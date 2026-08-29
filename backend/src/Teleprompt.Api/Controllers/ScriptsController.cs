using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Teleprompt.Api.Extensions;
using Teleprompt.Application.Dtos;
using Teleprompt.Domain.Constants;
using Teleprompt.Domain.Entities;
using Teleprompt.Domain.Enums;
using Teleprompt.Domain.Parsing;
using Teleprompt.Infrastructure.Data;

namespace Teleprompt.Api.Controllers;

[ApiController]
[Route("api/v1/scripts")]
[Authorize]
public class ScriptsController : ControllerBase
{
    private readonly TelepromptDbContext _db;

    public ScriptsController(TelepromptDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<ScriptDto>>> List([FromQuery] string? projectId, [FromQuery] string? workspaceId)
    {
        var wsId = workspaceId ?? User.WorkspaceId();
        var query = _db.Scripts.AsNoTracking();
        if (!string.IsNullOrEmpty(wsId))
            query = query.Where(s => s.WorkspaceId == wsId);
        if (!string.IsNullOrEmpty(projectId))
            query = query.Where(s => s.ProjectId == projectId);

        var list = await query.OrderByDescending(s => s.UpdatedAt).ToListAsync();
        return Ok(list.Select(ToDto));
    }

    [HttpPost]
    public async Task<ActionResult<ScriptDto>> Create([FromBody] CreateScriptRequest request)
    {
        var script = new Script
        {
            ProjectId = request.ProjectId,
            WorkspaceId = User.WorkspaceId() ?? string.Empty,
            Title = request.Title.Trim(),
            Content = request.Content ?? string.Empty,
            Folder = NormalizeFolder(request.Folder),
            Subfolder = NormalizeFolder(request.Subfolder),
            Lesson = NormalizeFolder(request.Lesson),
            IsPlaceholder = request.IsPlaceholder,
            CreatedBy = User.UserId(),
            Version = 1
        };
        _db.Scripts.Add(script);
        _db.Activities.Add(new Activity
        {
            WorkspaceId = script.WorkspaceId,
            UserId = User.UserId(),
            Type = ActivityType.Create,
            Description = $"Roteiro \"{script.Title}\" criado"
        });
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = script.Id }, ToDto(script));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ScriptDto>> Get(string id)
    {
        var script = await _db.Scripts.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);
        return script == null ? NotFound() : Ok(ToDto(script));
    }

    [HttpPut("{id}")]
    [Authorize(Policy = PolicyNames.CanEdit)]
    public async Task<ActionResult<ScriptDto>> Update(string id, [FromBody] UpdateScriptRequest request)
    {
        var script = await _db.Scripts.FindAsync(id);
        if (script == null)
            return NotFound();

        if (script.IsLocked && script.LockedBy != User.UserId())
            return Conflict(new ApiMessage("Roteiro está bloqueado por outro usuário."));

        var hasContentChange = request.Content != null && request.Content != script.Content;

        // Snapshot da versão anterior (append-only) antes de alterar o conteúdo.
        if (hasContentChange)
        {
            _db.Versions.Add(new ScriptVersion
            {
                ScriptId = script.Id,
                VersionNumber = script.Version,
                Content = script.Content,
                CreatedBy = User.UserId()
            });
            script.Version++;
        }

        if (!string.IsNullOrWhiteSpace(request.Title))
            script.Title = request.Title.Trim();
        if (request.Content != null)
            script.Content = request.Content;
        if (!string.IsNullOrWhiteSpace(request.Status) &&
            Enum.TryParse<ScriptStatus>(request.Status, true, out var status))
            script.Status = status;
        if (request.Folder != null)
            script.Folder = NormalizeFolder(request.Folder);
        if (request.Subfolder != null)
            script.Subfolder = NormalizeFolder(request.Subfolder);
        if (request.Lesson != null)
            script.Lesson = NormalizeFolder(request.Lesson);
        if (request.ProjectId != null)
            script.ProjectId = request.ProjectId;

        await _db.SaveChangesAsync();
        return Ok(ToDto(script));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = PolicyNames.SuperAdmin)]
    public async Task<IActionResult> Delete(string id)
    {
        var script = await _db.Scripts.FindAsync(id);
        if (script == null)
            return NotFound();
        script.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("parse")]
    public ActionResult<object> Parse([FromBody] ParseRequest request)
    {
        var scenes = ScriptParser.Parse(request.Content ?? string.Empty, request.ParagraphsPerScene);
        return Ok(new { scenes });
    }

    // ---------- Versões ----------

    [HttpGet("{id}/versions")]
    public async Task<ActionResult<List<VersionDto>>> Versions(string id)
    {
        var list = await _db.Versions.AsNoTracking()
            .Where(v => v.ScriptId == id)
            .OrderByDescending(v => v.VersionNumber)
            .ToListAsync();
        return Ok(list.Select(v => new VersionDto(v.Id, v.VersionNumber, v.Content, v.CreatedBy, v.CreatedAt.ToString("O"))));
    }

    [HttpPost("{id}/versions")]
    public async Task<ActionResult<VersionDto>> CreateVersion(string id, [FromBody] CreateVersionRequest request)
    {
        var script = await _db.Scripts.FindAsync(id);
        if (script == null)
            return NotFound();

        if (script.IsLocked && script.LockedBy != User.UserId())
            return Conflict(new ApiMessage("Roteiro está bloqueado por outro usuário."));

        var version = new ScriptVersion
        {
            ScriptId = id,
            VersionNumber = script.Version,
            Content = request.Content ?? script.Content,
            CreatedBy = User.UserId()
        };
        _db.Versions.Add(version);
        script.Content = version.Content;
        script.Version++;

        _db.Activities.Add(new Activity
        {
            WorkspaceId = script.WorkspaceId,
            UserId = User.UserId(),
            Type = ActivityType.Version,
            Description = $"Versão {version.VersionNumber} criada para \"{script.Title}\""
        });
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Versions), new { id }, new VersionDto(version.Id, version.VersionNumber, version.Content, version.CreatedBy, version.CreatedAt.ToString("O")));
    }

    [HttpPost("{id}/versions/{versionNumber}/revert")]
    [Authorize(Policy = "RequireRevert")]
    public async Task<ActionResult<ScriptDto>> Revert(string id, int versionNumber)
    {
        var script = await _db.Scripts.FindAsync(id);
        if (script == null)
            return NotFound();

        var version = await _db.Versions.AsNoTracking()
            .FirstOrDefaultAsync(v => v.ScriptId == id && v.VersionNumber == versionNumber);
        if (version == null)
            return NotFound(new ApiMessage("Versão não encontrada."));

        _db.Versions.Add(new ScriptVersion
        {
            ScriptId = id,
            VersionNumber = script.Version,
            Content = script.Content,
            CreatedBy = User.UserId()
        });
        script.Content = version.Content;
        script.Version++;

        _db.Activities.Add(new Activity
        {
            WorkspaceId = script.WorkspaceId,
            UserId = User.UserId(),
            Type = ActivityType.Revert,
            Description = $"Revertido para versão {versionNumber} em \"{script.Title}\""
        });
        await _db.SaveChangesAsync();
        return Ok(ToDto(script));
    }

    // ---------- Comentários ----------

    [HttpGet("{id}/comments")]
    public async Task<ActionResult<List<CommentDto>>> Comments(string id)
    {
        var list = await _db.Comments.AsNoTracking()
            .Where(c => c.ScriptId == id)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();
        return Ok(list.Select(c => new CommentDto(c.Id, c.AuthorId, c.Body, c.IsResolved, c.CreatedAt.ToString("O"))));
    }

    [HttpPost("{id}/comments")]
    public async Task<ActionResult<CommentDto>> AddComment(string id, [FromBody] CreateCommentRequest request)
    {
        var comment = new Comment
        {
            ScriptId = id,
            AuthorId = User.UserId()!,
            Body = request.Body
        };
        _db.Comments.Add(comment);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Comments), new { id },
            new CommentDto(comment.Id, comment.AuthorId, comment.Body, comment.IsResolved, comment.CreatedAt.ToString("O")));
    }

    [HttpPut("{id}/comments/{commentId}")]
    public async Task<ActionResult<CommentDto>> ResolveComment(string id, string commentId)
    {
        var comment = await _db.Comments.FindAsync(commentId);
        if (comment == null || comment.ScriptId != id)
            return NotFound();
        comment.IsResolved = true;
        await _db.SaveChangesAsync();
        return Ok(new CommentDto(comment.Id, comment.AuthorId, comment.Body, comment.IsResolved, comment.CreatedAt.ToString("O")));
    }

    // ---------- Checklist ----------

    [HttpGet("{id}/checklist")]
    public async Task<ActionResult<List<ChecklistItemDto>>> Checklist(string id)
    {
        var list = await _db.ChecklistItems.AsNoTracking()
            .Where(c => c.ScriptId == id)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();
        return Ok(list.Select(c => new ChecklistItemDto(c.Id, c.Label, c.Required, c.IsChecked, c.CheckedBy)));
    }

    [HttpPut("{id}/checklist")]
    public async Task<IActionResult> UpdateChecklist(string id, [FromBody] UpdateChecklistRequest request)
    {
        var existing = await _db.ChecklistItems.Where(c => c.ScriptId == id).ToListAsync();
        _db.ChecklistItems.RemoveRange(existing);

        foreach (var item in request.Items)
        {
            _db.ChecklistItems.Add(new ChecklistItem
            {
                ScriptId = id,
                Label = item.Label,
                Required = item.Required,
                IsChecked = item.IsChecked,
                CheckedBy = item.IsChecked ? User.UserId() : null,
                CheckedAt = item.IsChecked ? DateTime.UtcNow : null
            });
        }
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ---------- Bloqueio de edição ----------

    [HttpPost("{id}/lock")]
    public async Task<IActionResult> Lock(string id)
    {
        var script = await _db.Scripts.FindAsync(id);
        if (script == null)
            return NotFound();
        script.IsLocked = true;
        script.LockedBy = User.UserId();
        script.LockedUntil = DateTime.UtcNow.AddMinutes(5);
        await _db.SaveChangesAsync();
        return Ok(new ApiMessage("Roteiro bloqueado para edição."));
    }

    [HttpPost("{id}/unlock")]
    public async Task<IActionResult> Unlock(string id)
    {
        var script = await _db.Scripts.FindAsync(id);
        if (script == null)
            return NotFound();
        script.IsLocked = false;
        script.LockedBy = null;
        script.LockedUntil = null;
        await _db.SaveChangesAsync();
        return Ok(new ApiMessage("Roteiro liberado."));
    }

    internal static ScriptDto ToDto(Script s) => new(
        s.Id, s.ProjectId, s.WorkspaceId, s.Title, s.Content,
        s.Status.ToString(), s.IsLocked, s.LockedBy, s.Version,
        s.CreatedAt.ToString("O"), s.UpdatedAt.ToString("O"),
        s.Folder, s.Subfolder, s.Lesson, s.IsPlaceholder);

    /// <summary>"Raiz"/"Sem Pasta"/vazio viram null — a pasta raiz é ausência de pasta.</summary>
    private static string? NormalizeFolder(string? folder)
    {
        if (string.IsNullOrWhiteSpace(folder)) return null;
        var trimmed = folder.Trim();
        if (trimmed.Equals("Raiz", StringComparison.OrdinalIgnoreCase) ||
            trimmed.Equals("Sem Pasta", StringComparison.OrdinalIgnoreCase))
            return null;
        return trimmed;
    }
}
