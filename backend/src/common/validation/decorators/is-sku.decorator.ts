import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { VALIDATION_CONSTANTS } from '../validation.config';

@ValidatorConstraint({ name: 'isSku', async: false })
export class IsSkuConstraint implements ValidatorConstraintInterface {
  validate(value: any, _args: ValidationArguments) {
    if (typeof value !== 'string') return false;
    return VALIDATION_CONSTANTS.PATTERNS.SKU.test(value);
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a valid SKU (uppercase letters, numbers, and hyphens only)`;
  }
}

/**
 * Validates that a string is a valid SKU
 */
export function IsSku(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isSku',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsSkuConstraint,
    });
  };
}