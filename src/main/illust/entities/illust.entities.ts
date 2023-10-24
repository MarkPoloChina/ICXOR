import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Meta } from './meta.entities'
import { Poly } from './poly.entities'
import { RemoteBase } from './remote_base.entities'
import { Tag } from './tag.entities'

@Entity()
export class Illust {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'int', nullable: false, default: 0 })
  star: number

  @Column({ type: 'varchar', nullable: true })
  link: string

  @Column({ type: 'varchar', nullable: true, unique: true })
  remote_endpoint: string

  @Column({ type: 'varchar', nullable: true, unique: true })
  thumb_endpoint: string

  @Column({ type: 'date', nullable: true })
  date: Date

  @ManyToMany(() => Poly, poly => poly.illusts, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  poly: Poly[]

  @ManyToMany(() => Tag, tag => tag.illusts, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  tag: Tag[]

  @OneToOne(() => Meta, meta => meta.illust, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  meta: Meta

  @ManyToOne(() => RemoteBase, remote_base => remote_base.illusts, {
    nullable: false,
  })
  remote_base: RemoteBase

  @UpdateDateColumn()
  updateDate: Date

  @CreateDateColumn()
  createDate: Date
}
