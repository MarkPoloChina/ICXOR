import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Illust } from './illust.entities'

@Entity()
@Index(['pid', 'page'], { unique: true })
export class Meta {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number

  @Column({ type: 'int', nullable: false })
  pid: number

  @Column({ type: 'int', nullable: false })
  page: number

  @Column({ type: 'varchar', nullable: true })
  type: string

  @Column({ type: 'varchar', nullable: true, length: 45 })
  author: string

  @Column({ type: 'int', nullable: true })
  author_id: number

  @Column({ type: 'varchar', nullable: true, length: 128 })
  title: string

  @Column({ type: 'varchar', nullable: true, length: 45 })
  limit: string

  @Column({ type: 'int', nullable: true })
  book_cnt: number

  @Column({ type: 'int', nullable: true })
  width: number

  @Column({ type: 'int', nullable: true })
  height: number

  @Column({ type: 'varchar', nullable: true })
  tags_str: string

  @OneToOne(() => Illust, illust => illust.meta, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  illust: Illust

  @Column({ type: 'varchar', nullable: true, length: 512 })
  original_url: string
}
