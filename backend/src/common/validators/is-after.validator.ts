import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string') {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function IsAfter(
  property: string,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (target: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'isAfter',
      target: target.constructor,
      propertyName: propertyName.toString(),
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const [relatedPropertyName] = args.constraints as [string];
          const currentDate = parseDate(value);
          const relatedDate = parseDate(
            (args.object as Record<string, unknown>)[relatedPropertyName],
          );

          if (!currentDate || !relatedDate) {
            return false;
          }

          return currentDate.getTime() > relatedDate.getTime();
        },
        defaultMessage(args: ValidationArguments): string {
          const [relatedPropertyName] = args.constraints as [string];
          return `${args.property} must be after ${relatedPropertyName}`;
        },
      },
    });
  };
}
