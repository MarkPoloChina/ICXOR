import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
@Index(['pixiv_id', 'twitter_status_id'], { unique: true })
export class PixivTwitter {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number

  @Column({ type: 'varchar', nullable: false })
  pixiv_id: string

  @Column({ type: 'varchar', nullable: false })
  twitter_status_id: string
}
