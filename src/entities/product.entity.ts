import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { ExchangeRateHeader } from './exchangeRateHeader.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'float' })
  price: number;

  @Column()
  originalCurrency: string;

  @Column({ type: 'date' })
  expirationDate: Date;

  @ManyToOne(() => ExchangeRateHeader, (exchangeRateHeader) => exchangeRateHeader.products)
  @JoinColumn({ name: 'idExchangeRateHeader' })
  exchangeRateHeader: ExchangeRateHeader;
}