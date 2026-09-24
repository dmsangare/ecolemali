import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class OpenCashSessionDto {
  @IsNumber()
  @Min(0)
  openingBalance!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
