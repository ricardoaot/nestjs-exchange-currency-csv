import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as csv from 'csv-parser';
import * as fs from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { ExchangeRate } from '../exchange-rates/exchange-rate.entity';
import axios from 'axios';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ExchangeRate)
    private exchangeRateRepository: Repository<ExchangeRate>,
  ) {}

  async processCSV(filePath: string): Promise<any> {
    const originalCurrencyShortName = 'USD'
    const originalCurrencySymbol = '$'
    const currencies = ['EUR', 'GBP', 'JPY', 'AUD', 'PEN']
    const products = [];
    const exchangeRates = await this.getExchangeRates(originalCurrencyShortName, currencies); // method to get exchange rates    
    

    return new Promise((resolve, reject) => {

      fs.createReadStream(filePath)
        .pipe(csv({ separator: ';' }))
        .on('data', async (row) => {
          const product = this.productRepository.create({
            name: row.name,
            price: parseFloat(row.price.replace(originalCurrencySymbol, '')),
            originalCurrency: originalCurrencyShortName,
            expiration: new Date(row.expiration),
          });
          await this.productRepository.save(product);

          // Save exchange rates for each product
          for (const currency of Object.keys(exchangeRates)) {
            const rate = exchangeRates[currency];
            const exchangeRate = this.exchangeRateRepository.create({
              product,
              currency,
              rate,
              timestamp: new Date(),
            });
            await this.exchangeRateRepository.save(exchangeRate);
          }

          products.push(product);
        })
        .on('end', () => {
          resolve(products);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  async getExchangeRates(baseCurrency: string, currencies: string[]): Promise<any> {
    const exchangeApiUrl = 'https://v6.exchangerate-api.com/v6';
    const apiKey = '5348654631b94573e7c09a23';

    try {
      const url = `${exchangeApiUrl}/${apiKey}/latest/${baseCurrency}`;

      const response = await axios.get(url);

      // Filtering only the currencies that interest us
      const filteredRates = Object.keys(response.data.conversion_rates)
        .filter(currency => currencies.includes(currency))
        .reduce((obj, currency) => {
          obj[currency] = response.data.conversion_rates[currency];
          return obj;
        }, {});

      console.log('Exchange rates obtained:', filteredRates);

      return filteredRates;
    } catch (error) {
      console.log('Error getting exchange rates:', error);

      // Manejamos cualquier error que ocurra durante la solicitud
      throw new HttpException(
        'Error fetching exchange rates',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getProducts(name?: string, price?: number, expiration?: string) {
    const query = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.exchangeRates', 'exchangeRate');
    
    if (name) {
      query.andWhere('product.name LIKE :name', { name: `%${name}%` });
    }
    if (price) {
      query.andWhere('product.price = :price', { price });
    }
    if (expiration) {
      query.andWhere('product.expiration = :expiration', { expiration: new Date(expiration) });
    }

    return query.getMany();
  }
}