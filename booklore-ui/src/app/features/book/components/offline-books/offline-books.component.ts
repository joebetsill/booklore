import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookService } from '../../service/book.service';
import { Book } from '../../model/book.model';
import { Observable } from 'rxjs';
import { BookCardLiteComponent } from '../../components/book-card-lite/book-card-lite-component';
import { ButtonModule } from 'primeng/button';
import { OfflineService } from '../../../../core/service/offline.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-offline-books',
  standalone: true,
  imports: [CommonModule, BookCardLiteComponent, ButtonModule, ConfirmDialogModule],
  providers: [ConfirmationService],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Offline Books</h1>
        <p-button 
          label="Remove All Offline Books" 
          icon="pi pi-trash" 
          severity="danger" 
          (onClick)="removeAll()"
          [disabled]="(books$ | async)?.length === 0">
        </p-button>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" *ngIf="books$ | async as books">
        <div *ngFor="let book of books">
            <app-book-card-lite-component [book]="book"></app-book-card-lite-component>
        </div>
        
        <div *ngIf="books.length === 0" class="col-span-full text-center py-12 text-gray-500">
          <i class="pi pi-cloud-download text-4xl mb-4"></i>
          <p>No books available offline.</p>
          <p class="text-sm mt-2">Download books from their detail page to read them offline.</p>
        </div>
      </div>
    </div>
  `
})
export class OfflineBooksComponent implements OnInit {
  private bookService = inject(BookService);
  private offlineService = inject(OfflineService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  books$!: Observable<Book[]>;

  ngOnInit() {
    this.refreshBooks();
  }

  refreshBooks() {
    this.books$ = this.offlineService.getOfflineBooks();
  }

  removeAll() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to remove all offline books? This cannot be undone.',
      header: 'Confirm Removal',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.offlineService.clearAll().subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'All offline books removed' });
            this.refreshBooks();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to remove offline books' });
          }
        });
      }
    });
  }
}
