using Google.Cloud.Firestore;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Teleprompt.Domain.Entities;
using Teleprompt.Domain.Enums;

namespace Teleprompt.Infrastructure.Data;

/// <summary>
/// Sincroniza (importa) os dados existentes no Firebase/Firestore para o SQLite.
///
/// O objetivo é "não perder nada": o Firestore continua sendo a fonte dos dados
/// antigos enquanto migramos para o backend .NET. O sync é idempotente e nunca
/// sobrescreve registros já importados: ele usa o mesmo documento Id do Firebase
/// como Id da entidade local, então rodar de novo apenas pula o que já existe.
/// Comportamento sem sobrescrita por design: edições locais nunca são apagadas
/// pela sincronização.
/// </summary>
public class FirebaseSyncService
{
    private const string PlaceholderProjectId = "YOUR_FIREBASE_PROJECT_ID";

    private readonly TelepromptDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<FirebaseSyncService> _logger;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly bool _enabled;
    private readonly string? _projectId;

    public FirebaseSyncService(
        TelepromptDbContext db,
        IConfiguration config,
        ILogger<FirebaseSyncService> logger,
        UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _config = config;
        _logger = logger;
        _userManager = userManager;
        _projectId = _config["Firebase:ProjectId"];
        _enabled = !string.IsNullOrWhiteSpace(_projectId)
            && !_projectId.Equals(PlaceholderProjectId, StringComparison.OrdinalIgnoreCase);
    }

    public bool Enabled => _enabled;

    public async Task<FirebaseSyncReport> SyncAsync(CancellationToken ct = default)
    {
        if (!_enabled)
        {
            _logger.LogWarning("Firebase sync: ignorado (Firebase:ProjectId não configurado ou placeholder). Chave esperada em {KeyPath}",
                _config["Firebase:ServiceAccountKey"]);
            return new FirebaseSyncReport { Message = "Firebase:ProjectId não configurado — sync ignorado." };
        }

        if (!TryResolveServiceAccount(out string? gacPath))
        {
            var err = $"Falha ao encontrar a service account do Firebase. Firebase:ServiceAccountKey={_config["Firebase:ServiceAccountKey"]} (existe={File.Exists(_config["Firebase:ServiceAccountKey"] ?? string.Empty)}), GOOGLE_APPLICATION_CREDENTIALS={Environment.GetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS")}";
            _logger.LogError("Firebase sync: {Err}", err);
            return new FirebaseSyncReport { Message = err };
        }
        _logger.LogInformation("Firebase sync: service account resolvida em {GacPath}", gacPath);

        FirestoreDb firestore;
        try
        {
            firestore = await FirestoreDb.CreateAsync(_projectId!);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Firebase: não foi possível conectar no projeto {ProjectId}. GOOGLE_APPLICATION_CREDENTIALS={Creds}",
                _projectId, Environment.GetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS"));
            return new FirebaseSyncReport { Message = $"Falha ao conectar no Firebase: {ex.Message}" };
        }

        var report = new FirebaseSyncReport { ProjectId = _projectId! };
        _logger.LogInformation("Firebase sync: conectado em {ProjectId}. Iniciando importação (workspaces → atividades).", _projectId);

        await SyncWorkspacesAsync(firestore, report, ct);
        _logger.LogInformation("Firebase sync: workspaces {Imported}/{Skipped} → projetos", report.Workspaces, report.WorkspacesSkipped);
        await SyncUsersAsync(firestore, report, ct);
        _logger.LogInformation("Firebase sync: usuários {Imported}/{Skipped} → projetos", report.Users, report.UsersSkipped);
        await SyncProjectsAsync(firestore, report, ct);
        _logger.LogInformation("Firebase sync: projetos {Imported}/{Skipped} → scripts", report.Projects, report.ProjectsSkipped);
        await SyncScriptsAsync(firestore, report, ct);
        _logger.LogInformation("Firebase sync: scripts {Imported}/{Skipped} → subcoleções", report.Scripts, report.ScriptsSkipped);
        await BackfillScriptPathsAsync(firestore, report, ct);
        _logger.LogInformation("Firebase sync: pastas backfiladas {Backfilled}/{Skipped}", report.ScriptsBackfilled, report.ScriptsBackfillSkipped);
        await BackfillScriptMetadataAsync(firestore, report, ct);
        await SyncScriptSubcollectionsAsync(firestore, report, ct);
        await SyncTeamsAsync(firestore, report, ct);
        _logger.LogInformation("Firebase sync: equipes {Imported}/{Skipped} → apresentadores", report.Teams, report.TeamsSkipped);
        await SyncPresentersAsync(firestore, report, ct);
        _logger.LogInformation("Firebase sync: apresentadores {Imported}/{Skipped} → atividades", report.Presenters, report.PresentersSkipped);
        await SyncActivitiesAsync(firestore, report, ct);

        report.Message = "Sincronização concluída (idempotente: itens já importados foram ignorados).";
        _logger.LogInformation("Firebase sync: concluída. {Summary}", report.ToSummary());
        return report;
    }

    private bool TryResolveServiceAccount(out string? resolvedPath)
    {
        // Prioridade: GOOGLE_APPLICATION_CREDENTIALS já definida OU Firebase:ServiceAccountKey.
        var envCreds = Environment.GetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS");
        var saPath = _config["Firebase:ServiceAccountKey"];
        if (!string.IsNullOrWhiteSpace(envCreds))
        {
            resolvedPath = envCreds;
            return true;
        }
        if (!string.IsNullOrWhiteSpace(saPath) && File.Exists(saPath))
        {
            var full = Path.GetFullPath(saPath);
            Environment.SetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS", full);
            resolvedPath = full;
            return true;
        }
        resolvedPath = null;
        return false;
    }

    private string? GetString(Dictionary<string, object> data, params string[] keys)
    {
        foreach (var key in keys)
            if (data.ContainsKey(key) && data[key] is not null)
            {
                var value = data[key].ToString();
                if (!string.IsNullOrWhiteSpace(value)) return value;
            }
        return null;
    }

    private static DateTime GetDateTime(Dictionary<string, object> data, string key)
    {
        if (!data.ContainsKey(key)) return DateTime.UtcNow;
        var value = data[key];
        if (value is Timestamp ts) return ts.ToDateTime().ToUniversalTime();
        if (value is string s && DateTime.TryParse(s, out var parsed)) return parsed.ToUniversalTime();
        return DateTime.UtcNow;
    }

    private static bool GetBool(Dictionary<string, object> data, string key)
    {
        if (!data.ContainsKey(key)) return false;
        var value = data[key];
        if (value is bool b) return b;
        if (value is string s && bool.TryParse(s, out var result)) return result;
        return false;
    }

    private static int GetInt(Dictionary<string, object> data, string key, int defaultValue)
    {
        if (!data.ContainsKey(key)) return defaultValue;
        var value = data[key];
        if (value is long l) return (int)l;
        if (value is int i) return i;
        if (value is string s && int.TryParse(s, out var result)) return result;
        return defaultValue;
    }

    private static List<string> GetStringList(Dictionary<string, object> data, string key)
    {
        if (!data.ContainsKey(key)) return new List<string>();
        if (data[key] is IReadOnlyList<object> list)
            return list.Select(x => x?.ToString() ?? string.Empty).Where(s => !string.IsNullOrEmpty(s)).ToList();
        return new List<string>();
    }

    /// <summary>"Raiz"/"Sem Pasta"/vazio viram null — pasta raiz é ausência de pasta.</summary>
    private static string? NormalizeFolder(string? folder)
    {
        if (string.IsNullOrWhiteSpace(folder)) return null;
        var trimmed = folder.Trim();
        if (trimmed.Equals("Raiz", StringComparison.OrdinalIgnoreCase) ||
            trimmed.Equals("Sem Pasta", StringComparison.OrdinalIgnoreCase))
            return null;
        return trimmed;
    }

    /// <summary>
    /// Extrai pasta/subpasta/aula de um documento legado do Firestore. Aceita
    /// os campos strings (folder/subfolder/lesson) e o antigo caminho em array
    /// ou string (path): ["Pasta", "Subpasta", "Aula"] ou "Pasta › Subpasta".
    /// </summary>
    private (string? folder, string? subfolder, string? lesson) ExtractFolderFields(Dictionary<string, object> data)
    {
        var folder = NormalizeFolder(GetString(data, "folder"));
        if (!string.IsNullOrWhiteSpace(folder))
            return (folder, NormalizeFolder(GetString(data, "subfolder")), NormalizeFolder(GetString(data, "lesson")));

        if (!data.TryGetValue("path", out var pathValue)) return (null, null, null);

        var segments = new List<string>();
        switch (pathValue)
        {
            case IReadOnlyList<object> list:
                segments.AddRange(list
                    .Select(x => NormalizeFolder(x?.ToString()))
                    .Where(s => s is not null)
                    .Cast<string>());
                break;
            case string raw:
                segments.AddRange(raw
                    .Split(new[] { '/', '›', '>', '»' }, StringSplitOptions.RemoveEmptyEntries)
                    .Select(x => NormalizeFolder(x))
                    .Where(s => s is not null)
                    .Cast<string>());
                break;
        }

        if (segments.Count == 0) return (null, null, null);
        var segs = segments.ToArray();
        return (segs[0], segs.Length > 1 ? segs[1] : null, segs.Length > 2 ? segs[2] : null);
    }

    private static Role ParseRole(string? role)
    {
        if (string.IsNullOrWhiteSpace(role)) return Role.Estagiario;

        var normalized = role.Trim()
            .Replace("á", "a")
            .Replace("é", "e")
            .Replace("í", "i")
            .Replace("ó", "o")
            .Replace("ú", "u");

        return normalized.ToLowerInvariant() switch
        {
            "superadmin" => Role.SuperAdmin,
            "diretor" => Role.Diretor,
            "coordenador" => Role.Coordenador,
            "orientador" => Role.Orientador,
            "docente" => Role.Docente,
            "especialista" => Role.Especialista,
            "assistente" => Role.Assistente,
            "analista" => Role.Analista,
            "tutor" => Role.Tutor,
            "monitor" => Role.Monitor,
            "tecnico" => Role.Tecnico,
            "estagiario" => Role.Estagiario,
            "editor" => Role.Editor,
            "validador" => Role.Validador,
            "publico" => Role.Publico,
            _ => role.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase) ? Role.SuperAdmin : Role.Estagiario
        };
    }

    private static UserStatus ParseUserStatus(string? status) => status?.Trim().ToLowerInvariant() switch
    {
        "inactive" => UserStatus.Inactive,
        "pending" => UserStatus.Pending,
        _ => UserStatus.Active
    };

    private static WorkspacePlan ParsePlan(string? plan) => plan?.Trim().ToLowerInvariant() switch
    {
        "pro" => WorkspacePlan.Pro,
        "enterprise" => WorkspacePlan.Enterprise,
        "lifetime" => WorkspacePlan.Lifetime,
        _ => WorkspacePlan.Free
    };

    private static ProjectStatus? ParseProjectStatus(string? status) => status?.Trim().ToLowerInvariant() switch
    {
        "in-progress" or "inprogress" or "em andamento" => ProjectStatus.InProgress,
        "completed" or "concluido" or "concluído" or "completo" => ProjectStatus.Completed,
        "paused" or "pausado" => ProjectStatus.Paused,
        "delayed" or "atrasado" => ProjectStatus.Delayed,
        "backlog" => ProjectStatus.Backlog,
        _ when string.IsNullOrWhiteSpace(status) => null,
        _ => ProjectStatus.Awaiting
    };

    private static Bucket? ParseBucket(string? bucket) => bucket?.Trim().ToLowerInvariant() switch
    {
        "em andamento" => Bucket.EmAndamento,
        "pausado" => Bucket.Pausado,
        "em revisao" or "em revisão" => Bucket.EmRevisao,
        "em ajuste" => Bucket.EmAjuste,
        "concluido" or "concluído" => Bucket.Concluido,
        "backlog" => Bucket.Backlog,
        _ when string.IsNullOrWhiteSpace(bucket) => null,
        _ => Bucket.Backlog
    };

    private static ScriptStatus ParseScriptStatus(string? status) => status?.Trim().ToLowerInvariant() switch
    {
        "emrevisao" or "em revisao" or "em-revisao" or "em revisão" => ScriptStatus.EmRevisao,
        "aprovado" => ScriptStatus.Aprovado,
        "gravado" => ScriptStatus.Gravado,
        "concluido" or "concluído" => ScriptStatus.Concluido,
        _ => ScriptStatus.Rascunho
    };

    private static ActivityType ParseActivityType(string? type) => type?.Trim().ToLowerInvariant() switch
    {
        "update" or "edit" => ActivityType.Update,
        "delete" or "remove" => ActivityType.Delete,
        "comment" => ActivityType.Comment,
        "version" => ActivityType.Version,
        "revert" => ActivityType.Revert,
        "assign" => ActivityType.Assign,
        "record" => ActivityType.Record,
        "login" => ActivityType.Login,
        "permission" => ActivityType.Permission,
        "other" => ActivityType.Other,
        _ => ActivityType.Create
    };

    /* ------------------------------------------------------------------ */

    private async Task SyncWorkspacesAsync(FirestoreDb firestore, FirebaseSyncReport report, CancellationToken ct)
    {
        var snapshot = await firestore.Collection("workspaces").GetSnapshotAsync(ct);
        foreach (var doc in snapshot.Documents)
        {
            ct.ThrowIfCancellationRequested();
            if (await _db.Workspaces.AnyAsync(w => w.Id == doc.Id, ct)) { report.WorkspacesSkipped++; continue; }

            var data = doc.ToDictionary();
            _db.Workspaces.Add(new Workspace
            {
                Id = doc.Id,
                Name = GetString(data, "name") ?? "Workspace",
                OwnerId = GetString(data, "ownerId") ?? string.Empty,
                Plan = ParsePlan(GetString(data, "plan")),
                CreatedAt = GetDateTime(data, "createdAt"),
                UpdatedAt = GetDateTime(data, "updatedAt")
            });

            foreach (var memberId in GetStringList(data, "members"))
                _db.WorkspaceMembers.Add(new WorkspaceMember { WorkspaceId = doc.Id, UserId = memberId });

            report.Workspaces++;
        }
        await _db.SaveChangesAsync(ct);
    }

    private async Task SyncUsersAsync(FirestoreDb firestore, FirebaseSyncReport report, CancellationToken ct)
    {
        var snapshot = await firestore.Collection("users").GetSnapshotAsync(ct);
        foreach (var doc in snapshot.Documents)
        {
            ct.ThrowIfCancellationRequested();
            var firebaseUid = doc.Id;
            var data = doc.ToDictionary();
            var email = GetString(data, "email")?.Trim();

            if (string.IsNullOrWhiteSpace(email))
            {
                report.UsersSkipped++;
                continue;
            }

            var exists = await _db.Users.AnyAsync(
                u => u.Id == firebaseUid || u.NormalizedEmail == email!.ToUpperInvariant(), ct);
            if (exists) { report.UsersSkipped++; continue; }

            var user = new ApplicationUser
            {
                Id = firebaseUid,
                UserName = email,
                Email = email,
                EmailConfirmed = true,
                DisplayName = GetString(data, "displayName", "name") ?? email,
                Role = ParseRole(GetString(data, "role")),
                IsSuperAdmin = GetBool(data, "isSuperAdmin"),
                CanCollaborate = GetBool(data, "canCollaborate"),
                IsEditor = GetBool(data, "isEditor"),
                IsRevisor = GetBool(data, "isRevisor"),
                CanRevert = GetBool(data, "canRevert"),
                CanViewAdmin = GetBool(data, "canViewAdmin"),
                CanViewReports = GetBool(data, "canViewReports"),
                CanViewActivityHistory = GetBool(data, "canViewActivityHistory"),
                CanViewDebugLogs = GetBool(data, "canViewDebugLogs"),
                CanAssign = GetBool(data, "canAssign"),
                RequiresChecklist = data.ContainsKey("requiresChecklist") ? GetBool(data, "requiresChecklist") : true,
                WorkspaceId = GetString(data, "workspaceId"),
                Status = ParseUserStatus(GetString(data, "status")),
                CreatedAt = GetDateTime(data, "createdAt"),
                UpdatedAt = GetDateTime(data, "updatedAt")
            };

            var result = await _userManager.CreateAsync(user, "Migrated@Temp123!");
            if (result.Succeeded)
            {
                report.Users++;
                _logger.LogInformation("Firebase sync: usuário importado {Email} ({Uid})", user.Email, firebaseUid);
            }
            else
            {
                report.UsersSkipped++;
                _logger.LogWarning("Firebase sync: não foi possível importar {Email}: {Errors}",
                    user.Email, string.Join("; ", result.Errors.Select(e => e.Description)));
            }
        }
    }

    private async Task SyncProjectsAsync(FirestoreDb firestore, FirebaseSyncReport report, CancellationToken ct)
    {
        var snapshot = await firestore.Collection("projects").GetSnapshotAsync(ct);
        foreach (var doc in snapshot.Documents)
        {
            ct.ThrowIfCancellationRequested();
            if (await _db.Projects.AnyAsync(p => p.Id == doc.Id, ct)) { report.ProjectsSkipped++; continue; }

            var data = doc.ToDictionary();
            _db.Projects.Add(new Project
            {
                Id = doc.Id,
                Name = GetString(data, "name") ?? "Projeto",
                Code = GetString(data, "code"),
                ExternalLink = GetString(data, "externalLink", "link"),
                WorkspaceId = GetString(data, "workspaceId") ?? string.Empty,
                Status = ParseProjectStatus(GetString(data, "status")),
                Bucket = ParseBucket(GetString(data, "bucket")),
                CreatedAt = GetDateTime(data, "createdAt"),
                UpdatedAt = GetDateTime(data, "updatedAt")
            });
            report.Projects++;
        }
        await _db.SaveChangesAsync(ct);
    }

    private async Task SyncScriptsAsync(FirestoreDb firestore, FirebaseSyncReport report, CancellationToken ct)
    {
        var snapshot = await firestore.Collection("scripts").GetSnapshotAsync(ct);
        foreach (var doc in snapshot.Documents)
        {
            ct.ThrowIfCancellationRequested();
            if (await _db.Scripts.AnyAsync(s => s.Id == doc.Id, ct)) { report.ScriptsSkipped++; continue; }

            var data = doc.ToDictionary();
            var (folder, subfolder, lesson) = ExtractFolderFields(data);
            _db.Scripts.Add(new Script
            {
                Id = doc.Id,
                ProjectId = GetString(data, "projectId") ?? string.Empty,
                WorkspaceId = GetString(data, "workspaceId") ?? string.Empty,
                Title = GetString(data, "title") ?? "Roteiro",
                Content = GetString(data, "content") ?? string.Empty,
                Status = ParseScriptStatus(GetString(data, "status")),
                Folder = folder,
                Subfolder = subfolder,
                Lesson = lesson,
                IsPlaceholder = GetBool(data, "isPlaceholder"),
                IsLocked = GetBool(data, "isLocked"),
                Version = Math.Max(1, GetInt(data, "version", 1)),
                CreatedBy = GetString(data, "createdBy"),
                CreatedByName = GetString(data, "createdByName"),
                EditorId = GetString(data, "editorId"),
                EditorName = GetString(data, "editorName"),
                ReviewerId = GetString(data, "reviewerId"),
                ReviewerName = GetString(data, "reviewerName"),
                VideomakerId = GetString(data, "videomakerId"),
                VideomakerName = GetString(data, "videomakerName"),
                ProjectName = GetString(data, "project", "projectName"),
                PresenterIdsJson = GetStringList(data, "presenterIds") is { Count: > 0 } pIds
                    ? System.Text.Json.JsonSerializer.Serialize(pIds)
                    : null,
                CreatedAt = GetDateTime(data, "createdAt"),
                UpdatedAt = GetDateTime(data, "updatedAt")
            });
            report.Scripts++;
        }
        await _db.SaveChangesAsync(ct);
    }

    /// <summary>
    /// Preenche Folder/Subfolder/Lesson/IsPlaceholder dos roteiros já importados
    /// a partir do Firestore. Nunca sobrescreve um roteiro que já tem pasta
    /// (movimentos/edições locais são preservados) e nunca mexe em título/conteúdo.
    /// </summary>
    private async Task BackfillScriptPathsAsync(FirestoreDb firestore, FirebaseSyncReport report, CancellationToken ct)
    {
        // Roteiros locais que ainda não têm pasta: candidatos ao backfill.
        var candidates = await _db.Scripts.Where(s => string.IsNullOrEmpty(s.Folder)).ToListAsync(ct);
        var byId = candidates.ToDictionary(s => s.Id);

        var snapshot = await firestore.Collection("scripts").GetSnapshotAsync(ct);
        foreach (var doc in snapshot.Documents)
        {
            ct.ThrowIfCancellationRequested();
            if (!byId.TryGetValue(doc.Id, out var script))
            {
                report.ScriptsBackfillSkipped++;
                continue;
            }

            var data = doc.ToDictionary();
            var (folder, subfolder, lesson) = ExtractFolderFields(data);
            var isPlaceholder = GetBool(data, "isPlaceholder");

            if (string.IsNullOrWhiteSpace(folder) && !isPlaceholder)
            {
                report.ScriptsBackfillNoop++;
                continue;
            }

            script.Folder = folder;
            script.Subfolder = subfolder;
            script.Lesson = lesson;
            if (isPlaceholder) script.IsPlaceholder = true;
            report.ScriptsBackfilled++;
        }

        await _db.SaveChangesAsync(ct);
    }

    /// <summary>
    /// Re-executa apenas o backfill de pastas (sem a importação completa).
    /// Idempotente: um segundo run não acha roteiros sem pasta que já tenham
    /// caminho no Firestore.
    /// </summary>
    public async Task<FirebaseSyncReport> BackfillPathsAsync(CancellationToken ct = default)
    {
        if (!_enabled)
            return new FirebaseSyncReport { Message = "Firebase:ProjectId não configurado — backfill ignorado." };

        if (!TryResolveServiceAccount(out string? _))
            return new FirebaseSyncReport { Message = "Service account do Firebase não encontrada." };

        var firestore = await FirestoreDb.CreateAsync(_projectId!);
        var report = new FirebaseSyncReport { ProjectId = _projectId! };
        await BackfillScriptPathsAsync(firestore, report, ct);
        report.Message = $"Backfill de pastas concluído: {report.ScriptsBackfilled} roteiro(s) atualizado(s).";
        _logger.LogInformation("Firebase sync: backfill de pastas {Backfilled} atualizado(s), {Noop} sem pasta no Firestore, {Skipped} já com pasta/inexistente.",
            report.ScriptsBackfilled, report.ScriptsBackfillNoop, report.ScriptsBackfillSkipped);
        return report;
    }

    /// <summary>
    /// Preenche os metadados de pessoas (editor, revisor, videomaker, criador,
    /// projeto e apresentadores) dos roteiros já importados a partir do Firestore.
    /// Idempotente: só atualiza campos que ainda estão vazios, para nunca apagar
    /// atribuições feitas localmente depois da importação.
    /// </summary>
    private async Task BackfillScriptMetadataAsync(FirestoreDb firestore, FirebaseSyncReport report, CancellationToken ct)
    {
        // Candidatos: roteiros locais que ainda não têm os metadados de pessoas.
        var candidates = await _db.Scripts
            .Where(s => string.IsNullOrEmpty(s.EditorId) && string.IsNullOrEmpty(s.ReviewerId)
                && string.IsNullOrEmpty(s.VideomakerId) && string.IsNullOrEmpty(s.CreatedByName)
                && string.IsNullOrEmpty(s.ProjectName) && string.IsNullOrEmpty(s.PresenterIdsJson))
            .ToListAsync(ct);
        var byId = candidates.ToDictionary(s => s.Id);

        var snapshot = await firestore.Collection("scripts").GetSnapshotAsync(ct);
        foreach (var doc in snapshot.Documents)
        {
            ct.ThrowIfCancellationRequested();
            if (!byId.TryGetValue(doc.Id, out var script))
            {
                report.ScriptsBackfillSkipNoId++;
                continue;
            }

            var data = doc.ToDictionary();

            var editorId = GetString(data, "editorId");
            var reviewerId = GetString(data, "reviewerId");
            var videomakerId = GetString(data, "videomakerId");
            var createdByName = GetString(data, "createdByName");
            var projectName = GetString(data, "project", "projectName");
            var presenterIds = GetStringList(data, "presenterIds");

            if (editorId == null && reviewerId == null && videomakerId == null
                && createdByName == null && projectName == null && presenterIds.Count == 0)
            {
                report.ScriptsBackfillNoData++;
                continue;
            }

            script.EditorId ??= editorId;
            script.EditorName ??= GetString(data, "editorName");
            script.ReviewerId ??= reviewerId;
            script.ReviewerName ??= GetString(data, "reviewerName");
            script.VideomakerId ??= videomakerId;
            script.VideomakerName ??= GetString(data, "videomakerName");
            script.CreatedByName ??= createdByName;
            script.ProjectName ??= projectName;
            if (presenterIds.Count > 0 && string.IsNullOrEmpty(script.PresenterIdsJson))
                script.PresenterIdsJson = System.Text.Json.JsonSerializer.Serialize(presenterIds);

            report.ScriptsBackfillMetadata++;
        }

        await _db.SaveChangesAsync(ct);
    }

    private async Task SyncScriptSubcollectionsAsync(FirestoreDb firestore, FirebaseSyncReport report, CancellationToken ct)
    {
        var scriptsSnapshot = await firestore.Collection("scripts").GetSnapshotAsync(ct);
        foreach (var scriptDoc in scriptsSnapshot.Documents)
        {
            ct.ThrowIfCancellationRequested();
            if (!await _db.Scripts.AnyAsync(s => s.Id == scriptDoc.Id, ct)) continue;

            var versions = await scriptDoc.Reference.Collection("versions").GetSnapshotAsync(ct);
            foreach (var doc in versions.Documents)
            {
                var data = doc.ToDictionary();
                var versionNumber = GetInt(data, "versionNumber", 1);
                var exists = await _db.Versions.AnyAsync(v => v.ScriptId == scriptDoc.Id && v.VersionNumber == versionNumber, ct);
                if (exists) { report.VersionsSkipped++; continue; }

                _db.Versions.Add(new ScriptVersion
                {
                    ScriptId = scriptDoc.Id,
                    VersionNumber = versionNumber,
                    Content = GetString(data, "content") ?? string.Empty,
                    CreatedBy = GetString(data, "createdBy", "userId"),
                    CreatedAt = GetDateTime(data, "createdAt"),
                    UpdatedAt = GetDateTime(data, "updatedAt")
                });
                report.Versions++;
            }

            var comments = await scriptDoc.Reference.Collection("comments").GetSnapshotAsync(ct);
            foreach (var doc in comments.Documents)
            {
                var data = doc.ToDictionary();
                if (await _db.Comments.AnyAsync(c => c.Id == doc.Id, ct)) { report.CommentsSkipped++; continue; }

                _db.Comments.Add(new Comment
                {
                    Id = doc.Id,
                    ScriptId = scriptDoc.Id,
                    AuthorId = GetString(data, "userId") ?? string.Empty,
                    Body = GetString(data, "text", "body") ?? string.Empty,
                    IsResolved = GetBool(data, "isResolved"),
                    CreatedAt = GetDateTime(data, "createdAt"),
                    UpdatedAt = GetDateTime(data, "updatedAt")
                });
                report.Comments++;
            }

            await _db.SaveChangesAsync(ct);
        }
    }

    private async Task SyncTeamsAsync(FirestoreDb firestore, FirebaseSyncReport report, CancellationToken ct)
    {
        var snapshot = await firestore.Collection("teams").GetSnapshotAsync(ct);
        foreach (var doc in snapshot.Documents)
        {
            ct.ThrowIfCancellationRequested();
            if (await _db.Teams.AnyAsync(t => t.Id == doc.Id, ct)) { report.TeamsSkipped++; continue; }

            var data = doc.ToDictionary();
            _db.Teams.Add(new Team
            {
                Id = doc.Id,
                Name = GetString(data, "name") ?? "Equipe",
                Acronym = GetString(data, "acronym"),
                WorkspaceId = GetString(data, "workspaceId") ?? string.Empty
            });

            foreach (var memberId in GetStringList(data, "members"))
                _db.TeamMembers.Add(new TeamMember { TeamId = doc.Id, UserId = memberId });

            report.Teams++;
        }
        await _db.SaveChangesAsync(ct);
    }

    private async Task SyncPresentersAsync(FirestoreDb firestore, FirebaseSyncReport report, CancellationToken ct)
    {
        var snapshot = await firestore.Collection("presenters").GetSnapshotAsync(ct);
        foreach (var doc in snapshot.Documents)
        {
            ct.ThrowIfCancellationRequested();
            if (await _db.Presenters.AnyAsync(p => p.Id == doc.Id, ct)) { report.PresentersSkipped++; continue; }

            var data = doc.ToDictionary();
            _db.Presenters.Add(new Presenter
            {
                Id = doc.Id,
                Name = GetString(data, "name") ?? "Apresentador",
                Email = GetString(data, "email"),
                Phone = GetString(data, "phone", "telefone"),
                WorkspaceId = GetString(data, "workspaceId") ?? string.Empty
            });
            report.Presenters++;
        }
        await _db.SaveChangesAsync(ct);
    }

    private async Task SyncActivitiesAsync(FirestoreDb firestore, FirebaseSyncReport report, CancellationToken ct)
    {
        var snapshot = await firestore.Collection("activities").GetSnapshotAsync(ct);
        foreach (var doc in snapshot.Documents)
        {
            ct.ThrowIfCancellationRequested();
            if (await _db.Activities.AnyAsync(a => a.Id == doc.Id, ct)) { report.ActivitiesSkipped++; continue; }

            var data = doc.ToDictionary();
            _db.Activities.Add(new Activity
            {
                Id = doc.Id,
                WorkspaceId = GetString(data, "workspaceId") ?? string.Empty,
                UserId = GetString(data, "userId"),
                Type = ParseActivityType(GetString(data, "type", "action")),
                Description = GetString(data, "description") ?? string.Empty,
                CreatedAt = GetDateTime(data, "createdAt"),
                UpdatedAt = GetDateTime(data, "updatedAt")
            });
            report.Activities++;
        }
        await _db.SaveChangesAsync(ct);
    }
}

public class FirebaseSyncReport
{
    public string? ProjectId { get; set; }
    public string? Message { get; set; }
    public int Workspaces { get; set; }
    public int WorkspacesSkipped { get; set; }
    public int Users { get; set; }
    public int UsersSkipped { get; set; }
    public int Projects { get; set; }
    public int ProjectsSkipped { get; set; }
    public int Scripts { get; set; }
    public int ScriptsSkipped { get; set; }
    public int ScriptsBackfilled { get; set; }
    public int ScriptsBackfillSkipped { get; set; }
    public int ScriptsBackfillNoop { get; set; }
    public int ScriptsBackfillMetadata { get; set; }
    public int ScriptsBackfillSkipNoId { get; set; }
    public int ScriptsBackfillNoData { get; set; }
    public int Versions { get; set; }
    public int VersionsSkipped { get; set; }
    public int Comments { get; set; }
    public int CommentsSkipped { get; set; }
    public int Teams { get; set; }
    public int TeamsSkipped { get; set; }
    public int Presenters { get; set; }
    public int PresentersSkipped { get; set; }
    public int Activities { get; set; }
    public int ActivitiesSkipped { get; set; }

    public string ToSummary() =>
        $"workspaces={Workspaces}(+{WorkspacesSkipped} skip) users={Users}(+{UsersSkipped} skip) " +
        $"projects={Projects}(+{ProjectsSkipped} skip) scripts={Scripts}(+{ScriptsSkipped} skip; +{ScriptsBackfilled} backfill; +{ScriptsBackfillMetadata} metadata)" +
        $"versions={Versions}(+{VersionsSkipped} skip) comments={Comments}(+{CommentsSkipped} skip) " +
        $"teams={Teams}(+{TeamsSkipped} skip) presenters={Presenters}(+{PresentersSkipped} skip) " +
        $"activities={Activities}(+{ActivitiesSkipped} skip)";
}