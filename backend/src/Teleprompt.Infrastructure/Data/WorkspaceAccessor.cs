namespace Teleprompt.Infrastructure.Data;

/// <summary>
/// Contexto da requisição usado pelo RLS: qual workspace e usuário estão
/// ativos na conexão atual. Preenchido por um middleware após autenticação.
/// </summary>
public class WorkspaceAccessor
{
    public string? WorkspaceId { get; private set; }
    public string? UserId { get; private set; }
    public bool IsSuperAdmin { get; private set; }

    public void Set(string? workspaceId, string? userId, bool isSuperAdmin)
    {
        WorkspaceId = workspaceId;
        UserId = userId;
        IsSuperAdmin = isSuperAdmin;
    }

    public void Clear()
    {
        WorkspaceId = null;
        UserId = null;
        IsSuperAdmin = false;
    }
}
