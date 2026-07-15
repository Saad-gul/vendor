import { IsObject } from 'class-validator';

export class ShippingAddressDto {
  street!: string;
  city!: string;
  state!: string;
  zip!: string;
  country!: string;
  phone?: string;
}

export class CreateOrderDto {
  @IsObject()
  shippingAddress!: ShippingAddressDto;
}
