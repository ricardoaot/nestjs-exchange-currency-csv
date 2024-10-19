import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ExchangeRate } from '../exchange-rates/exchange-rate.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  originalCurrency: string;

  @Column()
  expiration: Date;

  @OneToMany(() => ExchangeRate, (exchangeRate) => exchangeRate.product)
  exchangeRates: ExchangeRate[];
}