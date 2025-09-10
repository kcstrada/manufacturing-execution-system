import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { VALIDATION_CONSTANTS } from '../validation.config';

@ValidatorConstraint({ name: 'isBarcode', async: false })
export class IsBarcodeConstraint implements ValidatorConstraintInterface {
  validate(value: any, _args: ValidationArguments) {
    if (typeof value !== 'string') return false;
    
    // Check if it's a valid barcode format (numeric only)
    if (!VALIDATION_CONSTANTS.PATTERNS.BARCODE.test(value)) {
      return false;
    }
    
    // Validate common barcode lengths
    const validLengths = [8, 12, 13, 14]; // EAN-8, UPC-A, EAN-13, GTIN-14
    return validLengths.includes(value.length);
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a valid barcode (8, 12, 13, or 14 numeric digits)`;
  }
}

/**
 * Validates that a string is a valid barcode
 */
export function IsBarcode(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isBarcode',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsBarcodeConstraint,
    });
  };
}