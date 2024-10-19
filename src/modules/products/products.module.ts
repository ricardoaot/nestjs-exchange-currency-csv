import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { ExchangeRate } from '../exchange-rates/exchange-rate.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [Product, ExchangeRate]
    )
  ],
  controllers: [ProductsController],
  providers: [ProductsService]
})
export class ProductsModule {}
