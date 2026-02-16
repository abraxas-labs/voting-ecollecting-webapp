/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { AfterViewInit, Component, ElementRef, HostListener, inject, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { COLLECTION_MESSAGES_SERVICE_TOKEN } from '../../../core/collection-messages.service';
import { CollectionMessage } from '../../models/collection-message.model';
import { ButtonModule, DialogModule, IconButtonModule, SpinnerModule, SwitchModule, TextareaModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { CollectionMessageComponent } from './collection-message/collection-message.component';
import { Subscription } from 'rxjs';
import { AUTHENTICATION_SERVICE_TOKEN } from '../../../core/authentication.service';
import { ConfirmDialogService } from '../../../core/confirm-dialog.service';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AsyncInputValidators } from '@abraxas/voting-lib';
import { CollectionType } from '@abraxas/voting-ecollecting-proto';

export const SHOW_CHAT_QUERY_PARAM = 'showChat';

export interface CollectionMessagesComponentData {
  collectionId: string;
  collectionType: CollectionType;
  isEditable: boolean;
  isRequestInformalReviewVisible: boolean;
  canRequestInformalReview: boolean;
}

export interface CollectionMessagesComponentResult {
  informalReviewRequested: boolean;
}

@Component({
  selector: 'vo-ecol-collection-messages',
  imports: [
    DialogModule,
    TranslatePipe,
    IconButtonModule,
    CollectionMessageComponent,
    TextareaModule,
    SpinnerModule,
    ButtonModule,
    ReactiveFormsModule,
    SwitchModule,
  ],
  templateUrl: './collection-messages.component.html',
  styleUrl: './collection-messages.component.scss',
})
export class CollectionMessagesComponent implements OnInit, AfterViewInit, OnDestroy {
  public readonly data = inject<CollectionMessagesComponentData>(MAT_DIALOG_DATA);
  private readonly messagesService = inject(COLLECTION_MESSAGES_SERVICE_TOKEN);
  private readonly auth = inject(AUTHENTICATION_SERVICE_TOKEN);
  private readonly dialogRef = inject<MatDialogRef<CollectionMessagesComponent, CollectionMessagesComponentResult>>(MatDialogRef);
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  public loading = false;
  public messages: CollectionMessage[] = [];
  public informalReviewRequested?: boolean;
  public newMessage: string = '';

  public readonly backdropClickSubscription: Subscription;

  @ViewChildren(CollectionMessageComponent, { read: ElementRef })
  protected messageComponents!: QueryList<ElementRef<HTMLElement>>;

  protected form!: FormGroup<Form>;

  private messageComponentsSubscription: Subscription = Subscription.EMPTY;

  constructor() {
    this.dialogRef.disableClose = true;
    this.backdropClickSubscription = this.dialogRef.backdropClick().subscribe(() => this.close());
    this.buildForm();
  }

  private get hasChanges(): boolean {
    return this.newMessage !== '';
  }

  @HostListener('window:beforeunload')
  public beforeUnload(): boolean {
    return !this.hasChanges;
  }

  @HostListener('window:keyup.esc')
  public async keyUpEscape(): Promise<void> {
    await this.close();
  }

  public ngOnDestroy(): void {
    this.backdropClickSubscription.unsubscribe();
    this.messageComponentsSubscription.unsubscribe();
  }

  public ngAfterViewInit(): void {
    this.messageComponentsSubscription = this.messageComponents.changes.subscribe(() =>
      this.messageComponents.last.nativeElement.scrollIntoView({ behavior: 'smooth' }),
    );
  }

  public async ngOnInit(): Promise<void> {
    try {
      this.loading = true;
      const response = await this.messagesService.listMessages(this.data.collectionId);
      this.messages = response.messages;
      this.informalReviewRequested = response.informalReviewRequested;
    } finally {
      this.loading = false;
    }
  }

  public async send(): Promise<void> {
    const message = this.newMessage.trim();
    this.newMessage = '';
    const id = await this.messagesService.addMessage(this.data.collectionId, message);
    this.messages = [
      ...this.messages,
      {
        id,
        collectionId: this.data.collectionId,
        collectionType: this.data.collectionType,
        content: message,
        createdAt: new Date(),
        createdByName: this.auth.userProfile.name,
      },
    ];
  }

  public async close(): Promise<void> {
    await this.confirmClose();
    this.dialogRef.close({ informalReviewRequested: this.informalReviewRequested! });
  }

  public async requestInformalReview(requestInformalReview: boolean): Promise<void> {
    const ok =
      !requestInformalReview ||
      (await this.confirmDialogService.confirm({
        title: 'COLLECTION_MESSAGES.REQUEST_INFORMAL_REVIEW_CONFIRM.TITLE',
        message: 'COLLECTION_MESSAGES.REQUEST_INFORMAL_REVIEW_CONFIRM.MESSAGE',
        confirmText: 'APP.YES',
        discardText: 'APP.DISCARD',
      }));
    if (!ok) {
      this.informalReviewRequested = false;
      return;
    }

    const message = await this.messagesService.updateRequestInformalReview(this.data.collectionId, requestInformalReview);
    this.messages = [...this.messages, message];
  }

  private async confirmClose(): Promise<void> {
    if (!this.hasChanges) {
      return;
    }

    const ok = await this.confirmDialogService.confirm({
      title: 'APP.CHANGES.TITLE',
      message: 'COLLECTION_MESSAGES.UNSAVED_CHANGES.MESSAGE',
      confirmText: 'COLLECTION_MESSAGES.UNSAVED_CHANGES.SEND_AND_CLOSE',
      discardText: 'COLLECTION_MESSAGES.UNSAVED_CHANGES.DISCARD',
    });

    if (ok) {
      // don't await the result and close the dialog
      this.send();
    }
  }

  private buildForm(): void {
    this.form = this.formBuilder.group<Form>({
      message: this.formBuilder.control(
        { value: '', disabled: !this.data.isEditable },
        {
          validators: [Validators.maxLength(1000)],
          asyncValidators: [AsyncInputValidators.complexMlText],
        },
      ),
    });
  }
}

interface Form {
  message: FormControl<string>;
}
