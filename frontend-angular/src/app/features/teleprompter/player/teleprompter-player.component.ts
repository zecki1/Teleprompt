import { Component, OnInit, inject, signal, OnDestroy, ElementRef, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TpHubService } from '@core/realtime/tp-hub.service';
import { ApiService } from '@core/services/api.service';
import { ObservabilityService } from '@core/services/observability.service';
import { Script } from '@core/models/script.model';

@Component({
  selector: 'app-teleprompter-player',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    @if (loading()) {
      <div class="tp-loading">
        <div class="tp-spinner"></div>
        <p class="tp-loading-text">Carregando roteiro...</p>
      </div>
    } @else if (error()) {
      <div class="tp-error">
        <p class="tp-error-text">{{ error() }}</p>
        <a routerLink="/dashboard" class="tp-error-link">← Voltar ao Dashboard</a>
      </div>
    } @else {
    <div class="tp-layout">
      <div class="tp-scroll-area" #scrollArea [style.background]="bgColor()">
        @if (showReadingStrip()) {
          <div class="reading-strip"></div>
        }

        <div class="tp-content" #scrollContent
             [style.fontSize]="fontSize()"
             [style.fontWeight]="fontWeight()"
             [style.lineHeight]="lineHeight()"
             [style.maxWidth]="maxWidth()"
             [style.color]="textColor()"
             [style.textAlign]="textAlign()">
          @for (scene of scenes(); track scene.index) {
            <div class="tp-scene" [style.marginBottom]="sceneGap()">
              <span class="tp-marker">Cena {{ scene.index }}</span>
              <p class="tp-text">{{ scene.content }}</p>
            </div>
          }
          @if (scenes().length === 0) {
            <p class="tp-text">{{ formattedContent() }}</p>
          }
        </div>

        @if (isPaused()) {
          <div class="paused-indicator" [class.mirror-mode]="false">
            <span class="paused-dot"></span>
            <span class="paused-label">PAUSADO</span>
          </div>
        }
      </div>

      @if (showSidebar()) {
        <div class="tp-sidebar">
          <div class="sidebar-top">
            <div class="sidebar-title-row">
              <span class="sidebar-icon">⚙</span>
              <span class="sidebar-title-text">Master Control</span>
            </div>
          </div>

          <div class="sidebar-scroll">
            <div class="sidebar-section">
              <span class="sidebar-section-label">Roteiro</span>
              <p class="sidebar-script-title">{{ script()?.title || 'Teleprompter' }}</p>
            </div>

            <div class="sidebar-section">
              <span class="sidebar-section-label">Velocidade</span>
              <div class="speed-control">
                <button class="speed-btn" (click)="decreaseSpeed()">−</button>
                <div class="speed-value-box">
                  <span class="speed-value">{{ speed() }}</span>
                  <span class="speed-suffix">x</span>
                </div>
                <button class="speed-btn" (click)="increaseSpeed()">＋</button>
              </div>
            </div>

            <div class="sidebar-section">
              <span class="sidebar-section-label">Controles</span>
              <div class="controls-grid">
                <button class="control-btn" (click)="togglePlay()" [class.playing]="isPlaying()">
                  @if (isPlaying()) { ⏸ } @else { ▶ }
                </button>
                <button class="control-btn" (click)="resetScroll()">↺</button>
                <button class="control-btn" (click)="toggleFullscreen()">
                  @if (isFullscreen()) { ⊡ } @else { ⤢ }
                </button>
              </div>
            </div>

            <div class="sidebar-section">
              <span class="sidebar-section-label">Tamanho</span>
              <div class="style-btns">
                @for (size of fontSizeOptions; track size.value) {
                  <button class="style-btn" [class.active]="fontSize() === size.value"
                          (click)="fontSize.set(size.value)">{{ size.label }}</button>
                }
              </div>
            </div>

            <div class="sidebar-section">
              <span class="sidebar-section-label">Espessura</span>
              <div class="style-btns">
                <button class="style-btn" [class.active]="fontWeight() === 'normal'"
                        (click)="fontWeight.set('normal')">Normal</button>
                <button class="style-btn" [class.active]="fontWeight() === '500'"
                        (click)="fontWeight.set('500')">Médio</button>
                <button class="style-btn" [class.active]="fontWeight() === 'bold'"
                        (click)="fontWeight.set('bold')">Bold</button>
              </div>
            </div>

            <div class="sidebar-section">
              <span class="sidebar-section-label">Alinhamento</span>
              <div class="style-btns">
                <button class="style-btn" [class.active]="textAlign() === 'left'"
                        (click)="textAlign.set('left')">◀ Esq</button>
                <button class="style-btn" [class.active]="textAlign() === 'center'"
                        (click)="textAlign.set('center')">■ Centro</button>
                <button class="style-btn" [class.active]="textAlign() === 'right'"
                        (click)="textAlign.set('right')">▶ Dir</button>
              </div>
            </div>

            <div class="sidebar-section">
              <span class="sidebar-section-label">Largura</span>
              <div class="style-btns">
                @for (w of maxWidthOptions; track w.value) {
                  <button class="style-btn" [class.active]="maxWidth() === w.value"
                          (click)="maxWidth.set(w.value)">{{ w.label }}</button>
                }
              </div>
            </div>

            <div class="sidebar-section">
              <span class="sidebar-section-label">Cores</span>
              <div class="color-row">
                <span class="color-label">Fundo</span>
                <div class="color-swatches">
                  @for (c of bgColors; track c) {
                    <button class="swatch" [style.background]="c"
                            [class.active-swatch]="bgColor() === c"
                            (click)="bgColor.set(c)"></button>
                  }
                </div>
              </div>
              <div class="color-row">
                <span class="color-label">Texto</span>
                <div class="color-swatches">
                  @for (c of textColors; track c) {
                    <button class="swatch" [style.background]="c"
                            [class.active-swatch]="textColor() === c"
                            (click)="textColor.set(c)"></button>
                  }
                </div>
              </div>
            </div>

            <div class="sidebar-section">
              <span class="sidebar-section-label">Opções</span>
              <label class="toggle-row">
                <span>Faixa de leitura</span>
                <button class="toggle-switch" [class.toggle-on]="showReadingStrip()"
                        (click)="showReadingStrip.set(!showReadingStrip())">
                  <span class="toggle-thumb"></span>
                </button>
              </label>
              <label class="toggle-row">
                <span>Espaço entre cenas</span>
                <select class="select-sm" [ngModel]="sceneGap()" (ngModelChange)="sceneGap.set($event)">
                  <option value="2rem">Pequeno</option>
                  <option value="4rem">Médio</option>
                  <option value="8rem">Grande</option>
                  <option value="12rem">Extra</option>
                </select>
              </label>
            </div>

            <div class="sidebar-section">
              <a [routerLink]="['/scripts', scriptId]" class="back-edit-link">← Voltar ao Editor</a>
            </div>
          </div>
        </div>
      }

      <button class="sidebar-toggle" (click)="showSidebar.set(!showSidebar())"
              [class.shifted]="showSidebar()">
        {{ showSidebar() ? '›' : '‹' }}
      </button>
    </div>
    }
  `,
  styles: [`
    .tp-layout {
      display: flex; height: 100vh; overflow: hidden; position: relative;
    }

    .tp-scroll-area {
      flex: 1; overflow-y: auto; position: relative;
      -ms-overflow-style: none; scrollbar-width: none;
    }
    .tp-scroll-area::-webkit-scrollbar { display: none; }

    .reading-strip {
      position: fixed; top: 50%; left: 0; width: 100%; height: 8rem;
      background: rgba(255,255,255,0.05); pointer-events: none;
      transform: translateY(-50%); z-index: 10;
      border-top: 1px solid rgba(255,255,255,0.1);
      border-bottom: 1px solid rgba(255,255,255,0.1);
      box-shadow: 0 0 30px rgba(0,0,0,0.3);
    }

    .tp-content {
      max-width: 56rem; margin: 0 auto; padding: 40vh 2rem 60vh;
      position: relative; z-index: 1;
    }

    .tp-scene { padding-bottom: 2rem; }
    .tp-marker {
      display: block; font-size: 0.875rem; font-weight: 600;
      color: var(--blue-500); text-transform: uppercase;
      letter-spacing: 0.05em; margin-bottom: 0.5rem;
    }
    .tp-text { white-space: pre-wrap; }

    .paused-indicator {
      position: fixed; bottom: 1.5rem; left: 1.5rem;
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.5rem 1rem; border-radius: 1rem;
      backdrop-filter: blur(12px); box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 20;
      background: rgba(16,185,129,0.15);
    }
    .paused-indicator.mirror-mode {
      background: rgba(239,68,68,0.25);
    }
    .paused-dot {
      width: 8px; height: 8px; border-radius: 50%;
      animation: pulse 2s infinite;
    }
    .paused-indicator:not(.mirror-mode) .paused-dot { background: #10b981; }
    .paused-indicator.mirror-mode .paused-dot { background: #ef4444; }
    .paused-label {
      font-size: 0.75rem; font-weight: 900; text-transform: uppercase;
      letter-spacing: 0.3em;
    }

    .tp-sidebar {
      width: 400px; flex-shrink: 0; height: 100%;
      background: var(--zinc-950); border-left: 1px solid rgba(255,255,255,0.1);
      display: flex; flex-direction: column; z-index: 20;
      box-shadow: -4px 0 12px rgba(0,0,0,0.3);
    }

    .sidebar-top {
      padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .sidebar-title-row { display: flex; align-items: center; gap: 0.75rem; }
    .sidebar-icon {
      display: flex; align-items: center; justify-content: center;
      width: 2rem; height: 2rem; border-radius: 8px;
      background: rgba(255,255,255,0.1); font-size: 14px;
    }
    .sidebar-title-text {
      font-size: 0.625rem; font-weight: 900; text-transform: uppercase;
      letter-spacing: 0.2em; color: #71717a; font-family: monospace;
    }

    .sidebar-scroll { flex: 1; overflow-y: auto; padding: 0.5rem 0; }

    .sidebar-section {
      padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .sidebar-section-label {
      display: block; font-size: 0.625rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.1em;
      color: #71717a; margin-bottom: 0.75rem;
    }
    .sidebar-script-title {
      font-size: 0.75rem; font-weight: 700; color: #fff;
    }

    .speed-control {
      display: flex; align-items: center; justify-content: center; gap: 1rem;
    }
    .speed-btn {
      display: flex; align-items: center; justify-content: center;
      width: 2.5rem; height: 2.5rem; border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.15); background: transparent;
      color: #fff; font-size: 1.125rem; cursor: pointer;
      transition: background 0.15s;
    }
    .speed-btn:hover { background: rgba(255,255,255,0.1); }
    .speed-value-box { text-align: center; }
    .speed-value {
      display: block; font-size: 1.5rem; font-weight: 900; color: #fff;
    }
    .speed-suffix {
      font-size: 0.625rem; font-weight: 700; color: #71717a;
      text-transform: uppercase;
    }

    .controls-grid { display: flex; gap: 0.5rem; }
    .control-btn {
      flex: 1; display: flex; align-items: center; justify-content: center;
      height: 2.5rem; border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.15); background: transparent;
      color: #fff; font-size: 1rem; cursor: pointer; transition: all 0.15s;
    }
    .control-btn:hover { background: rgba(255,255,255,0.1); }
    .control-btn.playing {
      background: rgba(239,68,68,0.2); border-color: rgba(239,68,68,0.5); color: #ef4444;
    }

    .style-btns { display: flex; gap: 0.375rem; flex-wrap: wrap; }
    .style-btn {
      padding: 0.375rem 0.75rem; border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.15); background: transparent;
      color: #a1a1aa; font-size: 0.625rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.05em;
      cursor: pointer; transition: all 0.15s;
    }
    .style-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
    .style-btn.active {
      background: rgba(255,255,255,0.15); color: #fff;
      border-color: rgba(255,255,255,0.3);
    }

    .color-row { margin-bottom: 0.75rem; }
    .color-label {
      display: block; font-size: 0.5625rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.1em;
      color: #52525b; margin-bottom: 0.5rem;
    }
    .color-swatches { display: flex; gap: 0.5rem; }
    .swatch {
      width: 2rem; height: 2rem; border-radius: 50%;
      border: 2px solid transparent; cursor: pointer;
      transition: all 0.15s; box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .swatch:hover { transform: scale(1.1); }
    .active-swatch { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.3); }

    .toggle-row {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 0.75rem; cursor: pointer;
    }
    .toggle-row span { font-size: 0.75rem; color: #d4d4d8; }
    .toggle-switch {
      width: 2.75rem; height: 1.5rem; border-radius: 9999px;
      border: none; background: rgba(255,255,255,0.15);
      position: relative; cursor: pointer; transition: background 0.2s;
    }
    .toggle-on { background: var(--emerald-500); }
    .toggle-thumb {
      position: absolute; top: 2px; left: 2px;
      width: 1.25rem; height: 1.25rem; border-radius: 50%;
      background: #fff; transition: transform 0.2s;
    }
    .toggle-on .toggle-thumb { transform: translateX(1.25rem); }

    .select-sm {
      padding: 0.25rem 0.5rem; border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.05);
      color: #d4d4d8; font-size: 0.75rem;
    }
    .select-sm option { background: #18181b; color: #d4d4d8; }

    .back-edit-link {
      display: block; font-size: 0.8125rem; color: var(--blue-500);
      text-decoration: none; font-weight: 500;
    }
    .back-edit-link:hover { color: #60a5fa; }

    .sidebar-toggle {
      position: fixed; right: 0; top: 50%; transform: translateY(-50%);
      width: 2rem; height: 4rem; border-radius: 8px 0 0 8px;
      border: 1px solid rgba(255,255,255,0.15); border-right: none;
      background: var(--zinc-900); color: #d4d4d8;
      font-size: 1.125rem; cursor: pointer; z-index: 30;
      transition: right 0.3s;
    }
    .sidebar-toggle.shifted { right: 400px; }
    .sidebar-toggle:hover { background: var(--zinc-800); }

    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

    .tp-loading, .tp-error {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100vh; background: #000; color: #fff; gap: 1rem;
    }
    .tp-spinner {
      width: 2rem; height: 2rem; border: 3px solid rgba(255,255,255,0.15);
      border-top-color: var(--blue-500); border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .tp-loading-text { font-size: 0.875rem; color: #a1a1aa; }
    .tp-error-text { font-size: 1rem; color: #f87171; text-align: center; max-width: 24rem; }
    .tp-error-link {
      font-size: 0.875rem; color: var(--blue-500); text-decoration: none;
    }
    .tp-error-link:hover { text-decoration: underline; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 768px) {
      .tp-sidebar { width: 100%; position: fixed; inset: 0; z-index: 40; }
      .sidebar-toggle.shifted { right: 0; }
    }
  `]
})
export class TeleprompterPlayerComponent implements OnInit, OnDestroy {
  @ViewChild('scrollArea') scrollArea!: ElementRef<HTMLDivElement>;
  @ViewChild('scrollContent') scrollContent!: ElementRef<HTMLDivElement>;

  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private tpHub = inject(TpHubService);
  private observability = inject(ObservabilityService);

  script = signal<Script | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  speed = signal(1);
  isPlaying = signal(false);
  isFullscreen = signal(false);
  isPaused = signal(true);
  formattedContent = signal('');
  showSidebar = signal(true);

  bgColor = signal('#000000');
  textColor = signal('#ffffff');
  fontSize = signal('4.5rem');
  fontWeight = signal('500');
  lineHeight = signal('1.6');
  maxWidth = signal('56rem');
  textAlign = signal('left');
  showReadingStrip = signal(true);
  sceneGap = signal('8rem');

  fontSizeOptions = [
    { label: 'M', value: '2.5rem' },
    { label: 'L', value: '3.5rem' },
    { label: 'XL', value: '4.5rem' },
    { label: '2XL', value: '6rem' },
    { label: '3XL', value: '8rem' },
  ];
  maxWidthOptions = [
    { label: 'S', value: '40rem' },
    { label: 'M', value: '56rem' },
    { label: 'L', value: '72rem' },
    { label: 'XL', value: 'none' },
  ];
  bgColors = ['#000000', '#0a192f', '#064e3b', '#18181b', '#ffffff'];
  textColors = ['#ffffff', '#ffff00', '#22d3ee', '#18181b'];

  scenes = computed(() => {
    const content = this.script()?.content || '';
    if (!content) return [];
    const parts = content.split(/\[Cena\s+(\d+)\]/i);
    const scenes: { index: number; content: string }[] = [];
    for (let i = 1; i < parts.length; i += 2) {
      scenes.push({ index: parseInt(parts[i]), content: (parts[i + 1] || '').trim() });
    }
    return scenes;
  });

  private scrollInterval: any;
  scriptId = '';

  ngOnInit(): void {
    this.observability.trackPageView('teleprompter-player');
    this.scriptId = this.route.snapshot.paramMap.get('id')!;
    this.loadScript();
    this.setupRealtime();
    this.setupKeyboard();
  }

  ngOnDestroy(): void {
    this.stopScrolling();
    this.tpHub.leaveSession(this.scriptId);
    document.removeEventListener('keydown', this.handleKeydown);
  }

  private loadScript(): void {
    if (!this.scriptId) {
      this.loading.set(false);
      this.error.set('ID do roteiro não encontrado na URL.');
      return;
    }
    this.api.getScript(this.scriptId).subscribe({
      next: script => {
        this.script.set(script);
        this.formattedContent.set(script.content || '');
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar roteiro:', err);
        this.loading.set(false);
        this.error.set('Erro ao carregar o roteiro. Verifique se o backend está rodando.');
      }
    });
  }

  private async setupRealtime(): Promise<void> {
    await this.tpHub.connect();
    await this.tpHub.joinSession(this.scriptId);
  }

  private setupKeyboard(): void {
    document.addEventListener('keydown', this.handleKeydown);
  }

  private handleKeydown = (e: KeyboardEvent): void => {
    switch (e.key) {
      case ' ': e.preventDefault(); this.togglePlay(); break;
      case 'ArrowUp': e.preventDefault(); this.decreaseSpeed(); break;
      case 'ArrowDown': e.preventDefault(); this.increaseSpeed(); break;
      case 'f': this.toggleFullscreen(); break;
    }
  };

  togglePlay(): void {
    this.isPlaying.update(p => !p);
    this.isPaused.set(this.isPlaying());
    if (this.isPlaying()) this.startScrolling();
    else this.stopScrolling();
  }

  private startScrolling(): void {
    this.scrollInterval = setInterval(() => {
      const el = this.scrollArea?.nativeElement;
      if (el) el.scrollTop += this.speed();
    }, 16);
  }

  private stopScrolling(): void {
    if (this.scrollInterval) { clearInterval(this.scrollInterval); this.scrollInterval = null; }
  }

  increaseSpeed(): void { this.speed.update(s => Math.min(s + 0.25, 5)); }
  decreaseSpeed(): void { this.speed.update(s => Math.max(s - 0.25, 0.25)); }

  resetScroll(): void {
    this.scrollArea?.nativeElement?.scrollTo({ top: 0, behavior: 'smooth' });
    this.isPlaying.set(false);
    this.isPaused.set(true);
    this.stopScrolling();
  }

  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      this.isFullscreen.set(true);
    } else {
      document.exitFullscreen();
      this.isFullscreen.set(false);
    }
  }
}
