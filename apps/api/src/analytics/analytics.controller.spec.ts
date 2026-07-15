import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  const mockService = {
    getPlatformAnalytics: jest.fn().mockResolvedValue({ totalUsers: 1 }),
    getVendorAnalytics: jest.fn().mockResolvedValue({ totalOrders: 1 }),
    getMonthlySales: jest.fn().mockResolvedValue([{ month: '2024-01', revenue: 100, orders: 1 }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [{ provide: AnalyticsService, useValue: mockService }],
    }).compile();
    controller = module.get<AnalyticsController>(AnalyticsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return platform analytics', async () => {
    const result = await controller.platform();
    expect(result.success).toBe(true);
    expect((result as any).data.totalUsers).toBe(1);
  });

  it('should return vendor analytics', async () => {
    const result = await controller.vendor('vendor-1');
    expect(result.success).toBe(true);
    expect((result as any).data.totalOrders).toBe(1);
  });
});
