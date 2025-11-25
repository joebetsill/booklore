import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Book } from '../../features/book/model/book.model';
import { from, Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

export interface OfflineBook {
    id: number;
    book: Book;
    content: Blob;
    addedAt: Date;
}

export interface OfflineProgress {
    bookId: number;
    progress: any;
    updatedAt: Date;
    needsSync: number;
}

export interface OfflineNote {
    id?: number;
    serverId?: number;
    bookId: number;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    needsSync: number;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'NONE';
}

@Injectable({
    providedIn: 'root'
})
export class OfflineService extends Dexie {
    offlineBooks!: Table<OfflineBook, number>;
    offlineProgress!: Table<OfflineProgress, number>;
    offlineNotes!: Table<OfflineNote, number>;

    constructor() {
        super('BookloreOfflineDB');
        this.version(1).stores({
            offlineBooks: 'id, addedAt',
            offlineProgress: 'bookId, updatedAt, needsSync',
            offlineNotes: '++id, bookId, serverId, needsSync'
        });
    }

    saveBook(book: Book, content: Blob): Observable<number> {
        return from(this.offlineBooks.put({
            id: book.id,
            book: book,
            content: content,
            addedAt: new Date()
        }));
    }

    removeBook(bookId: number): Observable<void> {
        return from(this.offlineBooks.delete(bookId));
    }

    getOfflineBooks(): Observable<Book[]> {
        return from(this.offlineBooks.toArray()).pipe(
            map(items => items.map(item => item.book))
        );
    }

    getBookContent(bookId: number): Observable<Blob | undefined> {
        return from(this.offlineBooks.get(bookId)).pipe(
            map(item => item?.content)
        );
    }

    isBookOffline(bookId: number): Observable<boolean> {
        return from(this.offlineBooks.get(bookId)).pipe(
            map(item => !!item)
        );
    }

    saveProgress(bookId: number, progress: any): Observable<number> {
        return from(this.offlineProgress.put({
            bookId: bookId,
            progress: progress,
            updatedAt: new Date(),
            needsSync: 1
        }));
    }

    getUnsyncedProgress(): Observable<OfflineProgress[]> {
        return from(this.offlineProgress.where('needsSync').equals(1).toArray());
    }

    markProgressAsSynced(bookId: number): Observable<number> {
        return from(this.offlineProgress.update(bookId, { needsSync: 0 }));
    }

    getProgress(bookId: number): Observable<any> {
        return from(this.offlineProgress.get(bookId)).pipe(
            map(item => item?.progress)
        );
    }

    // Note methods

    saveNote(note: OfflineNote): Observable<number> {
        return from(this.offlineNotes.put(note));
    }

    getNotesForBook(bookId: number): Observable<OfflineNote[]> {
        return from(this.offlineNotes.where('bookId').equals(bookId).filter(n => n.action !== 'DELETE').toArray());
    }

    getUnsyncedNotes(): Observable<OfflineNote[]> {
        return from(this.offlineNotes.where('needsSync').equals(1).toArray());
    }

    deleteNote(id: number): Observable<void> {
        return from(this.offlineNotes.get(id)).pipe(
            switchMap(note => {
                if (!note) return of(void 0);
                if (note.action === 'CREATE') {
                    return from(this.offlineNotes.delete(id));
                } else {
                    return from(this.offlineNotes.update(id, { action: 'DELETE', needsSync: 1 })).pipe(map(() => void 0));
                }
            })
        );
    }

    markNoteAsSynced(id: number, serverId?: number): Observable<number> {
        const updates: any = { needsSync: 0, action: 'NONE' };
        if (serverId) {
            updates.serverId = serverId;
        }
        return from(this.offlineNotes.update(id, updates));
    }

    removeSyncedDeletedNotes(): Observable<void> {
        return from(this.offlineNotes.where('action').equals('DELETE').and(n => n.needsSync === 0).delete()).pipe(map(() => void 0));
    }

    clearAll(): Observable<void> {
        return from(Promise.all([
            this.offlineBooks.clear(),
            this.offlineProgress.clear(),
            this.offlineNotes.clear()
        ])).pipe(map(() => void 0));
    }
}
