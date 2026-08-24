using Google.Cloud.Firestore;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Teleprompt.Domain.Entities;
using Teleprompt.Domain.Enums;
using Teleprompt.Infrastructure.Data;

namespace Teleprompt.Migration;

public class Program
{
    private static FirestoreDb _firestore = null!;
    private static IServiceScopeFactory _scopeFactory = null!;

    public static async Task Main(string[] args)
    {
        Console.WriteLine("=== Teleprompt Firebase → .NET Migration ===");
        Console.WriteLine();

        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false)
            .Build();

        // Setup Firebase
        var firebaseConfig = configuration.GetSection("Firebase");
        var projectId = firebaseConfig["ProjectId"];
        var serviceAccountKey = firebaseConfig["ServiceAccountKey"];

        if (string.IsNullOrEmpty(projectId) || projectId == "YOUR_FIREBASE_PROJECT_ID")
        {
            Console.WriteLine("ERROR: Configure Firebase ProjectId in appsettings.json");
            Console.WriteLine();
            Console.WriteLine("1. Go to Firebase Console → Project Settings → General");
            Console.WriteLine("2. Copy your Project ID");
            Console.WriteLine("3. Update 'Firebase:ProjectId' in appsettings.json");
            Console.WriteLine();
            Console.WriteLine("4. Download service account key from:");
            Console.WriteLine("   Firebase Console → Project Settings → Service accounts → Generate new private key");
            Console.WriteLine("5. Save as 'serviceAccountKey.json' in this directory");
            Console.WriteLine();
            Console.WriteLine("Then run this tool again.");
            return;
        }

        if (!string.IsNullOrEmpty(serviceAccountKey) && File.Exists(serviceAccountKey))
        {
            Environment.SetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS", Path.GetFullPath(serviceAccountKey));
        }

        _firestore = await FirestoreDb.CreateAsync(projectId);
        Console.WriteLine($"Connected to Firebase project: {projectId}");

        // Setup DI
        var services = new ServiceCollection();
        services.AddDbContext<TelepromptDbContext>(options =>
        {
            var provider = configuration["Database:Provider"] ?? "Sqlite";
            var connStr = configuration["Database:DefaultConnection"] ?? "Data Source=teleprompt-migration.db";
            if (provider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase))
                options.UseSqlite(connStr);
            else
                options.UseSqlServer(connStr);
        });
        services.AddIdentityCore<ApplicationUser>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = true;
            options.Password.RequiredLength = 8;
            options.User.RequireUniqueEmail = true;
        })
        .AddEntityFrameworkStores<TelepromptDbContext>();

        var provider = services.BuildServiceProvider();
        _scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        // Ensure database is created
        using (var scope = _scopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<TelepromptDbContext>();
            await db.Database.EnsureCreatedAsync();
        }
        Console.WriteLine("Database ready.");
        Console.WriteLine();

        // Run migration
        try
        {
            var userMap = await MigrateWorkspacesAndUsers();
            await MigrateProjects(userMap);
            await MigrateScripts(userMap);
            await MigrateActivities(userMap);

            Console.WriteLine();
            Console.WriteLine("=== Migration Complete ===");
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<TelepromptDbContext>();
            Console.WriteLine($"Users: {await db.Users.CountAsync()}");
            Console.WriteLine($"Workspaces: {await db.Workspaces.CountAsync()}");
            Console.WriteLine($"Projects: {await db.Projects.CountAsync()}");
            Console.WriteLine($"Scripts: {await db.Scripts.CountAsync()}");
            Console.WriteLine($"Activities: {await db.Activities.CountAsync()}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ERROR: {ex.Message}");
            Console.WriteLine(ex.StackTrace);
        }
    }

    private static async Task<Dictionary<string, string>> MigrateWorkspacesAndUsers()
    {
        Console.WriteLine("--- Migrating Workspaces & Users ---");
        var userMap = new Dictionary<string, string>();

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TelepromptDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        // Migrate workspaces
        var workspacesSnapshot = await _firestore.Collection("workspaces").GetSnapshotAsync();
        foreach (var doc in workspacesSnapshot.Documents)
        {
            var data = doc.ToDictionary();
            var workspace = new Workspace
            {
                Name = data.GetValueOrDefault("name")?.ToString() ?? "Workspace",
                OwnerId = data.GetValueOrDefault("ownerId")?.ToString() ?? "",
                Plan = ParsePlan(data.GetValueOrDefault("plan")?.ToString()),
                CreatedAt = GetDateTime(data, "createdAt"),
                UpdatedAt = GetDateTime(data, "updatedAt")
            };

            db.Workspaces.Add(workspace);
            await db.SaveChangesAsync();

            // Migrate workspace members
            var members = data.GetValueOrDefault("members") as List<object>;
            if (members != null)
            {
                foreach (var memberId in members)
                {
                    var userId = memberId.ToString();
                    if (!string.IsNullOrEmpty(userId))
                    {
                        db.WorkspaceMembers.Add(new WorkspaceMember
                        {
                            WorkspaceId = workspace.Id,
                            UserId = userId,
                            JoinedAt = DateTime.UtcNow
                        });
                    }
                }
            }

            Console.WriteLine($"  Workspace: {workspace.Name} ({workspace.Id})");
        }

        await db.SaveChangesAsync();

        // Migrate users
        var usersSnapshot = await _firestore.Collection("users").GetSnapshotAsync();
        foreach (var doc in usersSnapshot.Documents)
        {
            var data = doc.ToDictionary();
            var firebaseUid = doc.Id;

            var user = new ApplicationUser
            {
                UserName = data.GetValueOrDefault("email")?.ToString() ?? $"{firebaseUid}@migrated.local",
                Email = data.GetValueOrDefault("email")?.ToString() ?? $"{firebaseUid}@migrated.local",
                DisplayName = data.GetValueOrDefault("displayName")?.ToString() ?? "User",
                EmailConfirmed = true,
                Role = ParseRole(data.GetValueOrDefault("role")?.ToString()),
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
                RequiresChecklist = GetBoolOrDefault(data, "requiresChecklist", true),
                WorkspaceId = data.GetValueOrDefault("workspaceId")?.ToString(),
                CreatedAt = GetDateTime(data, "createdAt"),
                UpdatedAt = GetDateTime(data, "updatedAt")
            };

            var statusStr = data.GetValueOrDefault("status")?.ToString()?.ToLower();
            user.Status = statusStr switch
            {
                "inactive" => UserStatus.Inactive,
                "pending" => UserStatus.Pending,
                _ => UserStatus.Active
            };

            try
            {
                var result = await userManager.CreateAsync(user, "Migrated@Temp123!");
                if (result.Succeeded)
                {
                    userMap[firebaseUid] = user.Id;
                    Console.WriteLine($"  User: {user.Email} ({user.Id})");
                }
                else
                {
                    Console.WriteLine($"  WARN: Could not create {user.Email}: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  WARN: Error creating user {user.Email}: {ex.Message}");
            }
        }

        Console.WriteLine($"  Migrated {userMap.Count} users.");
        return userMap;
    }

    private static async Task MigrateProjects(Dictionary<string, string> userMap)
    {
        Console.WriteLine("--- Migrating Projects ---");
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TelepromptDbContext>();

        var projectsSnapshot = await _firestore.Collection("projects").GetSnapshotAsync();
        foreach (var doc in projectsSnapshot.Documents)
        {
            var data = doc.ToDictionary();
            var project = new Project
            {
                Name = data.GetValueOrDefault("name")?.ToString() ?? "Project",
                Code = data.GetValueOrDefault("code")?.ToString(),
                WorkspaceId = data.GetValueOrDefault("workspaceId")?.ToString() ?? "",
                Status = ParseProjectStatus(data.GetValueOrDefault("status")?.ToString()),
                Bucket = ParseBucket(data.GetValueOrDefault("bucket")?.ToString()),
                CreatedAt = GetDateTime(data, "createdAt"),
                UpdatedAt = GetDateTime(data, "updatedAt")
            };

            db.Projects.Add(project);
            Console.WriteLine($"  Project: {project.Name} ({project.Id})");
        }

        await db.SaveChangesAsync();
    }

    private static async Task MigrateScripts(Dictionary<string, string> userMap)
    {
        Console.WriteLine("--- Migrating Scripts ---");
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TelepromptDbContext>();

        var scriptsSnapshot = await _firestore.Collection("scripts").GetSnapshotAsync();
        foreach (var doc in scriptsSnapshot.Documents)
        {
            var data = doc.ToDictionary();
            var script = new Script
            {
                ProjectId = data.GetValueOrDefault("projectId")?.ToString() ?? "",
                WorkspaceId = data.GetValueOrDefault("workspaceId")?.ToString() ?? "",
                Title = data.GetValueOrDefault("title")?.ToString() ?? "Script",
                Content = data.GetValueOrDefault("content")?.ToString() ?? "",
                Status = ParseScriptStatus(data.GetValueOrDefault("status")?.ToString()),
                IsLocked = GetBool(data, "isLocked"),
                Version = GetInt(data, "version", 1),
                CreatedBy = data.GetValueOrDefault("createdBy")?.ToString(),
                CreatedAt = GetDateTime(data, "createdAt"),
                UpdatedAt = GetDateTime(data, "updatedAt")
            };

            db.Scripts.Add(script);
            Console.WriteLine($"  Script: {script.Title} ({script.Id})");
        }

        await db.SaveChangesAsync();
    }

    private static async Task MigrateActivities(Dictionary<string, string> userMap)
    {
        Console.WriteLine("--- Migrating Activities ---");
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TelepromptDbContext>();

        var activitiesSnapshot = await _firestore.Collection("activities").GetSnapshotAsync();
        var count = 0;
        foreach (var doc in activitiesSnapshot.Documents)
        {
            var data = doc.ToDictionary();
            var activity = new Activity
            {
                WorkspaceId = data.GetValueOrDefault("workspaceId")?.ToString() ?? "",
                UserId = data.GetValueOrDefault("userId")?.ToString(),
                Type = ParseActivityType(data.GetValueOrDefault("type")?.ToString()),
                Description = data.GetValueOrDefault("description")?.ToString() ?? "",
                CreatedAt = GetDateTime(data, "createdAt")
            };

            db.Activities.Add(activity);
            count++;
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"  Migrated {count} activities.");
    }

    // Helper methods
    private static DateTime GetDateTime(Dictionary<string, object> data, string key)
    {
        if (!data.ContainsKey(key)) return DateTime.UtcNow;
        var val = data[key];
        if (val is Timestamp ts) return ts.ToDateTime();
        if (val is string s && DateTime.TryParse(s, out var dt)) return dt;
        return DateTime.UtcNow;
    }

    private static bool GetBool(Dictionary<string, object> data, string key)
    {
        if (!data.ContainsKey(key)) return false;
        var val = data[key];
        if (val is bool b) return b;
        if (val is string s && bool.TryParse(s, out var result)) return result;
        return false;
    }

    private static bool GetBoolOrDefault(Dictionary<string, object> data, string key, bool defaultValue)
    {
        if (!data.ContainsKey(key)) return defaultValue;
        return GetBool(data, key);
    }

    private static int GetInt(Dictionary<string, object> data, string key, int defaultValue)
    {
        if (!data.ContainsKey(key)) return defaultValue;
        var val = data[key];
        if (val is long l) return (int)l;
        if (val is int i) return i;
        if (val is string s && int.TryParse(s, out var result)) return result;
        return defaultValue;
    }

    private static WorkspacePlan ParsePlan(string? plan) => plan?.ToLower() switch
    {
        "pro" => WorkspacePlan.Pro,
        "enterprise" => WorkspacePlan.Enterprise,
        "lifetime" => WorkspacePlan.Lifetime,
        _ => WorkspacePlan.Free
    };

    private static Role ParseRole(string? role)
    {
        if (string.IsNullOrEmpty(role)) return Role.Estagiario;
        if (Enum.TryParse<Role>(role, true, out var parsed)) return parsed;
        return Role.Estagiario;
    }

    private static ProjectStatus ParseProjectStatus(string? status) => status?.ToLower() switch
    {
        "in-progress" or "em andamento" => ProjectStatus.InProgress,
        "completed" or "concluído" or "completo" => ProjectStatus.Completed,
        "paused" => ProjectStatus.Paused,
        "delayed" => ProjectStatus.Delayed,
        "backlog" => ProjectStatus.Backlog,
        _ => ProjectStatus.Awaiting
    };

    private static Bucket ParseBucket(string? bucket) => bucket?.ToLower() switch
    {
        "em andamento" => Bucket.EmAndamento,
        "pausado" => Bucket.Pausado,
        "em revisão" => Bucket.EmRevisao,
        "em ajuste" => Bucket.EmAjuste,
        "concluído" => Bucket.Concluido,
        _ => Bucket.Backlog
    };

    private static ScriptStatus ParseScriptStatus(string? status) => status?.ToLower() switch
    {
        "emrevisao" or "em revisão" or "em-revisao" => ScriptStatus.EmRevisao,
        "aprovado" => ScriptStatus.Aprovado,
        "gravado" => ScriptStatus.Gravado,
        "concluido" or "concluído" => ScriptStatus.Concluido,
        _ => ScriptStatus.Rascunho
    };

    private static ActivityType ParseActivityType(string? type) => type?.ToLower() switch
    {
        "update" or "edit" => ActivityType.Update,
        "delete" or "remove" => ActivityType.Delete,
        "comment" => ActivityType.Comment,
        "version" => ActivityType.Version,
        _ => ActivityType.Create
    };
}
