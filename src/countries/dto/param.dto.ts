import { IsAlpha, IsString, Length } from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';

export class CountryCodeParam {
  @IsString()
  @Length(2, 2, { message: 'Country code must be exactly 2 char' })
  @IsAlpha()
  @Transform(({ value }: TransformFnParams): string => {
    if (typeof value === 'string') {
      return value.toUpperCase();
    }

    return String(value || '');
  })
  countryCode: string;
}
