import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Meta } from '../illust/entities/meta.entities'
import { Illust } from '../illust/entities/illust.entities'
import { PixivApiController } from './pixiv-api.controller'
import { PixivApiService } from './pixiv-api.service'

@Module({
  imports: [TypeOrmModule.forFeature([Meta, Illust])],
  providers: [PixivApiService, Meta, Illust],
  controllers: [PixivApiController],
})
export class PixivApiModule {}
