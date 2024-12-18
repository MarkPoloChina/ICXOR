import type { IllustDto } from './dto/illust.dto'
import type { IllustBatchDto } from './dto/illust_batch.dto'
import type { RemoteBaseDto } from './dto/remote_base.dto'
import { IpcHandle } from '@doubleshot/nest-electron'
import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { FilterConditionObj } from './dto/filter_condition_obj.dto'
import { IllustTodayDto } from './dto/illust_today.dto'
import { Poly } from './entities/poly.entities'
import { Tag } from './entities/tag.entities'
import { IllustService } from './illust.service'

@Controller()
export class IllustController {
  constructor(private readonly illustService: IllustService) {}

  @IpcHandle('api:GET/illust/base/enum')
  getIllustEnum(@Payload() [{ row, desc }]: [{ row: string, desc: boolean }]) {
    return this.illustService.getIllustEnum(row, desc)
  }

  @IpcHandle('api:GET/illust/base/list')
  getIllusts(
    @Payload()
    [{ conditionJson, limit, offset, orderAsJson }]: [
      {
        conditionJson: FilterConditionObj
        limit: number
        offset: number
        orderAsJson: object
      },
    ],
  ) {
    return this.illustService.getIllusts(conditionJson, limit, offset, orderAsJson)
  }

  @IpcHandle('api:GET/illust/base/count')
  getIllustsCount(@Payload() [{ conditionJson }]: [{ conditionJson: object }]) {
    return this.illustService.getIllustsCount(conditionJson)
  }

  @IpcHandle('api:POST/illust/bases')
  updateIllusts(@Payload() [, illusts]: [any, IllustBatchDto]) {
    return this.illustService.updateIllusts(illusts)
  }

  @IpcHandle('api:PUT/illust/base')
  updateIllust(
    @Payload()
    [, illusts]: [any, IllustDto],
  ) {
    return this.illustService.updateIllust(illusts)
  }

  @IpcHandle('api:DELETE/illust/bases')
  deleteIllusts(@Payload() [{ illustIds }]: [{ illustIds: number[] }]) {
    return this.illustService.deleteIllusts(illustIds)
  }

  @IpcHandle('api:GET/illust/poly/list')
  getPolys(
    @Payload()
    [{ withIllust, type, orderAsJson }]: [
      { withIllust: boolean, type: string, orderAsJson: object },
    ],
  ) {
    return this.illustService.getPolys(withIllust, type, orderAsJson)
  }

  @IpcHandle('api:POST/illust/poly/bases')
  addIllustsToPoly(@Payload() [, illusts]: [any, IllustBatchDto]) {
    return this.illustService.addIllustsToPoly(illusts)
  }

  @IpcHandle('api:DELETE/illust/poly/bases')
  removeIllustsFromPoly(
    @Payload()
    [{ polyId, illustList }]: [{ polyId: number, illustList: number[] }],
  ) {
    return this.illustService.removeIllustsFromPoly(polyId, illustList)
  }

  @IpcHandle('api:DELETE/illust/poly')
  deletePoly(@Payload() [{ polyId }]: [{ polyId: number }]) {
    return this.illustService.deletePoly(polyId)
  }

  @IpcHandle('api:PUT/illust/poly')
  updateRemotePoly(@Payload() [, poly]: [any, poly: Poly]) {
    return this.illustService.updateRemotePoly(poly)
  }

  @IpcHandle('api:GET/illust/poly/enum')
  getPolyEnum(
    @Payload()
    [{ requiredType, row, desc }]: [{ requiredType: string, row: string, desc: boolean }],
  ) {
    return this.illustService.getPolyEnum(row, desc, requiredType)
  }

  @IpcHandle('api:GET/illust/remote-base/list')
  getRemoteBases(@Payload() [{ withIllust }]: [{ withIllust: boolean }]) {
    return this.illustService.getRemoteBases(withIllust)
  }

  @IpcHandle('api:GET/illust/tag/list')
  getTags() {
    return this.illustService.getTags()
  }

  @IpcHandle('api:PUT/illust/tag')
  updateTag(@Payload() [, tag]: [any, tag: Tag]) {
    return this.illustService.updateTag(tag)
  }

  @IpcHandle('api:DELETE/illust/tag')
  deleteTag(@Payload() [{ tagId }]: [{ tagId: number }]) {
    return this.illustService.deleteTag(tagId)
  }

  @IpcHandle('api:POST/illust/tag/author')
  addAuthorTag(@Payload() [{ tag }]: [{ tag: string }]) {
    return this.illustService.addAuthorTag(tag)
  }

  @IpcHandle('api:POST/illust/remote-base')
  updateRemoteBase(@Payload() [, remoteBase]: [any, remoteBase: RemoteBaseDto]) {
    return this.illustService.updateRemoteBase(remoteBase)
  }

  @IpcHandle('api:GET/illust/illust-today')
  getIllustToday(@Payload() [{ date }]: [{ date: string }]) {
    return this.illustService.getIllustToday(date)
  }

  @IpcHandle('api:POST/illust/illust-today')
  updateIllustToday(@Payload() [{ date }, itdto]: [{ date: string }, itdto: IllustTodayDto]) {
    return this.illustService.updateIllustToday(date, itdto)
  }
}
