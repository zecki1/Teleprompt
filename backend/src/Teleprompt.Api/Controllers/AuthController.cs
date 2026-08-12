using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Teleprompt.Api.Extensions;
using Teleprompt.Api.Services;
using Teleprompt.Application.Dtos;
using Teleprompt.Domain.Entities;
using Teleprompt.Domain.Enums;
using Teleprompt.Infrastructure.Data;

namespace Teleprompt.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly JwtTokenService _tokenService;
    private readonly TelepromptDbContext _db;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        JwtTokenService tokenService,
        TelepromptDbContext db)
    {
        _userManager = userManager;
        _tokenService = tokenService;
        _db = db;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new ApiMessage("E-mail e senha são obrigatórios."));

        var existing = await _userManager.FindByEmailAsync(request.Email);
        if (existing != null)
            return Conflict(new ApiMessage("Já existe uma conta com este e-mail."));

        var user = new ApplicationUser
        {
            UserName = request.Email.Trim(),
            Email = request.Email.Trim(),
            DisplayName = request.DisplayName ?? request.Email.Split('@')[0],
            EmailConfirmed = true,
            Status = UserStatus.Pending,
            Role = Role.Estagiario
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return BadRequest(new ApiMessage(string.Join("; ", result.Errors.Select(e => e.Description))));

        var token = _tokenService.GenerateToken(user);
        return Ok(new AuthResponse(token, ToDto(user)));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
            return Unauthorized(new ApiMessage("E-mail ou senha inválidos."));

        if (user.Status == UserStatus.Inactive)
            return Forbid();

        var token = _tokenService.GenerateToken(user);

        _db.Activities.Add(new Activity
        {
            WorkspaceId = user.WorkspaceId ?? string.Empty,
            UserId = user.Id,
            Type = ActivityType.Login,
            Description = $"Login: {user.Email}"
        });
        await _db.SaveChangesAsync();

        return Ok(new AuthResponse(token, ToDto(user)));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me()
    {
        var user = await _userManager.FindByIdAsync(User.UserId()!);
        if (user == null)
            return NotFound();
        return Ok(ToDto(user));
    }

    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        // JWT é stateless; logout é responsabilidade do cliente (descartar o token).
        return Ok(new ApiMessage("Sessão encerrada."));
    }

    internal static UserDto ToDto(ApplicationUser u) => new(
        u.Id, u.Email, u.DisplayName,
        RoleNames.GetName(u.Role),
        u.IsSuperAdmin, u.CanManagePermissions, u.CanCollaborate,
        u.IsEditor, u.IsRevisor, u.CanRevert, u.CanViewAdmin,
        u.CanViewReports, u.CanViewActivityHistory, u.CanViewDebugLogs,
        u.CanAssign, u.RequiresChecklist,
        u.Status.ToString(), u.WorkspaceId);
}
