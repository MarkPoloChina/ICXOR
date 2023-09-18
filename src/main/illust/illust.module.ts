import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Illust } from './entities/illust.entities'
import { IllustController } from './illust.controller'
import { IllustService } from './illust.service'
import { Meta } from './entities/meta.entities'
import { Poly } from './entities/poly.entities'
import { RemoteBase } from './entities/remote_base.entities'
import { Tag } from './entities/tag.entities'
import { IllustToday } from './entities/illust_today.entities'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Illust,
      Meta,
      Poly,
      RemoteBase,
      Tag,
      IllustToday,
    ]),
  ],
  providers: [IllustService, Illust, Meta, Poly, RemoteBase, Tag, IllustToday],
  controllers: [IllustController],
})
export class IllustModule {}
