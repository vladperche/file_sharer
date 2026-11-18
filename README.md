# FileSharer

A lightweight, self-hosted **Local Network File Sharing** web application built with **.NET 10 Web API** and **Angular 19 (Angular Material)**, ready to deploy with **Docker Compose**.

FileSharer provides a clean web interface for devices on a local network (LAN) to upload, browse, download, and delete files stored in a configurable directory on the host server.

---

## ✨ Features

- **Upload Files (Select & Confirm):** Choose any file from your device, inspect its extension and size before sending, and upload with a real-time progress bar.
- **Large File Support:** Configured across Nginx and Kestrel to handle large file uploads over a local network without size restrictions.
- **Server Files Grid:** View all shared files with their **File Name**, **File Extension**, and **File Size** (human-readable and exact byte count).
- **One-Click Download:** Stream and download files directly from the server with automatic MIME type detection.
- **Safe File Deletion:** Delete files from the remote server with an Angular Material confirmation dialog to prevent accidental removals.
- **Configurable Storage Path:** Set the server storage folder via `appsettings.json` or Docker environment variables (`.env`).

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend** | .NET 10.0 (`ASP.NET Core Web API`, C#) |
| **Frontend** | Angular 19, Angular Material, TypeScript, SCSS |
| **Web Server / Proxy** | Nginx (serves the Angular SPA and proxies `/api` to the backend) |
| **Infrastructure** | Docker & Docker Compose |

---

## 📂 Project Structure

```text
FileSharer/
├── srcBackend/                     # .NET 10.0 Web API solution
│   ├── FileSharer.Api/
│   │   ├── Controllers/
│   │   │   └── FilesController.cs  # REST endpoints (List, Upload, Download, Delete)
│   │   ├── Models/
│   │   │   ├── FileItemDto.cs
│   │   │   └── FileStorageOptions.cs
│   │   ├── Program.cs
│   │   └── appsettings.json
│   ├── Dockerfile
│   └── FileSharer.sln
├── srcFrontend/                    # Angular 19 + Angular Material SPA
│   ├── src/app/
│   │   ├── components/confirm-delete-dialog/
│   │   ├── models/file-item.model.ts
│   │   ├── services/file.service.ts
│   │   └── app.component.*
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json
├── SharedFiles/                    # Default local folder mounted for shared files
├── .env                            # Environment variables for Docker Compose
└── docker-compose.yml              # Multi-container orchestration
```

---

## 🚀 Getting Started

### Option 1: Run with Docker Compose (Recommended)

#### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & Docker Compose installed.

#### 1. Configure the Storage Folder (Optional)
Edit the `.env` file in the root directory to set the host folder that will store uploaded files:
```env
LOCAL_STORAGE_FOLDER=./SharedFiles
```

#### 2. Build and Start the Containers
```bash
docker compose up --build -d
```

#### 3. Access the Application
- **Web UI:** [http://localhost:4200](http://localhost:4200) (or `http://<YOUR-LAN-IP>:4200` from other devices on your network)
- **Backend API:** [http://localhost:5000/api/files](http://localhost:5000/api/files)

To stop the containers:
```bash
docker compose down
```

---

### Option 2: Run Locally for Development

#### Prerequisites
- [.NET 10.0 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 22+](https://nodejs.org/) and `npm`

#### 1. Start the Backend API
```bash
cd srcBackend/FileSharer.Api
dotnet run --urls "http://localhost:5000"
```
You can configure the local storage directory in `srcBackend/FileSharer.Api/appsettings.json`:
```json
{
  "FileStorage": {
    "StoragePath": "./SharedFiles"
  }
}
```

#### 2. Start the Frontend Application
In a separate terminal:
```bash
cd srcFrontend
npm install
npm start
```
The Angular development server will start at [http://localhost:4200](http://localhost:4200) and automatically proxy `/api` requests to `http://localhost:5000` via `proxy.conf.json`.

---

## 📡 REST API Endpoints

Base URL: `/api/files`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/files` | Lists all files in the configured server folder (`fileName`, `fileExtension`, `fileSize`, `lastModified`). |
| `POST` | `/api/files/upload` | Uploads a new file (`multipart/form-data` field `file`). |
| `GET` | `/api/files/download/{fileName}` | Downloads a specific file by name. |
| `DELETE` | `/api/files/{fileName}` | Deletes a specific file by name from the server. |

---

## ⚠️ Security Note

This application is intentionally designed for **trusted Local Area Networks (LAN)** without authentication or user access controls. Do not expose this service directly to the public internet without adding authentication, TLS/HTTPS, and access control mechanisms.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
