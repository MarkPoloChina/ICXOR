import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, SelectQueryBuilder } from 'typeorm'
import { IllustDto } from './dto/illust.dto'
import { IllustBatchDto } from './dto/illust_batch.dto'
import { RemoteBaseDto } from './dto/remote_base.dto'
import { Illust } from './entities/illust.entities'
import { IllustToday } from './entities/illust_today.entities'
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
    @InjectRepository(IllustToday)
    private readonly illustTodayRepository: Repository<IllustToday>,
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

  async getIllustListByQuery(
    conditionObj: object,
    limit = 100,
    offset = 0,
    orderAs: object = {
      'meta.pid': 'DESC',
      'meta.page': 'ASC',
      'Illust.remote_endpoint': 'ASC',
      'Illust.id': 'DESC',
    },
  ) {
    let querybuilder: SelectQueryBuilder<Illust> = this.illustRepository
      .createQueryBuilder()
      .leftJoinAndSelect('Illust.meta', 'meta')
      .leftJoinAndSelect('Illust.poly', 'poly')
      .leftJoinAndSelect('Illust.tag', 'tag')
      .leftJoinAndSelect('Illust.remote_base', 'remote_base')
    let firstCause = true
    Object.keys(conditionObj).forEach((colName, index) => {
      if (conditionObj[colName].length) {
        const param1 = `(${colName} IN (:...row${index}))`
        const param2 = {
          [`row${index}`]: conditionObj[colName],
        }
        if (firstCause) {
          querybuilder = querybuilder.where(param1, param2)
          firstCause = false
        }
        else { querybuilder = querybuilder.andWhere(param1, param2) }
      }
    })
    firstCause = true
    Object.keys(orderAs).forEach((colName) => {
      if (firstCause) {
        querybuilder = querybuilder.orderBy(colName, orderAs[colName])
        firstCause = false
      }
      else { querybuilder = querybuilder.addOrderBy(colName, orderAs[colName]) }
    })
    const results
      = limit === -1
        ? await querybuilder.getMany()
        : await querybuilder.skip(offset).take(limit).getMany()
    return results
  }

  async getIllustListCountByQuery(conditionObj: object) {
    let querybuilder: SelectQueryBuilder<Illust> = this.illustRepository
      .createQueryBuilder()
      .select('COUNT(Illust.id)', 'count')
      .leftJoin('Illust.meta', 'meta')
      .leftJoin('Illust.poly', 'poly')
      .leftJoin('Illust.tag', 'tag')
      .leftJoin('Illust.remote_base', 'remote_base')
    let firstCause = true
    Object.keys(conditionObj).forEach((colName, index) => {
      if (conditionObj[colName].length) {
        const param1 = `(${colName} IN (:...row${index}))`
        const param2 = {
          [`row${index}`]: conditionObj[colName],
        }
        if (firstCause) {
          querybuilder = querybuilder.where(param1, param2)
          firstCause = false
        }
        else { querybuilder = querybuilder.andWhere(param1, param2) }
      }
    })
    const results = await querybuilder.getRawOne()
    // dont use getCount()!! That will query and transfer all data that is too large.
    return results
  }

  async getPolyList(
    withIllust: boolean,
    type: string,
    orderAs: object = {
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
      where: type
        ? {
            type,
          }
        : {},
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

  async newIllusts(illusts: IllustBatchDto) {
    const resp_list = []
    for (const illust of illusts.dtos) {
      const newIllust = new Illust()
      newIllust.star = illusts.addition.star
      newIllust.date = illusts.addition.date || null
      if (illust.dto.meta) {
        newIllust.meta = new Meta()
        newIllust.meta.pid = illust.dto.meta.pid
        newIllust.meta.page = illust.dto.meta.page
        newIllust.meta.title = illust.dto.meta.title
        if (illust.dto.meta.original_url)
          newIllust.meta.original_url = illust.dto.meta.original_url
        if (illust.dto.meta.thumb_url)
          newIllust.meta.thumb_url = illust.dto.meta.thumb_url
        if (illusts.addition.meta)
          newIllust.meta.limit = illusts.addition.meta.limit ?? null
      }
      newIllust.remote_endpoint = illust.dto.remote_endpoint || null
      newIllust.thumb_endpoint = illust.dto.thumb_endpoint || null
      if (illust.dto.remote_base) {
        newIllust.remote_base = await this.remoteBaseRepository.findOneBy({
          name: illust.dto.remote_base.name,
        })
      }
      else if (
        illusts.addition.remote_base
        && illusts.addition.remote_base.id
      ) {
        newIllust.remote_base = await this.remoteBaseRepository.findOneBy({
          id: illusts.addition.remote_base.id,
        })
      }
      try {
        await this.illustRepository.save(newIllust)
        resp_list.push({
          bid: illust.bid,
          status: 'success',
          message: 'OK',
        })
      }
      catch (err) {
        resp_list.push({
          bid: illust.bid,
          status: `${err}`.startsWith('QueryFailedError: Duplicate entry')
            ? 'conflict'
            : 'fault',
          message: `${err}`,
        })
      }
    }
    return resp_list
  }

  async updateIllusts(illusts: IllustBatchDto) {
    let dtos: any[]
    if (illusts.conditionObject) {
      const list = await this.getIllustListByQuery(
        illusts.conditionObject,
        -1,
        0,
        {},
      )
      dtos = list.map((value) => {
        return { bid: null, dto: value }
      })
    }
    else { dtos = illusts.dtos }
    const resp_list = []
    for (const illust of dtos) {
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
        if (!illusts.control.addIfNotFound) {
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
        if (illust.dto.remote_base) {
          targetIllust.remote_base = await this.remoteBaseRepository.findOneBy({
            name: illust.dto.remote_base.name,
          })
        }
        else if (
          illusts.addition.remote_base
          && illusts.addition.remote_base.id
        ) {
          targetIllust.remote_base = await this.remoteBaseRepository.findOneBy({
            id: illusts.addition.remote_base.id,
          })
        }
      }
      targetIllust.remote_endpoint = illust.dto.remote_endpoint || null
      targetIllust.thumb_endpoint = illust.dto.thumb_endpoint || null
      if (illusts.addition.star || illusts.addition.star === 0)
        targetIllust.star = illusts.addition.star
      if (illusts.addition.date)
        targetIllust.date = illusts.addition.date
      if (illust.dto.meta && illust.dto.meta.title)
        targetIllust.meta.title = illust.dto.meta.title
      if (illusts.addition.meta && illusts.addition.meta.limit)
        targetIllust.meta.limit = illusts.addition.meta.limit
      if (illusts.addition.tag) {
        for (const ele of illusts.addition.tag) {
          if (
            targetIllust.tag.findIndex((value) => {
              return value.name === ele.name
            }) === -1
          ) {
            let targetTag: Tag
            targetTag = await this.tagRepository.findOneBy({ name: ele.name })
            if (!targetTag) {
              targetTag = new Tag()
              targetTag.name = ele.name
              targetTag.type = 'simple'
              await this.tagRepository.save(targetTag)
            }
            targetIllust.tag.push(targetTag)
          }
        }
      }
      try {
        const msg = targetIllust.id ? 'Modified.' : 'Added.'
        if (targetIllust.meta)
          await this.metaRepository.save(targetIllust.meta)
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
          status: `${err}`.startsWith('QueryFailedError: Duplicate entry')
            ? 'conflict'
            : 'fault',
          message: `${err}`,
        })
      }
    }
    return resp_list
  }

  async updateIllust(illust: IllustDto, addIfNotFound: boolean) {
    let whereObj: object
    if (illust.id) {
      whereObj = {
        id: illust.id,
      }
    }
    else if (illust.meta) {
      whereObj = {
        meta: {
          pid: illust.meta.pid,
          page: illust.meta.page,
        },
      }
    }
    else if (illust.remote_endpoint) {
      whereObj = {
        remote_endpoint: illust.remote_endpoint,
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
      if (!addIfNotFound)
        throw new HttpException('No Illust Found', HttpStatus.BAD_REQUEST)

      targetIllust = new Illust()
      if (illust.meta) {
        targetIllust.meta = new Meta()
        targetIllust.meta.pid = illust.meta.pid
        targetIllust.meta.page = illust.meta.page
      }
      if (illust.remote_base) {
        if (illust.remote_base.name) {
          targetIllust.remote_base = await this.remoteBaseRepository.findOneBy({
            name: illust.remote_base.name,
          })
        }
        else if (illust.remote_base.id) {
          targetIllust.remote_base = await this.remoteBaseRepository.findOneBy({
            id: illust.remote_base.id,
          })
        }
      }
    }
    targetIllust.remote_endpoint = illust.remote_endpoint || null
    targetIllust.thumb_endpoint = illust.thumb_endpoint || null
    if (illust.star || illust.star === 0)
      targetIllust.star = illust.star
    if (illust.date)
      targetIllust.date = illust.date
    if (illust.meta && illust.meta.title)
      targetIllust.meta.title = illust.meta.title
    if (illust.meta && illust.meta.limit)
      targetIllust.meta.limit = illust.meta.limit
    if (illust.tag) {
      for (const ele of illust.tag) {
        if (
          targetIllust.tag.findIndex((value) => {
            return value.name === ele.name
          }) === -1
        ) {
          let targetTag: Tag
          targetTag = await this.tagRepository.findOneBy({ name: ele.name })
          if (!targetTag) {
            targetTag = new Tag()
            targetTag.name = ele.name
            targetTag.type = 'simple'
            await this.tagRepository.save(targetTag)
          }
          targetIllust.tag.push(targetTag)
        }
      }
      const newTags = []
      for (const tag of targetIllust.tag) {
        if (
          illust.tag.findIndex((value) => {
            return value.name === tag.name
          }) !== -1
        )
          newTags.push(tag)
      }
      targetIllust.tag = newTags
    }
    if (targetIllust.meta)
      await this.metaRepository.save(targetIllust.meta)
    await this.illustRepository.save(targetIllust)
  }

  async deleteIllusts(illustIds: number[]) {
    for (const illustId of illustIds) {
      try {
        await this.illustRepository.delete(illustId)
      }
      catch {
        continue
      }
    }
  }

  async removeIllustsFromPoly(polyId: number, ids: number[]) {
    const targetPoly = await this.polyRepository.findOne({
      where: { id: polyId },
      relations: {
        illusts: true,
      },
    })
    if (!targetPoly) {
      throw new HttpException('No Poly found', HttpStatus.BAD_REQUEST)
    }
    else {
      for (const id of ids) {
        const idx = targetPoly.illusts.findIndex((value) => {
          return value.id === id
        })
        if (idx === -1)
          continue
        targetPoly.illusts.splice(idx, 1)
      }
      await this.polyRepository.save(targetPoly)
    }
  }

  async deletePoly(polyId: number) {
    await this.polyRepository.delete(polyId)
  }

  async updatePoly(illusts: IllustBatchDto) {
    let targetPoly: Poly
    if (illusts.polyBase.id) {
      targetPoly = await this.polyRepository.findOne({
        where: {
          id: illusts.polyBase.id,
        },
        relations: {
          illusts: true,
        },
      })
      if (!targetPoly)
        throw new HttpException('No such poly.', HttpStatus.BAD_REQUEST)
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
        await this.polyRepository.save(targetPoly)
      }
    }
    let dtos: any[]
    if (illusts.conditionObject) {
      const list = await this.getIllustListByQuery(
        illusts.conditionObject,
        10000000,
        0,
        {},
      )
      dtos = list.map((value) => {
        return { bid: null, dto: value }
      })
    }
    else { dtos = illusts.dtos }
    const resp_list = []
    for (const illust of dtos) {
      let targetIllust: Illust
      if (illust.dto.id) {
        targetIllust = await this.illustRepository.findOneBy({
          id: illust.dto.id,
        })
      }
      else if (illust.dto.meta) {
        targetIllust = await this.illustRepository.findOneBy({
          meta: {
            pid: illust.dto.meta.pid,
            page: illust.dto.meta.page,
          },
        })
      }
      else if (illust.dto.remote_endpoint) {
        targetIllust = await this.illustRepository.findOneBy({
          remote_endpoint: illust.dto.remote_endpoint,
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
        if (!targetPoly.illusts.find(value => value.id === targetIllust.id)) {
          targetPoly.illusts.push(targetIllust)
          resp_list.push({
            bid: illust.bid,
            status: 'padding',
            message: 'OK',
          })
        }
        else {
          resp_list.push({
            bid: illust.bid,
            status: 'conflict',
            message: 'EXIST Illust.',
          })
        }
      }
    }
    try {
      await this.polyRepository.save(targetPoly)
      return resp_list.map((value) => {
        if (value.status === 'padding')
          value.status = 'success'
        return value
      })
    }
    catch (err) {
      return resp_list.map((value) => {
        if (value.status === 'padding') {
          value.status = 'fault'
          value.message = `${err}`
        }
        return value
      })
    }
  }

  async getRemoteBaseList(withIllust: boolean) {
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

  async coverRemoteBase(remoteBase: RemoteBaseDto) {
    let targetRemoteBase: RemoteBase
    if (remoteBase.id) {
      targetRemoteBase = await this.remoteBaseRepository.findOneBy({
        id: remoteBase.id,
      })
    }
    else { targetRemoteBase = new RemoteBase() }
    targetRemoteBase.name = remoteBase.name
    targetRemoteBase.type = remoteBase.type
    targetRemoteBase.origin_url = remoteBase.origin_url
    targetRemoteBase.thum_url = remoteBase.thum_url
    await this.remoteBaseRepository.save(targetRemoteBase)
  }

  async coverIllustToday(date: Date, illustId: number) {
    let targetIllustToday = await this.illustTodayRepository.findOneBy({
      date,
    })
    if (!targetIllustToday) {
      targetIllustToday = new IllustToday()
      targetIllustToday.date = date
    }
    targetIllustToday.illust = await this.illustRepository.findOneBy({
      id: illustId,
    })
    if (!targetIllustToday.illust)
      throw new HttpException('No such illust.', HttpStatus.BAD_REQUEST)

    else
      await this.illustTodayRepository.save(targetIllustToday)
  }

  async getIllustToday(date: Date) {
    const targetIllustToday = await this.illustTodayRepository.findOne({
      where: {
        date,
      },
      relations: {
        illust: {
          meta: true,
          remote_base: true,
        },
      },
    })
    if (targetIllustToday)
      return targetIllustToday

    else
      throw new HttpException('empty in date', HttpStatus.NOT_FOUND)
  }
}
