import { Component, OnInit, inject, signal, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { ScriptHubService } from '@core/realtime/script-hub.service';
import { ObservabilityService } from '@core/services/observability.service';
import { Script, ScriptVersion, Comment, ChecklistItem, ScriptStatus } from '@core/models/script.model';

@Component({
  selector: 'app-script-editor',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    @if (script(); as s) {
      <div class="editor-layout">
        <header class="editor-topbar">
          <div class="topbar-inner">
            <div class="topbar-left">
              <a routerLink="/dashboard" class="back-btn">← Voltar</a>
              <input
                class="title-input"
                [(ngModel)]="s.title"
                (blur)="saveTitle()"
                placeholder="Título do roteiro"
              />
            </div>
            <div class="topbar-right">
              <span class="version-badge">v{{ s.version }}</span>
              <span class="status-badge" [style]="getStatusStyle(s.status)">
                {{ getStatusLabel(s.status) }}
              </span>
              @if (onlineUsers().size > 0) {
                <span class="online-indicator"></span>
                <span class="online-text">{{ onlineUsers().size }} online</span>
              }
              <div class="topbar-divider"></div>
              <button class="panel-tab" [class.active]="showPanel() === 'versions'"
                      (click)="togglePanel('versions')">Histórico</button>
              <button class="panel-tab" [class.active]="showPanel() === 'comments'"
                      (click)="togglePanel('comments')">Comentários</button>
              <button class="panel-tab" [class.active]="showPanel() === 'checklist'"
                      (click)="togglePanel('checklist')">Checklist</button>
              <div class="topbar-divider"></div>
              <button class="save-btn" (click)="saveScript()" [disabled]="!hasChanges()">
                Salvar
              </button>
            </div>
          </div>
        </header>

        <div class="editor-body">
          <div class="editor-main">
            @if (scenes().length > 0) {
              <div class="scenes-container">
                @for (scene of scenes(); track scene.index) {
                  <div class="scene-card">
                    <div class="scene-header">
                      <span class="scene-number">Cena {{ scene.index }}</span>
                    </div>
                    <div class="scene-body">
                      <div class="scene-content-block">
                        <p class="scene-text">{{ scene.content }}</p>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
            <div class="editor-textarea-wrapper">
              <textarea
                class="editor-textarea"
                [(ngModel)]="s.content"
                (input)="onContentChange()"
                placeholder="Digite o conteúdo do roteiro aqui...

Marcadores suportados:
[Cena 1] Título da Cena
[Loc] Localização
[Let] Lettering
[Pron] Pronúncia
[Img] Imagem
[Url] Fonte
[Abe] Abertura
[Enc] Encerramento"
                spellcheck="true"
              ></textarea>
            </div>
          </div>

          @if (showPanel()) {
            <div class="editor-sidebar">
              @if (showPanel() === 'versions') {
                <div class="sidebar-header">
                  <h3>Histórico de Versões</h3>
                </div>
                <div class="sidebar-body">
                  @for (v of versions(); track v.id) {
                    <div class="sidebar-item">
                      <div class="sidebar-item-info">
                        <span class="version-num">v{{ v.versionNumber }}</span>
                        <span class="version-date">{{ v.createdAt | date:'short' }}</span>
                      </div>
                      <button class="btn-xs" (click)="revertVersion(v.versionNumber)">Reverter</button>
                    </div>
                  } @empty {
                    <div class="sidebar-empty">Nenhuma versão salva</div>
                  }
                </div>
              }

              @if (showPanel() === 'comments') {
                <div class="sidebar-header">
                  <h3>Comentários</h3>
                </div>
                <div class="sidebar-body">
                  @for (c of comments(); track c.id) {
                    <div class="comment-card" [class.resolved]="c.isResolved">
                      <p class="comment-text">{{ c.body }}</p>
                      <div class="comment-footer">
                        <span class="comment-date">{{ c.createdAt | date:'short' }}</span>
                        @if (!c.isResolved) {
                          <button class="btn-xs" (click)="resolveComment(c.id)">Resolver</button>
                        }
                      </div>
                    </div>
                  } @empty {
                    <div class="sidebar-empty">Nenhum comentário</div>
                  }
                </div>
                <div class="sidebar-footer">
                  <input [(ngModel)]="newComment" placeholder="Novo comentário..."
                         class="sidebar-input" (keyup.enter)="addComment()" />
                  <button class="btn-xs-primary" (click)="addComment()">Enviar</button>
                </div>
              }

              @if (showPanel() === 'checklist') {
                <div class="sidebar-header">
                  <h3>Checklist de Revisão</h3>
                </div>
                <div class="sidebar-body">
                  @for (item of checklist(); track item.id || item.label) {
                    <label class="checklist-row">
                      <input type="checkbox" [checked]="item.isChecked" (change)="toggleChecklistItem(item)" />
                      <span [class.checked-text]="item.isChecked">{{ item.label }}</span>
                      @if (item.required) { <span class="required-mark">*</span> }
                    </label>
                  } @empty {
                    <div class="sidebar-empty">Nenhum item na checklist</div>
                  }
                </div>
              }
            </div>
          }
        </div>

        <div class="editor-footer">
          <div class="footer-left">
            <button class="btn-outline-xs" (click)="exportJson()">JSON</button>
            <button class="btn-outline-xs" (click)="exportWord()">Word</button>
          </div>
          <div class="footer-right">
            @if (s.status === ScriptStatus.Aprovado || s.status === ScriptStatus.Gravado) {
              <button class="btn-primary-xs" (click)="openTeleprompter()">Abrir Teleprompter</button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .editor-layout { display: flex; flex-direction: column; height: calc(100vh - 4rem); background: var(--zinc-50); }
    .dark .editor-layout { background: var(--zinc-950); }

    .editor-topbar {
      position: sticky; top: 0; z-index: 10;
      background: rgba(255,255,255,0.8); backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border); box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .dark .editor-topbar { background: rgba(39,39,42,0.8); }

    .topbar-inner {
      max-width: 80rem; margin: 0 auto;
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.625rem 1rem; flex-wrap: wrap; gap: 0.5rem;
    }

    .topbar-left { display: flex; align-items: center; gap: 0.75rem; min-width: 0; flex: 1; }
    .back-btn {
      font-size: 0.8125rem; color: var(--muted-foreground);
      text-decoration: none; white-space: nowrap; font-weight: 500;
    }
    .back-btn:hover { color: var(--foreground); }

    .title-input {
      flex: 1; min-width: 200px; max-width: 350px;
      background: transparent; border: none; color: var(--foreground);
      font-size: 1.125rem; font-weight: 800; outline: none;
      padding: 0;
    }
    .title-input::placeholder { color: var(--muted-foreground); opacity: 0.4; }

    .topbar-right { display: flex; align-items: center; gap: 0.375rem; flex-shrink: 0; }
    .topbar-divider { width: 1px; height: 1.25rem; background: var(--border); margin: 0 0.25rem; }

    .version-badge {
      display: inline-flex; padding: 0.125rem 0.5rem; border-radius: 9999px;
      background: rgba(59,130,246,0.1); color: var(--blue-500);
      font-size: 0.75rem; font-weight: 500; font-family: monospace;
    }

    .status-badge {
      display: inline-flex; padding: 0.125rem 0.625rem; border-radius: 9999px;
      font-size: 0.75rem; font-weight: 500;
    }

    .online-indicator {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--emerald-500); display: inline-block;
      animation: pulse 2s infinite;
    }
    .online-text { font-size: 0.75rem; color: var(--muted-foreground); }

    .panel-tab {
      padding: 0.375rem 0.625rem; border: none; background: transparent;
      color: var(--muted-foreground); font-size: 0.8125rem; font-weight: 500;
      border-radius: 6px; cursor: pointer; transition: all 0.15s;
    }
    .panel-tab:hover, .panel-tab.active { background: var(--accent); color: var(--foreground); }

    .save-btn {
      padding: 0.375rem 0.75rem; border: none; border-radius: 6px;
      background: var(--primary); color: var(--primary-foreground);
      font-size: 0.8125rem; font-weight: 600; cursor: pointer;
      transition: opacity 0.15s;
    }
    .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .editor-body { display: flex; flex: 1; overflow: hidden; }
    .editor-main { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }

    .scenes-container {
      max-width: 56rem; margin: 0 auto; padding: 2.5rem 1rem 0;
    }

    .scene-card {
      background: var(--card); border: 1px solid var(--border);
      border-radius: 8px; overflow: hidden; margin-bottom: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }

    .scene-header {
      padding: 0.875rem 1.25rem; background: var(--zinc-50);
      border-bottom: 1px solid var(--border);
    }
    .dark .scene-header { background: rgba(39,39,42,0.3); }

    .scene-number {
      display: inline-flex; padding: 0.375rem 1rem;
      border-radius: 4px; font-size: 0.6875rem;
      font-weight: 900; letter-spacing: -0.025em;
      background: var(--blue-600); color: #fff;
      box-shadow: 0 2px 4px rgba(59,130,246,0.3);
    }

    .scene-body { padding: 1.25rem; }

    .scene-content-block {
      padding: 1rem; background: var(--muted);
      border-radius: 6px; border: 1px solid var(--border);
    }

    .scene-text {
      font-size: 0.875rem; font-weight: 500; line-height: 1.8;
      color: var(--foreground); white-space: pre-wrap;
    }

    .editor-textarea-wrapper {
      max-width: 56rem; margin: 0 auto; padding: 0 1rem 8rem;
    }

    .editor-textarea {
      width: 100%; min-height: 400px; padding: 1.5rem;
      border: 1px solid var(--border); border-radius: 8px;
      background: var(--card); color: var(--foreground);
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 0.9375rem; line-height: 1.8; resize: vertical; outline: none;
    }
    .editor-textarea::placeholder { color: var(--muted-foreground); opacity: 0.3; }
    .editor-textarea:focus { border-color: var(--ring); box-shadow: 0 0 0 2px rgba(161,161,170,0.15); }

    .editor-sidebar {
      width: 340px; border-left: 1px solid var(--border);
      background: var(--card); display: flex; flex-direction: column;
      flex-shrink: 0;
    }

    .sidebar-header {
      padding: 1rem 1.25rem; border-bottom: 1px solid var(--border);
    }
    .sidebar-header h3 { font-size: 0.9375rem; font-weight: 700; color: var(--foreground); }

    .sidebar-body { flex: 1; overflow-y: auto; padding: 0.5rem 0; }
    .sidebar-empty { text-align: center; padding: 2rem; color: var(--muted-foreground); font-size: 0.8125rem; }

    .sidebar-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.625rem 1.25rem; border-bottom: 1px solid var(--border);
    }
    .sidebar-item-info { display: flex; align-items: center; gap: 0.5rem; }
    .version-num { font-size: 0.8125rem; font-weight: 600; color: var(--blue-500); font-family: monospace; }
    .version-date { font-size: 0.75rem; color: var(--muted-foreground); }

    .comment-card { padding: 0.75rem 1.25rem; border-bottom: 1px solid var(--border); }
    .comment-card.resolved { opacity: 0.5; }
    .comment-text { font-size: 0.8125rem; color: var(--foreground); margin-bottom: 0.375rem; line-height: 1.5; }
    .comment-footer { display: flex; justify-content: space-between; align-items: center; }
    .comment-date { font-size: 0.75rem; color: var(--muted-foreground); }

    .checklist-row {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.625rem 1.25rem; cursor: pointer;
      font-size: 0.8125rem; color: var(--foreground);
    }
    .checklist-row input[type="checkbox"] { width: 1rem; height: 1rem; accent-color: var(--primary); }
    .checked-text { text-decoration: line-through; opacity: 0.5; }
    .required-mark { color: var(--destructive); }

    .sidebar-footer {
      display: flex; gap: 0.375rem; padding: 0.75rem 1.25rem;
      border-top: 1px solid var(--border);
    }
    .sidebar-input {
      flex: 1; padding: 0.375rem 0.625rem;
      border: 1px solid var(--input); border-radius: 6px;
      background: transparent; color: var(--foreground); font-size: 0.8125rem;
    }
    .sidebar-input:focus { outline: none; border-color: var(--ring); }

    .btn-xs {
      padding: 0.25rem 0.5rem; border: none; border-radius: 6px;
      background: var(--muted); color: var(--muted-foreground);
      font-size: 0.75rem; font-weight: 500; cursor: pointer;
    }
    .btn-xs:hover { background: var(--accent); color: var(--foreground); }

    .btn-xs-primary {
      padding: 0.375rem 0.75rem; border: none; border-radius: 6px;
      background: var(--primary); color: var(--primary-foreground);
      font-size: 0.8125rem; font-weight: 500; cursor: pointer;
    }

    .editor-footer {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.625rem 1rem; border-top: 1px solid var(--border);
      background: var(--card); flex-shrink: 0;
    }
    .footer-left, .footer-right { display: flex; gap: 0.375rem; }

    .btn-outline-xs {
      padding: 0.375rem 0.625rem; border: 1px solid var(--border);
      border-radius: 6px; background: transparent; color: var(--muted-foreground);
      font-size: 0.8125rem; font-weight: 500; cursor: pointer;
    }
    .btn-outline-xs:hover { background: var(--accent); color: var(--foreground); }

    .btn-primary-xs {
      padding: 0.375rem 0.75rem; border: none; border-radius: 6px;
      background: var(--primary); color: var(--primary-foreground);
      font-size: 0.8125rem; font-weight: 600; cursor: pointer;
    }

    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

    @media (max-width: 768px) {
      .topbar-right { display: none; }
      .editor-sidebar { width: 100%; border-left: none; border-top: 1px solid var(--border); }
    }
  `]
})
export class ScriptEditorComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private scriptHub = inject(ScriptHubService);
  private observability = inject(ObservabilityService);

  ScriptStatus = ScriptStatus;
  script = signal<Script | null>(null);
  versions = signal<ScriptVersion[]>([]);
  comments = signal<Comment[]>([]);
  checklist = signal<ChecklistItem[]>([]);
  onlineUsers = signal<Set<string>>(new Set());
  showPanel = signal<string | null>(null);
  newComment = '';
  private hasUnsavedChanges = false;
  private scriptId = '';
  private subscriptions: Subscription[] = [];

  scenes = computed(() => {
    const content = this.script()?.content || '';
    if (!content) return [];
    const parts = content.split(/\[Cena\s+(\d+)\]/i);
    const scenes: { index: number; content: string }[] = [];
    for (let i = 1; i < parts.length; i += 2) {
      scenes.push({ index: parseInt(parts[i]), content: (parts[i + 1] || '').trim() });
    }
    return scenes.length > 0 ? scenes : [{ index: 1, content }];
  });

  ngOnInit(): void {
    this.observability.trackPageView('script-editor');
    this.scriptId = this.route.snapshot.paramMap.get('id')!;
    if (this.scriptId === 'new') {
      const projectId = this.route.snapshot.queryParamMap.get('projectId');
      this.createNewScript(projectId || '');
      return;
    }
    this.loadScript();
    this.setupRealtime();
  }

  ngOnDestroy(): void {
    this.scriptHub.leaveScript(this.scriptId);
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  private createNewScript(projectId: string): void {
    this.api.createScript({
      projectId,
      title: 'Novo Roteiro',
      content: ''
    }).subscribe({
      next: script => {
        this.scriptId = script.id;
        this.script.set(script);
        this.router.navigate(['/scripts', script.id], { replaceUrl: true });
        this.setupRealtime();
      }
    });
  }

  private loadScript(): void {
    this.api.getScript(this.scriptId).subscribe({ next: s => this.script.set(s) });
    this.api.getScriptVersions(this.scriptId).subscribe({ next: v => this.versions.set(v) });
    this.api.getScriptComments(this.scriptId).subscribe({ next: c => this.comments.set(c) });
    this.api.getScriptChecklist(this.scriptId).subscribe({ next: c => this.checklist.set(c) });
  }

  private async setupRealtime(): Promise<void> {
    await this.scriptHub.connect();
    await this.scriptHub.joinScript(this.scriptId);

    this.scriptHub.onContentChanged((data) => {
      if (data.user !== this.scriptId) {
        this.script.update(s => s ? { ...s, content: data.content } : s);
      }
    });

    this.scriptHub.onPresenceChanged((scriptId, info) => {
      if (scriptId === this.scriptId) {
        this.onlineUsers.update(users => {
          const n = new Set(users);
          if (info.joined) n.add(info.user); else n.delete(info.user);
          return n;
        });
      }
    });

    this.scriptHub.onVersionCreated((data) => {
      if (data.scriptId === this.scriptId) this.loadScript();
    });

    this.scriptHub.onCommentAdded((data) => {
      if (data.scriptId === this.scriptId) this.comments.update(c => [...c, data.comment]);
    });
  }

  togglePanel(panel: string): void {
    this.showPanel.update(p => p === panel ? null : panel);
  }

  onContentChange(): void {
    this.hasUnsavedChanges = true;
    this.scriptHub.contentChanged(this.scriptId, this.script()?.content || '', this.scriptId);
  }

  hasChanges(): boolean { return this.hasUnsavedChanges; }

  saveScript(): void {
    const s = this.script();
    if (!s) return;
    this.api.updateScript(s.id, { content: s.content, title: s.title }).subscribe({
      next: () => {
        this.hasUnsavedChanges = false;
        this.api.createScriptVersion(s.id, { content: s.content }).subscribe();
      }
    });
  }

  saveTitle(): void {
    const s = this.script();
    if (!s) return;
    this.api.updateScript(s.id, { title: s.title }).subscribe();
  }

  revertVersion(versionNumber: number): void {
    if (confirm(`Reverter para a versão ${versionNumber}?`)) {
      this.api.revertScriptVersion(this.scriptId, versionNumber).subscribe({
        next: script => { this.script.set(script); this.loadScript(); }
      });
    }
  }

  addComment(): void {
    if (this.newComment.trim()) {
      this.api.addScriptComment(this.scriptId, this.newComment).subscribe({
        next: comment => { this.comments.update(c => [...c, comment]); this.newComment = ''; }
      });
    }
  }

  resolveComment(commentId: string): void {
    this.api.resolveScriptComment(this.scriptId, commentId).subscribe({
      next: updated => this.comments.update(c => c.map(cm => cm.id === commentId ? updated : cm))
    });
  }

  toggleChecklistItem(item: ChecklistItem): void {
    item.isChecked = !item.isChecked;
    this.api.updateScriptChecklist(this.scriptId, this.checklist()).subscribe();
  }

  exportJson(): void { this.api.exportJson(this.scriptId).subscribe(blob => this.downloadBlob(blob, 'roteiro.json')); }
  exportWord(): void { this.api.exportWord(this.scriptId).subscribe(blob => this.downloadBlob(blob, 'roteiro.docx')); }
  openTeleprompter(): void { window.open(`/tp/${this.scriptId}`, '_blank'); }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  getStatusLabel(status: ScriptStatus): string {
    const labels: Record<number, string> = {
      [ScriptStatus.Rascunho]: 'Rascunho', [ScriptStatus.EmRevisao]: 'Em Revisão',
      [ScriptStatus.Aprovado]: 'Aprovado', [ScriptStatus.Gravado]: 'Gravado', [ScriptStatus.Concluido]: 'Concluído'
    };
    return labels[status] || 'N/A';
  }

  getStatusStyle(status: ScriptStatus): string {
    const styles: Record<number, string> = {
      [ScriptStatus.Rascunho]: 'background:rgba(249,115,22,0.1);color:#f97316;',
      [ScriptStatus.EmRevisao]: 'background:rgba(234,179,8,0.1);color:#eab308;',
      [ScriptStatus.Aprovado]: 'background:rgba(16,185,129,0.1);color:#10b981;',
      [ScriptStatus.Gravado]: 'background:rgba(59,130,246,0.1);color:#3b82f6;',
      [ScriptStatus.Concluido]: 'background:rgba(113,113,122,0.1);color:#71717a;'
    };
    return styles[status] || 'background:rgba(113,113,122,0.1);color:#71717a;';
  }
}
