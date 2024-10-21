import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from '../../entities/product.entity';
import { ExchangeRateDetail } from '../../entities/exchangeRateDetail.entity';
import { ExchangeRateHeader } from '../../entities/exchangeRateHeader.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [Product, ExchangeRateHeader, ExchangeRateDetail]
    )
  ],
  controllers: [ProductsController],
  providers: [ProductsService]
})
export class ProductsModule {}
