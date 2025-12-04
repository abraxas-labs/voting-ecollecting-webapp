/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { AfterViewInit, Component, Input, ViewChild, inject } from '@angular/core';
import { Certificate } from '../../../core/models/certificate.model';
import { TranslatePipe } from '@ngx-translate/core';
import {
  IconButtonModule,
  LabelModule,
  SortDirective,
  SpinnerModule,
  StatusLabelModule,
  TableDataSource,
  TableModule,
  TooltipModule,
  TruncateWithTooltipModule,
} from '@abraxas/base-components';
import { DatePipe } from '@angular/common';
import { ToastService } from 'ecollecting-lib';
import { CertificateInfoComponent } from '../certificate-info/certificate-info.component';

@Component({
  selector: 'app-certificates-list',
  imports: [
    TranslatePipe,
    StatusLabelModule,
    TableModule,
    TooltipModule,
    TruncateWithTooltipModule,
    DatePipe,
    IconButtonModule,
    SpinnerModule,
    LabelModule,
    CertificateInfoComponent,
  ],
  templateUrl: './certificates-list.component.html',
  styleUrl: './certificates-list.component.scss',
})
export class CertificatesListComponent implements AfterViewInit {
  private readonly toast = inject(ToastService);

  protected readonly notAfterColumn = 'notAfter';
  protected readonly importedAtColumn = 'importedAt';
  protected readonly importedByColumn = 'importedBy';
  protected readonly subjectColumn = 'subject';
  protected readonly labelColumn = 'label';
  protected readonly checkColumn = 'check';
  protected readonly thumbprintColumn = 'thumbprint';
  protected readonly actionsColumn = 'actions';
  protected readonly columns = [
    this.notAfterColumn,
    this.importedAtColumn,
    this.importedByColumn,
    this.subjectColumn,
    this.labelColumn,
    this.checkColumn,
    this.thumbprintColumn,
    this.actionsColumn,
  ];

  protected dataSource = new TableDataSource<Certificate>();

  @ViewChild(SortDirective, { static: true })
  public sort!: SortDirective;

  @Input({ required: true })
  public loading = false;

  @Input({ required: true })
  public set certificates(c: Certificate[]) {
    this.dataSource.data = c;
  }

  public ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  protected async copyThumbprint(cert: Certificate): Promise<void> {
    await navigator.clipboard.writeText(cert.info.thumbprint);
    this.toast.success('ADMIN.CERTS.ACTIVE.COPIED');
  }
}
