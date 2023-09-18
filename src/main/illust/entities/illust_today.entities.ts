import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Illust } from './illust.entities'

@Entity()
export class IllustToday {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number

  @Column({ type: 'date', nullable: false })
  date: Date

  @OneToOne(() => Illust)
  @JoinColumn()
  illust: Illust
}
