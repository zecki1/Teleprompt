using Microsoft.AspNetCore.Identity;
using Teleprompt.Domain.Enums;

namespace Teleprompt.Infrastructure.Data;

/// <summary>
/// Usuário do ASP.NET Core Identity + perfil de negócio
/// (papel, permissões e workspace).
/// </summary>
public class ApplicationUser : IdentityUser
{
    public string? DisplayName { get; set; }

    public Role Role { get; set; } = Role.Estagiario;

    public bool IsSuperAdmin { get; set; }

    public bool CanManagePermissions { get; set; }

    public bool CanCollaborate { get; set; }

    public bool IsEditor { get; set; }

    public bool IsRevisor { get; set; }

    public bool CanRevert { get; set; }

    public bool CanViewAdmin { get; set; }

    public bool CanViewReports { get; set; }

    public bool CanViewActivityHistory { get; set; }

    public bool CanViewDebugLogs { get; set; }

    public bool CanAssign { get; set; }

    public bool RequiresChecklist { get; set; } = true;

    public string? AvatarUrl { get; set; }

    public UserStatus Status { get; set; } = UserStatus.Active;

    public string? WorkspaceId { get; set; }

    /// <summary>JSON com lista de workspaces dos quais o usuário participa.</summary>
    public string? WorkspacesJson { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
