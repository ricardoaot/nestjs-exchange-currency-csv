import { Column, Entity, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { ExchangeRateHeader } from './exchangeRateHeader.entity';


@Entity()
export class ExchangeRateDetail {
  @PrimaryGeneratedColumn()
  idExchangeRateDetail: number;

  @Column()
  currency: string;

  @Column({ type: 'float' })
  rate: number;

  @ManyToOne(() => ExchangeRateHeader, (header) => header.exchangeRateDetails)
  @JoinColumn({ name: 'idExchangeRateHeader' }) // Define la columna de clave foránea
  exchangeRateHeader: ExchangeRateHeader;
  
}