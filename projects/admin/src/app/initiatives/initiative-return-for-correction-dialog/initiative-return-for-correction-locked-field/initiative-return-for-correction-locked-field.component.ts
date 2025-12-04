/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconButtonModule, TooltipModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-initiative-return-for-correction-locked-field',
  templateUrl: './initiative-return-for-correction-locked-field.component.html',
  imports: [IconButtonModule, TooltipModule, TranslatePipe],
})
export class InitiativeReturnForCorrectionLockedFieldComponent {
  protected isLocked = true;

  @Input()
  public label: string = '';

  @Input()
  public tooltipLabel: string = '';

  @Output()
  public lockedChanged: EventEmitter<boolean> = new EventEmitter();

  protected toggleLocked(): void {
    this.isLocked = !this.isLocked;
    this.lockedChanged.emit(this.isLocked);
  }
}
