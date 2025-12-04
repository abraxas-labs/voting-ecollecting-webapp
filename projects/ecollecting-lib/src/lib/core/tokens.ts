/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { GrpcEnvironment } from '@abraxas/voting-lib';
import { InjectionToken } from '@angular/core';

export const GRPC_ENV_INJECTION_TOKEN: InjectionToken<GrpcEnvironment> = new InjectionToken<GrpcEnvironment>('grpc environment settings');
export const REST_API_URL_INJECTION_TOKEN: InjectionToken<string> = new InjectionToken<string>('rest api url');
