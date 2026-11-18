import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FileItem } from '../models/file-item.model';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/files';

  listFiles(): Observable<FileItem[]> {
    return this.http.get<FileItem[]>(this.apiUrl);
  }

  uploadFile(file: File): Observable<HttpEvent<FileItem>> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<FileItem>(`${this.apiUrl}/upload`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  downloadFile(fileName: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${encodeURIComponent(fileName)}`, {
      responseType: 'blob'
    });
  }

  deleteFile(fileName: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${encodeURIComponent(fileName)}`);
  }
}
