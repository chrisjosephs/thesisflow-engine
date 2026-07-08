import {
  IsArray, IsBoolean, IsDateString, IsEnum, IsNumber,
  IsOptional, IsString, Max, Min, MinLength, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ThesisVisibility } from '../thesis.entity.js';
import { CreateCriterionDto } from './create-criterion.dto.js';

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
  authorStatedConfidence?: number;

  @IsString()
  @IsOptional()
  originalAuthor?: string;

  @IsString()
  @IsOptional()
  originalSource?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @IsString()
  @IsOptional()
  resolution?: string;

  @IsString()
  @IsOptional()
  monitoringProfileName?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCriterionDto)
  @IsOptional()
  criteria?: CreateCriterionDto[];

  // If true, thesis is published immediately (DRAFT → ACTIVE)
  @IsBoolean()
  @IsOptional()
  publish?: boolean;
}
