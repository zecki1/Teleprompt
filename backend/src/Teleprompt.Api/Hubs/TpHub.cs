using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Teleprompt.Api.Hubs;

/// <summary>
/// Realtime do teleprompter: sincronização de espelhos, controle remoto
/// da rolagem e ordem de gravação.
/// </summary>
[Authorize]
public class TpHub : Hub
{
    public async Task JoinTp(string tpSessionId, string role)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, tpSessionId);
        await Clients.Group(tpSessionId).SendAsync("ParticipantJoined",
            tpSessionId, new { user = Context.UserIdentifier ?? Context.ConnectionId, role });
    }

    public async Task ScrollStateChanged(string tpSessionId, double position, double speed, string mode)
    {
        await Clients.Group(tpSessionId).SendAsync("ScrollStateChanged", tpSessionId, position, speed, mode);
    }

    public async Task ModeChanged(string tpSessionId, string mode)
    {
        await Clients.Group(tpSessionId).SendAsync("ModeChanged", tpSessionId, mode);
    }

    public async Task SpeedChanged(string tpSessionId, double speed)
    {
        await Clients.Group(tpSessionId).SendAsync("SpeedChanged", tpSessionId, speed);
    }

    public async Task RemoteCommand(string tpSessionId, string command)
    {
        await Clients.Group(tpSessionId).SendAsync("RemoteCommand", tpSessionId, command);
    }

    public async Task Recorded(string tpSessionId, string scriptId)
    {
        await Clients.Group(tpSessionId).SendAsync("Recorded", tpSessionId, scriptId);
    }

    public async Task OrderChanged(string tpSessionId, object recordingOrder)
    {
        await Clients.Group(tpSessionId).SendAsync("OrderChanged", tpSessionId, recordingOrder);
    }
}
