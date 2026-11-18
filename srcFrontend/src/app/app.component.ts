import { Component, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { FileItem } from './models/file-item.model';
import { FileService } from './services/file.service';
import { ConfirmDeleteDialogComponent } from './components/confirm-delete-dialog/confirm-delete-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatChipsModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private readonly fileService = inject(FileService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  files: FileItem[] = [];
  displayedColumns: string[] = ['fileName', 'fileExtension', 'fileSize', 'actions'];

  selectedFile: File | null = null;
  isLoading = false;
  isUploading = false;
  uploadProgress = 0;

  ngOnInit(): void {
    this.loadFiles();
  }

  loadFiles(): void {
    this.isLoading = true;
    this.fileService.listFiles().subscribe({
      next: (files) => {
        this.files = files;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load files:', err);
        this.isLoading = false;
        this.showNotification('Failed to load files from server.', true);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  clearSelectedFile(): void {
    this.selectedFile = null;
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  confirmUpload(): void {
    if (!this.selectedFile || this.isUploading) {
      return;
    }

    const fileToUpload = this.selectedFile;
    this.isUploading = true;
    this.uploadProgress = 0;

    this.fileService.uploadFile(fileToUpload).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round((100 * event.loaded) / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.isUploading = false;
          this.uploadProgress = 0;
          this.showNotification(`File "${fileToUpload.name}" uploaded successfully!`);
          this.clearSelectedFile();
          this.loadFiles();
        }
      },
      error: (err) => {
        console.error('Upload failed:', err);
        this.isUploading = false;
        this.uploadProgress = 0;
        this.showNotification(`Failed to upload "${fileToUpload.name}".`, true);
      }
    });
  }

  downloadFile(file: FileItem): void {
    this.fileService.downloadFile(file.fileName).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = file.fileName;
        anchor.click();
        window.URL.revokeObjectURL(url);
        this.showNotification(`Downloading "${file.fileName}"...`);
      },
      error: (err) => {
        console.error('Download failed:', err);
        this.showNotification(`Failed to download "${file.fileName}".`, true);
      }
    });
  }

  confirmAndDeleteFile(file: FileItem): void {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '420px',
      data: { fileName: file.fileName }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.fileService.deleteFile(file.fileName).subscribe({
          next: () => {
            this.showNotification(`File "${file.fileName}" deleted.`);
            this.loadFiles();
          },
          error: (err) => {
            console.error('Delete failed:', err);
            this.showNotification(`Failed to delete "${file.fileName}".`, true);
          }
        });
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
    return `${size} ${units[i]}`;
  }

  getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot > 0 ? fileName.substring(lastDot) : '-';
  }

  private showNotification(message: string, isError = false): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: isError ? ['snackbar-error'] : ['snackbar-success']
    });
  }
}
