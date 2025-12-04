/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { inject, Injectable } from '@angular/core';
import { AccessibilityServiceClient, SendAccessibilityMessageRequest } from '@abraxas/voting-ecollecting-proto/citizen';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AccessibilityService {
  private readonly client = inject(AccessibilityServiceClient);

  public async sendMessage(request: SendAccessibilityMessageRequest.AsObject): Promise<void> {
    await lastValueFrom(this.client.sendMessage(new SendAccessibilityMessageRequest(request)));
  }
}
