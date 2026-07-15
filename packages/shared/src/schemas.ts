import { UserRole, OrderStatus, PaymentStatus, ProductStatus } from './types';

export const isValidRole = (value: unknown): value is UserRole =>
  typeof value === 'string' && Object.values(UserRole).includes(value as UserRole);

export const isValidProductStatus = (value: unknown): value is ProductStatus =>
  typeof value === 'string' && Object.values(ProductStatus).includes(value as ProductStatus);

export const isValidOrderStatus = (value: unknown): value is OrderStatus =>
  typeof value === 'string' && Object.values(OrderStatus).includes(value as OrderStatus);

export const isValidPaymentStatus = (value: unknown): value is PaymentStatus =>
  typeof value === 'string' && Object.values(PaymentStatus).includes(value as PaymentStatus);

export const generateSlug = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
