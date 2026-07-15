import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('product-description')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate AI product description' })
  async generateDescription(@Body() body: { name: string; category?: string; keywords?: string[] }) {
    return { success: true, data: await this.aiService.generateProductDescription(body) };
  }

  @Get('sales-insights')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get AI sales insights' })
  async salesInsights(@CurrentUser('vendorId') vendorId: string | undefined) {
    if (!vendorId) throw new Error('Vendor not found');
    return { success: true, data: await this.aiService.generateSalesInsights(vendorId) };
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get AI product recommendations' })
  async recommendations(@CurrentUser('sub') userId?: string) {
    return { success: true, data: await this.aiService.getRecommendations(userId) };
  }
}
