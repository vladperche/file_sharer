namespace FileSharer.Api.Models;

public class FileStorageOptions
{
    public const string SectionName = "FileStorage";

    public string StoragePath { get; set; } = "SharedFiles";
}
