using Teleprompt.Domain.Enums;

namespace Teleprompt.Domain.Constants;

/// <summary>
/// Nomes das capabilities/permissões usadas como claims e na matriz de papéis.
/// Espelha a lógica atual da aplicação (permission flags em users).
/// </summary>
public static class Permissions
{
    public const string IsSuperAdmin = "isSuperAdmin";
    public const string CanManagePermissions = "canManagePermissions";
    public const string CanCollaborate = "canCollaborate";
    public const string IsEditor = "isEditor";
    public const string IsRevisor = "isRevisor";
    public const string CanRevert = "canRevert";
    public const string CanViewAdmin = "canViewAdmin";
    public const string CanViewReports = "canViewReports";
    public const string CanViewActivityHistory = "canViewActivityHistory";
    public const string CanViewDebugLogs = "canViewDebugLogs";
    public const string CanAssign = "canAssign";
    public const string RequiresChecklist = "requiresChecklist";

    public static readonly string[] All =
    [
        IsSuperAdmin, CanManagePermissions, CanCollaborate, IsEditor, IsRevisor,
        CanRevert, CanViewAdmin, CanViewReports, CanViewActivityHistory,
        CanViewDebugLogs, CanAssign, RequiresChecklist
    ];
}

/// <summary>
/// Matriz Papel x Permissão. Define as permissões base de cada papel.
/// O SuperAdmin pode conceder/revogar flags por usuário (overrides).
/// </summary>
public static class RolePermissions
{
    public static readonly HashSet<string> SuperAdmin = new(Permissions.All);

    public static readonly HashSet<string> Diretor = new()
    {
        Permissions.CanManagePermissions, Permissions.CanCollaborate, Permissions.IsEditor,
        Permissions.IsRevisor, Permissions.CanRevert, Permissions.CanViewAdmin,
        Permissions.CanViewReports, Permissions.CanViewActivityHistory,
        Permissions.CanViewDebugLogs, Permissions.CanAssign
    };

    public static readonly HashSet<string> Coordenador = new()
    {
        Permissions.CanManagePermissions, Permissions.CanCollaborate, Permissions.IsEditor,
        Permissions.IsRevisor, Permissions.CanRevert, Permissions.CanViewAdmin,
        Permissions.CanViewReports, Permissions.CanViewActivityHistory, Permissions.CanAssign
    };

    public static readonly HashSet<string> Orientador = new()
    {
        Permissions.CanCollaborate, Permissions.IsEditor, Permissions.IsRevisor,
        Permissions.CanRevert, Permissions.CanViewReports,
        Permissions.CanViewActivityHistory, Permissions.CanAssign
    };

    public static readonly HashSet<string> Docente = new(Orientador);

    public static readonly HashSet<string> Especialista = new()
    {
        Permissions.CanCollaborate, Permissions.IsEditor, Permissions.IsRevisor,
        Permissions.CanViewReports, Permissions.CanViewActivityHistory
    };

    public static readonly HashSet<string> Assistente = new()
    {
        Permissions.CanCollaborate, Permissions.IsEditor
    };

    public static readonly HashSet<string> Analista = new()
    {
        Permissions.CanCollaborate, Permissions.IsEditor,
        Permissions.CanViewReports, Permissions.CanViewActivityHistory
    };

    public static readonly HashSet<string> Tutor = new()
    {
        Permissions.CanCollaborate, Permissions.IsEditor
    };

    public static readonly HashSet<string> Monitor = new(Tutor);

    public static readonly HashSet<string> Tecnico = new(Tutor);

    public static readonly HashSet<string> Estagiario = new(Tutor);

    public static readonly HashSet<string> Editor = new()
    {
        Permissions.IsEditor
    };

    public static readonly HashSet<string> Validador = new()
    {
        Permissions.IsRevisor
    };

    public static readonly HashSet<string> Publico = new();

    public static HashSet<string> ForRole(Role role) => role switch
    {
        Role.SuperAdmin => SuperAdmin,
        Role.Diretor => Diretor,
        Role.Coordenador => Coordenador,
        Role.Orientador => Orientador,
        Role.Docente => Docente,
        Role.Especialista => Especialista,
        Role.Assistente => Assistente,
        Role.Analista => Analista,
        Role.Tutor => Tutor,
        Role.Monitor => Monitor,
        Role.Tecnico => Tecnico,
        Role.Estagiario => Estagiario,
        Role.Editor => Editor,
        Role.Validador => Validador,
        _ => Publico
    };

    /// <summary>
    /// Papéis de gestão/docência/técnica que podem editar roteiros
    /// (mesma regra da aplicação atual).
    /// </summary>
    public static bool CanEditScripts(Role role) => role switch
    {
        Role.SuperAdmin or Role.Diretor or Role.Coordenador or Role.Orientador or
        Role.Docente or Role.Especialista or Role.Assistente or Role.Analista or
        Role.Tutor or Role.Monitor or Role.Tecnico or Role.Estagiario or
        Role.Editor or Role.Validador => true,
        _ => false
    };
}
