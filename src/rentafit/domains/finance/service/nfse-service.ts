import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { map, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NfseService {
  uploadProgress = signal<number>(0);
  isUploading = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  /**
   * In a real scenario, this would call your backend to get a presigned URL.
   * For now, it simulates the upload to a specific bucket folder.
   */
  uploadBackup(file: File) {
    this.isUploading.set(true);
    this.uploadProgress.set(0);

    // Placeholder: In a real app, you'd GET the signed URL first
    const mockSignedUrl = `https://your-bucket.s3.amazonaws.com/backups/${file.name}`;

    return this.http.put(mockSignedUrl, file, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map(event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress.set(Math.round(100 * event.loaded / event.total));
        }
        if (event.type === HttpEventType.Response) {
          this.isUploading.set(false);
          return true;
        }
        return false;
      }),
      catchError(err => {
        console.error('Upload failed', err);
        this.isUploading.set(false);
        this.uploadProgress.set(0);
        return of(false);
      })
    );
  }
}
