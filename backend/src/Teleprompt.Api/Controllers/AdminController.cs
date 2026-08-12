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
[Route("api/v1/admin")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly TelepromptDbContext _db;

    public AdminController(TelepromptDbContext db) => _db = db;

    [HttpGet("debug-logs")]
    [Authorize(Policy = PolicyNames.CanViewDebugLogs)]
    public async Task<ActionResult<List<DebugLogDto>>> DebugLogs([FromQuery] int limit = 100)
    {
        var list = await _db.DebugLogs.AsNoTracking()
            .OrderByDescending(l => l.CreatedAt)
            .Take(Math.Clamp(limit, 1, 500))
            .ToListAsync();
        return Ok(list.Select(l => new DebugLogDto(l.Id, l.Level.ToString(), l.Source, l.Message, l.CreatedAt.ToString("O"))));
    }

    [HttpPost("debug-logs")]
    public async Task<IActionResult> WriteDebugLog([FromBody] WriteLogRequest request)
    {
        _db.DebugLogs.Add(new DebugLog
        {
            Level = Enum.TryParse<Teleprompt.Domain.Enums.LogLevel>(request.Level, true, out var level) ? level : Teleprompt.Domain.Enums.LogLevel.Info,
            Source = request.Source ?? "client",
            Message = request.Message,
            MetadataJson = request.MetadataJson
        });
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("error-reports")]
    [Authorize(Policy = PolicyNames.CanViewDebugLogs)]
    public async Task<ActionResult<List<ErrorReportDto>>> ErrorReports()
    {
        var list = await _db.ErrorReports.AsNoTracking()
            .OrderByDescending(r => r.CreatedAt)
            .Take(200)
            .ToListAsync();
        return Ok(list.Select(r => new ErrorReportDto(
            r.Id, r.UserId, r.ScreenshotUrl, r.Description, r.Status, r.CreatedAt.ToString("O"))));
    }

    [HttpPost("error-reports")]
    public async Task<ActionResult<ErrorReportDto>> CreateErrorReport([FromBody] CreateErrorReportRequest request)
    {
        var report = new ErrorReport
        {
            UserId = User.UserId(),
            ScreenshotUrl = request.ScreenshotUrl,
            Description = request.Description,
            LogsJson = request.LogsJson
        };
        _db.ErrorReports.Add(report);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(ErrorReports), null,
            new ErrorReportDto(report.Id, report.UserId, report.ScreenshotUrl, report.Description, report.Status, report.CreatedAt.ToString("O")));
    }

    [HttpDelete("error-reports/{id}")]
    [Authorize(Policy = PolicyNames.SuperAdmin)]
    public async Task<IActionResult> DeleteErrorReport(string id)
    {
        var report = await _db.ErrorReports.FindAsync(id);
        if (report == null)
            return NotFound();
        _db.ErrorReports.Remove(report);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record WriteLogRequest(string Level, string Source, string Message, string? MetadataJson);
