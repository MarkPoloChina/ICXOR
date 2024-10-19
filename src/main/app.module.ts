import path from 'node:path'
import { ElectronModule } from '@doubleshot/nest-electron'
import { AppController } from '@main/app.controller'
import { AppService } from '@main/app.service'
import { IllustModule } from '@main/illust/illust.module'
import { createWindow } from '@main/index'
import { PixivApiModule } from '@main/pixiv-api/pixiv-api.module'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { app } from 'electron'
import { KnownDuplicateModule } from './known-duplicate/known-duplicate.module'

@Module({
  imports: [
    IllustModule,
    PixivApiModule,
    KnownDuplicateModule,
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: path.join(app.getPath('userData'), 'main.db'),
      autoLoadEntities: true,
      synchronize: true,
    }),
    ElectronModule.registerAsync({
      useFactory: async () => {
        return await createWindow()
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
