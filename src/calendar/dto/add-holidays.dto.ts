import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsAlpha,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class AddHolidaysDto {
  @IsString()
  @Length(2, 2, { message: 'Country code must be exactly 2 chars' })
  @IsAlpha()
  @Transform(({ value }: TransformFnParams): string => {
    if (typeof value !== 'string') {
      return '';
    }
    return value.toUpperCase();
  })
  countryCode: string;

  @IsInt()
  @Min(2000, { message: 'Year to be at least 2000' })
  @Max(2050, { message: 'Year to be at most 2050' })
  year: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  holidays?: string[];
}
