import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Product } from '../products/product.entity';

@Entity()
export class ExchangeRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  currency: string;

  @Column('decimal', { precision: 10, scale: 4 })
  rate: number;

  @Column()
  timestamp: Date;

  @ManyToOne(() => Product, (product) => product.exchangeRates)
  product: Product;
}