using FileSharer.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Options;

namespace FileSharer.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FilesController : ControllerBase
{
    private readonly string _storagePath;
    private readonly ILogger<FilesController> _logger;
    private static readonly FileExtensionContentTypeProvider ContentTypeProvider = new();

    public FilesController(IOptions<FileStorageOptions> options, IWebHostEnvironment env, ILogger<FilesController> logger)
    {
        _logger = logger;
        var configuredPath = options.Value.StoragePath;
        if (string.IsNullOrWhiteSpace(configuredPath))
        {
            configuredPath = "SharedFiles";
        }

        _storagePath = Path.IsPathRooted(configuredPath)
            ? configuredPath
            : Path.GetFullPath(Path.Combine(env.ContentRootPath, configuredPath));

        if (!Directory.Exists(_storagePath))
        {
            Directory.CreateDirectory(_storagePath);
        }
    }

    [HttpGet]
    public ActionResult<IEnumerable<FileItemDto>> ListFiles()
    {
        if (!Directory.Exists(_storagePath))
        {
            Directory.CreateDirectory(_storagePath);
        }

        var directoryInfo = new DirectoryInfo(_storagePath);
        var files = directoryInfo.GetFiles()
            .OrderBy(f => f.Name, StringComparer.OrdinalIgnoreCase)
            .Select(f => new FileItemDto
            {
                FileName = f.Name,
                FileExtension = string.IsNullOrEmpty(f.Extension) ? "-" : f.Extension,
                FileSize = f.Length,
                LastModified = f.LastWriteTimeUtc
            })
            .ToList();

        return Ok(files);
    }

    [HttpPost]
    [HttpPost("upload")]
    [DisableRequestSizeLimit]
    public async Task<ActionResult<FileItemDto>> UploadFile(IFormFile? file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "No file was provided or the file is empty." });
        }

        var safeFileName = Path.GetFileName(file.FileName);
        if (string.IsNullOrWhiteSpace(safeFileName))
        {
            return BadRequest(new { message = "Invalid file name." });
        }

        if (!Directory.Exists(_storagePath))
        {
            Directory.CreateDirectory(_storagePath);
        }

        var destinationPath = Path.Combine(_storagePath, safeFileName);

        await using (var stream = new FileStream(destinationPath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        var fileInfo = new FileInfo(destinationPath);
        _logger.LogInformation("Uploaded file '{FileName}' ({FileSize} bytes) to '{StoragePath}'.", safeFileName, fileInfo.Length, _storagePath);

        return Ok(new FileItemDto
        {
            FileName = fileInfo.Name,
            FileExtension = string.IsNullOrEmpty(fileInfo.Extension) ? "-" : fileInfo.Extension,
            FileSize = fileInfo.Length,
            LastModified = fileInfo.LastWriteTimeUtc
        });
    }

    [HttpGet("download/{fileName}")]
    [HttpGet("{fileName}")]
    public IActionResult DownloadFile(string fileName)
    {
        var safeFileName = Path.GetFileName(fileName);
        if (string.IsNullOrWhiteSpace(safeFileName))
        {
            return BadRequest(new { message = "Invalid file name." });
        }

        var filePath = Path.Combine(_storagePath, safeFileName);
        if (!System.IO.File.Exists(filePath))
        {
            return NotFound(new { message = $"File '{safeFileName}' was not found." });
        }

        if (!ContentTypeProvider.TryGetContentType(safeFileName, out var contentType))
        {
            contentType = "application/octet-stream";
        }

        return PhysicalFile(filePath, contentType, safeFileName);
    }

    [HttpDelete("{fileName}")]
    public IActionResult DeleteFile(string fileName)
    {
        var safeFileName = Path.GetFileName(fileName);
        if (string.IsNullOrWhiteSpace(safeFileName))
        {
            return BadRequest(new { message = "Invalid file name." });
        }

        var filePath = Path.Combine(_storagePath, safeFileName);
        if (!System.IO.File.Exists(filePath))
        {
            return NotFound(new { message = $"File '{safeFileName}' was not found." });
        }

        System.IO.File.Delete(filePath);
        _logger.LogInformation("Deleted file '{FileName}' from '{StoragePath}'.", safeFileName, _storagePath);

        return Ok(new { message = $"File '{safeFileName}' deleted successfully." });
    }
}
