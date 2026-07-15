import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UserRole } from '@marketverse/shared';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create category (admin)' })
  async create(@Body() dto: CreateCategoryDto) {
    return { success: true, data: await this.categoriesService.create(dto) };
  }

  @Get()
  @ApiOperation({ summary: 'List all categories' })
  async findAll() {
    return { success: true, data: await this.categoriesService.findAll() };
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get category by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return { success: true, data: await this.categoriesService.findBySlug(slug) };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category (admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return { success: true, data: await this.categoriesService.update(id, dto) };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete category (admin)' })
  async remove(@Param('id') id: string) {
    await this.categoriesService.remove(id);
    return { success: true };
  }
}
