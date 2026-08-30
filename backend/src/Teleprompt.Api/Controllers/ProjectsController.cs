using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Teleprompt.Api.Extensions;
using Teleprompt.Application.Dtos;
using Teleprompt.Domain.Constants;
using Teleprompt.Domain.Entities;
using Teleprompt.Domain.Enums;
using Teleprompt.Infrastructure.Data;

namespace Teleprompt.Api.Controllers;

[ApiController]
[Route("api/v1/projects")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly TelepromptDbContext _db;

    public ProjectsController(TelepromptDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<ProjectDto>>> List([FromQuery] string? workspaceId)
    {
        var wsId = workspaceId ?? User.WorkspaceId();
        var query = _db.Projects.AsNoTracking();
        if (!string.IsNullOrEmpty(wsId))
            query = query.Where(p => p.WorkspaceId == wsId);
        if (User.HasPermission(Permissions.IsSuperAdmin) == false && !string.IsNullOrEmpty(wsId))
            query = query.Where(p => p.WorkspaceId == wsId);

        var list = await query.OrderBy(p => p.Name).ToListAsync();
        return Ok(list.Select(ToDto));
    }

    [HttpPost]
    public async Task<ActionResult<ProjectDto>> Create([FromBody] CreateProjectRequest request)
    {
        var project = new Project
        {
            Name = request.Name.Trim(),
            Code = request.Code,
            ExternalLink = request.ExternalLink,
            WorkspaceId = User.WorkspaceId() ?? string.Empty,
            Status = Enum.TryParse<ProjectStatus>(request.Status, true, out var s) ? s : ProjectStatus.Awaiting,
            Bucket = Enum.TryParse<Bucket>(request.Bucket, true, out var b) ? b : Bucket.Backlog
        };
        _db.Projects.Add(project);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = project.Id }, ToDto(project));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProjectDto>> Get(string id)
    {
        var project = await _db.Projects.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
        return project == null ? NotFound() : Ok(ToDto(project));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ProjectDto>> Update(string id, [FromBody] CreateProjectRequest request)
    {
        var project = await _db.Projects.FindAsync(id);
        if (project == null)
            return NotFound();

        project.Name = request.Name.Trim();
        project.Code = request.Code;
        project.ExternalLink = request.ExternalLink;
        project.Status = Enum.TryParse<ProjectStatus>(request.Status, true, out var s) ? s : project.Status;
        project.Bucket = Enum.TryParse<Bucket>(request.Bucket, true, out var b) ? b : project.Bucket;

        await _db.SaveChangesAsync();
        return Ok(ToDto(project));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = PolicyNames.SuperAdmin)]
    public async Task<IActionResult> Delete(string id)
    {
        var project = await _db.Projects.FindAsync(id);
        if (project == null)
            return NotFound();

        project.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id}/scripts")]
    public async Task<ActionResult<List<ScriptDto>>> Scripts(string id)
    {
        var list = await _db.Scripts.AsNoTracking()
            .Where(s => s.ProjectId == id)
            .OrderByDescending(s => s.UpdatedAt)
            .ToListAsync();
        var project = await _db.Projects.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
        var names = project == null
            ? new Dictionary<string, string>()
            : new Dictionary<string, string> { [id] = project.Name };
        return Ok(list.Select(s => ScriptsController.ToDto(s, names)));
    }

    private static ProjectDto ToDto(Project p) => new(
        p.Id, p.Name, p.Code, p.ExternalLink, p.WorkspaceId,
        p.Status?.ToString(), p.Bucket?.ToString(), p.CreatedAt.ToString("O"));
}
