import type { PixivIllust } from '@markpolochina/pixiv.ts'
import path from 'node:path'
import { ConfigDB } from '@main/node-processor/DBService'
import Pixiv from '@markpolochina/pixiv.ts'
import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import fs from 'fs-extra'
import { Repository } from 'typeorm'
import { Meta } from '../illust/entities/meta.entities'

@Injectable()
export class PixivApiService {
  @InjectRepository(Meta)
  private readonly metaRepository: Repository<Meta>

  private pixivApi: Pixiv = null

  async initPixiv() {
    if (this.pixivApi)
      return
    const token = ConfigDB.getByKey('pixivToken')
    if (token) {
      try {
        this.pixivApi = await Pixiv.refreshLogin(token)
      }
      catch {
        throw new HttpException('pixiv token check failed', HttpStatus.UNAUTHORIZED)
      }
    }
    else {
      throw new HttpException('pixiv token not set', HttpStatus.SERVICE_UNAVAILABLE)
    }
  }

  async getPixivUrl(pid: number, page: number, type: string) {
    await this.initPixiv()
    if (!['square_medium', 'medium', 'original'].includes(type))
      throw new HttpException('illegal type.', HttpStatus.BAD_REQUEST)
    const illust = await this.pixivApi.illust.detail({ illust_id: pid })
    if (!illust || page >= illust.page_count || !illust.visible)
      throw new HttpException('pid or page no found', HttpStatus.NOT_FOUND)
    const url
      = illust.page_count === 1
        ? type === 'original'
          ? illust.meta_single_page.original_image_url
          : illust.image_urls[type]
        : illust.meta_pages[page].image_urls[type]
    return url
  }

  async getLatestIllusts(isPrivate: boolean, stopIn?: string) {
    await this.initPixiv()
    const list = []
    const queryAsync = (pid: number, index: number) => {
      return new Promise((resolve, reject) => {
        this.metaRepository
          .findOne({ where: { pid } })
          .then(data => resolve({ data, index }))
          .catch(err => reject(err))
      })
    }
    const check = async (url?: string) => {
      let flag = false
      let json: { illusts: Array<PixivIllust>, next_url: string }
      if (!url) {
        json = {
          illusts: await this.pixivApi.user.bookmarksIllust({
            user_id: Number(ConfigDB.getByKey('pixivUserId')),
            restrict: isPrivate ? 'private' : 'public',
          }),
          next_url: this.pixivApi.user.nextURL,
        }
      }
      else {
        json = await this.pixivApi.api.request(url)
      }
      if (stopIn) {
        json.illusts.forEach((illust) => {
          const ou
            = illust.meta_single_page.original_image_url || illust.meta_pages[0].image_urls.original
          if (
            !fs.pathExistsSync(
              path.join(stopIn, illust.type === 'ugoira' ? `${illust.id}.gif` : path.basename(ou)),
            )
          ) {
            list.push({ ...illust, caption: null })
            flag = true
          }
        })
      }
      else {
        const promises = []
        json.illusts.forEach((illust, index) => {
          promises.push(queryAsync(illust.id, index))
        })
        const values = await Promise.all(promises)
        values.forEach((value) => {
          if (!value.data) {
            list.push({ ...json.illusts[value.index], caption: null })
            flag = true
          }
        })
      }
      if (flag)
        return await check(json.next_url)
      else return list
    }
    return await check()
  }

  async getPixivIllustJson(pid: number | string) {
    await this.initPixiv()
    const illust = await this.pixivApi.illust.detail({ illust_id: Number(pid) })
    if (!illust || !illust.visible)
      throw new HttpException('pid no found', HttpStatus.NOT_FOUND)
    return illust
  }

  async getPixivUserJson(uid: number | string) {
    await this.initPixiv()
    const user = await this.pixivApi.user.detail({ user_id: Number(uid) })
    if (!user)
      throw new HttpException('uid no found', HttpStatus.NOT_FOUND)
    return user
  }

  async getPixivUserIllusts(uid: number | string) {
    await this.initPixiv()
    const illusts = await this.pixivApi.user.illusts({ user_id: Number(uid) })
    return { illusts, nextUrl: this.pixivApi.user.nextURL }
  }

  async getPixivNextRequest(nextUrl: string) {
    await this.initPixiv()
    const resp = await this.pixivApi.api.next(nextUrl)
    return resp
  }

  async getPixivUgoiraJson(pid: number | string) {
    await this.initPixiv()
    return await this.pixivApi.ugoira.metadata({ illust_id: Number(pid) })
  }

  async bookmarkIllust(pid: number | string, isPrivate = false) {
    await this.initPixiv()
    return await this.pixivApi.illust.bookmarkIllust({
      illust_id: Number(pid),
      restrict: isPrivate ? 'private' : 'public',
    })
  }

  async unbookmarkIllust(pid: number | string) {
    await this.initPixiv()
    return await this.pixivApi.illust.unbookmarkIllust({ illust_id: Number(pid) })
  }
}
