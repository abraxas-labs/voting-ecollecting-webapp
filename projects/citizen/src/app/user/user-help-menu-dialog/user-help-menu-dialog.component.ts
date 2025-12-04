/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component } from '@angular/core';
import { DialogModule, IconButtonModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { MatDialogClose } from '@angular/material/dialog';

@Component({
  selector: 'app-user-help-menu-dialog',
  templateUrl: './user-help-menu-dialog.component.html',
  imports: [DialogModule, TranslatePipe, IconButtonModule, MatDialogClose],
})
export class UserHelpMenuDialogComponent {}
