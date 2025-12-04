/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject } from '@angular/core';
import {
  AlertBarModule,
  ButtonModule,
  DropdownModule,
  LinkModule,
  RadioButton,
  RadioButtonModule,
  SpinnerModule,
  TextareaModule,
  TextModule,
} from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { AsyncInputValidators, EnumItemDescription, InputValidators, VotingLibModule } from '@abraxas/voting-lib';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EnumItemDescriptionUtils } from 'ecollecting-lib';
import { AccessibilityCategory, AccessibilitySalutation } from '@abraxas/voting-ecollecting-proto/citizen';
import { AccessibilityService } from '../../services/accessibility.service';

@Component({
  selector: 'app-accessibility-page',
  templateUrl: './accessibility-page.component.html',
  styleUrl: './accessibility-page.component.scss',
  imports: [
    SpinnerModule,
    TranslatePipe,
    VotingLibModule,
    LinkModule,
    ReactiveFormsModule,
    RadioButtonModule,
    TextModule,
    DropdownModule,
    TextareaModule,
    ButtonModule,
    AlertBarModule,
  ],
})
export class AccessibilityPageComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly accessibilityService = inject(AccessibilityService);

  protected form!: FormGroup<Form>;
  protected readonly salutationChoices: RadioButton[];
  protected readonly categoryItems: EnumItemDescription<AccessibilityCategory>[];
  protected sending = false;
  protected sent = false;

  constructor() {
    const enumItemDescriptionUtils = inject(EnumItemDescriptionUtils);

    this.salutationChoices = enumItemDescriptionUtils
      .getArrayWithDescriptions<AccessibilitySalutation>(AccessibilitySalutation, 'ACCESSIBILITY.FORM.SALUTATION.')
      .map(item => ({
        value: item.value,
        displayText: item.description,
      }));
    this.categoryItems = enumItemDescriptionUtils.getArrayWithDescriptions<AccessibilityCategory>(
      AccessibilityCategory,
      'ACCESSIBILITY.FORM.CATEGORY.',
    );
    this.buildForm();
  }

  protected async send(): Promise<void> {
    const values = this.form.value as Required<typeof this.form.value>;
    try {
      this.sending = true;
      await this.accessibilityService.sendMessage(values);
      this.sent = true;
    } finally {
      this.sending = false;
    }
  }

  protected reset(): void {
    this.form.reset();
  }

  private buildForm(): void {
    this.form = this.formBuilder.group<Form>({
      salutation: this.formBuilder.control(undefined),
      firstName: this.formBuilder.control(undefined, {
        validators: [Validators.maxLength(100)],
        asyncValidators: [AsyncInputValidators.complexSlText],
      }),
      lastName: this.formBuilder.control(undefined, {
        validators: [Validators.maxLength(100)],
        asyncValidators: [AsyncInputValidators.complexSlText],
      }),
      email: this.formBuilder.control('', {
        validators: [Validators.maxLength(254), Validators.email],
      }),
      phone: this.formBuilder.control(undefined, {
        validators: [Validators.maxLength(254), InputValidators.phone],
      }),
      category: this.formBuilder.control(AccessibilityCategory.ACCESSIBILITY_CATEGORY_PROBLEM, {
        validators: [Validators.required],
      }),
      message: this.formBuilder.control('', {
        validators: [Validators.maxLength(1000), Validators.required],
        asyncValidators: [AsyncInputValidators.complexMlText],
      }),
    });
  }
}

interface Form {
  salutation: FormControl<AccessibilitySalutation | undefined>;
  firstName: FormControl<string | undefined>;
  lastName: FormControl<string | undefined>;
  email: FormControl<string>;
  phone: FormControl<string | undefined>;
  category: FormControl<AccessibilityCategory | undefined>;
  message: FormControl<string>;
}
