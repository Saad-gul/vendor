import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  const mockProductsService = {
    findAll: jest.fn().mockResolvedValue({ data: [{ id: '1', name: 'Test' }], meta: { total: 1 } }),
    findBySlug: jest.fn().mockResolvedValue({ id: '1', name: 'Test' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: mockProductsService }],
    }).compile();
    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list products', async () => {
    const result = await controller.findAll({} as any);
    expect(result.success).toBe(true);
    expect((result as any).data.data.length).toBe(1);
    expect(mockProductsService.findAll).toHaveBeenCalled();
  });
});
