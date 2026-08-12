using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Teleprompt.Api.Extensions;
using Teleprompt.Application.Dtos;
using Teleprompt.Domain.Constants;
using Teleprompt.Infrastructure.Data;

namespace Teleprompt.Api.Controllers;

[ApiController]
[Route("api/v1/activities")]
[Authorize(Policy = PolicyNames.CanViewActivityHistory)]
public class ActivitiesController : ControllerBase
{
    private readonly TelepromptDbContext _db;

    public ActivitiesController(TelepromptDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<ActivityDto>>> List([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var wsId = User.WorkspaceId();
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = _db.Activities.AsNoTracking();
        if (!string.IsNullOrEmpty(wsId))
            query = query.Where(a => a.WorkspaceId == wsId);

        var list = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(list.Select(a => new ActivityDto(a.Id, a.Type.ToString(), a.Description, a.UserId, a.CreatedAt.ToString("O"))));
    }
}
