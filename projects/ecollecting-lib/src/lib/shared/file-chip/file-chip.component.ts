/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconButtonModule, LinkModule, SpinnerModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'vo-ecol-file-chip',
  imports: [IconButtonModule, SpinnerModule, LinkModule, TranslatePipe],
  templateUrl: './file-chip.component.html',
  styleUrl: './file-chip.component.scss',
})
export class FileChipComponent {
  @Input()
  public loading = false;

  @Input()
  public canRemove = true;

  @Input()
  public canOpen = true;

  @Input({ required: true })
  public label: string = '';

  @Output()
  public open: EventEmitter<void> = new EventEmitter<void>();

  @Output()
  public remove: EventEmitter<void> = new EventEmitter<void>();
}
