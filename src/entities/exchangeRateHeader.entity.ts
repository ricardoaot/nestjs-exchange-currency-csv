import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ExchangeRateDetail } from './exchangeRateDetail.entity';
import { Product } from './product.entity';

@Entity()
export class ExchangeRateHeader {
  @PrimaryGeneratedColumn()
  idExchangeRateHeader: number;

  @Column({ type: 'date' })
  loadDate: Date;
  
  @OneToMany(() => Product, (product) => product.exchangeRateHeader)
  products: Product[];
  
  @OneToMany(() => ExchangeRateDetail, (detail) => detail.exchangeRateHeader)
  exchangeRateDetails: ExchangeRateDetail[];
}