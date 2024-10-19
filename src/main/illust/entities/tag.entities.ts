import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Illust } from './illust.entities'

@Entity()
export class Tag {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number

  @Column({ type: 'varchar', nullable: false })
  type: string

  @Column({ type: 'varchar', nullable: false, unique: true })
  name: string

  @ManyToMany(() => Illust, illust => illust.tag, {
    onDelete: 'CASCADE',
  })
  @JoinTable()
  illusts: Illust[]
}
