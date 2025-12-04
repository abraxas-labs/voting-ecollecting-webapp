/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import {
  ValidationResult as ValidationResultProto,
  ValidationSummary as ValidationSummaryProto,
} from '@abraxas/voting-ecollecting-proto/citizen';
import { Validation } from '@abraxas/voting-ecollecting-proto';

export { ValidationSummaryProto, ValidationResultProto };

export interface ValidationSummary {
  validationResults: ValidationResult[];
  isValid: boolean;
}

export interface ValidationResult {
  validation: Validation;
  isValid: boolean;
}

export function mapValidationSummaryToModel(validationSummaryProto: ValidationSummaryProto): ValidationSummary {
  return {
    ...validationSummaryProto.toObject(),
    validationResults: validationSummaryProto.validationResults?.map(x => mapValidationResultToModel(x)) ?? [],
  } as ValidationSummary;
}

export function mapValidationResultToModel(validationResultProto: ValidationResultProto): ValidationResult {
  return {
    ...validationResultProto.toObject(),
  } as ValidationResult;
}
