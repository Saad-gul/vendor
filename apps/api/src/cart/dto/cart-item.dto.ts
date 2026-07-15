import { IsUUID, IsInt, Min, IsString } from 'class-validator';

export class AddToCartDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity = 1;
}

export class UpdateCartItemDto {
  @IsInt()
  @Min(0)
  quantity!: number;
}

export class ApplyCouponDto {
  @IsString()
  code!: string;
}
