/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Output, inject } from '@angular/core';
import { ButtonModule, FilterModule, FilterOperation, FilterOperationId, TextModule } from '@abraxas/base-components';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { PersonFilterData } from '../../../core/models/person.model';
import { InputValidators } from '@abraxas/voting-lib';

@Component({
  selector: 'app-signature-sheet-person-search',
  imports: [TextModule, FilterModule, TranslatePipe, ButtonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './signature-sheet-person-search.component.html',
  styleUrl: './signature-sheet-person-search.component.scss',
})
export class SignatureSheetPersonSearchComponent {
  public readonly i18n = inject(TranslateService);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected readonly filterOperationIds = FilterOperationId;
  protected readonly textFilterOperations: FilterOperation[];
  protected readonly dateFilterOperations: FilterOperation[];
  protected readonly form: FormGroup<Form>;

  @Output()
  public filter: EventEmitter<PersonFilterData> = new EventEmitter<PersonFilterData>();

  @Output()
  public searchReset: EventEmitter<void> = new EventEmitter<void>();

  constructor() {
    this.form = this.buildForm();
    this.textFilterOperations = [
      {
        id: FilterOperationId.STARTS_WITH,
        icon: 'starts-with',
        label: this.i18n.instant('COLLECTION.SIGNATURE_SHEETS.DETAIL.FILTER_STARTS_WITH'),
      },
    ];
    this.dateFilterOperations = [
      {
        id: FilterOperationId.EQUALS,
        icon: 'equals',
        label: this.i18n.instant('COLLECTION.SIGNATURE_SHEETS.DETAIL.EQUALS'),
      },
    ];
  }

  public reset(): void {
    this.form.reset();
    this.searchReset.emit();
  }

  protected onSearch(): void {
    if (this.form.valid) {
      const data: PersonFilterData = this.form.value as Required<typeof this.form.value>;
      if (!data.dateOfBirth) {
        // remove null property
        delete data.dateOfBirth;
      } else {
        // ensure date of birth is a date
        data.dateOfBirth = new Date(data.dateOfBirth);
      }

      this.filter.emit(data);
    }
  }

  private buildForm(): FormGroup<Form> {
    return this.formBuilder.group<Form>(
      {
        officialName: this.formBuilder.control('', {
          validators: [Validators.minLength(2), Validators.maxLength(100), InputValidators.complexSlText],
        }),
        firstName: this.formBuilder.control('', {
          validators: [Validators.minLength(2), Validators.maxLength(100), InputValidators.complexSlText],
        }),
        dateOfBirth: this.formBuilder.control(undefined),
        residenceAddressStreet: this.formBuilder.control('', {
          validators: [Validators.minLength(2), Validators.maxLength(150), InputValidators.complexSlText],
        }),
        residenceAddressHouseNumber: this.formBuilder.control('', {
          validators: [Validators.maxLength(150), InputValidators.complexSlText],
        }),
      },
      {
        validators: [this.requireAtLeastOne()],
      },
    );
  }

  private requireAtLeastOne(): ValidatorFn {
    return (): ValidationErrors | null => {
      const hasValue =
        this.form?.value.firstName ||
        this.form?.value.officialName ||
        this.form?.value.residenceAddressStreet ||
        this.form?.value.residenceAddressHouseNumber;
      return hasValue ? null : { requireOne: true };
    };
  }
}

interface Form {
  officialName: FormControl<string>;
  firstName: FormControl<string>;
  dateOfBirth: FormControl<Date | undefined>;
  residenceAddressStreet: FormControl<string>;
  residenceAddressHouseNumber: FormControl<string>;
}
