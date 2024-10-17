import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Illust } from './illust.entities'

@Entity()
export class Poly {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number

  @Column({ type: 'varchar', nullable: false })
  type: string

  @Column({ type: 'varchar', nullable: false })
  name: string

  @Column({ type: 'varchar', nullable: true })
  parent: string

  @Column({ type: 'varchar', nullable: true })
  remote_base: string

  @Column({ type: 'varchar', nullable: true })
  remote2x_base: string

  @ManyToMany(() => Illust, illust => illust.poly, {
    onDelete: 'CASCADE',
  })
  @JoinTable()
  illusts: Illust[]
}
