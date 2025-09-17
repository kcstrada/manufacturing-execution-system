import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { VALIDATION_CONSTANTS } from '../validation.config';

@ValidatorConstraint({ name: 'isLotNumber', async: false })
export class IsLotNumberConstraint implements ValidatorConstraintInterface {
  validate(value: any, _args: ValidationArguments) {
    if (typeof value !== 'string') return false;
    return VALIDATION_CONSTANTS.PATTERNS.LOT_NUMBER.test(value);
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a valid lot number (uppercase letters, numbers, and hyphens only)`;
  }
}

/**
 * Validates that a string is a valid lot number
 */
export function IsLotNumber(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isLotNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsLotNumberConstraint,
    });
  };
}
