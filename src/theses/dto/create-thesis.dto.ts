import { IsEnum, IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { ThesisVisibility } from '../thesis.entity.js';

export class CreateThesisDto {
  @IsString()
  @MinLength(5)
  title: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ThesisVisibility)
  @IsOptional()
  visibility?: ThesisVisibility;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  currentConfidence?: number;

  @IsString()
  @IsOptional()
  originalAuthor?: string;

  @IsString()
  @IsOptional()
  originalSource?: string;
}
