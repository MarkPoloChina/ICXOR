import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PixivTwitter } from './entities/pixiv-twitter.entities'
import { KnownDuplicateService } from './known-duplicate.service'
import { KnownDuplicateController } from './known-duplicate.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PixivTwitter,
    ]),
  ],
  providers: [KnownDuplicateService, PixivTwitter],
  controllers: [KnownDuplicateController],
})
export class KnownDuplicateModule {}
