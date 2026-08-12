namespace Teleprompt.Domain.Entities;

public class Workspace : Entity
{
    public string Name { get; set; } = string.Empty;

    public string OwnerId { get; set; } = string.Empty;

    public Enums.WorkspacePlan Plan { get; set; } = Enums.WorkspacePlan.Free;

    public DateTime? TrialEndsAt { get; set; }

    /// <summary>JSON com labels personalizados por papel.</summary>
    public string? RoleLabelsJson { get; set; }

    public List<WorkspaceMember> Members { get; set; } = new();
}

public class WorkspaceMember
{
    public string WorkspaceId { get; set; } = string.Empty;
    public Workspace? Workspace { get; set; }

    public string UserId { get; set; } = string.Empty;

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}

public class Team : Entity
{
    public string Name { get; set; } = string.Empty;

    public string? Acronym { get; set; }

    public string WorkspaceId { get; set; } = string.Empty;

    public List<TeamMember> Members { get; set; } = new();
}

public class TeamMember
{
    public string TeamId { get; set; } = string.Empty;
    public Team? Team { get; set; }

    public string UserId { get; set; } = string.Empty;

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}

public class Presenter : Entity
{
    public string Name { get; set; } = string.Empty;

    public string? Email { get; set; }

    public string? Phone { get; set; }

    public string WorkspaceId { get; set; } = string.Empty;
}

public class Project : Entity
{
    public string Name { get; set; } = string.Empty;

    public string? Code { get; set; }

    public string? ExternalLink { get; set; }

    /// <summary>JSON com lista de links adicionais.</summary>
    public string? LinksJson { get; set; }

    public string WorkspaceId { get; set; } = string.Empty;

    public Enums.ProjectStatus? Status { get; set; }

    public Enums.Bucket? Bucket { get; set; }
}

public class Script : Entity
{
    public string ProjectId { get; set; } = string.Empty;

    public string WorkspaceId { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    /// <summary>Texto com marcadores estruturados ([Cena], [Loc], [Let]...).</summary>
    public string Content { get; set; } = string.Empty;

    public Enums.ScriptStatus Status { get; set; } = Enums.ScriptStatus.Rascunho;

    public bool IsLocked { get; set; }

    public string? LockedBy { get; set; }

    public DateTime? LockedUntil { get; set; }

    public string? CreatedBy { get; set; }

    public int Version { get; set; } = 1;

    public List<ScriptVersion> Versions { get; set; } = new();

    public List<Comment> Comments { get; set; } = new();

    public List<ChecklistItem> ChecklistItems { get; set; } = new();
}

/// <summary>Versão imutável (append-only) de um roteiro.</summary>
public class ScriptVersion : Entity
{
    public string ScriptId { get; set; } = string.Empty;

    public int VersionNumber { get; set; }

    public string Content { get; set; } = string.Empty;

    public string? CreatedBy { get; set; }
}

public class Comment : Entity
{
    public string ScriptId { get; set; } = string.Empty;

    public string AuthorId { get; set; } = string.Empty;

    public string Body { get; set; } = string.Empty;

    public bool IsResolved { get; set; }
}

public class ChecklistItem : Entity
{
    public string ScriptId { get; set; } = string.Empty;

    public string Label { get; set; } = string.Empty;

    public bool Required { get; set; }

    public bool IsChecked { get; set; }

    public string? CheckedBy { get; set; }

    public DateTime? CheckedAt { get; set; }
}

public class Activity : Entity
{
    public string WorkspaceId { get; set; } = string.Empty;

    public string? UserId { get; set; }

    public Enums.ActivityType Type { get; set; }

    public string Description { get; set; } = string.Empty;

    /// <summary>JSON com metadados adicionais.</summary>
    public string? MetadataJson { get; set; }
}

public class TpSession : Entity
{
    public string ScriptId { get; set; } = string.Empty;

    public string OwnerId { get; set; } = string.Empty;

    public Enums.TpScrollMode Mode { get; set; } = Enums.TpScrollMode.Paragraph;

    public double Speed { get; set; } = 1.0;

    /// <summary>JSON com estado da rolagem (posição, espelhos, ordem de gravação).</summary>
    public string? ScrollStateJson { get; set; }
}

public class ErrorReport : Entity
{
    public string? UserId { get; set; }

    public string? ScreenshotUrl { get; set; }

    public string? Description { get; set; }

    /// <summary>JSON com os logs recentes.</summary>
    public string? LogsJson { get; set; }

    public string Status { get; set; } = "open";
}

public class DebugLog : Entity
{
    public Enums.LogLevel Level { get; set; }

    public string Source { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    /// <summary>JSON com metadados.</summary>
    public string? MetadataJson { get; set; }
}
