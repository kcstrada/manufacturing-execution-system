import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { VALIDATION_CONSTANTS } from '../validation.config';

@ValidatorConstraint({ name: 'isPercentage', async: false })
export class IsPercentageConstraint implements ValidatorConstraintInterface {
  validate(value: any, _args: ValidationArguments) {
    if (typeof value !== 'number') return false;
    return (
      value >= VALIDATION_CONSTANTS.MIN_PERCENTAGE &&
      value <= VALIDATION_CONSTANTS.MAX_PERCENTAGE
    );
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a valid percentage between 0 and 100`;
  }
}

/**
 * Validates that a number is a valid percentage (0-100)
 */
export function IsPercentage(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPercentage',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsPercentageConstraint,
    });
  };
}
