/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { AfterViewInit, Component, inject, Input, OnInit, ViewChild } from '@angular/core';
import { SortDirective, StatusLabelModule, TableDataSource, TableModule, TruncateWithTooltipModule } from '@abraxas/base-components';
import { CollectionService } from '../../services/collection.service';
import { CollectionPermission } from '../../models/collection.model';
import { TranslatePipe } from '@ngx-translate/core';
import { collectionPermissionRoleColorMap } from 'ecollecting-lib';

@Component({
  selector: 'app-collection-permissions',
  templateUrl: './collection-permissions.component.html',
  imports: [TableModule, TranslatePipe, TruncateWithTooltipModule, StatusLabelModule],
})
export class CollectionDetailPermissionsComponent implements OnInit, AfterViewInit {
  protected readonly collectionPermissionRoleColorMap = collectionPermissionRoleColorMap;
  private readonly collectionService = inject(CollectionService);

  public readonly fullNameColumn = 'fullName';
  public readonly emailColumn = 'email';
  public readonly roleColumn = 'role';
  public readonly columns = [this.fullNameColumn, this.emailColumn, this.roleColumn];

  @Input({ required: true })
  public collectionId!: string;

  @ViewChild(SortDirective, { static: true })
  public sort!: SortDirective;

  public dataSource = new TableDataSource<CollectionPermission>();

  public async ngOnInit(): Promise<void> {
    this.dataSource.data = await this.collectionService.listPermissions(this.collectionId);
  }

  public ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }
}
