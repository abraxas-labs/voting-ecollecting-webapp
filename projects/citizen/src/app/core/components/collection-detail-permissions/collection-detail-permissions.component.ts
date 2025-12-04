/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { AfterViewInit, Component, OnDestroy, ViewChild, inject } from '@angular/core';
import {
  ButtonModule,
  CardModule,
  DialogService,
  IconButtonModule,
  SortDirective,
  StatusLabelModule,
  TableDataSource,
  TableModule,
  TruncateWithTooltipModule,
} from '@abraxas/base-components';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';
import { CollectionService } from '../../services/collection.service';
import { firstValueFrom, Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ConfirmDialogComponent, ConfirmDialogData, ToastService } from 'ecollecting-lib';
import { CollectionDetailPermissionDialogComponent } from '../collection-detail-permission-dialog/collection-detail-permission-dialog.component';
import { Collection, CollectionPermission } from '../../models/collection.model';
import { CollectionPermissionState } from '@abraxas/voting-ecollecting-proto';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-collection-detail-permissions',
  templateUrl: './collection-detail-permissions.component.html',
  styleUrls: ['./collection-detail-permissions.component.scss'],
  imports: [
    CardModule,
    TranslateDirective,
    TranslatePipe,
    TableModule,
    ButtonModule,
    TruncateWithTooltipModule,
    StatusLabelModule,
    IconButtonModule,
  ],
})
export class CollectionDetailPermissionsComponent implements AfterViewInit, OnDestroy {
  private readonly collectionService = inject(CollectionService);
  private readonly dialogService = inject(DialogService);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthenticationService);

  public readonly lastNameColumn = 'lastName';
  public readonly firstNameColumn = 'firstName';
  public readonly emailColumn = 'email';
  public readonly roleColumn = 'role';
  public readonly acceptedColumn = 'accepted';
  public readonly actionsColumn = 'actions';
  public readonly columns = [
    this.lastNameColumn,
    this.firstNameColumn,
    this.emailColumn,
    this.roleColumn,
    this.acceptedColumn,
    this.actionsColumn,
  ];

  protected readonly states = CollectionPermissionState;

  @ViewChild(SortDirective, { static: true })
  public sort!: SortDirective;

  public dataSource = new TableDataSource<CollectionPermission>();
  public collection?: Collection;

  protected readonly currentUserEmail: string;

  private routeSubscription: Subscription;

  constructor() {
    const route = inject(ActivatedRoute);

    this.routeSubscription = route.parent!.data.subscribe(({ initiative, referendum }) =>
      this.loadData(initiative?.collection ?? referendum?.collection),
    );
    this.currentUserEmail = this.authService.userProfile.email;
  }

  public ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  public async loadData(collection: Collection): Promise<void> {
    this.collection = collection;
    this.dataSource.data = await this.collectionService.listPermissions(this.collection.id);
  }

  public async create(): Promise<void> {
    if (!this.collection) {
      return;
    }

    const dialogRef = this.dialogService.open(CollectionDetailPermissionDialogComponent, { collectionId: this.collection.id }, '500px');
    const result = await firstValueFrom(dialogRef.afterClosed());

    if (!result) {
      return;
    }

    this.dataSource.data = [...this.dataSource.data, result.permission];
    this.toastService.success('COLLECTION.DETAIL.PERMISSIONS.CREATED');
  }

  public async delete(id: string): Promise<void> {
    const dialogRef = this.dialogService.open(ConfirmDialogComponent, {
      title: 'APP.DELETE.TITLE',
      message: 'APP.DELETE.MSG',
      confirmText: 'APP.YES',
      discardText: 'APP.DISCARD',
    } satisfies ConfirmDialogData);
    const result = await firstValueFrom(dialogRef.afterClosed());

    if (!result) {
      return;
    }

    await this.collectionService.deletePermission(id);
    this.dataSource.data = this.dataSource.data.filter(x => x.id !== id);
  }

  public async resend(id: string): Promise<void> {
    await this.collectionService.resendPermission(id);
    this.toastService.success('COLLECTION.DETAIL.PERMISSIONS.SENT');
  }
}
