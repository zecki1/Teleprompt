using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Teleprompt.Domain.Constants;
using Teleprompt.Domain.Entities;

namespace Teleprompt.Infrastructure.Data;

public class TelepromptDbContext : IdentityDbContext<ApplicationUser>
{
    public const string WorkspaceContextKey = "WorkspaceId";
    public const string UserContextKey = "UserId";

    public DbSet<Workspace> Workspaces => Set<Workspace>();
    public DbSet<WorkspaceMember> WorkspaceMembers => Set<WorkspaceMember>();
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<TeamMember> TeamMembers => Set<TeamMember>();
    public DbSet<Presenter> Presenters => Set<Presenter>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Script> Scripts => Set<Script>();
    public DbSet<ScriptVersion> Versions => Set<ScriptVersion>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<ChecklistItem> ChecklistItems => Set<ChecklistItem>();
    public DbSet<Activity> Activities => Set<Activity>();
    public DbSet<TpSession> TpSessions => Set<TpSession>();
    public DbSet<ErrorReport> ErrorReports => Set<ErrorReport>();
    public DbSet<DebugLog> DebugLogs => Set<DebugLog>();

    public TelepromptDbContext(DbContextOptions<TelepromptDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>(e =>
        {
            e.HasIndex(u => u.WorkspaceId);
            e.HasIndex(u => u.Role);
            e.Property(u => u.DisplayName).HasMaxLength(200);
            e.Ignore(u => u.WorkspacesJson);
        });

        builder.Entity<WorkspaceMember>(e =>
        {
            e.HasKey(m => new { m.WorkspaceId, m.UserId });
            e.HasOne(m => m.Workspace)
                .WithMany(w => w.Members)
                .HasForeignKey(m => m.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Team>(e =>
        {
            e.HasIndex(t => t.WorkspaceId);
            e.Property(t => t.Name).HasMaxLength(200);
        });

        builder.Entity<TeamMember>(e =>
        {
            e.HasKey(m => new { m.TeamId, m.UserId });
            e.HasOne(m => m.Team)
                .WithMany(t => t.Members)
                .HasForeignKey(m => m.TeamId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Presenter>(e =>
        {
            e.HasIndex(p => p.WorkspaceId);
            e.Property(p => p.Name).HasMaxLength(300);
        });

        builder.Entity<Project>(e =>
        {
            e.HasIndex(p => p.WorkspaceId);
            e.HasIndex(p => new { p.WorkspaceId, p.Status });
            e.HasIndex(p => new { p.WorkspaceId, p.Bucket });
            e.Property(p => p.Name).HasMaxLength(300);
            e.Property(p => p.Code).HasMaxLength(100);
        });

        builder.Entity<Script>(e =>
        {
            e.HasIndex(s => s.WorkspaceId);
            e.HasIndex(s => s.ProjectId);
            e.Property(s => s.Title).HasMaxLength(500);
            e.HasMany(s => s.Versions)
                .WithOne()
                .HasForeignKey(v => v.ScriptId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasMany(s => s.Comments)
                .WithOne()
                .HasForeignKey(c => c.ScriptId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasMany(s => s.ChecklistItems)
                .WithOne()
                .HasForeignKey(c => c.ScriptId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ScriptVersion>(e =>
        {
            e.HasIndex(v => new { v.ScriptId, v.VersionNumber }).IsUnique();
        });

        builder.Entity<Comment>(e =>
        {
            e.HasIndex(c => c.ScriptId);
        });

        builder.Entity<ChecklistItem>(e =>
        {
            e.HasIndex(c => c.ScriptId);
        });

        builder.Entity<Activity>(e =>
        {
            e.HasIndex(a => new { a.WorkspaceId, a.CreatedAt });
        });

        builder.Entity<TpSession>(e =>
        {
            e.HasIndex(t => t.ScriptId);
        });

        builder.Entity<ErrorReport>(e =>
        {
            e.HasIndex(r => r.CreatedAt);
        });

        builder.Entity<DebugLog>(e =>
        {
            e.HasIndex(l => l.CreatedAt);
        });

        ApplySoftDeleteFilter(builder);
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        ApplyAudit();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        ApplyAudit();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void ApplyAudit()
    {
        var now = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries<Entity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    entry.Entity.UpdatedAt = now;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = now;
                    break;
            }
        }
    }

    private static void ApplySoftDeleteFilter(ModelBuilder builder)
    {
        builder.Entity<Workspace>().HasQueryFilter(e => e.DeletedAt == null);
        builder.Entity<Team>().HasQueryFilter(e => e.DeletedAt == null);
        builder.Entity<Presenter>().HasQueryFilter(e => e.DeletedAt == null);
        builder.Entity<Project>().HasQueryFilter(e => e.DeletedAt == null);
        builder.Entity<Script>().HasQueryFilter(e => e.DeletedAt == null);
        builder.Entity<Comment>().HasQueryFilter(e => e.DeletedAt == null);
    }
}
