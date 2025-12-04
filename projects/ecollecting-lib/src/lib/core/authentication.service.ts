/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { InjectionToken } from '@angular/core';

export const AUTHENTICATION_SERVICE_TOKEN = new InjectionToken<AuthenticationService>('AuthenticationService');

export interface AuthenticationService {
  readonly userProfile: UserProfile;
}

export interface UserProfile {
  name: string;
}
