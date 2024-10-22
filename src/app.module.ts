import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductsModule } from './modules/products/products.module';
import { ExchangeRateDetail } from './entities/exchangeRateDetail.entity';
import { ExchangeRateHeader } from './entities/exchangeRateHeader.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',  
      port: 5432,
      username: 'postgres',
      password: 'root',
      database: 'flatiron',
      entities: [Product, ExchangeRateHeader, ExchangeRateDetail],
      dropSchema: false,
      synchronize:false,
      migrations: ['src/migrations/*.ts'], 
    }),
    TypeOrmModule.forFeature(
      [Product, ExchangeRateHeader, ExchangeRateDetail]
    ),
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
