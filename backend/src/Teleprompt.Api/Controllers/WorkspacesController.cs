using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Teleprompt.Api.Extensions;
using Teleprompt.Application.Dtos;
using Teleprompt.Domain.Entities;
using Teleprompt.Domain.Enums;
using Teleprompt.Infrastructure.Data;

namespace Teleprompt.Api.Controllers;

[ApiController]
[Route("api/v1/workspaces")]
[Authorize]
public class WorkspacesController : ControllerBase
{
    private readonly TelepromptDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;

    public WorkspacesController(TelepromptDbContext db, UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    [HttpGet("mine")]
    public async Task<ActionResult<List<WorkspaceDto>>> Mine()
    {
        var userId = User.UserId()!;
        var memberships = await _db.WorkspaceMembers
            .Where(m => m.UserId == userId)
            .Select(m => m.Workspace)
            .Where(w => w != null)
            .AsNoTracking()
            .ToListAsync();

        return Ok(memberships.Select(w => new WorkspaceDto(
            w.Id, w.Name, w.OwnerId, w.Plan.ToString(), w.CreatedAt.ToString("O"))));
    }

    [HttpPost]
    public async Task<ActionResult<WorkspaceDto>> Create([FromBody] CreateWorkspaceRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new ApiMessage("Nome do workspace é obrigatório."));

        var userId = User.UserId()!;
        var workspace = new Workspace
        {
            Name = request.Name.Trim(),
            OwnerId = userId,
            Plan = Enum.TryParse<WorkspacePlan>(request.Plan, true, out var plan) ? plan : WorkspacePlan.Free
        };
        _db.Workspaces.Add(workspace);
        _db.WorkspaceMembers.Add(new WorkspaceMember { WorkspaceId = workspace.Id, UserId = userId });

        var user = await _userManager.FindByIdAsync(userId);
        if (user != null)
        {
            user.WorkspaceId = workspace.Id;
            await _userManager.UpdateAsync(user);
        }

        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Mine), new { id = workspace.Id },
            new WorkspaceDto(workspace.Id, workspace.Name, workspace.OwnerId, workspace.Plan.ToString(), workspace.CreatedAt.ToString("O")));
    }

    [HttpPost("{id}/members")]
    [Authorize(Policy = "ManagePermissions")]
    public async Task<IActionResult> AddMember(string id, [FromBody] AddMemberRequest request)
    {
        var workspace = await _db.Workspaces.FindAsync(id);
        if (workspace == null)
            return NotFound();

        var member = await _userManager.FindByEmailAsync(request.Email);
        if (member == null)
            return NotFound(new ApiMessage("Usuário não encontrado."));

        var already = await _db.WorkspaceMembers
            .AnyAsync(m => m.WorkspaceId == id && m.UserId == member.Id);
        if (already)
            return Conflict(new ApiMessage("Usuário já é membro."));

        _db.WorkspaceMembers.Add(new WorkspaceMember { WorkspaceId = id, UserId = member.Id });
        if (member.WorkspaceId == null)
        {
            member.WorkspaceId = id;
            await _userManager.UpdateAsync(member);
        }
        await _db.SaveChangesAsync();

        return Ok(new ApiMessage("Membro adicionado."));
    }

    [HttpGet("{id}/members")]
    public async Task<ActionResult<List<UserDto>>> Members(string id)
    {
        var userIds = await _db.WorkspaceMembers
            .Where(m => m.WorkspaceId == id)
            .Select(m => m.UserId)
            .ToListAsync();

        var users = await _db.Users.Where(u => userIds.Contains(u.Id)).AsNoTracking().ToListAsync();
        return Ok(users.Select(AuthController.ToDto));
    }
}
