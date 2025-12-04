/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { Role } from '../roles.model';
import { AuthorizationService } from '@abraxas/base-components';

@Directive({
  selector: '[appHasAnyRole],[appHasRole]',
})
export class HasAnyRoleDirective {
  private readonly templateRef = inject<TemplateRef<any>>(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authorization = inject(AuthorizationService);

  private _roles: Role[] | null = null;
  private hasView = false;

  @Input('appHasAnyRole')
  public set roles(roles: Role[]) {
    this._roles = roles;
    this.updateView();
  }

  @Input('appHasRole')
  public set role(role: Role) {
    this.roles = [role];
  }

  private async updateView() {
    if (!this._roles) {
      this.viewContainer.clear();
      this.hasView = false;
      return;
    }

    const roleChecks = await Promise.all(this._roles.map(role => this.authorization.hasRoleAwaitAuth(role)));
    const hasRole = roleChecks.some(x => x);
    if (hasRole && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasRole && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
