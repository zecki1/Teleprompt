using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Teleprompt.Domain.Constants;
using Teleprompt.Domain.Entities;
using Teleprompt.Domain.Enums;

namespace Teleprompt.Infrastructure.Data;

public static class SeedData
{
    public const string DemoEmail = "demo@teleprompt.app";
    public const string DemoPassword = "Demo@12345";
    public const string DemoWorkspaceName = "Workspace Demonstração";

    /// <summary>
    /// Bancos SQLite criados com EnsureCreated antigamente não têm as colunas de
    /// pasta adicionadas depois. Como a VM roda em produção com um .db já existente,
    /// aplica os ALTERs de forma idempotente (ignora erro de coluna duplicada).
    /// </summary>
    private static async Task EnsureSqliteColumnsAsync(TelepromptDbContext db)
    {
        var ddls = new[]
        {
            "ALTER TABLE \"Scripts\" ADD COLUMN \"Folder\" TEXT NULL",
            "ALTER TABLE \"Scripts\" ADD COLUMN \"Subfolder\" TEXT NULL",
            "ALTER TABLE \"Scripts\" ADD COLUMN \"Lesson\" TEXT NULL",
            "ALTER TABLE \"Scripts\" ADD COLUMN \"IsPlaceholder\" INTEGER NOT NULL DEFAULT 0",
            "ALTER TABLE \"Scripts\" ADD COLUMN \"EditorId\" TEXT NULL",
            "ALTER TABLE \"Scripts\" ADD COLUMN \"EditorName\" TEXT NULL",
            "ALTER TABLE \"Scripts\" ADD COLUMN \"ReviewerId\" TEXT NULL",
            "ALTER TABLE \"Scripts\" ADD COLUMN \"ReviewerName\" TEXT NULL",
            "ALTER TABLE \"Scripts\" ADD COLUMN \"VideomakerId\" TEXT NULL",
            "ALTER TABLE \"Scripts\" ADD COLUMN \"VideomakerName\" TEXT NULL",
            "ALTER TABLE \"Scripts\" ADD COLUMN \"CreatedByName\" TEXT NULL",
            "ALTER TABLE \"Scripts\" ADD COLUMN \"ProjectName\" TEXT NULL",
            "ALTER TABLE \"Scripts\" ADD COLUMN \"PresenterIdsJson\" TEXT NULL"
        };
        foreach (var ddl in ddls)
        {
            try
            {
                await db.Database.ExecuteSqlRawAsync(ddl);
            }
            catch
            {
                // "duplicate column name" → coluna já existe; segue o baile.
            }
        }
    }

    public static async Task SeedAsync(IServiceProvider services)
    {
        var db = services.GetRequiredService<TelepromptDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();

        // SQL Server usa migrations; SQLite (dev local) usa EnsureCreated.
        var connectionType = db.Database.GetDbConnection().GetType().Name;
        if (connectionType.Contains("SqlConnection", StringComparison.OrdinalIgnoreCase))
            await db.Database.MigrateAsync();
        else
        {
            await db.Database.EnsureCreatedAsync();
            await EnsureSqliteColumnsAsync(db);
        }

        var demoEmailLower = DemoEmail.ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.NormalizedEmail == demoEmailLower.ToUpperInvariant()))
            return;

        var workspace = new Workspace
        {
            Name = DemoWorkspaceName,
            OwnerId = "demo",
            Plan = WorkspacePlan.Enterprise
        };
        db.Workspaces.Add(workspace);

        var user = new ApplicationUser
        {
            UserName = demoEmailLower,
            Email = demoEmailLower,
            DisplayName = "Usuário Demonstração",
            EmailConfirmed = true,
            Role = Role.SuperAdmin,
            IsSuperAdmin = true,
            CanManagePermissions = true,
            CanCollaborate = true,
            IsEditor = true,
            IsRevisor = true,
            CanRevert = true,
            CanViewAdmin = true,
            CanViewReports = true,
            CanViewActivityHistory = true,
            CanViewDebugLogs = true,
            CanAssign = true,
            RequiresChecklist = true,
            Status = UserStatus.Active,
            WorkspaceId = workspace.Id
        };

        var result = await userManager.CreateAsync(user, DemoPassword);
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(
                $"Falha ao criar usuário demo: {string.Join("; ", result.Errors.Select(e => e.Description))}");
        }

        db.WorkspaceMembers.Add(new WorkspaceMember { WorkspaceId = workspace.Id, UserId = user.Id });

        var project = new Project
        {
            Name = "Projeto Exemplo",
            Code = "DEMO-01",
            WorkspaceId = workspace.Id,
            Status = ProjectStatus.Awaiting,
            Bucket = Bucket.Backlog
        };
        db.Projects.Add(project);

        var script = new Script
        {
            ProjectId = project.Id,
            WorkspaceId = workspace.Id,
            Title = "Roteiro Exemplo",
            CreatedBy = user.Id,
            Content = """
                Cena1

                Tempo: 45 segundos

                [Locução]: Bem-vindo ao Teleprompt. Este é um roteiro de demonstração com cenas e marcadores.

                [Let1]: Bem-vindo ao Teleprompt

                [Pron1]: te-le-promt

                [Url1]: https://exemplo.com/fonte

                Cena2

                Tempo: 30 segundos

                [Locução]: Edite o texto, crie comentários e grave com o teleprompter.

                [Img1]: https://exemplo.com/imagem.png
                """
        };
        db.Scripts.Add(script);

        db.Activities.Add(new Activity
        {
            WorkspaceId = workspace.Id,
            UserId = user.Id,
            Type = ActivityType.Create,
            Description = "Setup de demonstração criado"
        });

        await db.SaveChangesAsync();
    }
}
