/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent, ButtonModule, DialogModule, IconButtonModule, IconModule } from '@abraxas/base-components';
import { TranslateModule } from '@ngx-translate/core';
import { VotingLibModule } from '@abraxas/voting-lib';

@Component({
  selector: 'vo-ecol-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss'],
  imports: [ButtonModule, TranslateModule, DialogModule, IconModule, VotingLibModule, IconButtonModule],
})
export class DialogComponent {
  @Input()
  public header: string = '';

  @Input()
  public okText: string = 'APP.OK';

  @Input()
  public canOk: boolean = true;

  @Input()
  public showOk: boolean = true;

  @Input()
  public okColor: ButtonComponent['color'] = 'primary';

  @Input()
  public saving: boolean = false;

  @Input()
  public discardText: string = 'APP.DISCARD';

  @Input()
  public showDiscard: boolean = true;

  @Output()
  public ok: EventEmitter<void> = new EventEmitter<void>();

  @Output()
  public discard: EventEmitter<void> = new EventEmitter<void>();
}
