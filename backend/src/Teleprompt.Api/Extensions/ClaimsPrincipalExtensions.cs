using System.Security.Claims;

namespace Teleprompt.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static string? UserId(this ClaimsPrincipal principal) =>
        principal.FindFirstValue("sub")
        ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);

    public static string? WorkspaceId(this ClaimsPrincipal principal) =>
        principal.FindFirstValue("workspace");

    public static string? UserRole(this ClaimsPrincipal principal) =>
        principal.FindFirstValue("role");

    public static bool HasPermission(this ClaimsPrincipal principal, string permission) =>
        principal.HasClaim(c => c.Type == permission && c.Value == "true");
}
