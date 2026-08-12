using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Teleprompt.Api.Hubs;

/// <summary>
/// Realtime de edição colaborativa de roteiros.
/// Clientes entram no grupo do script para receber eventos ao vivo.
/// </summary>
[Authorize]
public class ScriptHub : Hub
{
    public async Task JoinScript(string scriptId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, scriptId);
        await Clients.Group(scriptId).SendAsync("PresenceChanged", scriptId,
            new { user = Context.UserIdentifier ?? Context.ConnectionId, joined = true });
    }

    public async Task LeaveScript(string scriptId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, scriptId);
        await Clients.Group(scriptId).SendAsync("PresenceChanged", scriptId,
            new { user = Context.UserIdentifier ?? Context.ConnectionId, joined = false });
    }

    public async Task ContentChanged(string scriptId, string content, string user)
    {
        await Clients.Group(scriptId).SendAsync("ContentChanged", scriptId, content, user);
    }

    public async Task CursorMoved(string scriptId, string position, string user)
    {
        await Clients.Group(scriptId).SendAsync("CursorMoved", scriptId, position, user);
    }

    public async Task CommentAdded(string scriptId, object comment)
    {
        await Clients.Group(scriptId).SendAsync("CommentAdded", scriptId, comment);
    }

    public async Task CommentResolved(string scriptId, string commentId)
    {
        await Clients.Group(scriptId).SendAsync("CommentResolved", scriptId, commentId);
    }

    public async Task VersionCreated(string scriptId, object version)
    {
        await Clients.Group(scriptId).SendAsync("VersionCreated", scriptId, version);
    }

    public async Task LockChanged(string scriptId, string? lockedBy)
    {
        await Clients.Group(scriptId).SendAsync("LockChanged", scriptId, lockedBy);
    }

    public async Task ChecklistUpdated(string scriptId, object items)
    {
        await Clients.Group(scriptId).SendAsync("ChecklistUpdated", scriptId, items);
    }
}
