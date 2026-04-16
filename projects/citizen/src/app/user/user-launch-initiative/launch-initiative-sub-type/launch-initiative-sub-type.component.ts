/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DropdownModule, LabelModule } from '@abraxas/base-components';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { InitiativeSubType } from 'ecollecting-lib';

@Component({
  selector: 'app-launch-initiative-sub-type',
  templateUrl: './launch-initiative-sub-type.component.html',
  styleUrl: './launch-initiative-sub-type.component.scss',
  imports: [DropdownModule, ReactiveFormsModule, LabelModule, TranslatePipe, DecimalPipe, NgTemplateOutlet],
})
export class LaunchInitiativeSubTypeComponent {
  @Input({ required: true })
  public items!: InitiativeSubType[];

  @Input({ required: true })
  public control!: FormControl;

  @Input({ required: true })
  public label!: string;

  @Input()
  public readonly = false;

  @Output()
  public valueChange: EventEmitter<void> = new EventEmitter<void>();
}
