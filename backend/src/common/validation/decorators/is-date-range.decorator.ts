import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isDateRange', async: false })
export class IsDateRangeConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as any;
    const [relatedPropertyName] = args.constraints;
    const relatedValue = object[relatedPropertyName];

    if (!value || !relatedValue) {
      return true; // Let other validators handle required validation
    }

    const startDate = new Date(value);
    const endDate = new Date(relatedValue);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return false;
    }

    return startDate <= endDate;
  }

  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    return `${args.property} must be before or equal to ${relatedPropertyName}`;
  }
}

/**
 * Validates that a date is within a valid range relative to another date property
 */
export function IsDateRange(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isDateRange',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: IsDateRangeConstraint,
    });
  };
}
