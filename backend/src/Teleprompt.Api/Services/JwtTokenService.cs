using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Teleprompt.Domain.Constants;
using Teleprompt.Infrastructure.Data;

namespace Teleprompt.Api.Services;

public class JwtTokenService
{
    private readonly JwtSettings _settings;

    public JwtTokenService(JwtSettings settings)
    {
        _settings = settings;
    }

    public string GenerateToken(ApplicationUser user)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email ?? ""),
            new(ClaimTypes.Name, user.DisplayName ?? user.UserName ?? ""),
            new("role", Domain.Enums.RoleNames.GetName(user.Role)),
            new("workspace", user.WorkspaceId ?? ""),
            new(Permissions.IsSuperAdmin, user.IsSuperAdmin ? "true" : "false"),
            new(Permissions.CanManagePermissions, user.CanManagePermissions ? "true" : "false"),
            new(Permissions.CanCollaborate, user.CanCollaborate ? "true" : "false"),
            new(Permissions.IsEditor, user.IsEditor ? "true" : "false"),
            new(Permissions.IsRevisor, user.IsRevisor ? "true" : "false"),
            new(Permissions.CanRevert, user.CanRevert ? "true" : "false"),
            new(Permissions.CanViewAdmin, user.CanViewAdmin ? "true" : "false"),
            new(Permissions.CanViewReports, user.CanViewReports ? "true" : "false"),
            new(Permissions.CanViewActivityHistory, user.CanViewActivityHistory ? "true" : "false"),
            new(Permissions.CanViewDebugLogs, user.CanViewDebugLogs ? "true" : "false"),
            new(Permissions.CanAssign, user.CanAssign ? "true" : "false"),
            new(Permissions.RequiresChecklist, user.RequiresChecklist ? "true" : "false")
        };

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
