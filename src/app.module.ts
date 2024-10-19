import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './modules/products/product.entity';
import { ExchangeRate } from './modules/exchange-rates/exchange-rate.entity';
import { ProductsModule } from './modules/products/products.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',  
      port: 5432,
      username: 'postgres',
      password: 'root',
      database: 'flatiron',
      entities: [Product, ExchangeRate],
      synchronize: true, // Dev Env
      dropSchema: true,
    }),
    TypeOrmModule.forFeature([Product, ExchangeRate]),
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
