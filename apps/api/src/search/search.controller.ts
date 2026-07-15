import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('products')
  @ApiOperation({ summary: 'Smart product search' })
  async searchProducts(
    @Query('q') query: string,
    @Query('categoryId') categoryId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const filters: Record<string, unknown> = { categoryId, vendorId, page: parseInt(page, 10), limit: parseInt(limit, 10) };
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    return { success: true, data: await this.searchService.searchProducts(query, filters) };
  }
}
