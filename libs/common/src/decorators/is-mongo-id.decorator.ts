import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { MONGO_ID_REGEX } from '../constants';

/**
 * Decorator để validate MongoDB ObjectId
 * Sử dụng trong DTO: @IsMongoId() id: string
 */
export function IsMongoId(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isMongoId',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: propertyName + ' must be a valid MongoDB ObjectId',
        ...validationOptions
      },
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }
          return MONGO_ID_REGEX.test(value);
        },
      },
    });
  };
}
