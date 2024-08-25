import { Controller } from '@nestjs/common'
import { IpcHandle } from '@doubleshot/nest-electron'
import { Payload } from '@nestjs/microservices'
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
  async getJsonLatest(@Payload() [{ isPrivate, existFilenames }]: [{ isPrivate: boolean;existFilenames?: string[] }]) {
    const json = await this.pixivApiService.getLatestIllusts(isPrivate, existFilenames)
    return json
  }

  @IpcHandle('api:GET/pixiv-api/pixiv-json')
  async getJson(@Payload() [{ pid }]: [{ pid: number }]) {
    return this.pixivApiService.getPixivIllustJson(pid)
  }

  @IpcHandle('api:GET/pixiv-api/user-json')
  async getUserJson(@Payload() [{ uid }]: [{ uid: number }]) {
    return this.pixivApiService.getPixivUserJson(uid)
  }

  @IpcHandle('api:GET/pixiv-api/user-illusts')
  async getUserIllusts(@Payload() [{ uid }]: [{ uid: number }]) {
    return this.pixivApiService.getPixivUserIllusts(uid)
  }

  @IpcHandle('api:GET/pixiv-api/next')
  async getPixivNextRequest(@Payload() [{ nextUrl }]: [{ nextUrl: string }]) {
    return this.pixivApiService.getPixivNextRequest(nextUrl)
  }

  @IpcHandle('api:GET/pixiv-api/ugoira-json')
  async getPixivUgoiraJson(@Payload() [{ pid }]: [{ pid: number }]) {
    return this.pixivApiService.getPixivUgoiraJson(pid)
  }

  @IpcHandle('api:POST/pixiv-api/bookmark')
  async togglePixivBookmark(@Payload() [{ pid, op, isPrivate }]: [{ pid: number; op: boolean; isPrivate: boolean }]) {
    if (op)
      return this.pixivApiService.bookmarkIllust(pid, isPrivate)
    else return this.pixivApiService.unbookmarkIllust(pid)
  }
}
