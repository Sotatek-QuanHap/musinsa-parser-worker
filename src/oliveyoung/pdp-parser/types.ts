import { IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ParsingConfigurations } from '../constants';

export class ProductDto {
  @IsString()
  productName: string;

  @IsString()
  productId: string;

  @IsString()
  category: string;

  @IsString()
  brandName: string;

  @IsString()
  sellerName: string;

  @IsNumber()
  @Type(() => Number)
  normalPrice: number;

  @IsNumber()
  @Type(() => Number)
  salePrice: number;

  @IsNumber()
  @Type(() => Number)
  finalPrice: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  couponPrice: number;

  @IsString()
  styleNumber: string;

  @IsNumber()
  @Type(() => Number)
  stock: number;
}

export interface UpdateConfigRequestPayload {
  type: 'update_config';
  value: ParsingConfigurations;
}

export interface ParserRequestPayload {
  productId: string;
  productHtml: string;
  extraInfoHtml: string;
}
