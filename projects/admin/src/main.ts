/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { enableProdMode, importProvidersFrom } from '@angular/core';
import { environment } from './environments/environment';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { routes } from './app/app.routes';
import { TranslationLoader } from './app/core/translation-loader';
import {
  AuthenticationModule,
  AuthorizationModule,
  FORMFIELD_DEFAULT_OPTIONS,
  RoleModule,
  TenantModule,
  UserModule,
} from '@abraxas/base-components';
import { ENV_INJECTION_TOKEN, VotingLibModule } from '@abraxas/voting-lib';
import {
  AUTHENTICATION_SERVICE_TOKEN,
  COLLECTION_MESSAGES_SERVICE_TOKEN,
  DOMAIN_OF_INFLUENCE_SERVICE_TOKEN,
  EcollectingLibModule,
  getCommonProviders,
  GRPC_ENV_INJECTION_TOKEN,
  HttpLanguageInterceptor,
  REST_API_URL_INJECTION_TOKEN,
} from 'ecollecting-lib';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeDeCh from '@angular/common/locales/de-CH';
import { GRPC_INTERCEPTORS, GrpcCoreModule, GrpcLoggerModule } from '@ngx-grpc/core';
import { GrpcWebClientModule } from '@ngx-grpc/grpc-web-client';
import { GrpcAuthInterceptor } from './app/core/interceptors/grpc-auth.interceptor';
import { GrpcTenantInterceptor } from './app/core/interceptors/grpc-tenant-interceptor.service';
import { CollectionService } from './app/core/services/collection.service';
import { AuthenticationAdapterService } from './app/core/services/authentication-adapter.service';
import { DomainOfInfluenceService } from './app/core/services/domain-of-influence.service';

if (environment.production) {
  enableProdMode();
}

registerLocaleData(localeDeCh);

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useClass: TranslationLoader,
        },
      }),
      AuthenticationModule.forAuthentication(environment.authenticationConfig),
      AuthorizationModule.forAuthorization(environment),
      RoleModule.forRoot(environment),
      UserModule.forRoot(environment),
      TenantModule.forRoot(environment),
      VotingLibModule.forRoot(environment.restApiEndpoint),
      EcollectingLibModule.forRoot(),
      GrpcCoreModule.forRoot(),
      GrpcWebClientModule.forRoot({
        settings: { host: environment.grpcApiEndpoint },
      }),
      GrpcLoggerModule.forRoot({
        settings: {
          enabled: localStorage.getItem('GRPC_CONSOLE_LOGGER_ENABLED') === 'true' || !environment.production,
        },
      }),
    ),
    provideAnimations(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    ...getCommonProviders(),
    {
      provide: GRPC_ENV_INJECTION_TOKEN,
      useValue: environment,
    },
    {
      provide: ENV_INJECTION_TOKEN,
      useValue: environment.env,
    },
    {
      provide: REST_API_URL_INJECTION_TOKEN,
      useValue: environment.restApiEndpoint,
    },
    {
      provide: HTTP_INTERCEPTORS,
      multi: true,
      useClass: HttpLanguageInterceptor,
    },
    {
      provide: GRPC_INTERCEPTORS,
      multi: true,
      useClass: GrpcAuthInterceptor,
    },
    {
      provide: GRPC_INTERCEPTORS,
      multi: true,
      useClass: GrpcTenantInterceptor,
    },
    {
      provide: FORMFIELD_DEFAULT_OPTIONS,
      useValue: { optionalText: 'optional' },
    },
    {
      provide: COLLECTION_MESSAGES_SERVICE_TOKEN,
      useExisting: CollectionService,
    },
    {
      provide: DOMAIN_OF_INFLUENCE_SERVICE_TOKEN,
      useExisting: DomainOfInfluenceService,
    },
    {
      provide: AUTHENTICATION_SERVICE_TOKEN,
      useExisting: AuthenticationAdapterService,
    },
  ],
}).catch(err => console.error(err));
