import { Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DOCUMENT } from '@angular/common';

import { ScriptsService } from '../../core/api/projects.service';
import { TpHubService } from '../../core/realtime/tp-hub.service';
import type { ScriptDto } from '../../core/api/types';

/// Estado compartilhado entre janela master (controlador) e espelhos,
/// no mesmo navegador e origem, via BroadcastChannel — mesma ideia do Next.
interface TpSharedState {
  playing: boolean;
  speed: number;
  fontSize: number;
}

type TpMessage =
  | { type: 'hello' }
  | { type: 'state'; state: TpSharedState }
  | { type: 'scroll'; ratio: number };

@Component({
  selector: 'app-tp-page',
  imports: [RouterLink],
  templateUrl: './tp-page.html',
  styleUrl: './tp-page.css',
})
export class TpPage {
  readonly id = input.required<string>();

  private readonly scriptsApi = inject(ScriptsService);
  private readonly document = inject(DOCUMENT);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly tpHub = inject(TpHubService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly script = signal<ScriptDto | null>(null);

  /// Esta janela é o espelho (aberta pelo master com ?mirror=1).
  protected readonly isMirror =
    this.route.snapshot.queryParamMap.get('mirror') === '1';

  protected readonly playing = signal(false);
  protected readonly speed = signal(1);
  protected readonly fontSize = signal(3.4);
  protected readonly mirrored = signal(this.isMirror);
  protected readonly recordedFeedback = signal<string | null>(null);

  private rafId: number | null = null;
  private lastTs: number | null = null;

  private channel: BroadcastChannel | null = null;

  constructor() {
    effect(() => {
      const scriptId = this.id();
      void this.load(scriptId);

      if (this.channel || typeof BroadcastChannel === 'undefined') return;
      this.channel = new BroadcastChannel(`tp-sync-${scriptId}`);
      this.channel.onmessage = (ev) => this.onMessage(ev.data as TpMessage);
      if (this.isMirror) {
        // Pede o estado atual ao master ao abrir.
        this.post({ type: 'hello' });
      }
      void this.joinTpRealtime();
    });

    this.destroyRef.onDestroy(() => {
      this.stopLoop();
      this.channel?.close();
      this.channel = null;
      void this.tpHub.disconnect();
    });
  }

  /** Sessão TP compartilhada via SignalR (espelhos entre dispositivos). */
  private tpSessionId(): string {
    return `tp-${this.id()}`;
  }

  /** Conecta ao hub TpHub e entra na sessão (best-effort). */
  private async joinTpRealtime(): Promise<void> {
    try {
      await this.tpHub.connect();
      if (!this.tpHub.isConnected()) return;
      await this.tpHub.joinTp(this.tpSessionId(), this.isMirror ? 'mirror' : 'master');
      this.tpHub.onScrollStateChanged(({ position, speed, mode }) => {
        if (!this.isMirror) return; // só o espelho obedece remoto
        this.speed.set(speed);
        this.mode = mode;
        this.applyRemoteRatio(position);
      });
      this.tpHub.onRemoteCommand((_session, command) => {
        if (this.isMirror) this.applyRemoteCommand(command);
      });
    } catch {
      /* realtime é aumentativo; BroadcastChannel cobre o mesmo browser */
    }
  }

  private mode = 'scroll';

  private applyRemoteRatio(ratio: number): void {
    const el = this.scrollView();
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    if (max > 0) el.scrollTop = ratio * max;
  }

  private applyRemoteCommand(command: string): void {
    if (command === 'play') {
      if (!this.playing()) this.togglePlay();
    } else if (command === 'pause') {
      if (this.playing()) this.togglePlay();
    } else if (command === 'reset') {
      this.resetScrollRemote();
    }
  }

  private resetScrollRemote(): void {
    const el = this.scrollView();
    if (el) el.scrollTo({ top: 0 });
  }

  /* ---------- Carregamento ---------- */

  protected async load(id: string): Promise<void> {
    this.loading.set(true);
    try {
      this.script.set(await this.scriptsApi.get(id));
    } catch (e) {
      this.error.set(
        `Erro ao carregar o roteiro (${(e as { status?: number }).status ?? 'conexão'}).`,
      );
    } finally {
      this.loading.set(false);
      // Espelho começa acompanhando o master imediatamente.
      if (this.isMirror) this.post({ type: 'hello' });
    }
  }

  /* ---------- Sincronização ---------- */

  private post(msg: TpMessage): void {
    try {
      this.channel?.postMessage(msg);
    } catch {
      /* canal pode estar fechado */
    }
  }

  private onMessage(msg: TpMessage): void {
    if (this.isMirror) {
      switch (msg.type) {
        case 'state':
          this.speed.set(msg.state.speed);
          this.fontSize.set(msg.state.fontSize);
          this.playing.set(msg.state.playing);
          break;
        case 'scroll':
          this.applyRemoteScroll(msg.ratio);
          break;
        case 'hello':
          break;
      }
      return;
    }

    // Master responde ao espelho recém-aberto com o estado atual.
    if (msg.type === 'hello') {
      this.broadcastState();
      const el = this.scrollView();
      const max = el ? el.scrollHeight - el.clientHeight : 0;
      this.post({ type: 'scroll', ratio: max > 0 ? el!.scrollTop / max : 0 });
    }
  }

  protected broadcastState(): void {
    this.post({
      type: 'state',
      state: {
        playing: this.playing(),
        speed: this.speed(),
        fontSize: this.fontSize(),
      },
    });
  }

  private applyRemoteScroll(ratio: number): void {
    const el = this.scrollView();
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    if (max > 0) el.scrollTop = ratio * max;
  }

  private scrollView(): HTMLElement | null {
    return this.document.querySelector('.scroll-view');
  }

  /* ---------- Controles (master) ---------- */

  protected togglePlay(): void {
    if (this.isMirror) return;
    if (this.playing()) {
      this.stopLoop();
    } else {
      this.lastTs = null;
      this.rafId = requestAnimationFrame(this.step);
    }
    this.playing.update((v) => !v);
    this.broadcastState();
    if (this.tpHub.isConnected()) {
      void this.tpHub
        .remoteCommand(this.tpSessionId(), this.playing() ? 'play' : 'pause')
        .catch(() => undefined);
    }
  }

  private step = (ts: number): void => {
    if (!this.playing()) return;
    const dt = this.lastTs === null ? 0 : (ts - this.lastTs) / 1000;
    this.lastTs = ts;

    const el = this.scrollView();
    if (el) {
      el.scrollTop += this.speed() * 55 * dt;
      const max = el.scrollHeight - el.clientHeight;
      // Envia a posição proporcional para os espelhos acompanharem.
      if (max > 0) {
        const ratio = el.scrollTop / max;
        this.post({ type: 'scroll', ratio });
        this.broadcastRemoteScroll(ratio);
      }
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
        this.stopAtEnd();
        return;
      }
    }
    this.rafId = requestAnimationFrame(this.step);
  };

  /** Transmite o estado de rolagem via SignalR (espelhos em outros dispositivos). */
  private broadcastRemoteScroll(ratio: number): void {
    if (this.tpHub.isConnected()) {
      void this.tpHub
        .scrollStateChanged(this.tpSessionId(), ratio, this.speed(), this.mode)
        .catch(() => undefined);
    }
  }

  private stopAtEnd(): void {
    this.stopLoop();
    this.playing.set(false);
    this.broadcastState();
  }

  private stopLoop(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.lastTs = null;
  }

  /** Abre a janela espelhada (para a tela do teleprompter). */
  protected openMirror(): void {
    window.open(
      `${location.origin}/tp/${this.id()}?mirror=1`,
      'tp-mirror',
      'width=1280,height=720',
    );
  }

  protected onKeydown(event: KeyboardEvent): void {
    if ((event.target as HTMLElement).tagName === 'INPUT') return;
    switch (event.code) {
      case 'Space':
        event.preventDefault();
        this.togglePlay();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.changeSpeed(0.1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.changeSpeed(-0.1);
        break;
      case 'KeyM':
        if (!this.isMirror) this.mirrored.update((m) => !m);
        break;
      case 'KeyF':
        void this.toggleFullscreen();
        break;
    }
  }

  protected changeSpeed(delta: number): void {
    this.speed.update((s) =>
      Math.min(5, Math.max(0.2, Math.round((s + delta) * 10) / 10)),
    );
    this.broadcastState();
  }

  protected resetScroll(): void {
    if (this.isMirror) return;
    const el = this.scrollView();
    if (el) el.scrollTo({ top: 0 });
    this.post({ type: 'scroll', ratio: 0 });
    if (this.playing()) this.togglePlay();
  }

  protected decFont(): void {
    this.fontSize.update((f) => Math.max(1.8, f - 0.3));
    this.broadcastState();
  }

  protected incFont(): void {
    this.fontSize.update((f) => Math.min(9, f + 0.3));
    this.broadcastState();
  }

  protected async toggleFullscreen(): Promise<void> {
    try {
      if (!this.document.fullscreenElement) {
        await this.document.documentElement.requestFullscreen();
      } else {
        await this.document.exitFullscreen();
      }
    } catch {
      /* fullscreen pode ser bloqueado */
    }
  }

  protected async markRecorded(): Promise<void> {
    const s = this.script();
    if (!s || this.isMirror) return;
    try {
      await this.scriptsApi.update(s.id, { status: 'Gravado' });
      this.recordedFeedback.set('✓ Marcado como gravado');
      setTimeout(() => this.recordedFeedback.set(null), 3000);
    } catch {
      this.recordedFeedback.set('✕ Falha ao marcar como gravado');
    }
  }
}
