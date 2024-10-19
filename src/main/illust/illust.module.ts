import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Illust } from './entities/illust.entities'
import { Meta } from './entities/meta.entities'
import { Poly } from './entities/poly.entities'
import { RemoteBase } from './entities/remote_base.entities'
import { Tag } from './entities/tag.entities'
import { IllustController } from './illust.controller'
import { DatabaseInitializerService } from './illust.init.service'
import { IllustService } from './illust.service'

@Module({
  imports: [TypeOrmModule.forFeature([Illust, Meta, Poly, RemoteBase, Tag])],
  providers: [DatabaseInitializerService, IllustService, Illust, Meta, Poly, RemoteBase, Tag],
  controllers: [IllustController],
})
export class IllustModule {}
