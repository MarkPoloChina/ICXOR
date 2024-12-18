import { MPAPI } from '@main/node-processor/ApiService'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, SelectQueryBuilder } from 'typeorm'
import { FilterConditionObj } from './dto/filter_condition_obj.dto'
import { FilterPolySortObj, FilterSortObj } from './dto/filter_sort_obj.dto'
import { IllustDto } from './dto/illust.dto'
import { IllustBatchDto } from './dto/illust_batch.dto'
import { IllustTodayDto } from './dto/illust_today.dto'
import { RemoteBaseDto } from './dto/remote_base.dto'
import { RespListObjDto } from './dto/resp_list_obj.dto'
import { Illust } from './entities/illust.entities'
import { Meta } from './entities/meta.entities'
import { Poly } from './entities/poly.entities'
import { RemoteBase } from './entities/remote_base.entities'
import { Tag } from './entities/tag.entities'

@Injectable()
export class IllustService {
  constructor(
    @InjectRepository(Illust)
    private readonly illustRepository: Repository<Illust>,
    @InjectRepository(Meta)
    private readonly metaRepository: Repository<Meta>,
    @InjectRepository(Poly)
    private readonly polyRepository: Repository<Poly>,
    @InjectRepository(RemoteBase)
    private readonly remoteBaseRepository: Repository<RemoteBase>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  async getMetaEnum(row: string, desc: boolean) {
    const results: any[] = await this.metaRepository
      .createQueryBuilder('meta')
      .select(row)
      .addSelect('COUNT(*)', 'count')
      .where(':row IS NOT NULL', { row })
      .groupBy(row)
      .orderBy(row, desc ? 'DESC' : 'ASC')
      .getRawMany()
    return results
  }

  async getIllustEnum(row: string, desc: boolean) {
    const results: any[] = await this.illustRepository
      .createQueryBuilder()
      .select(row)
      .addSelect(`COUNT(${row})`, 'count')
      .where(`${row} IS NOT NULL`)
      .groupBy(row)
      .orderBy(row, desc ? 'DESC' : 'ASC')
      .getRawMany()
    return results
  }

  async getPolyEnum(row: string, desc: boolean, requiredType?: string) {
    let queryBuilder = this.polyRepository
      .createQueryBuilder()
      .select(row)
      .addSelect(`COUNT(${row})`, 'count')
      .where(`${row} IS NOT NULL`)
    if (requiredType) {
      queryBuilder = queryBuilder.andWhere('type = :type', {
        type: requiredType,
      })
    }
    const results: any[] = await queryBuilder
      .groupBy(row)
      .orderBy(row, desc ? 'DESC' : 'ASC')
      .getRawMany()
    return results
  }

  private buildIllustQueryChain(
    conditionObj: FilterConditionObj = {},
    inputQuerybuilder: SelectQueryBuilder<Illust>,
  ) {
    let querybuilder = inputQuerybuilder
      .leftJoin('Illust.meta', 'meta')
      .leftJoin('Illust.poly', 'poly')
      .leftJoin('Illust.tag', 'tag')
      .leftJoin('Illust.remote_base', 'remote_base')

    let firstCause = true
    Object.keys(conditionObj).forEach((colName, index) => {
      let param1: string
      let param2: object
      if (Array.isArray(conditionObj[colName]) && conditionObj[colName].length) {
        param1 = `(${colName} IN (:...row${index}))`
        param2 = {
          [`row${index}`]: conditionObj[colName],
        }
      }
      else if (colName === 'AR') {
        if (conditionObj[colName] !== 'all')
          param1 = `meta.width ${conditionObj.AR === 'horizontal' ? '>' : '<'}= meta.height`
      }
      else if (colName === 'meta.pid' || colName === 'meta.author_id') {
        if (conditionObj[colName]) {
          param1 = `(${colName} = :row${index})`
          param2 = {
            [`row${index}`]: `${conditionObj[colName]}`,
          }
        }
      }
      else if (typeof conditionObj[colName] === 'string' && conditionObj[colName]) {
        param1 = `(${colName} LIKE :row${index})`
        param2 = {
          [`row${index}`]: `%${conditionObj[colName]}%`,
        }
      }
      if (param1) {
        if (firstCause) {
          querybuilder = querybuilder.where(param1, param2)
          firstCause = false
        }
        else {
          querybuilder = querybuilder.andWhere(param1, param2)
        }
      }
    })

    return querybuilder
  }

  /**
   * Illust类经过queryBuilder的标准查询
   * @param conditionObj 形如"类.字段:[值1,值2]"的对象
   * @param limit 分页大小, 不分页则输入-1, 默认为100
   * @param offset 页偏移, 仅当limit不为-1时有效, 默认为0
   * @param orderAs 形如"类.字段:正逆序"的对象
   * @returns Illust标准查询结果
   */
  async getIllusts(
    conditionObj: FilterConditionObj = {},
    limit: number = 100,
    offset: number = 0,
    orderAs: FilterSortObj = {},
  ) {
    let querybuilder: SelectQueryBuilder<Illust> = this.illustRepository
      .createQueryBuilder()
      .leftJoinAndSelect('Illust.meta', 'meta')
      .leftJoinAndSelect('Illust.poly', 'poly')
      .leftJoinAndSelect('Illust.tag', 'tag')
      .leftJoinAndSelect('Illust.remote_base', 'remote_base')
      .where((qb) => {
        const querybuilder = this.buildIllustQueryChain(
          conditionObj,
          qb.subQuery().select('Illust.id').from(Illust, 'Illust'),
        )

        return `Illust.id IN ${querybuilder.getQuery()}`
      })
    let firstCause = true
    Object.keys(orderAs).forEach((colName) => {
      if (firstCause) {
        querybuilder = querybuilder.orderBy(colName, orderAs[colName])
        firstCause = false
      }
      else {
        querybuilder = querybuilder.addOrderBy(colName, orderAs[colName])
      }
      if (colName === 'meta.pid')
        querybuilder = querybuilder.addOrderBy('meta.page', 'ASC')
    })
    const results
      = limit === -1
        ? await querybuilder.getMany()
        : await querybuilder.skip(offset).take(limit).getMany()
    return results
  }

  /**
   * Illust类经过queryBuilder的标准DISTINCT计数
   * @param conditionObj 形如"类.字段:[值1,值2]"的对象
   * @returns Illust标准计数结果, 可从count中解构
   */
  async getIllustsCount(conditionObj: FilterConditionObj = {}) {
    const querybuilder: SelectQueryBuilder<Illust> = this.buildIllustQueryChain(
      conditionObj,
      this.illustRepository.createQueryBuilder().select('COUNT(DISTINCT Illust.id)', 'count'),
    )
    const results: { count: number } = await querybuilder.getRawOne()
    // dont use getCount()!! That will query and transfer all data that is too large.
    return results
  }

  /**
   * Poly的简单查询
   * @param withIllust 是否返回Illust列表
   * @param type 指定where的type
   * @param orderAs 形如"字段或对象:正逆序"的嵌套对象
   * @returns Poly的简单查询结果
   */
  async getPolys(
    withIllust: boolean,
    type: string,
    orderAs: FilterPolySortObj = {
      type: 'ASC',
      parent: 'ASC',
      name: 'ASC',
      illusts: {
        meta: {
          pid: 'ASC',
          page: 'ASC',
        },
        remote_endpoint: 'DESC',
        id: 'ASC',
      },
    },
  ) {
    const result = await this.polyRepository.find({
      where: type ? { type } : {},
      relations: withIllust
        ? {
            illusts: {
              meta: true,
              remote_base: true,
            },
          }
        : {},
      order: orderAs,
    })
    return result
  }

  /**
   * Support update but not includes add illust.
   * @function
   */
  async updateIllust(illust: IllustDto) {
    const targetIllust = await this.illustRepository.findOneOrFail({
      where: {
        id: illust.id,
      },
      relations: {
        meta: true,
        tag: true,
      },
    })
    if (illust.star !== undefined)
      targetIllust.star = illust.star
    if (illust.date !== undefined)
      targetIllust.date = illust.date
    if (illust.remote_endpoint !== undefined)
      targetIllust.remote_endpoint = illust.remote_endpoint
    if (illust.thumb_endpoint !== undefined)
      targetIllust.thumb_endpoint = illust.thumb_endpoint
    if (illust.tag) {
      targetIllust.tag.length = 0
      for (const tag of illust.tag) {
        if (tag.id) {
          targetIllust.tag.push(await this.tagRepository.findOneByOrFail({ id: tag.id }))
        }
        else {
          let targetTag: Tag
          targetTag = await this.tagRepository.findOneBy({ name: tag.name })
          if (!targetTag) {
            targetTag = new Tag()
            targetTag.name = tag.name
            targetTag.type = tag.type || 'simple'
          }
          targetIllust.tag.push(targetTag)
        }
      }
    }
    if (illust.meta && targetIllust.meta) {
      Object.keys(illust.meta).forEach((key) => {
        if (key !== 'pid' && key !== 'page' && illust.meta[key])
          targetIllust.meta[key] = illust.meta[key]
      })
    }
    return await this.illustRepository.save(targetIllust)
  }

  /**
   * Add, cover, or modify illusts by batch.
   * @function
   */
  async updateIllusts(illusts: IllustBatchDto) {
    const resp_list: RespListObjDto[] = []
    for (const illust of illusts.dtos) {
      let whereObj: object
      if (illust.dto.id) {
        whereObj = {
          id: illust.dto.id,
        }
      }
      else if (illust.dto.meta) {
        whereObj = {
          meta: {
            pid: illust.dto.meta.pid,
            page: illust.dto.meta.page,
          },
        }
      }
      else if (illust.dto.remote_endpoint) {
        whereObj = {
          remote_endpoint: illust.dto.remote_endpoint,
        }
      }
      let targetIllust = whereObj
        ? await this.illustRepository.findOne({
          where: whereObj,
          relations: {
            meta: true,
            tag: true,
          },
        })
        : null
      if (!targetIllust) {
        if (illusts.control.updatePolicy === 'onlyUpdate') {
          resp_list.push({
            bid: illust.bid,
            status: 'ignore',
            message: 'Illust Not Found.',
          })
          continue
        }
        targetIllust = new Illust()
        if (illust.dto.meta) {
          targetIllust.meta = new Meta()
          targetIllust.meta.pid = illust.dto.meta.pid
          targetIllust.meta.page = illust.dto.meta.page
        }
        if (illust.dto.remote_base && illust.dto.remote_base.id) {
          targetIllust.remote_base = await this.remoteBaseRepository.findOneBy({
            id: illust.dto.remote_base.id,
          })
        }
        if (illust.dto.remote_base && illust.dto.remote_base.name) {
          targetIllust.remote_base = await this.remoteBaseRepository.findOneBy({
            name: illust.dto.remote_base.name,
          })
        }
      }
      else if (illusts.control.updatePolicy === 'onlyAdd') {
        resp_list.push({
          bid: illust.bid,
          status: 'ignore',
          message: 'Illust Already Exist.',
        })
        continue
      }
      if (illust.dto.star !== undefined)
        targetIllust.star = illust.dto.star
      if (illust.dto.date !== undefined)
        targetIllust.date = illust.dto.date
      if (illust.dto.remote_endpoint !== undefined)
        targetIllust.remote_endpoint = illust.dto.remote_endpoint
      if (illust.dto.thumb_endpoint !== undefined)
        targetIllust.thumb_endpoint = illust.dto.thumb_endpoint
      if (illust.dto.tag) {
        for (const tag of illust.dto.tag) {
          let targetTag: Tag
          targetTag = await this.tagRepository.findOneBy({ name: tag.name })
          if (!targetTag) {
            targetTag = new Tag()
            targetTag.name = tag.name
            targetTag.type = tag.type || 'simple'
          }
          targetIllust.tag.push(targetTag)
        }
      }
      if (illust.dto.meta && targetIllust.meta) {
        Object.keys(illust.dto.meta).forEach((key) => {
          if (key !== 'pid' && key !== 'page' && illust.dto.meta[key])
            targetIllust.meta[key] = illust.dto.meta[key]
        })
      }
      try {
        const msg = targetIllust.id ? 'Modified.' : 'Added.'
        await this.illustRepository.save(targetIllust)
        resp_list.push({
          bid: illust.bid,
          status: 'success',
          message: msg,
        })
      }
      catch (err) {
        resp_list.push({
          bid: illust.bid,
          status: `${err}`.startsWith('QueryFailedError: Duplicate entry') ? 'conflict' : 'fault',
          message: `${err}`,
        })
      }
    }
    return resp_list
  }

  async deleteIllusts(illustIds: number[]) {
    const resp_list: RespListObjDto[] = []
    for (const [index, illustId] of illustIds.entries()) {
      try {
        await this.illustRepository.delete(illustId)
        resp_list.push({
          bid: index,
          status: 'success',
          message: 'OK',
        })
      }
      catch (err) {
        resp_list.push({
          bid: index,
          status: 'error',
          message: err,
        })
        continue
      }
    }
    return resp_list
  }

  async removeIllustsFromPoly(polyId: number, ids: number[]) {
    const targetPoly = await this.polyRepository.findOneOrFail({
      where: { id: polyId },
      relations: {
        illusts: true,
      },
    })
    const resp_list: RespListObjDto[] = []
    for (const [index, id] of ids.entries()) {
      const idx = targetPoly.illusts.findIndex((value) => {
        return value.id === id
      })
      if (idx === -1) {
        resp_list.push({
          bid: index,
          status: 'ignore',
          message: 'illustNotFoundInPoly',
        })
      }
      else {
        resp_list.push({
          bid: index,
          status: 'success',
          message: 'OK',
        })
        targetPoly.illusts.splice(idx, 1)
      }
    }
    await this.polyRepository.save(targetPoly)
    return resp_list
  }

  async deletePoly(polyId: number) {
    return await this.polyRepository.delete(polyId)
  }

  async updateRemotePoly(poly: Poly) {
    const targetPoly = await this.polyRepository.findOneByOrFail({
      id: poly.id,
    })
    targetPoly.remote_base = poly.remote_base
    targetPoly.remote2x_base = poly.remote2x_base
    await this.polyRepository.save(targetPoly)
    return targetPoly
  }

  async addIllustsToPoly(illusts: IllustBatchDto) {
    let targetPoly: Poly
    if (illusts.polyBase.id) {
      targetPoly = await this.polyRepository.findOneOrFail({
        where: {
          id: illusts.polyBase.id,
        },
        relations: {
          illusts: true,
        },
      })
    }
    else {
      targetPoly = await this.polyRepository.findOne({
        where: {
          type: illusts.polyBase.type,
          name: illusts.polyBase.name,
          parent: illusts.polyBase.parent || null,
        },
        relations: {
          illusts: true,
        },
      })
      if (!targetPoly) {
        targetPoly = new Poly()
        targetPoly.name = illusts.polyBase.name
        targetPoly.parent = illusts.polyBase.parent || null
        targetPoly.type = illusts.polyBase.type
        targetPoly.illusts = []
      }
    }
    const resp_list: RespListObjDto[] = []
    for (const illust of illusts.dtos) {
      let targetIllust: Illust
      if (illust.dto.id) {
        targetIllust = await this.illustRepository.findOne({
          where: {
            id: illust.dto.id,
          },
          relations: {
            poly: true,
          },
        })
      }
      else if (illust.dto.meta) {
        targetIllust = await this.illustRepository.findOne({
          where: {
            meta: {
              pid: illust.dto.meta.pid,
              page: illust.dto.meta.page,
            },
          },
          relations: {
            poly: true,
          },
        })
      }
      else if (illust.dto.remote_endpoint) {
        targetIllust = await this.illustRepository.findOne({
          where: {
            remote_endpoint: illust.dto.remote_endpoint,
          },
          relations: {
            poly: true,
          },
        })
      }
      if (!targetIllust) {
        resp_list.push({
          bid: illust.bid,
          status: 'ignore',
          message: 'Illust Not Found.',
        })
      }
      else {
        if (targetPoly.illusts.some(value => value.id === targetIllust.id)) {
          resp_list.push({
            bid: illust.bid,
            status: 'conflict',
            message: 'EXIST Illust.',
          })
        }
        else if (
          targetIllust.poly
          && targetIllust.poly.some(value => value.parent === targetPoly.parent)
        ) {
          resp_list.push({
            bid: illust.bid,
            status: 'conflict',
            message: 'Illust Already In Other Poly With Same Parent.',
          })
        }
        else {
          targetPoly.illusts.push(targetIllust)
          resp_list.push({
            bid: illust.bid,
            status: 'success',
            message: 'OK',
          })
        }
      }
    }
    await this.polyRepository.save(targetPoly)
    return resp_list
  }

  async getRemoteBases(withIllust: boolean) {
    const result = await this.remoteBaseRepository.find({
      where: {},
      relations: withIllust
        ? {
            illusts: {
              meta: true,
            },
          }
        : {},
      order: {
        name: 'ASC',
        illusts: {
          id: 'DESC',
        },
      },
    })
    return result
  }

  async updateRemoteBase(remoteBase: RemoteBaseDto) {
    let targetRemoteBase: RemoteBase
    if (remoteBase.id) {
      targetRemoteBase = await this.remoteBaseRepository.findOneBy({
        id: remoteBase.id,
      })
    }
    else {
      targetRemoteBase = new RemoteBase()
    }
    targetRemoteBase.name = remoteBase.name
    targetRemoteBase.type = remoteBase.type
    targetRemoteBase.origin_url = remoteBase.origin_url
    targetRemoteBase.thum_url = remoteBase.thum_url
    return await this.remoteBaseRepository.save(targetRemoteBase)
  }

  async updateIllustToday(date: string, dto: IllustTodayDto) {
    return await MPAPI.updateIllustToday(date, dto)
  }

  async getIllustToday(date: string) {
    return await MPAPI.getIllustToday(date)
  }

  async getTags() {
    const result = await this.tagRepository.find({
      order: {
        type: 'ASC',
        name: 'ASC',
      },
    })
    return result
  }

  async addAuthorTag(tag: string) {
    const targetTag = new Tag()
    targetTag.name = tag
    targetTag.type = 'author'
    return await this.tagRepository.save(targetTag)
  }

  async updateTag(tag: Tag) {
    const targetTag = await this.tagRepository.findOneByOrFail({
      id: tag.id,
    })
    targetTag.name = tag.name
    targetTag.type = tag.type
    return await this.tagRepository.save(targetTag)
  }

  async deleteTag(tagId: number) {
    return await this.tagRepository.delete(tagId)
  }
}
