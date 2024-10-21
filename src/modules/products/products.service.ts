import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as csv from 'csv-parser';
import * as fs from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { ExchangeRateHeader } from '../../entities/exchangeRateHeader.entity';
import { ExchangeRateDetail } from '../../entities/exchangeRateDetail.entity';
import axios from 'axios';

@Injectable()
export class ProductsService {
  private originalCurrencyShortName = 'USD'
  private currencies = ['EUR', 'GBP', 'JPY', 'AUD', 'PEN']
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ExchangeRateHeader)
    private exchangeRateHeaderRepository: Repository<ExchangeRateHeader>,
    @InjectRepository(ExchangeRateDetail)
    private exchangeRateDetailRepository: Repository<ExchangeRateDetail>,
    
  ) {}

  async processCSV(filePath: string): Promise<any> {
    const BATCH_SIZE = 1000;
    const originalCurrencySymbol = '$';
    const products = [];
    const errors = [];
    const exchangeRateHeader = await this.getExchangeRates(); // method to get exchange rates    
    let count = 0;
    let batchNumber = 1;

    return new Promise((resolve, reject) => {
        const stream = fs.createReadStream(filePath)
            .pipe(csv({ separator: ';' }))
            .on('data', async (row) => {
                count++;
                try {
                    // Validaciones
                    if (!row.name || !row.price || !row.expiration) {
                        throw new Error('Missing required fields');
                    }

                    const price = parseFloat(row.price.replace(originalCurrencySymbol, ''));
                    if (isNaN(price)) {
                        throw new Error('Invalid price format');
                    }

                    const expiration = new Date(row.expiration);
                    if (isNaN(expiration.getTime())) {
                        throw new Error('Invalid expiration date');
                    }

                    const product = {
                        name: row.name,
                        price,
                        originalCurrency: this.originalCurrencyShortName,
                        expiration,
                        exchangeRateHeader
                    };

                    products.push(product);

                    // If we reach the batch size, we insert into the database
                    if (products.length === BATCH_SIZE) {
                        stream.pause(); // Pause the stream to insert data
                        await this.productRepository.save(products);
                        products.length = 0; 
                        batchNumber++; // Increment batch number
                        stream.resume(); // resume the stream
                    }

                } catch (error) {
                    errors.push({
                        batch: batchNumber,
                        row: count,
                        error: error.message,
                        data: row
                    });
                }
            })
            .on('end', async () => {
                // Insert rest rows at the end
                if (products.length > 0) {
                    await this.productRepository.save(products);
                }

                // Log errors to a file
                if (errors.length > 0) {
                    const errorLogStream = fs.createWriteStream('error-log.txt', { flags: 'a' });
                    errors.forEach(err => {
                        errorLogStream.write(`Batch: ${err.batch}, Row: ${err.row}, Error: ${err.error}, Data: ${JSON.stringify(err.data)}\n`);
                    });
                    errorLogStream.end();
                }

                console.log(`File processed successfully. Total rows: ${count}, Errors: ${errors.length}`);
                resolve(`File processed successfully. Total rows: ${count}, Errors: ${errors.length}`);
            })
            .on('error', (error) => {
                console.log('Error processing CSV file:', error);
                reject(new HttpException('Error processing CSV file:', HttpStatus.INTERNAL_SERVER_ERROR));
            });
    });
}


  async getExchangeRates(): Promise<any> {
    const baseCurrency = this.originalCurrencyShortName
    const currencies = this.currencies

    const exchangeApiUrl = 'https://v6.exchangerate-api.com/v6';
    const apiKey = '5348654631b94573e7c09a23';

    try {
      const loadDate = new Date();

      const url = `${exchangeApiUrl}/${apiKey}/latest/${baseCurrency}`;

      const response = await axios.get(url);
      const exchangeRates = []

      // Filtering only the currencies that interest us
        const filteredRates = Object.keys(response.data.conversion_rates)
        .filter(currency => currencies.includes(currency))
        .reduce((obj, currency) => {
          obj[currency] = response.data.conversion_rates[currency];
          return obj;
        }, {});

      // Crear el registro en ExchangeRateHeader
      const exchangeRateHeader = this.exchangeRateHeaderRepository.create({
        loadDate,
      });
      
      // Guardar el ExchangeRateHeader en la base de datos
      const savedHeader = await this.exchangeRateHeaderRepository.save(exchangeRateHeader);

      // Crear los registros de ExchangeRateDetail
      const exchangeRateDetails = currencies.map(currency => {
        return this.exchangeRateDetailRepository.create({
          currency,
          rate: filteredRates[currency],
          exchangeRateHeader: savedHeader, 
        });
      });

      // Guardar los ExchangeRateDetails en la base de datos
      await this.exchangeRateDetailRepository.save(exchangeRateDetails);

      console.log('Exchange rates filtered:', filteredRates);
      console.log('Exchange rates saved:', exchangeRateDetails);

      return savedHeader;

    } catch (error) {
      console.log('Error getting exchange rates:', error);

      throw new HttpException(
        'Error fetching exchange rates',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getProducts(
    name?: string, 
    price?: number, 
    expiration?: string, 
    page: number = 1, 
    pageSize: number = 20,
    order: 'ASC' | 'DESC' = 'ASC',
    orderBy: 'name' | 'price' | 'expiration' = 'name'
  ): Promise<any> {
    // Create query builder to fetch products and join related tables
    const query = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.exchangeRateHeader', 'exchangeRateHeader')
      .leftJoinAndSelect('exchangeRateHeader.exchangeRateDetails', 'exchangeRateDetails');
  
    // Apply filters if provided
    if (name) {
      query.andWhere('UPPER(product.name) LIKE UPPER(:name)', { name: `%${name}%` });
    }
    if (price) {
      query.andWhere('product.price = :price', { price });
    }
    if (expiration) {
      query.andWhere('product.expiration = :expiration', { expiration: new Date(expiration) });
    }
  
    // Implement pagination
    const skip = (page - 1) * pageSize; 
    query.skip(skip).take(pageSize);    

    // Apply ordering
    const orderByField = 'product.'+ orderBy.toString()
    query.orderBy( orderByField , order); 
  
    // Fetch paginated products
    const [products, total] = await query.getManyAndCount(); // Get total count of records as well
  
    // Calculate the converted price for each exchange rate detail
    const productsWithConvertedPrices = products.map((product) => {
      // Check if the product has exchange rate details
      if (product.exchangeRateHeader && product.exchangeRateHeader.exchangeRateDetails) {
        product.exchangeRateHeader.exchangeRateDetails = product.exchangeRateHeader.exchangeRateDetails.map((exchangeRateDetail) => {
          // Calculate the converted price based on the rate
          const convertedPrice = product.price * exchangeRateDetail.rate;
          return {
            ...exchangeRateDetail,
            convertedPrice, 
          };
        });
      }
      return product;
    });
  
    // Return the paginated result with total count and current page data
    return {
      total, 
      page, 
      pageSize, 
      products: productsWithConvertedPrices, 
    };
  }
  
  
}