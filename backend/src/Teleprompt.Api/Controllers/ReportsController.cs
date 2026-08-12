using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Teleprompt.Api.Extensions;
using Teleprompt.Domain.Constants;
using Teleprompt.Infrastructure.Data;

namespace Teleprompt.Api.Controllers;

[ApiController]
[Route("api/v1/reports")]
[Authorize(Policy = PolicyNames.CanViewReports)]
public class ReportsController : ControllerBase
{
    private readonly TelepromptDbContext _db;

    public ReportsController(TelepromptDbContext db) => _db = db;

    /// <summary>
    /// Resumo do workspace: contagens por status/bucket e taxa de crescimento
    /// de roteiros criados nos últimos 6 meses.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<object>> Summary([FromQuery] string? workspaceId)
    {
        var wsId = workspaceId ?? User.WorkspaceId();

        var scriptsQuery = _db.Scripts.AsNoTracking().AsQueryable();
        var projectsQuery = _db.Projects.AsNoTracking().AsQueryable();
        if (!string.IsNullOrEmpty(wsId))
        {
            scriptsQuery = scriptsQuery.Where(s => s.WorkspaceId == wsId);
            projectsQuery = projectsQuery.Where(p => p.WorkspaceId == wsId);
        }

        var totalScripts = await scriptsQuery.CountAsync();
        var totalProjects = await projectsQuery.CountAsync();

        var byStatus = await scriptsQuery
            .GroupBy(s => s.Status)
            .Select(g => new { status = g.Key.ToString(), count = g.Count() })
            .ToListAsync();

        var byBucket = await projectsQuery
            .Where(p => p.Bucket != null)
            .GroupBy(p => p.Bucket!.Value)
            .Select(g => new { bucket = g.Key.ToString(), count = g.Count() })
            .ToListAsync();

        var since = DateTime.UtcNow.AddMonths(-6);
        var growth = await scriptsQuery
            .Where(s => s.CreatedAt >= since)
            .GroupBy(s => new { s.CreatedAt.Year, s.CreatedAt.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, count = g.Count() })
            .OrderBy(g => g.Year).ThenBy(g => g.Month)
            .ToListAsync();

        return Ok(new
        {
            totalScripts,
            totalProjects,
            byStatus,
            byBucket,
            growth,
            generatedAt = DateTime.UtcNow
        });
    }
}
