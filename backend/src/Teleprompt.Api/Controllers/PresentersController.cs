using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Teleprompt.Api.Extensions;
using Teleprompt.Application.Dtos;
using Teleprompt.Domain.Entities;
using Teleprompt.Infrastructure.Data;

namespace Teleprompt.Api.Controllers;

[ApiController]
[Route("api/v1/presenters")]
[Authorize]
public class PresentersController : ControllerBase
{
    private readonly TelepromptDbContext _db;

    public PresentersController(TelepromptDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<PresenterDto>>> List()
    {
        var wsId = User.WorkspaceId();
        var query = _db.Presenters.AsNoTracking();
        if (!string.IsNullOrEmpty(wsId))
            query = query.Where(p => p.WorkspaceId == wsId);

        var list = await query.ToListAsync();
        return Ok(list.Select(p => new PresenterDto(p.Id, p.Name, p.Email, p.Phone)));
    }

    [HttpPost]
    public async Task<ActionResult<PresenterDto>> Create([FromBody] CreatePresenterRequest request)
    {
        var presenter = new Presenter
        {
            Name = request.Name.Trim(),
            Email = request.Email,
            Phone = request.Phone,
            WorkspaceId = User.WorkspaceId() ?? string.Empty
        };
        _db.Presenters.Add(presenter);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(List), new { id = presenter.Id },
            new PresenterDto(presenter.Id, presenter.Name, presenter.Email, presenter.Phone));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<PresenterDto>> Update(string id, [FromBody] CreatePresenterRequest request)
    {
        var presenter = await _db.Presenters.FindAsync(id);
        if (presenter == null)
            return NotFound();
        presenter.Name = request.Name.Trim();
        presenter.Email = request.Email;
        presenter.Phone = request.Phone;
        await _db.SaveChangesAsync();
        return Ok(new PresenterDto(presenter.Id, presenter.Name, presenter.Email, presenter.Phone));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var presenter = await _db.Presenters.FindAsync(id);
        if (presenter == null)
            return NotFound();
        _db.Presenters.Remove(presenter);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
