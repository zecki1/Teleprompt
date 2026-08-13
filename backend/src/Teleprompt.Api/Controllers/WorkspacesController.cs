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
            .Where(m => m.UserId == userId && m.Workspace != null)
            .Select(m => m.Workspace!)
            .AsNoTracking()
            .ToListAsync();

        return Ok(memberships.Select(ToDto));
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

        return CreatedAtAction(nameof(Mine), new { id = workspace.Id }, ToDto(workspace));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<WorkspaceDto>> Get(string id)
    {
        var workspace = await _db.Workspaces.AsNoTracking().FirstOrDefaultAsync(w => w.Id == id);
        if (workspace == null)
            return NotFound();
        return Ok(ToDto(workspace));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<WorkspaceDto>> Update(string id, [FromBody] CreateWorkspaceRequest request)
    {
        var workspace = await _db.Workspaces.FindAsync(id);
        if (workspace == null)
            return NotFound();

        if (!string.IsNullOrWhiteSpace(request.Name))
            workspace.Name = request.Name.Trim();
        if (!string.IsNullOrWhiteSpace(request.Plan))
            workspace.Plan = Enum.TryParse<WorkspacePlan>(request.Plan, true, out var plan) ? plan : workspace.Plan;

        await _db.SaveChangesAsync();
        return Ok(ToDto(workspace));
    }

    [HttpPost("join")]
    public async Task<ActionResult<WorkspaceDto>> Join([FromBody] JoinWorkspaceRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
            return BadRequest(new ApiMessage("Token de convite é obrigatório."));

        var token = request.Token.Trim();
        // Aceita o ID do workspace ou um token de convite (quando existir).
        var workspace = await _db.Workspaces.AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == token);

        if (workspace == null)
            return NotFound(new ApiMessage("Link de convite inválido ou expirado."));

        var userId = User.UserId()!;
        var already = await _db.WorkspaceMembers
            .AnyAsync(m => m.WorkspaceId == workspace.Id && m.UserId == userId);
        if (!already)
        {
            _db.WorkspaceMembers.Add(new WorkspaceMember { WorkspaceId = workspace.Id, UserId = userId });
            _db.Activities.Add(new Activity
            {
                WorkspaceId = workspace.Id,
                UserId = userId,
                Type = ActivityType.Other,
                Description = "Usuário entrou no workspace"
            });
            await _db.SaveChangesAsync();
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user != null && string.IsNullOrEmpty(user.WorkspaceId))
        {
            user.WorkspaceId = workspace.Id;
            await _userManager.UpdateAsync(user);
        }

        return Ok(ToDto(workspace));
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

    private static WorkspaceDto ToDto(Workspace w) =>
        new(w.Id, w.Name, w.OwnerId, w.Plan.ToString(), w.CreatedAt.ToString("O"));
}
