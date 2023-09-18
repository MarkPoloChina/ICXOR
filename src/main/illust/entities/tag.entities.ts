import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Illust } from './illust.entities'

@Entity()
export class Tag {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number

  @Column({ type: 'varchar', nullable: false })
  type: string

  @Column({ type: 'varchar', nullable: false })
  name: string

  @ManyToMany(() => Illust, illust => illust.tag)
  @JoinTable()
  illusts: Illust[]
}
