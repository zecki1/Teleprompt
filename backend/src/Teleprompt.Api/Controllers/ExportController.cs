using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Teleprompt.Infrastructure.Data;

namespace Teleprompt.Api.Controllers;

[ApiController]
[Route("api/v1/export")]
[Authorize]
public class ExportController : ControllerBase
{
    private readonly TelepromptDbContext _db;

    public ExportController(TelepromptDbContext db) => _db = db;

    /// <summary>
    /// Exporta o roteiro completo em JSON (download).
    /// </summary>
    [HttpGet("scripts/{id}/json")]
    public async Task<IActionResult> ExportJson(string id)
    {
        var script = await _db.Scripts.AsNoTracking()
            .Include(s => s.Versions.OrderBy(v => v.VersionNumber))
            .Include(s => s.Comments.OrderBy(c => c.CreatedAt))
            .Include(s => s.ChecklistItems.OrderBy(c => c.CreatedAt))
            .FirstOrDefaultAsync(s => s.Id == id);
        if (script == null)
            return NotFound();

        var payload = new
        {
            id = script.Id,
            title = script.Title,
            status = script.Status.ToString(),
            version = script.Version,
            content = script.Content,
            createdAt = script.CreatedAt,
            updatedAt = script.UpdatedAt,
            versions = script.Versions.Select(v => new
            {
                id = v.Id,
                versionNumber = v.VersionNumber,
                createdBy = v.CreatedBy,
                createdAt = v.CreatedAt,
                content = v.Content
            }),
            comments = script.Comments.Select(c => new
            {
                id = c.Id,
                authorId = c.AuthorId,
                body = c.Body,
                isResolved = c.IsResolved,
                createdAt = c.CreatedAt
            }),
            checklist = script.ChecklistItems.Select(c => new
            {
                id = c.Id,
                label = c.Label,
                required = c.Required,
                isChecked = c.IsChecked
            })
        };

        var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = true });
        return File(System.Text.Encoding.UTF8.GetBytes(json), "application/json",
            $"{Normalize(script.Title)}.json");
    }

    /// <summary>Exportação PPT (OpenXML SDK) — pendente da Fase 4.</summary>
    [HttpGet("scripts/{id}/ppt")]
    public IActionResult ExportPpt(string id) => StatusCode(StatusCodes.Status501NotImplemented);

    /// <summary>Exportação Word (OpenXML SDK) — pendente da Fase 4.</summary>
    [HttpGet("scripts/{id}/word")]
    public IActionResult ExportWord(string id) => StatusCode(StatusCodes.Status501NotImplemented);

    private static string Normalize(string title)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var safe = new string(title.Select(c => invalid.Contains(c) ? '_' : c).ToArray());
        return string.IsNullOrWhiteSpace(safe) ? "roteiro" : safe;
    }
}
