using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Teleprompt.Api.Extensions;
using Teleprompt.Application.Dtos;
using Teleprompt.Domain.Entities;
using Teleprompt.Infrastructure.Data;

namespace Teleprompt.Api.Controllers;

[ApiController]
[Route("api/v1/teams")]
[Authorize]
public class TeamsController : ControllerBase
{
    private readonly TelepromptDbContext _db;

    public TeamsController(TelepromptDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<Team>>> List([FromQuery] string? workspaceId)
    {
        var wsId = workspaceId ?? User.WorkspaceId();
        var query = _db.Teams.AsNoTracking();
        if (!string.IsNullOrEmpty(wsId))
            query = query.Where(t => t.WorkspaceId == wsId);
        return Ok(await query.ToListAsync());
    }

    [HttpPost]
    public async Task<ActionResult<Team>> Create([FromBody] CreateTeamRequest request)
    {
        var team = new Team
        {
            Name = request.Name.Trim(),
            Acronym = request.Acronym,
            WorkspaceId = request.WorkspaceId
        };
        _db.Teams.Add(team);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = team.Id }, team);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Team>> Get(string id)
    {
        var team = await _db.Teams.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id);
        return team == null ? NotFound() : Ok(team);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "ManagePermissions")]
    public async Task<IActionResult> Delete(string id)
    {
        var team = await _db.Teams.FindAsync(id);
        if (team == null)
            return NotFound();
        _db.Teams.Remove(team);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/members")]
    public async Task<IActionResult> AddMember(string id, [FromBody] AddTeamMemberRequest request)
    {
        var exists = await _db.TeamMembers
            .AnyAsync(m => m.TeamId == id && m.UserId == request.UserId);
        if (exists)
            return Conflict(new ApiMessage("Membro já pertence ao time."));

        _db.TeamMembers.Add(new TeamMember { TeamId = id, UserId = request.UserId });
        await _db.SaveChangesAsync();
        return Ok(new ApiMessage("Membro adicionado."));
    }

    [HttpGet("{id}/members")]
    public async Task<ActionResult<List<string>>> Members(string id)
    {
        return Ok(await _db.TeamMembers.Where(m => m.TeamId == id).Select(m => m.UserId).ToListAsync());
    }
}
