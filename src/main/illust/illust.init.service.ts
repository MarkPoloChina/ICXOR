import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { RemoteBase } from './entities/remote_base.entities'

@Injectable()
export class DatabaseInitializerService implements OnModuleInit {
  constructor(
    @InjectRepository(RemoteBase)
    private readonly remoteBaseRepository: Repository<RemoteBase>,
  ) {}

  async onModuleInit() {
    await this.ensurePixivExists()
  }

  async ensurePixivExists() {
    const existingPixiv = await this.remoteBaseRepository.findOne({
      where: { name: 'Pixiv' },
    })

    if (!existingPixiv) {
      const newPixiv = this.remoteBaseRepository.create({
        name: 'Pixiv',
        type: 'pixiv',
        origin_url: '',
        thum_url: '',
      })

      await this.remoteBaseRepository.save(newPixiv)
    }
  }
}
