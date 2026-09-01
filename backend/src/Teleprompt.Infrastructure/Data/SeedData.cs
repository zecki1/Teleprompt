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
    /// aplica os ALTERs de forma idempotente. Em vez de tentar e engolir o erro de
    /// coluna duplicada (que poluía o log com "fail" a cada boot), consulta o
    /// PRAGMA table_info e só aplica o ALTER para colunas realmente ausentes.
    /// </summary>
    private static async Task EnsureSqliteColumnsAsync(TelepromptDbContext db)
    {
        var columns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["Folder"] = "ALTER TABLE \"Scripts\" ADD COLUMN \"Folder\" TEXT NULL",
            ["Subfolder"] = "ALTER TABLE \"Scripts\" ADD COLUMN \"Subfolder\" TEXT NULL",
            ["Lesson"] = "ALTER TABLE \"Scripts\" ADD COLUMN \"Lesson\" TEXT NULL",
            ["IsPlaceholder"] = "ALTER TABLE \"Scripts\" ADD COLUMN \"IsPlaceholder\" INTEGER NOT NULL DEFAULT 0",
            ["EditorId"] = "ALTER TABLE \"Scripts\" ADD COLUMN \"EditorId\" TEXT NULL",
            ["EditorName"] = "ALTER TABLE \"Scripts\" ADD COLUMN \"EditorName\" TEXT NULL",
            ["ReviewerId"] = "ALTER TABLE \"Scripts\" ADD COLUMN \"ReviewerId\" TEXT NULL",
            ["ReviewerName"] = "ALTER TABLE \"Scripts\" ADD COLUMN \"ReviewerName\" TEXT NULL",
            ["VideomakerId"] = "ALTER TABLE \"Scripts\" ADD COLUMN \"VideomakerId\" TEXT NULL",
            ["VideomakerName"] = "ALTER TABLE \"Scripts\" ADD COLUMN \"VideomakerName\" TEXT NULL",
            ["CreatedByName"] = "ALTER TABLE \"Scripts\" ADD COLUMN \"CreatedByName\" TEXT NULL",
            ["ProjectName"] = "ALTER TABLE \"Scripts\" ADD COLUMN \"ProjectName\" TEXT NULL",
            ["PresenterIdsJson"] = "ALTER TABLE \"Scripts\" ADD COLUMN \"PresenterIdsJson\" TEXT NULL"
        };

        var existing = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var connection = db.Database.GetDbConnection();
        var wasClosed = connection.State != System.Data.ConnectionState.Open;
        if (wasClosed)
            await connection.OpenAsync();
        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = "PRAGMA table_info(\"Scripts\")";
            await using var reader = await command.ExecuteReaderAsync();
            var nameOrdinal = reader.GetOrdinal("name");
            while (await reader.ReadAsync())
                existing.Add(reader.GetString(nameOrdinal));
        }
        finally
        {
            if (wasClosed)
                await connection.CloseAsync();
        }

        foreach (var (column, ddl) in columns)
        {
            if (existing.Contains(column))
                continue;
            await db.Database.ExecuteSqlRawAsync(ddl);
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

        //
        // Seed ADITIVO e idempotente (roda a cada boot, dev e prod):
        // antes, o método retornava cedo quando o e-mail demo já existia — e na VM o
        // usuário demo veio do Firestore com a senha "Migrated@Temp123!", então o demo
        // ficava sem conteúdo e sem a senha documentada no deploy. Agora o seed REUSA o
        // usuário demo, garante permissões de super admin, redefine a senha de demonstração
        // e assegura o workspace, projeto, roteiro e atividade (nada é duplicado).
        //

        // Workspace de demonstração (reusa pelo nome).
        var workspace = await db.Workspaces
            .FirstOrDefaultAsync(w => w.Name == DemoWorkspaceName && w.DeletedAt == null)
            ?? new Workspace
            {
                Name = DemoWorkspaceName,
                OwnerId = "demo",
                Plan = WorkspacePlan.Enterprise
            };
        var workspaceIsNew = db.Entry(workspace).State == EntityState.Detached;
        if (workspaceIsNew)
            db.Workspaces.Add(workspace);
        await db.SaveChangesAsync();

        // Usuário de demonstração.
        var user = await userManager.FindByEmailAsync(DemoEmail);
        if (user is null)
        {
            user = new ApplicationUser
            {
                UserName = DemoEmail.ToLowerInvariant(),
                Email = DemoEmail.ToLowerInvariant(),
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

            var createResult = await userManager.CreateAsync(user, DemoPassword);
            if (!createResult.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Falha ao criar usuário demo: {string.Join("; ", createResult.Errors.Select(e => e.Description))}");
            }
        }
        else
        {
            user.DisplayName ??= "Usuário Demonstração";
            user.EmailConfirmed = true;
            user.Role = Role.SuperAdmin;
            user.IsSuperAdmin = true;
            user.CanManagePermissions = true;
            user.CanCollaborate = true;
            user.IsEditor = true;
            user.IsRevisor = true;
            user.CanRevert = true;
            user.CanViewAdmin = true;
            user.CanViewReports = true;
            user.CanViewActivityHistory = true;
            user.CanViewDebugLogs = true;
            user.CanAssign = true;
            user.RequiresChecklist = true;
            user.Status = UserStatus.Active;
            user.WorkspaceId = workspace.Id;

            var updateResult = await userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Falha ao atualizar usuário demo: {string.Join("; ", updateResult.Errors.Select(e => e.Description))}");
            }

            // Usuário migrado do Firestore entra com Migrated@Temp123!; o demo deve
            // entrar sempre com a senha documentada (Demo@12345).
            var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
            var resetResult = await userManager.ResetPasswordAsync(user, resetToken, DemoPassword);
            if (!resetResult.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Falha ao definir a senha do usuário demo: {string.Join("; ", resetResult.Errors.Select(e => e.Description))}");
            }
        }

        if (!await db.WorkspaceMembers.AnyAsync(m => m.WorkspaceId == workspace.Id && m.UserId == user.Id))
            db.WorkspaceMembers.Add(new WorkspaceMember { WorkspaceId = workspace.Id, UserId = user.Id });

        // Projeto de demonstração (reusa pelo código DEMO-01).
        var project = await db.Projects
            .FirstOrDefaultAsync(p => p.Code == "DEMO-01" && p.WorkspaceId == workspace.Id && p.DeletedAt == null)
            ?? new Project
            {
                Name = "Projeto Exemplo",
                Code = "DEMO-01",
                WorkspaceId = workspace.Id,
                Status = ProjectStatus.Awaiting,
                Bucket = Bucket.Backlog
            };
        if (db.Entry(project).State == EntityState.Detached)
            db.Projects.Add(project);
        await db.SaveChangesAsync();

        // Roteiro de demonstração (reusa por título no projeto).
        var script = await db.Scripts
            .FirstOrDefaultAsync(s => s.Title == "Roteiro Exemplo" && s.ProjectId == project.Id && s.DeletedAt == null)
            ?? new Script
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
        if (db.Entry(script).State == EntityState.Detached)
            db.Scripts.Add(script);

        // Atividade de demonstração (evita duplicar a cada boot).
        var hasSetupActivity = await db.Activities.AnyAsync(a =>
            a.WorkspaceId == workspace.Id &&
            a.Type == ActivityType.Create &&
            a.Description == "Setup de demonstração criado");
        if (!hasSetupActivity)
        {
            db.Activities.Add(new Activity
            {
                WorkspaceId = workspace.Id,
                UserId = user.Id,
                Type = ActivityType.Create,
                Description = "Setup de demonstração criado"
            });
        }

        await db.SaveChangesAsync();
    }
}
