using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Teleprompt.Domain.Entities;
using Teleprompt.Domain.Enums;
using Teleprompt.Infrastructure.Data;
using Teleprompt.Infrastructure.Extensions;

namespace Teleprompt.Migrator;

internal static class Program
{
    // Senha padrão atribuída a todos os usuários migrados (o Firebase não exporta senhas).
    private const string DefaultPassword = "Mudar@123";

    private static int _created, _skipped;

    private static async Task<int> Main(string[] args)
    {
        Console.OutputEncoding = Encoding.UTF8;
        Console.WriteLine("=== Teleprompt Migrator: Firestore → SQLite ===\n");

        var repoRoot = FindRepoRoot();
        if (repoRoot is null)
        {
            Console.Error.WriteLine("Raiz do repositório não encontrada (procurei .env.local subindo diretórios).");
            return 1;
        }
        Console.WriteLine($"Repositório: {repoRoot}");

        // ---- Configuração Firebase (.env.local na raiz) ----
        var envFile = Path.Combine(repoRoot, ".env.local");
        var envVars = ParseEnvFile(envFile);
        var apiKey = envVars.GetValueOrDefault("NEXT_PUBLIC_FIREBASE_API_KEY");
        var projectId = envVars.GetValueOrDefault("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
        if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(projectId))
        {
            Console.Error.WriteLine(".env.local sem NEXT_PUBLIC_FIREBASE_API_KEY / NEXT_PUBLIC_FIREBASE_PROJECT_ID.");
            return 1;
        }

        // ---- Credenciais: args > env > prompt ----
        var email = args.Length > 0 ? args[0] : Environment.GetEnvironmentVariable("TP_FB_EMAIL");
        var password = args.Length > 1 ? args[1] : Environment.GetEnvironmentVariable("TP_FB_PASSWORD");
        if (string.IsNullOrEmpty(email))
        {
            Console.Write("E-mail Firebase: ");
            email = Console.ReadLine()?.Trim();
        }
        if (string.IsNullOrEmpty(password))
        {
            Console.Write("Senha Firebase: ");
            password = ReadMasked();
        }

        var fs = new FirestoreClient(apiKey, projectId);
        try
        {
            await fs.SignInAsync(email!, password!);
            Console.WriteLine($"\nLogin Firebase OK ({projectId}).");
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine(ex.Message);
            return 1;
        }

        // ---- Serviços (DbContext + Identity apontando para o banco da API) ----
        var dbPath = Path.Combine(repoRoot, "backend", "src", "Teleprompt.Api", "teleprompt-dev.db");
        Console.WriteLine($"Banco destino: {dbPath}\n");

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Database:Provider"] = "Sqlite",
                ["ConnectionStrings:DefaultConnection"] = $"Data Source={dbPath}",
            })
            .Build();

        var services = new ServiceCollection()
            .AddLogging(l => l.SetMinimumLevel(Microsoft.Extensions.Logging.LogLevel.Warning))
            .AddInfrastructure(configuration)
            .AddIdentityCore<ApplicationUser>()
            .AddEntityFrameworkStores<TelepromptDbContext>()
            .Services.BuildServiceProvider();

        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TelepromptDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        await db.Database.EnsureCreatedAsync();

        try
        {
            await StepAsync("users", () => ImportUsersAsync(fs, db, userManager));
            await StepAsync("workspaces", () => ImportWorkspacesAsync(fs, db));
            await StepAsync("projects", () => ImportProjectsAsync(fs, db));
            await StepAsync("scripts", () => ImportScriptsAsync(fs, db));
            await StepAsync("presenters", () => ImportPresentersAsync(fs, db));
            await StepAsync("activities", () => ImportActivitiesAsync(fs, db));
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"\nFALHA: {ex.Message}");
            Console.Error.WriteLine(ex.StackTrace);
            return 1;
        }

        Console.WriteLine("\n=== Migração concluída ===");
        Console.WriteLine("Coleções com erro de permissão podem ser reprocessadas após ajustar as regras do Firestore e rodar novamente (a migração é idempotente).");
        return 0;
    }

    private static async Task StepAsync(string name, Func<Task> step)
    {
        try
        {
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.Write($"[{name}] ");
            Console.ResetColor();
            await step();
        }
        catch (Exception ex)
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine($"PULADO: {ex.Message.Split('—')[0].Trim()}");
            Console.ResetColor();
        }
    }

    // ---------------- Usuários ----------------

    private static async Task ImportUsersAsync(
        FirestoreClient fs, TelepromptDbContext db, UserManager<ApplicationUser> userManager)
    {
        Console.Write("users… ");
        var docs = await fs.ListAllAsync("users");

        // Dedup por e-mail normalizado (o Identity exige e-mail único).
        var seenEmails = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var existingIds = await db.Users.Select(u => u.Id).ToHashSetAsync();

        foreach (var doc in docs)
        {
            var uid = doc.Id;
            var rawEmail = doc.StrOrNull("email")?.Trim().ToLowerInvariant();
            var loginEmail = rawEmail ?? $"{uid}@migrado.local";

            if (!seenEmails.Add(loginEmail)) { _skipped++; continue; }   // e-mail duplicado: primeiro vence
            if (existingIds.Contains(uid)) { _skipped++; continue; }     // já migrado

            var user = new ApplicationUser
            {
                Id = uid,
                UserName = loginEmail,
                Email = loginEmail,
                EmailConfirmed = true,
                DisplayName = doc.StrOrNull("displayName") ?? doc.StrOrNull("name") ?? loginEmail,
                Role = MapRole(doc.StrOrNull("role")),
                IsSuperAdmin = doc.Bool("isSuperAdmin"),
                CanCollaborate = doc.Bool("canCollaborate"),
                IsEditor = doc.Bool("isEditor"),
                IsRevisor = doc.Bool("isRevisor"),
                CanRevert = doc.Bool("canRevert"),
                CanViewAdmin = doc.Bool("canViewAdmin"),
                CanViewReports = doc.Bool("canViewReports"),
                CanViewActivityHistory = doc.Bool("canViewActivityHistory"),
                CanViewDebugLogs = doc.Bool("canViewDebugLogs"),
                CanAssign = doc.Bool("canAssign"),
                RequiresChecklist = doc.Bool("requiresChecklist", true),
                Status = MapUserStatus(doc.StrOrNull("status")),
                WorkspaceId = doc.StrOrNull("workspaceId") ?? "",
                WorkspacesJson = JsonSerializer.Serialize(doc.StrList("workspaces")),
                CreatedAt = doc.CreatedAt(),
                UpdatedAt = doc.UpdatedAtOrCreated(),
                AvatarUrl = doc.StrOrNull("avatarUrl") ?? doc.StrOrNull("photoURL"),
                ConcurrencyStamp = Guid.NewGuid().ToString(),
            };

            var result = await userManager.CreateAsync(user, DefaultPassword);
            if (result.Succeeded) _created++;
            else
            {
                _skipped++;
                Console.WriteLine($"\n  ! usuário {uid} ({loginEmail}): {string.Join("; ", result.Errors.Select(e => e.Description))}");
            }
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"{_created} criados, {_skipped} ignorados");
        Reset();
    }

    // ---------------- Workspaces ----------------

    private static async Task ImportWorkspacesAsync(FirestoreClient fs, TelepromptDbContext db)
    {
        Console.Write("workspaces… ");
        var docs = await fs.ListAllAsync("workspaces");
        var userIds = await db.Users.Select(u => u.Id).ToHashSetAsync();
        var existingWs = await db.Workspaces.Select(w => w.Id).ToHashSetAsync();
        var existingMembers = await db.WorkspaceMembers
            .Select(m => new { m.WorkspaceId, m.UserId })
            .ToListAsync();
        var memberSet = existingMembers.Select(m => (m.WorkspaceId, m.UserId)).ToHashSet();

        foreach (var doc in docs)
        {
            if (!existingWs.Add(doc.Id)) { _skipped++; continue; }

            var ws = new Workspace
            {
                Id = doc.Id,
                Name = doc.Str("name", "(sem nome)"),
                OwnerId = doc.StrOrNull("ownerId") ?? "",
                Plan = MapPlan(doc.StrOrNull("plan")),
                RoleLabelsJson = doc.MapOfStrings("roleLabels") is { Count: > 0 } labels
                    ? JsonSerializer.Serialize(labels) : null,
                CreatedAt = doc.CreatedAt(),
                UpdatedAt = doc.UpdatedAtOrCreated(),
            };
            db.Workspaces.Add(ws);
            _created++;

            foreach (var memberId in doc.StrList("members"))
            {
                if (memberSet.Add((ws.Id, memberId)))
                    db.WorkspaceMembers.Add(new WorkspaceMember
                    {
                        WorkspaceId = ws.Id,
                        UserId = memberId,
                        JoinedAt = doc.CreatedAt(),
                    });
            }
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"{_created} criados, {_skipped} ignorados");
        Reset();
    }

    // ---------------- Projetos ----------------

    private static async Task ImportProjectsAsync(FirestoreClient fs, TelepromptDbContext db)
    {
        Console.Write("projects… ");
        var (docs, workspaces) = await fs.ListAllOrPerWorkspaceAsync("projects");
        if (workspaces.Count > 0)
            Console.Write($"(via filtro por workspace: {string.Join(", ", workspaces.Select(w => w[..8]))}…) ");
        var existing = await db.Projects.Select(p => p.Id).ToHashSetAsync();

        foreach (var doc in docs)
        {
            if (!existing.Add(doc.Id)) { _skipped++; continue; }

            db.Projects.Add(new Project
            {
                Id = doc.Id,
                Name = doc.Str("name", "(sem nome)"),
                Code = doc.StrOrNull("code"),
                ExternalLink = doc.StrOrNull("externalLink"),
                LinksJson = null,
                WorkspaceId = doc.Str("workspaceId"),
                Status = MapProjectStatus(doc.StrOrNull("status")),
                Bucket = MapBucket(doc.StrOrNull("bucket")),
                CreatedAt = doc.CreatedAt(),
                UpdatedAt = doc.UpdatedAtOrCreated(),
            });
            _created++;
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"{_created} criados, {_skipped} ignorados");
        Reset();
    }

    // ---------------- Roteiros (+ versões + comentários) ----------------

    private static async Task ImportScriptsAsync(FirestoreClient fs, TelepromptDbContext db)
    {
        Console.WriteLine("scripts… ");
        var docs = await fs.ListAllAsync("scripts");
        Console.WriteLine($"  {docs.Count} documentos encontrados");

        var existingScripts = await db.Scripts.Select(s => s.Id).ToHashSetAsync();
        var existingVersionKeys = (await db.Versions.Select(v => new { v.ScriptId, v.VersionNumber }).ToListAsync())
            .Select(v => (v.ScriptId, v.VersionNumber)).ToHashSet();
        var existingComments = await db.Comments.Select(c => c.Id).ToHashSetAsync();

        var createdScripts = 0;
        var createdVersions = 0;
        var createdComments = 0;
        var emptyScripts = 0;

        foreach (var doc in docs)
        {
            var sid = doc.Id;

            // Versões: ordenadas por createdAt; a mais recente é o conteúdo atual.
            List<FsDoc> versions;
            try
            {
                versions = await fs.ListSubcollectionAsync("scripts", sid, "versions");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  ! versões de {sid}: {ex.Message.Split('—')[0].Trim()} — roteiro ficará sem conteúdo");
                versions = new List<FsDoc>();
            }

            versions.Sort((a, b) => a.CreatedAt().CompareTo(b.CreatedAt()));
            var latestContent = versions.LastOrDefault()?.StrOrNull("content") ?? "";

            if (existingScripts.Add(sid))
            {
                db.Scripts.Add(new Script
                {
                    Id = sid,
                    ProjectId = doc.Str("projectId"),
                    WorkspaceId = doc.Str("workspaceId"),
                    Title = doc.Str("title", "(sem título)"),
                    Content = latestContent,
                    Status = MapScriptStatus(doc.StrOrNull("status")),
                    IsLocked = doc.Bool("lockedForEditing"),
                    CreatedBy = doc.StrOrNull("createdBy"),
                    Version = Math.Max(1, versions.Count),
                    CreatedAt = doc.CreatedAt(),
                    UpdatedAt = doc.UpdatedAtOrCreated(),
                });
                createdScripts++;
                if (latestContent.Length == 0) emptyScripts++;
            }
            else
            {
                _skipped++;
            }

            // Linhas de versão (append-only).
            for (var i = 0; i < versions.Count; i++)
            {
                var v = versions[i];
                if (!existingVersionKeys.Add((sid, i + 1))) continue;

                db.Versions.Add(new ScriptVersion
                {
                    Id = Guid.NewGuid().ToString("N"),
                    ScriptId = sid,
                    VersionNumber = i + 1,
                    Content = v.Str("content"),
                    CreatedBy = v.StrOrNull("createdBy") ?? doc.StrOrNull("createdBy"),
                    CreatedAt = v.CreatedAt(),
                });
                createdVersions++;
            }

            // Comentários.
            try
            {
                var comments = await fs.ListSubcollectionAsync("scripts", sid, "comments");
                foreach (var c in comments)
                {
                    if (!existingComments.Add(c.Id)) continue;
                    db.Comments.Add(new Comment
                    {
                        Id = c.Id,
                        ScriptId = sid,
                        AuthorId = c.Str("userId"),
                        Body = c.Str("text"),
                        IsResolved = false,
                        CreatedAt = c.CreatedAt(),
                        UpdatedAt = c.CreatedAt(),
                    });
                    createdComments++;
                }
            }
            catch { /* comentários são opcionais */ }
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"  roteiros: {createdScripts} criados ({emptyScripts} vazios), {_skipped} ignorados; versões: {createdVersions}; comentários: {createdComments}");
        Reset();
    }

    // ---------------- Apresentadores ----------------

    private static async Task ImportPresentersAsync(FirestoreClient fs, TelepromptDbContext db)
    {
        Console.Write("presenters… ");
        var docs = await fs.ListAllAsync("presenters");
        var existing = await db.Presenters.Select(p => p.Id).ToHashSetAsync();

        foreach (var doc in docs)
        {
            if (!existing.Add(doc.Id)) { _skipped++; continue; }

            db.Presenters.Add(new Presenter
            {
                Id = doc.Id,
                Name = doc.Str("name", "(sem nome)"),
                Email = doc.StrOrNull("email"),
                Phone = doc.StrOrNull("phone"),
                WorkspaceId = doc.Str("workspaceId"),
                CreatedAt = doc.CreatedAt(),
                UpdatedAt = doc.UpdatedAtOrCreated(),
            });
            _created++;
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"{_created} criados, {_skipped} ignorados");
        Reset();
    }

    // ---------------- Atividades ----------------

    private static async Task ImportActivitiesAsync(FirestoreClient fs, TelepromptDbContext db)
    {
        Console.Write("activities… ");
        var (docs, workspaces) = await fs.ListAllOrPerWorkspaceAsync("activities");
        if (workspaces.Count > 0)
            Console.Write($"(via filtro por workspace: {string.Join(", ", workspaces.Select(w => w[..8]))}…) ");
        var existing = await db.Activities.Select(a => a.Id).ToHashSetAsync();

        foreach (var doc in docs)
        {
            if (!existing.Add(doc.Id)) { _skipped++; continue; }

            var action = doc.StrOrNull("action") ?? "";
            var target = doc.StrOrNull("scriptTitle") ?? doc.StrOrNull("projectName") ?? doc.StrOrNull("lesson") ?? "";
            var description = target.Length > 0 ? $"{action}: {target}" : action;

            // Metadados extras (tudo que não virou coluna).
            var meta = new Dictionary<string, object?>();
            foreach (var (key, value) in doc.Fields)
            {
                if (key is "action" or "scriptTitle" or "projectName" or "workspaceId" or "userId" or "userName"
                    or "createdAt" or "updatedAt" or "timestamp" or "userAvatar")
                    continue;
                meta[key] = value;
            }

            db.Activities.Add(new Activity
            {
                Id = doc.Id,
                WorkspaceId = doc.Str("workspaceId"),
                UserId = doc.StrOrNull("userId"),
                Type = MapActivityType(action),
                Description = description,
                MetadataJson = meta.Count > 0 ? JsonSerializer.Serialize(meta) : null,
                CreatedAt = doc.Raw("timestamp") is DateTime ts ? ts : doc.CreatedAt(),
                UpdatedAt = doc.UpdatedAtOrCreated(),
            });
            _created++;
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"{_created} criadas, {_skipped} ignoradas");
        Reset();
    }

    // ---------------- Mapeamentos legado → domínio ----------------

    private static Role MapRole(string? legacy) => legacy?.ToLowerInvariant() switch
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
        "técnico" or "tecnico" => Role.Tecnico,
        "estagiário" or "estagiario" => Role.Estagiario,
        "editor" => Role.Editor,
        "validador" => Role.Validador,
        "publico" or "público" => Role.Publico,
        _ => Role.Estagiario,
    };

    private static UserStatus MapUserStatus(string? status) => status?.ToLowerInvariant() switch
    {
        "active" => UserStatus.Active,
        "inactive" => UserStatus.Inactive,
        "pending" => UserStatus.Pending,
        _ => UserStatus.Active,
    };

    private static WorkspacePlan MapPlan(string? plan) => plan?.ToLowerInvariant() switch
    {
        "pro" => WorkspacePlan.Pro,
        "enterprise" => WorkspacePlan.Enterprise,
        "lifetime" => WorkspacePlan.Lifetime,
        _ => WorkspacePlan.Free,
    };

    /// <summary>Status legado (UI) → ScriptStatus do domínio.</summary>
    private static ScriptStatus MapScriptStatus(string? status) => status?.ToLowerInvariant() switch
    {
        "rascunho" or "nao_gravado" or "rejeitado" => ScriptStatus.Rascunho,
        "em_revisao" => ScriptStatus.EmRevisao,
        "revisao_realizada" or "aguardando_gravacao" => ScriptStatus.Aprovado,
        "gravado" => ScriptStatus.Gravado,
        "concluido" or "arquivado" => ScriptStatus.Concluido,
        _ => ScriptStatus.Rascunho,
    };

    private static ProjectStatus? MapProjectStatus(string? status) => status?.ToLowerInvariant() switch
    {
        "awaiting" or "pendente" => ProjectStatus.Awaiting,
        "in-progress" or "em andamento" => ProjectStatus.InProgress,
        "completed" or "concluído" or "concluido" or "completo" => ProjectStatus.Completed,
        "paused" or "pausado" => ProjectStatus.Paused,
        "delayed" or "atrasado" => ProjectStatus.Delayed,
        "backlog" => ProjectStatus.Backlog,
        _ => null,
    };

    private static Bucket? MapBucket(string? bucket)
    {
        if (string.IsNullOrWhiteSpace(bucket)) return null;
        foreach (Bucket b in Enum.GetValues<Bucket>())
        {
            if (string.Equals(b.ToString(), bucket, StringComparison.OrdinalIgnoreCase))
                return b;
            if (b == Bucket.EmAndamento &&
                string.Equals(bucket.Replace(" ", ""), "EmAndamento", StringComparison.OrdinalIgnoreCase))
                return b;
        }
        return null;
    }

    private static ActivityType MapActivityType(string action)
    {
        var a = action.ToLowerInvariant();
        if (a.Contains("gravou") || a.Contains("record")) return ActivityType.Record;
        if (a.Contains("criou") || a.Contains("criaç") || a.Contains("create")) return ActivityType.Create;
        if (a.Contains("excluiu") || a.Contains("removeu") || a.Contains("delete")) return ActivityType.Delete;
        if (a.Contains("coment")) return ActivityType.Comment;
        if (a.Contains("restaur") || a.Contains("revert")) return ActivityType.Revert;
        if (a.Contains("atribui") || a.Contains("assign")) return ActivityType.Assign;
        if (a.Contains("login") || a.Contains("entrou")) return ActivityType.Login;
        if (a.Contains("versã") || a.Contains("versao") || a.Contains("version")) return ActivityType.Version;
        if (a.Contains("editou") || a.Contains("atualizou") || a.Contains("update") || a.Contains("salvou")) return ActivityType.Update;
        if (a.Contains("permiss")) return ActivityType.Permission;
        return ActivityType.Other;
    }

    // ---------------- Utilidades ----------------

    private static void Reset() => (_created, _skipped) = (0, 0);

    private static string? FindRepoRoot()
    {
        var dir = new DirectoryInfo(Directory.GetCurrentDirectory());
        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, ".env.local"))) return dir.FullName;
            dir = dir.Parent!;
        }
        return null;
    }

    private static Dictionary<string, string> ParseEnvFile(string path)
    {
        var dict = new Dictionary<string, string>();
        foreach (var line in File.ReadAllLines(path))
        {
            var trimmed = line.Trim();
            if (trimmed.Length == 0 || trimmed.StartsWith('#')) continue;
            var eq = trimmed.IndexOf('=');
            if (eq <= 0) continue;
            var key = trimmed[..eq].Trim();
            var value = trimmed[(eq + 1)..].Trim().Trim('"');
            dict[key] = value;
        }
        return dict;
    }

    private static string ReadMasked()
    {
        var sb = new StringBuilder();
        while (true)
        {
            var key = Console.ReadKey(intercept: true);
            if (key.Key == ConsoleKey.Enter) { Console.WriteLine(); break; }
            if (key.Key == ConsoleKey.Backspace && sb.Length > 0) { sb.Length--; Console.Write("\b \b"); }
            else if (!char.IsControl(key.KeyChar)) { sb.Append(key.KeyChar); Console.Write('*'); }
        }
        return sb.ToString();
    }
}
