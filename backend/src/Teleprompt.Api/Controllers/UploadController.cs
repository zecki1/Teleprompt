using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Teleprompt.Api.Controllers;

[ApiController]
[Route("api/v1/upload")]
[Authorize]
public class UploadController : ControllerBase
{
    private const long MaxFileSize = 10 * 1024 * 1024; // 10 MB
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
        ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt", ".json",
        ".mp3", ".mp4", ".wav"
    };

    private readonly IWebHostEnvironment _env;
    private readonly IConfiguration _config;

    public UploadController(IWebHostEnvironment env, IConfiguration config)
    {
        _env = env;
        _config = config;
    }

    /// <summary>
    /// Upload seguro: autenticação JWT, validação de extensão e limite de 10 MB.
    /// Arquivos ficam fora da web root quando configurado (Storage:LocalPath).
    /// </summary>
    [HttpPost]
    [RequestSizeLimit(MaxFileSize)]
    public async Task<ActionResult<object>> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Nenhum arquivo enviado." });

        if (file.Length > MaxFileSize)
            return BadRequest(new { message = "Arquivo excede o limite de 10 MB." });

        var extension = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(extension))
            return BadRequest(new { message = $"Tipo de arquivo não permitido: {extension ?? "(sem extensão)"}" });

        var localPath = _config["Storage:LocalPath"];
        string baseDirectory;
        string urlPath;
        if (!string.IsNullOrWhiteSpace(localPath) && Path.IsPathRooted(localPath))
        {
            baseDirectory = localPath;
            urlPath = "/uploads";
        }
        else
        {
            baseDirectory = Path.Combine(_env.WebRootPath ?? _env.ContentRootPath, "uploads");
            urlPath = "/uploads";
        }

        Directory.CreateDirectory(baseDirectory);

        var storedName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var filePath = Path.Combine(baseDirectory, storedName);

        await using (var stream = System.IO.File.Create(filePath))
        {
            await file.CopyToAsync(stream);
        }

        var url = $"{urlPath}/{storedName}";
        return Ok(new { url, name = file.FileName, size = file.Length });
    }
}
