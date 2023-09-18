import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Illust } from './illust.entities'

@Entity()
export class RemoteBase {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number

  @Column({ type: 'varchar', nullable: false, default: '' })
  type: string

  @Column({ type: 'varchar', nullable: false, unique: true })
  name: string

  @Column({ type: 'varchar', nullable: false })
  origin_url: string

  @Column({ type: 'varchar', nullable: false })
  thum_url: string

  @OneToMany(() => Illust, illust => illust.remote_base)
  illusts: Illust[]
}
