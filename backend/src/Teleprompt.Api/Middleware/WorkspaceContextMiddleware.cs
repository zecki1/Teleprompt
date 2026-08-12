using System.Security.Claims;
using Teleprompt.Domain.Constants;
using Teleprompt.Infrastructure.Data;

namespace Teleprompt.Api.Middleware;

/// <summary>
/// Preenche o WorkspaceAccessor (usado pelo RLS) a partir dos claims da requisição.
/// </summary>
public class WorkspaceContextMiddleware
{
    private readonly RequestDelegate _next;

    public WorkspaceContextMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, WorkspaceAccessor accessor)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var workspaceId = Claim(context.User, "workspace");
            var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? context.User.FindFirstValue("sub");
            var isSuperAdmin = Claim(context.User, Permissions.IsSuperAdmin) == "true";

            accessor.Set(workspaceId, userId, isSuperAdmin);
        }
        else
        {
            accessor.Clear();
        }

        await _next(context);
    }

    private static string? Claim(ClaimsPrincipal user, string type) =>
        user.FindFirstValue(type);
}
