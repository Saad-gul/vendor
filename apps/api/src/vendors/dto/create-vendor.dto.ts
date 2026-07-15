import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateVendorDto {
  @IsString()
  storeName!: string;

  @IsString()
  storeSlug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  banner?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;
}
