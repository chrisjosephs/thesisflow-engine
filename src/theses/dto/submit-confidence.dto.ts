import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class SubmitConfidenceDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  confidence: number;

  @IsString()
  @IsOptional()
  rationale?: string;
}
