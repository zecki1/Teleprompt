using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Teleprompt.Domain.Entities;
using Teleprompt.Domain.Enums;

namespace Teleprompt.Infrastructure.Data;

public static class SeedExampleData
{
    public const string WorkspaceName = "Workspace Demonstração";
    public const string AdminEmail = "admin@teleprompt.app";
    public const string AdminPassword = "Admin@12345";
    public const string TecnicoEmail = "tecnico@teleprompt.app";
    public const string TecnicoPassword = "Tecnico@12345";

    public static async Task SeedAsync(IServiceProvider services)
    {
        var db = services.GetRequiredService<TelepromptDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();

        var workspace = await db.Workspaces.FirstOrDefaultAsync(w => w.Name == WorkspaceName);
        if (workspace is null)
        {
            workspace = new Workspace
            {
                Name = WorkspaceName,
                OwnerId = "demo",
                Plan = WorkspacePlan.Pro
            };
            db.Workspaces.Add(workspace);
        }

        var admin = await CreateAccountAsync(
            userManager, db, workspace,
            AdminEmail, AdminPassword, "Administrador da Demonstração",
            Role.SuperAdmin, superAdmin: true, canViewAdmin: true, canViewReports: true,
            isEditor: true, isRevisor: true, canRevert: true, canAssign: true,
            requiresChecklist: false);

        var tecnico = await CreateAccountAsync(
            userManager, db, workspace,
            TecnicoEmail, TecnicoPassword, "Técnico da Demonstração",
            Role.Tecnico, superAdmin: false, canViewAdmin: false, canViewReports: false,
            isEditor: true, isRevisor: false, canRevert: false, canAssign: false,
            requiresChecklist: true);

        // Roteiros âncora criados pela opção "Nova Pasta" ficam com títulos
        // duplicados ("Roteiro Inicial"). No workspace demo, dá um nome próprio
        // para cada um (idempotente: só mexe em quem ainda tem o título padrão).
        await RenameInitialScriptsAsync(db, workspace);

        if (await db.Projects.AnyAsync(p => p.WorkspaceId == workspace.Id && p.Code != null && p.Code.StartsWith("EX-")))
        {
            await db.SaveChangesAsync();
            return;
        }

        var totalDays = DateTime.UtcNow;
        var sampleProjects = new (string Name, string Code, ProjectStatus Status, Bucket Bucket, int AgeDays)[]
        {
            ("Introdução ao Teleprompter", "EX-01", ProjectStatus.InProgress, Bucket.EmAndamento, 30),
            ("Séries Educativas — Módulo 1", "EX-02", ProjectStatus.InProgress, Bucket.EmAndamento, 21),
            ("Podcast Tecnologia", "EX-03", ProjectStatus.Paused, Bucket.Pausado, 14),
            ("Vinhetas de Abertura", "EX-04", ProjectStatus.Completed, Bucket.Concluido, 42),
            ("Roteiros Institucionais", "EX-05", ProjectStatus.Awaiting, Bucket.Backlog, 7),
            ("Novos Formatos", "EX-06", ProjectStatus.Backlog, Bucket.Backlog, 2)
        };

        foreach (var (name, code, status, bucket, ageDays) in sampleProjects)
        {
            var project = new Project
            {
                Name = name,
                Code = code,
                WorkspaceId = workspace.Id,
                Status = status,
                Bucket = bucket,
                CreatedAt = totalDays.AddDays(-ageDays),
                UpdatedAt = totalDays.AddDays(-(ageDays - 1))
            };
            db.Projects.Add(project);

            var scriptSamples = new (string Title, ScriptStatus Status, int ScriptAge, string Folder, string Subfolder, string Lesson)[]
            {
                ($"{name} — Aula 01", ScriptStatus.Rascunho, ageDays, "Módulo 1", "Unidade 1", "Aula 01"),
                ($"{name} — Aula 02 (Revisão)", ScriptStatus.EmRevisao, Math.Max(1, ageDays - 2), "Módulo 1", "Unidade 2", "Aula 02")
            };
            foreach (var (title, scriptStatus, scriptAge, folder, subfolder, lesson) in scriptSamples)
            {
                db.Scripts.Add(new Script
                {
                    ProjectId = project.Id,
                    WorkspaceId = workspace.Id,
                    Title = title,
                    Status = scriptStatus,
                    Folder = folder,
                    Subfolder = subfolder,
                    Lesson = lesson,
                    Version = 1,
                    CreatedBy = admin.Id,
                    CreatedAt = totalDays.AddDays(-scriptAge),
                    UpdatedAt = totalDays.AddDays(-(scriptAge - 1)),
                    Content = BuildRoteiroContent(title)
                });
            }
        }

        db.Activities.Add(new Activity
        {
            WorkspaceId = workspace.Id,
            UserId = admin.Id,
            Type = ActivityType.Create,
            Description = "Workspace de demonstração criado com contas fictícias",
            CreatedAt = totalDays.AddDays(-30)
        });

        await db.SaveChangesAsync();
    }

    private static async Task RenameInitialScriptsAsync(TelepromptDbContext db, Workspace workspace)
    {
        var projects = await db.Projects.AsNoTracking()
            .Where(p => p.WorkspaceId == workspace.Id)
            .ToDictionaryAsync(p => p.Id, p => p);
        var scripts = await db.Scripts
            .Where(s => s.WorkspaceId == workspace.Id && !s.IsPlaceholder)
            .Where(s => s.Title != null && s.Title.ToLower().StartsWith("roteiro inicial"))
            .OrderBy(s => s.CreatedAt)
            .ToListAsync();
        if (scripts.Count == 0)
            return;

        var counters = new Dictionary<string, int>();
        foreach (var script in scripts)
        {
            projects.TryGetValue(script.ProjectId, out var project);
            var key = project?.Code ?? project?.Name ?? script.ProjectId;
            counters[key] = counters.GetValueOrDefault(key) + 1;
            var n = counters[key];
            var label = string.IsNullOrWhiteSpace(key) ? "Projeto" : key;
            script.Title = $"{label} — Roteiro Inicial {n:00}";
        }
        await db.SaveChangesAsync();
    }

    private static async Task<ApplicationUser> CreateAccountAsync(
        UserManager<ApplicationUser> userManager,
        TelepromptDbContext db,
        Workspace workspace,
        string email,
        string password,
        string displayName,
        Role role,
        bool superAdmin,
        bool canViewAdmin,
        bool canViewReports,
        bool isEditor,
        bool isRevisor,
        bool canRevert,
        bool canAssign,
        bool requiresChecklist)
    {
        var emailNormalized = email.ToUpperInvariant();
        var user = await userManager.FindByEmailAsync(email);

        if (user is null)
        {
            user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                DisplayName = displayName,
                EmailConfirmed = true,
                Status = UserStatus.Active,
                WorkspaceId = workspace.Id,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            var result = await userManager.CreateAsync(user, password);
            if (!result.Succeeded)
                throw new InvalidOperationException(
                    $"Falha ao criar conta fictícia {email}: {string.Join("; ", result.Errors.Select(e => e.Description))}");
        }

        user.DisplayName = displayName;
        user.Role = role;
        user.IsSuperAdmin = superAdmin;
        user.CanManagePermissions = superAdmin;
        user.CanCollaborate = true;
        user.IsEditor = isEditor;
        user.IsRevisor = isRevisor;
        user.CanRevert = canRevert;
        user.CanViewAdmin = canViewAdmin;
        user.CanViewReports = canViewReports;
        user.CanViewActivityHistory = canViewReports;
        user.CanViewDebugLogs = superAdmin;
        user.CanAssign = canAssign;
        user.RequiresChecklist = requiresChecklist;
        user.Status = UserStatus.Active;
        user.WorkspaceId = workspace.Id;
        user.UpdatedAt = DateTime.UtcNow;
        await userManager.UpdateAsync(user);

        var isMember = await db.WorkspaceMembers.AnyAsync(
            m => m.WorkspaceId == workspace.Id && m.UserId == user.Id);
        if (!isMember)
            db.WorkspaceMembers.Add(new WorkspaceMember { WorkspaceId = workspace.Id, UserId = user.Id });

        return user;
    }

    private static string BuildRoteiroContent(string title)
    {
        return $$"""
            Cena 1
            Tempo: 45 segundos

            [Loc]: Bem-vindo ao roteiro "{{title}}". Este é um exemplo de demonstração do Teleprompt.
            [Let1]: {{title}}
            [Pron1]: te-le-promt
            [Url1]: https://teleprompt.zecki1.com.br
            [Img1]: https://picsum.photos/seed/{{title.Replace(' ', '-')}}/640/360

            Cena 2
            Tempo: 30 segundos

            [Loc]: Aperte Reproduzir no teleprompter para testar a rolagem automática do texto.
            [Let2]: Velocidade ajustável

            Cena 3
            Tempo: 20 segundos

            [Loc]: Quando terminar, marque como gravado e confira o histórico de versões no editor.
            [enc]: Encerramento
            """;
    }
}