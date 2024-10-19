import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PixivTwitter } from './entities/pixiv-twitter.entities'
import { KnownDuplicateController } from './known-duplicate.controller'
import { KnownDuplicateService } from './known-duplicate.service'

@Module({
  imports: [TypeOrmModule.forFeature([PixivTwitter])],
  providers: [KnownDuplicateService, PixivTwitter],
  controllers: [KnownDuplicateController],
})
export class KnownDuplicateModule {}
