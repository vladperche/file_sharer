# PBI-001: FileSharer Creation & Initial Implementation

**Date:** 2026-11-18  
**Project:** FileSharer — Local Network File Upload/Download Web Application

---

## 1. Objective & Requirements

Create a Web User Interface and REST API to upload, list, download, and delete files on a remote server running on a Local Network.

### Core Requisites
- **Local Network Operation:** Designed for LAN access without authentication/security overhead at this initial stage.
- **Configurable Storage Folder:** The local folder where files are stored on the server is configurable via application settings (`appsettings.json` / environment variables / `.env`).
- **Containerized Infrastructure:** Orchestrated end-to-end with `docker-compose`.

---

## 2. Architecture & Implementation Summary

### 2.1. Backend (`srcBackend`)
- **Platform:** .NET 10.0 (`net10.0`) ASP.NET Core Web API
- **Solution & Project:**
  - `srcBackend/FileSharer.sln` (and `FileSharer.slnx`)
  - `srcBackend/FileSharer.Api/FileSharer.Api.csproj`
- **Configuration:**
  - `Models/FileStorageOptions.cs`: Binds the `FileStorage:StoragePath` setting (defaults to `./SharedFiles`).
  - `Program.cs`:
    - Registers `FileStorageOptions`.
    - Configures Kestrel (`MaxRequestBodySize = null`) and `FormOptions` (`MultipartBodyLengthLimit = long.MaxValue`) to allow large file uploads over the local network.
    - Configures permissive CORS (`LocalNetworkCors`) exposing `Content-Disposition`.
- **REST API Endpoints (`Controllers/FilesController.cs` at `/api/files`):**
  - `GET /api/files` — Lists all files in the configured storage directory (`FileName`, `FileExtension`, `FileSize`, `LastModified`).
  - `POST /api/files/upload` (alias `POST /api/files`) — Uploads a new file to the configured storage directory with `[DisableRequestSizeLimit]` and path-traversal sanitization (`Path.GetFileName`).
  - `GET /api/files/download/{fileName}` (alias `GET /api/files/{fileName}`) — Streams a file by name with automatic MIME content-type detection (`FileExtensionContentTypeProvider`).
  - `DELETE /api/files/{fileName}` — Deletes a file by name from the configured storage directory.

### 2.2. Frontend (`srcFrontend`)
- **Platform:** Node / Angular 19 with Angular Material (`@angular/material`)
- **Key Files:**
  - `src/app/models/file-item.model.ts`: `FileItem` interface (`fileName`, `fileExtension`, `fileSize`, `lastModified`).
  - `src/app/services/file.service.ts`: `FileService` wrapping HTTP calls to `/api/files` (including upload progress events and blob downloads).
  - `src/app/components/confirm-delete-dialog/confirm-delete-dialog.component.ts`: Angular Material modal dialog (`MatDialog`) requiring user confirmation before deleting a file on the remote server.
  - `src/app/app.component.ts`, `app.component.html`, `app.component.scss`:
    - **Upload Control Card:** Allows selecting a file (`Select File`), previews file name, extension, and formatted size, and uploads upon clicking `Confirm Upload` with a determinate progress bar (`mat-progress-bar`).
    - **Server Files Grid (`mat-table`):** Displays `File Name`, `File Extension`, `File Size` (human-readable + exact byte count), and `Actions` (`Download` and `Delete` buttons).

### 2.3. Infrastructure (`docker-compose.yml`)
- **Backend Container (`filesharer-backend`):**
  - Built via multi-stage `srcBackend/Dockerfile` (`mcr.microsoft.com/dotnet/sdk:10.0` -> `mcr.microsoft.com/dotnet/aspnet:10.0`).
  - Exposes port `5000:8080`.
  - Mounts `${LOCAL_STORAGE_FOLDER:-./SharedFiles}:/app/SharedFiles`.
- **Frontend Container (`filesharer-frontend`):**
  - Built via multi-stage `srcFrontend/Dockerfile` (`node:22-alpine` -> `nginx:alpine`).
  - Exposes port `4200:80`.
  - `srcFrontend/nginx.conf` serves the Angular SPA and reverse-proxies `/api/` requests to `http://backend:8080/api/` with `client_max_body_size 0;` for unrestricted file upload sizes.

---

## 3. Follow-Up Adjustments Made During Session

1. **Frontend `.gitignore`:**
   - Added a standard Node/Angular `.gitignore` file at `srcFrontend/.gitignore` excluding `/node_modules`, `/dist`, `/.angular/cache`, IDE folders, logs, and environment files.
2. **File Grid Row Separator Alignment Fix:**
   - **Issue:** When listing more than 1 file on the server, the horizontal row separator line in `mat-table` was misaligned between the `File Name` column and the remaining columns.
   - **Root Cause:** `display: flex` was applied directly to `<td mat-cell class="file-name-cell">`, overriding native `display: table-cell` height synchronization across the row.
   - **Resolution:** Wrapped the icon and file name inside an inner `<div class="file-name-content">` inside `app.component.html` and moved the `display: flex` styling to `.file-name-content` in `app.component.scss`, preserving `display: table-cell` on `<td mat-cell>`.
