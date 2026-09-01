import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthStore } from '../../core/auth/auth.store';
import { ScriptsService } from '../../core/api/projects.service';
import { ScriptHubService } from '../../core/realtime/script-hub.service';
import type {
  ChecklistItemDto,
  CommentDto,
  ScriptDto,
  VersionDto,
} from '../../core/api/types';
import { fromBackendStatus, statusMeta } from '../../shared/script-status';
import { ModalComponent } from '../../shared/ui/modal';

interface SceneView {
  sceneNumber: string;
  time?: string;
  spokenText?: string;
  lettering?: string;
  pronunciation?: string;
  onScreenText?: string;
}

type Tab = 'scenes' | 'versions' | 'comments';

@Component({
  selector: 'app-editor-page',
  imports: [DatePipe, FormsModule, RouterLink, ModalComponent],
  templateUrl: './editor-page.html',
  styleUrl: './editor-page.css',
})
export class EditorPage {
  /** Parâmetro de rota via withComponentInputBinding. */
  readonly id = input.required<string>();

  private readonly scriptsApi = inject(ScriptsService);
  private readonly auth = inject(AuthStore);
  private readonly scriptHub = inject(ScriptHubService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly savedAt = signal<Date | null>(null);

  protected readonly script = signal<ScriptDto | null>(null);
  protected readonly title = signal('');
  protected readonly content = signal('');
  protected readonly dirty = computed(
    () =>
      this.script() !== null &&
      (this.title() !== this.script()!.title ||
        this.content() !== this.script()!.content),
  );

  protected readonly tab = signal<Tab>('scenes');
  protected readonly scenes = signal<SceneView[]>([]);
  protected readonly versions = signal<VersionDto[]>([]);
  protected readonly comments = signal<CommentDto[]>([]);
  protected readonly newComment = signal('');
  protected readonly revertTarget = signal<VersionDto | null>(null);

  constructor() {
    effect(() => void this.load(this.id()));
    this.destroyRef.onDestroy(() => {
      void this.leaveRealtime();
    });
  }

  protected async load(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const s = await this.scriptsApi.get(id);
      this.script.set(s);
      this.title.set(s.title);
      this.content.set(s.content);
      await Promise.all([
        this.refreshVersions(),
        this.refreshComments(),
        this.parseScenes(),
      ]);
      await this.joinRealtime(id);
    } catch (e) {
      this.error.set(`Erro ao carregar o roteiro (${(e as { status?: number }).status ?? 'conexão'}).`);
    } finally {
      this.loading.set(false);
    }
  }

  /** Conecta ao hub ScriptHub e entra no grupo do roteiro (presença). */
  private async joinRealtime(id: string): Promise<void> {
    try {
      await this.scriptHub.connect();
      if (this.scriptHub.isConnected()) await this.scriptHub.joinScript(id);
    } catch {
      /* realtime é best-effort; a UI segue funcionando via REST */
    }
  }

  /** Sai do grupo e desliga as notificações ao fechar o editor. */
  private async leaveRealtime(): Promise<void> {
    const s = this.script();
    if (s) {
      try {
        await this.scriptHub.leaveScript(s.id);
      } catch {
        /* ignore */
      }
    }
    await this.scriptHub.disconnect();
  }

  /* ---------- Conteúdo ---------- */

  protected async save(): Promise<void> {
    const s = this.script();
    if (!s) return;
    this.saving.set(true);
    try {
      await this.scriptsApi.update(s.id, {
        title: this.title().trim() || s.title,
        content: this.content(),
      });
      this.savedAt.set(new Date());
      this.script.update((cur) =>
        cur ? { ...cur, title: this.title(), content: this.content() } : cur,
      );
      // Notifica os demais colaboradores do grupo (realtime).
      if (this.scriptHub.isConnected()) {
        const user = this.auth.user()?.displayName ?? '';
        await this.scriptHub.contentChanged(s.id, this.content(), user);
      }
    } catch {
      this.error.set('Falha ao salvar.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async parseScenes(): Promise<void> {
    try {
      const res = await this.scriptsApi.parse(this.content());
      this.scenes.set(
        (res.scenes as Record<string, unknown>[]).map((sc) => ({
          sceneNumber: String(sc['sceneNumber'] ?? ''),
          time: (sc['time'] as string) ?? undefined,
          spokenText: (sc['spokenText'] as string) ?? undefined,
          lettering: (sc['lettering'] as string) ?? undefined,
          pronunciation: (sc['pronunciation'] as string) ?? undefined,
          onScreenText: (sc['onScreenText'] as string) ?? undefined,
        })),
      );
    } catch {
      this.scenes.set([]);
    }
  }

  /* ---------- Versões ---------- */

  protected async refreshVersions(): Promise<void> {
    try {
      this.versions.set(await this.scriptsApi.versions(this.id()));
    } catch {
      this.versions.set([]);
    }
  }

  protected async saveVersion(): Promise<void> {
    if (!this.dirty()) return;
    this.saving.set(true);
    try {
      await this.save();
      await this.scriptsApi.createVersion(this.id(), this.content());
      await this.refreshVersions();
    } catch {
      this.error.set('Falha ao criar a versão.');
    } finally {
      this.saving.set(false);
    }
  }

  protected canRevert(): boolean {
    const u = this.auth.user();
    return u?.isSuperAdmin === true || u?.canRevert === true;
  }

  protected async confirmRevert(): Promise<void> {
    const target = this.revertTarget();
    if (!target) return;
    this.saving.set(true);
    try {
      const s = await this.scriptsApi.revert(this.id(), target.versionNumber);
      this.script.set(s);
      this.title.set(s.title);
      this.content.set(s.content);
      this.revertTarget.set(null);
      await Promise.all([this.refreshVersions(), this.parseScenes()]);
    } catch {
      this.error.set('Falha ao reverter.');
    } finally {
      this.saving.set(false);
    }
  }

  /* ---------- Comentários ---------- */

  protected async refreshComments(): Promise<void> {
    try {
      this.comments.set(await this.scriptsApi.comments(this.id()));
    } catch {
      this.comments.set([]);
    }
  }

  protected async addComment(): Promise<void> {
    const body = this.newComment().trim();
    if (!body) return;
    this.saving.set(true);
    try {
      await this.scriptsApi.addComment(this.id(), body);
      this.newComment.set('');
      await this.refreshComments();
    } catch {
      this.error.set('Falha ao comentar.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async toggleResolved(c: CommentDto): Promise<void> {
    try {
      await this.scriptsApi.resolveComment(this.id(), c.id, !c.isResolved);
      await this.refreshComments();
    } catch {
      this.error.set('Falha ao atualizar o comentário.');
    }
  }

  /* ---------- Helpers ---------- */

  protected get statusPill(): Record<string, string> {
    const s = this.script();
    if (!s) return {};
    const meta = statusMeta(fromBackendStatus(s.status));
    return {
      color: meta.color,
      background: `color-mix(in srgb, ${meta.color} 16%, white)`,
    };
  }

  protected get statusLabel(): string {
    const s = this.script();
    return s ? statusMeta(fromBackendStatus(s.status)).label : '';
  }
}
