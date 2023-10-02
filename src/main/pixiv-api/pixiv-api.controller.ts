import { Controller } from '@nestjs/common'
import { IpcHandle } from '@doubleshot/nest-electron'
import { Payload } from '@nestjs/microservices'
import type { IllustBatchDto } from '../illust/dto/illust_batch.dto'
import { PixivApiService } from './pixiv-api.service'

@Controller()
export class PixivApiController {
  constructor(private readonly pixivApiService: PixivApiService) {}

  @IpcHandle('api:GET/pixiv-api/url')
  async getUrl(
    @Payload()
    [{ pid, page, type }]: [{ pid: number; page: number; type: string }],
  ) {
    return this.pixivApiService.getPixivUrl(pid, page, type)
  }

  @IpcHandle('api:GET/pixiv-api/pixiv-json/latest')
  async getJsonLatest(@Payload() [{ isPrivate }]: [{ isPrivate: boolean }]) {
    const json = await this.pixivApiService.getLatestIllusts(isPrivate)
    return json
  }

  @IpcHandle('api:PUT/pixiv-api/pixiv-json/list')
  async updateMetas(@Payload() [, illusts]: [any, illusts: IllustBatchDto]) {
    return this.pixivApiService.updateMetas(illusts)
  }

  @IpcHandle('api:GET/pixiv-api/pixiv-json')
  async getJson(@Payload() [{ pid }]: [{ pid: number }]) {
    return this.pixivApiService.getPixivJson(pid)
  }
}
