import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { SearchModule } from '../search/search.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [SearchModule, NotificationsModule],
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
