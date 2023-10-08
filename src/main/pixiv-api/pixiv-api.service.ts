import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import Pixiv from '@markpolochina/pixiv.ts'
import type { PixivIllust } from '@markpolochina/pixiv.ts'
import { ConfigDB } from '@main/node-processor/DBService'
import { Meta } from '../illust/entities/meta.entities'

let pixivApi: Pixiv = null
async function initPixiv() {
  const proxyStr: string | null | undefined = ConfigDB.getByKey('pixivProxy')
  if (
    proxyStr
    && proxyStr.match(
      /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\:[1-9]\d{0,4}$/,
    )
  )
    Pixiv.setProxy(proxyStr.split(':')[0], Number(proxyStr.split(':')[1]))
  const token = ConfigDB.getByKey('pixivToken')
  if (token)
    pixivApi = await Pixiv.refreshLogin(token)
}
initPixiv()
@Injectable()
export class PixivApiService {
  @InjectRepository(Meta)
  private readonly metaRepository: Repository<Meta>

  async getPixivUrl(pid: number, page: number, type: string) {
    if (!pixivApi) {
      throw new HttpException(
        'API not started.',
        HttpStatus.SERVICE_UNAVAILABLE,
      )
    }
    if (!['square_medium', 'medium', 'original'].includes(type))
      throw new HttpException('illegal type.', HttpStatus.BAD_REQUEST)
    const illust = await pixivApi.illust.get(pid)
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

  async getLatestIllusts(_isPrivate: boolean) {
    if (!pixivApi) {
      throw new HttpException(
        'API not started.',
        HttpStatus.SERVICE_UNAVAILABLE,
      )
    }
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
      let json: { illusts: Array<PixivIllust>; next_url: string }
      if (!url) {
        json = {
          illusts: await pixivApi.user.bookmarksIllust({
            user_id: Number(ConfigDB.getByKey('pixivUserId')),
          }),
          next_url: pixivApi.user.nextURL,
        }
      }
      else {
        json = await pixivApi.api.request(url)
      }
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
      if (flag)
        return await check(json.next_url)
      else return list
    }
    return await check()
  }

  async getPixivIllustJson(pid: number | string) {
    if (!pixivApi) {
      throw new HttpException(
        'API not started.',
        HttpStatus.SERVICE_UNAVAILABLE,
      )
    }
    const illust = await pixivApi.illust.detail({ illust_id: Number(pid) })
    if (!illust || !illust.visible)
      throw new HttpException('pid no found', HttpStatus.NOT_FOUND)
    return illust
  }

  async getPixivUserJson(uid: number | string) {
    if (!pixivApi) {
      throw new HttpException(
        'API not started.',
        HttpStatus.SERVICE_UNAVAILABLE,
      )
    }
    const user = await pixivApi.user.detail({ user_id: Number(uid) })
    if (!user)
      throw new HttpException('uid no found', HttpStatus.NOT_FOUND)
    return user
  }

  async getPixivUserIllusts(uid: number | string) {
    if (!pixivApi) {
      throw new HttpException(
        'API not started.',
        HttpStatus.SERVICE_UNAVAILABLE,
      )
    }
    const illusts = await pixivApi.user.illusts({ user_id: Number(uid) })
    return { illusts, nextUrl: pixivApi.user.nextURL }
  }

  async getPixivNextRequest(nextUrl: string) {
    if (!pixivApi) {
      throw new HttpException(
        'API not started.',
        HttpStatus.SERVICE_UNAVAILABLE,
      )
    }
    const resp = await pixivApi.api.next(nextUrl)
    return resp
  }

  async downloadPixivUgoira(url: string | PixivIllust, dest: string) {
    if (!pixivApi) {
      throw new HttpException(
        'API not started.',
        HttpStatus.SERVICE_UNAVAILABLE,
      )
    }
    return await pixivApi.util.downloadUgoira(url, dest, { speed: 1 })
  }

  async getPixivUgoiraJson(pid: number | string) {
    if (!pixivApi) {
      throw new HttpException(
        'API not started.',
        HttpStatus.SERVICE_UNAVAILABLE,
      )
    }
    return await pixivApi.ugoira.metadata({ illust_id: Number(pid) })
  }
}
