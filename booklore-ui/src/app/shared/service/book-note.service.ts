import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin, from } from 'rxjs';
import { map, switchMap, tap, catchError, first } from 'rxjs/operators';
import { API_CONFIG } from '../../core/config/api-config';
import { OfflineService, OfflineNote } from '../../core/service/offline.service';

export interface BookNote {
  id: number;
  userId: number;
  bookId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookNoteRequest {
  id?: number;
  bookId: number;
  title: string;
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookNoteService {

  private readonly url = `${API_CONFIG.BASE_URL}/api/v1/book-notes`;
  private readonly http = inject(HttpClient);
  private readonly offlineService = inject(OfflineService);

  constructor() {
    window.addEventListener('online', () => this.syncNotes());
    this.syncNotes();
  }

  private syncNotes() {
    if (!navigator.onLine) return;

    this.offlineService.getUnsyncedNotes().pipe(
      first(),
      switchMap(notes => {
        if (notes.length === 0) return this.offlineService.removeSyncedDeletedNotes();

        const tasks = notes.map(note => {
          if (note.action === 'DELETE') {
            const idToDelete = note.serverId || note.id;
            if (!idToDelete) return of(void 0);

            return this.http.delete(`${this.url}/${idToDelete}`).pipe(
              catchError(err => {
                console.error('Failed to delete note', err);
                return of(void 0);
              })
            );
          } else {
            const request: CreateBookNoteRequest = {
              id: note.serverId,
              bookId: note.bookId,
              title: note.title,
              content: note.content
            };
            return this.http.post<BookNote>(this.url, request).pipe(
              switchMap(savedNote => this.offlineService.markNoteAsSynced(note.id!, savedNote.id)),
              catchError(err => {
                console.error('Failed to sync note', err);
                return of(void 0);
              })
            );
          }
        });
        return forkJoin(tasks).pipe(
          switchMap(() => this.offlineService.removeSyncedDeletedNotes())
        );
      })
    ).subscribe();
  }

  getNotesForBook(bookId: number): Observable<BookNote[]> {
    return this.offlineService.getNotesForBook(bookId).pipe(
      switchMap(offlineNotes => {
        if (navigator.onLine) {
          return this.http.get<BookNote[]>(`${this.url}/book/${bookId}`).pipe(
            tap(serverNotes => {
              // Update offline cache
              serverNotes.forEach(sn => {
                // Find existing offline note with this serverId
                const existing = offlineNotes.find(n => n.serverId === sn.id);
                const noteToSave: OfflineNote = {
                  id: existing?.id, // Keep existing local ID if present
                  serverId: sn.id,
                  bookId: sn.bookId,
                  title: sn.title,
                  content: sn.content,
                  createdAt: sn.createdAt,
                  updatedAt: sn.updatedAt,
                  needsSync: 0,
                  action: 'NONE'
                };
                this.offlineService.saveNote(noteToSave);
              });
            }),
            map(serverNotes => serverNotes), // Return server notes as source of truth when online
            catchError(() => of(this.mapOfflineNotesToBookNotes(offlineNotes)))
          );
        }
        return of(this.mapOfflineNotesToBookNotes(offlineNotes));
      })
    );
  }

  createOrUpdateNote(request: CreateBookNoteRequest): Observable<BookNote> {
    const offlineNote: OfflineNote = {
      id: request.id, // This might be server ID if editing? No, request.id is usually server ID.
      // If request.id is present, it's an update. We need to find the local ID.
      serverId: request.id,
      bookId: request.bookId,
      title: request.title,
      content: request.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      needsSync: 1,
      action: request.id ? 'UPDATE' : 'CREATE'
    };

    // If updating, we need to ensure we have the local ID if possible, or just save.
    // Dexie will generate ID if undefined.
    // But if we are updating, we should probably look up by serverId if we don't have local ID?
    // The request.id comes from the UI, which uses BookNote.id.
    // If online, BookNote.id is server ID.
    // If offline, BookNote.id might be local ID?
    // This is tricky.
    // Let's assume the UI passes the ID it has.

    return from(this.offlineService.saveNote(offlineNote)).pipe(
      switchMap(localId => {
        offlineNote.id = localId;
        if (navigator.onLine) {
          return this.http.post<BookNote>(this.url, request).pipe(
            switchMap(savedNote => {
              return this.offlineService.markNoteAsSynced(localId, savedNote.id).pipe(
                map(() => savedNote)
              );
            }),
            catchError(() => {
              // Return offline note disguised as BookNote
              return of(this.mapOfflineNoteToBookNote(offlineNote));
            })
          );
        }
        return of(this.mapOfflineNoteToBookNote(offlineNote));
      })
    );
  }

  deleteNote(noteId: number): Observable<void> {
    // noteId could be local or server ID.
    // We need to find the note in offline storage.
    // If we can't find it by ID, maybe it's a server ID?

    return from(this.offlineService.offlineNotes.get(noteId)).pipe(
      switchMap(note => {
        if (note) {
          return this.offlineService.deleteNote(noteId);
        } else {
          // Try finding by serverId
          return from(this.offlineService.offlineNotes.where('serverId').equals(noteId).first()).pipe(
            switchMap(noteByServerId => {
              if (noteByServerId && noteByServerId.id) {
                return this.offlineService.deleteNote(noteByServerId.id);
              }
              return of(void 0);
            })
          );
        }
      }),
      switchMap(() => {
        if (navigator.onLine) {
          return this.http.delete<void>(`${this.url}/${noteId}`).pipe(
            switchMap(() => this.offlineService.removeSyncedDeletedNotes()),
            catchError(() => of(void 0))
          );
        }
        return of(void 0);
      })
    );
  }

  private mapOfflineNotesToBookNotes(offlineNotes: OfflineNote[]): BookNote[] {
    return offlineNotes.map(n => this.mapOfflineNoteToBookNote(n));
  }

  private mapOfflineNoteToBookNote(n: OfflineNote): BookNote {
    return {
      id: n.serverId || n.id || 0, // Prefer server ID, fallback to local
      userId: 0, // We don't store userId offline, maybe not needed for display
      bookId: n.bookId,
      title: n.title,
      content: n.content,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt
    };
  }
}
