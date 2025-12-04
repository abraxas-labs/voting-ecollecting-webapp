/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  AlertBarModule,
  BreadcrumbItemModule,
  BreadcrumbsModule,
  ButtonModule,
  CardModule,
  DividerModule,
  IconButtonModule,
  ReadonlyModule,
  SpinnerModule,
  SubNavigationBarModule,
  TooltipModule,
  TruncateWithTooltipModule,
} from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CollectionType } from '@abraxas/voting-ecollecting-proto';
import { Initiative } from '../../core/models/initiative.model';
import { Referendum } from '../../core/models/referendum.model';
import { samplesUrl } from '../check-samples.routes';
import { CollectionMunicipality } from '../../core/models/collection.model';
import { CheckSamplesMunicipalityTableComponent } from '../check-samples-municipality-table/check-samples-municipality-table.component';
import { CheckSamplesHeaderComponent } from '../check-samples-header/check-samples-header.component';
import { CollectionMunicipalityService } from '../../core/services/collection-municipality.service';

@Component({
  selector: 'app-check-samples-overview',
  templateUrl: './check-samples-overview.component.html',
  styleUrls: ['./check-samples-overview.component.scss'],
  imports: [
    SubNavigationBarModule,
    TranslatePipe,
    BreadcrumbsModule,
    BreadcrumbItemModule,
    DividerModule,
    CardModule,
    IconButtonModule,
    TooltipModule,
    TruncateWithTooltipModule,
    ReadonlyModule,
    ButtonModule,
    AlertBarModule,
    SpinnerModule,
    CheckSamplesMunicipalityTableComponent,
    CheckSamplesHeaderComponent,
  ],
})
export class CheckSamplesOverviewComponent implements OnInit, OnDestroy {
  protected readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly collectionMunicipalityService = inject(CollectionMunicipalityService);

  protected readonly collectionTypes = CollectionType;
  protected collection?: Initiative | Referendum;
  protected municipalities?: CollectionMunicipality[];
  protected loading = false;

  private routeSubscription: Subscription;

  constructor() {
    this.routeSubscription = this.route.data.subscribe(({ collection }) => (this.collection = collection));
  }

  public async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  protected async back(): Promise<void> {
    await this.router.navigate(['../../'], { relativeTo: this.route });
  }

  protected async openRandomList(): Promise<void> {
    await this.router.navigate([samplesUrl], { relativeTo: this.route });
  }

  private async loadData(): Promise<void> {
    if (!this.collection) {
      return;
    }

    try {
      this.loading = true;
      this.municipalities = await this.collectionMunicipalityService.list(this.collection.id);
    } finally {
      this.loading = false;
    }
  }
}
