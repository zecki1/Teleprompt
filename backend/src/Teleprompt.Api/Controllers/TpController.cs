using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Teleprompt.Api.Extensions;
using Teleprompt.Application.Dtos;
using Teleprompt.Domain.Entities;
using Teleprompt.Domain.Enums;
using Teleprompt.Infrastructure.Data;

namespace Teleprompt.Api.Controllers;

[ApiController]
[Route("api/v1/tp")]
[Authorize]
public class TpController : ControllerBase
{
    private readonly TelepromptDbContext _db;

    public TpController(TelepromptDbContext db) => _db = db;

    [HttpPost("sessions")]
    public async Task<ActionResult<TpSessionDto>> Create([FromBody] CreateTpSessionRequest request)
    {
        var script = await _db.Scripts.AsNoTracking().FirstOrDefaultAsync(s => s.Id == request.ScriptId);
        if (script == null)
            return NotFound(new ApiMessage("Roteiro não encontrado."));

        var session = new TpSession
        {
            ScriptId = request.ScriptId,
            OwnerId = User.UserId()!,
            Mode = Enum.TryParse<TpScrollMode>(request.Mode, true, out var mode) ? mode : TpScrollMode.Paragraph,
            Speed = Math.Clamp(request.Speed, 0.1, 10.0)
        };
        _db.TpSessions.Add(session);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = session.Id }, ToDto(session));
    }

    [HttpGet("sessions/{id}")]
    public async Task<ActionResult<TpSessionDto>> Get(string id)
    {
        var session = await _db.TpSessions.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);
        return session == null ? NotFound() : Ok(ToDto(session));
    }

    [HttpPut("sessions/{id}")]
    public async Task<ActionResult<TpSessionDto>> Update(string id, [FromBody] UpdateTpSessionRequest request)
    {
        var session = await _db.TpSessions.FindAsync(id);
        if (session == null)
            return NotFound();

        session.Mode = Enum.TryParse<TpScrollMode>(request.Mode, true, out var mode) ? mode : session.Mode;
        session.Speed = Math.Clamp(request.Speed, 0.1, 10.0);
        if (request.ScrollStateJson != null)
            session.ScrollStateJson = request.ScrollStateJson;

        await _db.SaveChangesAsync();
        return Ok(ToDto(session));
    }

    [HttpPost("sessions/{id}/recorded")]
    public async Task<IActionResult> MarkRecorded(string id, [FromBody] MarkRecordedRequest request)
    {
        var script = await _db.Scripts.FindAsync(request.ScriptId);
        if (script == null)
            return NotFound();

        script.Status = ScriptStatus.Gravado;
        _db.Activities.Add(new Activity
        {
            WorkspaceId = script.WorkspaceId,
            UserId = User.UserId(),
            Type = ActivityType.Record,
            Description = $"Roteiro \"{script.Title}\" marcado como gravado"
        });
        await _db.SaveChangesAsync();
        return Ok(new ApiMessage("Roteiro marcado como gravado."));
    }

    private static TpSessionDto ToDto(TpSession s) =>
        new(s.Id, s.ScriptId, s.OwnerId, s.Mode.ToString(), s.Speed, s.ScrollStateJson ?? string.Empty);
}
