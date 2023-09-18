import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, SelectQueryBuilder } from 'typeorm'
import Pixiv from 'pixiv.ts'
import type { PixivIllust } from 'pixiv.ts'
import { ConfigDB } from '@main/node-processor/DBService'
import { Meta } from '../illust/entities/meta.entities'
import { IllustBatchDto } from '../illust/dto/illust_batch.dto'
import { Illust } from '../illust/entities/illust.entities'

let pixivApi: Pixiv = null
async function initPixiv() {
  const token = ConfigDB.getByKey('pixivToken')
  if (token)
    pixivApi = await Pixiv.refreshLogin(token)
}
initPixiv()
@Injectable()
export class PixivApiService {
  @InjectRepository(Meta)
  private readonly metaRepository: Repository<Meta>

  @InjectRepository(Illust)
  private readonly illustRepository: Repository<Illust>

  checkIfAvailable() {
    return !!pixivApi
  }

  async getPixivUrl(pid: number, page: number, type: string) {
    if (!pixivApi)
      return
    if (!['square_medium', 'medium', 'original'].includes(type))
      throw new HttpException('illegal type.', HttpStatus.BAD_REQUEST)
    const illust
      = await pixivApi.illust.get(pid)
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
    if (!pixivApi)
      return
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
          illusts: await pixivApi.user.bookmarksIllust({ user_id: Number(ConfigDB.getByKey('pixivUserId')) }),
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
      else
        return list
    }
    return await check()
  }

  async updateMetas(illusts: IllustBatchDto) {
    if (!pixivApi)
      return
    const limitMap = {
      0: 'normal',
      1: 'R-18',
      2: 'R-18G',
    }
    const list: Meta[] = []
    if (illusts.conditionObject) {
      let querybuilder: SelectQueryBuilder<Illust> = this.illustRepository
        .createQueryBuilder()
        .leftJoinAndSelect('Illust.meta', 'meta')
        .leftJoinAndSelect('Illust.poly', 'poly')
        .leftJoinAndSelect('Illust.tag', 'tag')
        .leftJoinAndSelect('Illust.remote_base', 'remote_base')
      let firstCause = true
      Object.keys(illusts.conditionObject).forEach((colName, index) => {
        if (illusts.conditionObject[colName].length) {
          const param1 = `(${colName} IN (:...row${index}))`
          const param2 = {
            [`row${index}`]: illusts.conditionObject[colName],
          }
          if (firstCause) {
            querybuilder = querybuilder.where(param1, param2)
            firstCause = false
          }
          else { querybuilder = querybuilder.andWhere(param1, param2) }
        }
      })
      const results = await querybuilder.getMany()
      for (const illust of results) {
        if (illust.meta)
          list.push(illust.meta)
      }
    }
    else {
      for (const illust of illusts.dtos) {
        if (!illust.dto.meta)
          continue
        const result = await this.metaRepository.findBy({
          pid: illust.dto.meta.pid,
        })
        if (result)
          list.push(...result)
      }
    }
    list.forEach((meta) => {
      pixivApi.illust.get(meta.pid).then((illust) => {
        if (!illust || !illust.visible)
          return
        meta.author = illust.user.name
        meta.author_id = illust.user.id
        meta.book_cnt = illust.total_bookmarks
        meta.limit = limitMap[illust.x_restrict]
        this.metaRepository.save(meta)
      })
    })
  }

  async getPixivJson(pid: number) {
    if (!pixivApi)
      return
    const illust
      = await pixivApi.illust.get(pid)
    if (!illust || !illust.visible)
      throw new HttpException('pid no found', HttpStatus.NOT_FOUND)
    return illust
  }
}
