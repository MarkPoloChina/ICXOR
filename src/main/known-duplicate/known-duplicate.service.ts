import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PixivTwitter } from './entities/pixiv-twitter.entities'

@Injectable()
export class KnownDuplicateService {
  constructor(
    @InjectRepository(PixivTwitter)
    private readonly pixivTwitterRepository: Repository<PixivTwitter>,
  ) {}

  async getDuplicateByPixivId(pixiv_id: string) {
    const result = await this.pixivTwitterRepository.findOneBy({ pixiv_id })
    if (result)
      return { target: result.twitter_status_id }
  }

  async getDuplicateByTwitterStatusId(twitter_status_id: string) {
    const result = await this.pixivTwitterRepository.findOneBy({ twitter_status_id })
    if (result)
      return { target: result.pixiv_id }
  }

  async addDuplicate(pixiv_id: string, twitter_status_id: string) {
    const targetDuplicate = await this.pixivTwitterRepository.findOneBy(
      { twitter_status_id },
    ) || this.pixivTwitterRepository.create({ twitter_status_id })
    targetDuplicate.pixiv_id = pixiv_id
    await this.pixivTwitterRepository.save(targetDuplicate)
  }
}
