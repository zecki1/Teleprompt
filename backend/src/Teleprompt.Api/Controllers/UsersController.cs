using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Teleprompt.Api.Controllers;
using Teleprompt.Api.Extensions;
using Teleprompt.Application.Dtos;
using Teleprompt.Domain.Constants;
using Teleprompt.Domain.Entities;
using Teleprompt.Domain.Enums;
using Teleprompt.Infrastructure.Data;

namespace Teleprompt.Api.Controllers;

[ApiController]
[Route("api/v1/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly TelepromptDbContext _db;

    public UsersController(UserManager<ApplicationUser> userManager, TelepromptDbContext db)
    {
        _userManager = userManager;
        _db = db;
    }

    [HttpGet]
    [Authorize(Policy = PolicyNames.ManagePermissions)]
    public async Task<ActionResult<List<UserDto>>> List()
    {
        var users = await _db.Users.AsNoTracking().ToListAsync();
        return Ok(users.Select(AuthController.ToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> Get(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound();
        return Ok(AuthController.ToDto(user));
    }

    [HttpPut("me")]
    public async Task<ActionResult<UserDto>> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var user = await _userManager.FindByIdAsync(User.UserId()!);
        if (user == null)
            return NotFound();

        if (!string.IsNullOrWhiteSpace(request.DisplayName))
            user.DisplayName = request.DisplayName;
        if (request.AvatarUrl != null)
            user.AvatarUrl = request.AvatarUrl;

        await _userManager.UpdateAsync(user);
        return Ok(AuthController.ToDto(user));
    }

    [HttpPut("{id}/permissions")]
    [Authorize(Policy = PolicyNames.ManagePermissions)]
    public async Task<ActionResult<UserDto>> UpdatePermissions(string id, [FromBody] UpdatePermissionsRequest request)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound();

        if (!RoleNames.TryGetRole(request.Role, out var role))
            return BadRequest(new ApiMessage($"Papel inválido: {request.Role}"));

        if (request.IsSuperAdmin && !User.HasPermission(Permissions.IsSuperAdmin))
            return Forbid();

        user.Role = role;
        user.IsSuperAdmin = request.IsSuperAdmin;
        user.CanManagePermissions = request.CanManagePermissions;
        user.CanCollaborate = request.CanCollaborate;
        user.IsEditor = request.IsEditor;
        user.IsRevisor = request.IsRevisor;
        user.CanRevert = request.CanRevert;
        user.CanViewAdmin = request.CanViewAdmin;
        user.CanViewReports = request.CanViewReports;
        user.CanViewActivityHistory = request.CanViewActivityHistory;
        user.CanViewDebugLogs = request.CanViewDebugLogs;
        user.CanAssign = request.CanAssign;
        user.RequiresChecklist = request.RequiresChecklist;
        user.Status = Enum.TryParse<UserStatus>(request.Status, true, out var status) ? status : user.Status;

        await _userManager.UpdateAsync(user);

        _db.Activities.Add(new Activity
        {
            WorkspaceId = user.WorkspaceId ?? string.Empty,
            UserId = User.UserId(),
            Type = ActivityType.Permission,
            Description = $"Permissões de {user.Email} atualizadas"
        });
        await _db.SaveChangesAsync();

        return Ok(AuthController.ToDto(user));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = PolicyNames.SuperAdmin)]
    public async Task<IActionResult> Delete(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound();
        if (user.Id == User.UserId())
            return BadRequest(new ApiMessage("Você não pode excluir a própria conta."));

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
            return BadRequest(new ApiMessage(string.Join("; ", result.Errors.Select(e => e.Description))));

        return NoContent();
    }
}
