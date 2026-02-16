/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject, Input } from '@angular/core';
import { ButtonModule, CardModule, SpinnerModule } from '@abraxas/base-components';
import { Initiative, InitiativeCommittee } from '../../../../../core/models/initiative.model';
import { InitiativeService } from '../../../../../core/services/initiative.service';
import { ConfirmDialogService, FileChipComponent, FileUploadComponent, StoredFile, ToastService } from 'ecollecting-lib';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-launch-initiative-detail-comittee-lists',
  imports: [ButtonModule, CardModule, SpinnerModule, TranslatePipe, FileUploadComponent, FileChipComponent],
  templateUrl: './launch-initiative-detail-comittee-lists.component.html',
  styleUrl: './launch-initiative-detail-comittee-lists.component.scss',
})
export class LaunchInitiativeDetailComitteeListsComponent {
  private readonly initiativeService = inject(InitiativeService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialogService = inject(ConfirmDialogService);

  @Input({ required: true })
  public initiative!: Initiative;

  @Input({ required: true })
  public committee!: InitiativeCommittee;

  protected readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  protected downloadingTemplate = false;
  protected uploadingFileName?: string;

  public async downloadTemplate(): Promise<void> {
    if (!this.initiative) {
      return;
    }

    this.downloadingTemplate = true;
    try {
      await this.initiativeService.downloadCommitteeListTemplate(this.initiative.id);
    } finally {
      this.downloadingTemplate = false;
    }
  }

  public async uploadFile(file: File): Promise<void> {
    if (!this.initiative || !this.committee) {
      return;
    }

    this.uploadingFileName = this.addTimestampToFileName(file.name);
    try {
      const fileEntity = await this.initiativeService.addCommitteeList(this.initiative.id, file);
      this.committee.committeeLists = [fileEntity, ...this.committee.committeeLists];
      this.toast.success('LAUNCH_INITIATIVE.DETAIL.COMMITTEE.LISTS.UPLOADED');
    } finally {
      delete this.uploadingFileName;
    }
  }

  public async removeCommitteeList(list: StoredFile): Promise<void> {
    if (!this.initiative || !this.committee || !(await this.confirmRemoveList())) {
      return;
    }

    this.committee.committeeLists = this.committee.committeeLists.filter(x => x.id !== list.id);
    await this.initiativeService.deleteCommitteeList(this.initiative.id, list.id);
  }

  public async openCommitteeList(list: StoredFile): Promise<void> {
    if (!this.initiative) {
      return;
    }

    await this.initiativeService.downloadCommitteeList(this.initiative.id, list.id);
  }

  private addTimestampToFileName(filename: string): string {
    const date = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `_${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;

    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return filename + timestamp;
    }

    const name = filename.slice(0, lastDotIndex);
    const extension = filename.slice(lastDotIndex);
    return name + timestamp + extension;
  }

  private async confirmRemoveList(): Promise<boolean> {
    return this.confirmDialogService.confirm({
      title: 'LAUNCH_INITIATIVE.DETAIL.COMMITTEE.LISTS.REMOVE_CONFIRMATION.TITLE',
      message: 'LAUNCH_INITIATIVE.DETAIL.COMMITTEE.LISTS.REMOVE_CONFIRMATION.MSG',
      confirmText: 'APP.YES',
      discardText: 'APP.DISCARD',
    });
  }
}
