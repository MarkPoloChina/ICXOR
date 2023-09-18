import { Controller } from '@nestjs/common'
import { IpcHandle } from '@doubleshot/nest-electron'
import { Payload } from '@nestjs/microservices'
import type { IllustDto } from './dto/illust.dto'
import type { IllustBatchDto } from './dto/illust_batch.dto'
import type { RemoteBaseDto } from './dto/remote_base.dto'
import { IllustService } from './illust.service'

@Controller()
export class IllustController {
  constructor(private readonly illustService: IllustService) {}

  @IpcHandle('api:GET/illust/base/enum')
  illustEnum(@Payload() [{ row, desc }]: [{ row: string; desc: boolean }]) {
    return this.illustService.getIllustEnum(row, desc)
  }

  @IpcHandle('api:GET/illust/base/list')
  illustList(
    @Payload()
    [{ conditionJson, limit, offset, orderAsJson }]: [
      {
        conditionJson: object
        limit: number
        offset: number
        orderAsJson: object
      },
    ],
  ) {
    return this.illustService.getIllustListByQuery(
      conditionJson,
      limit,
      offset,
      orderAsJson || undefined,
    )
  }

  @IpcHandle('api:GET/illust/base/count')
  illustListCount(@Payload() [{ conditionJson }]: [{ conditionJson: object }]) {
    return this.illustService.getIllustListCountByQuery(conditionJson)
  }

  @IpcHandle('api:POST/illust/bases')
  newIllusts(@Payload() [, illusts]: [any, illusts: IllustBatchDto]) {
    return this.illustService.newIllusts(illusts)
  }

  @IpcHandle('api:PUT/illust/bases')
  updateIllusts(@Payload() [, illusts]: [any, illusts: IllustBatchDto]) {
    return this.illustService.updateIllusts(illusts)
  }

  @IpcHandle('api:PUT/illust/base')
  updateIllust(
    @Payload()
    [{ addIfNotFound }, illusts]: [{ addIfNotFound: boolean }, IllustDto],
  ) {
    return this.illustService.updateIllust(illusts, addIfNotFound)
  }

  @IpcHandle('api:DELETE/illust/bases')
  deleteIllusts(@Payload() [{ illustIds }]: [{ illustIds: number[] }]) {
    return this.illustService.deleteIllusts(illustIds)
  }

  @IpcHandle('api:GET/illust/poly/list')
  illustPolyList(
    @Payload()
    [{ withIllust, type, orderAsJson }]: [
      { withIllust: boolean; type: string; orderAsJson: object },
    ],
  ) {
    return this.illustService.getPolyList(
      withIllust,
      type,
      orderAsJson || undefined,
    )
  }

  @IpcHandle('api:POST/illust/poly/bases')
  updatePoly(@Payload() [, illusts]: [any, IllustBatchDto]) {
    return this.illustService.updatePoly(illusts)
  }

  @IpcHandle('api:DELETE/illust/poly/bases')
  removeFromPoly(
    @Payload()
    [{ polyId, illustList }]: [{ polyId: number; illustList: number[] }],
  ) {
    return this.illustService.removeIllustsFromPoly(polyId, illustList)
  }

  @IpcHandle('api:DELETE/illust/poly')
  deletePoly(@Payload() [{ polyId }]: [{ polyId: number }]) {
    return this.illustService.deletePoly(polyId)
  }

  @IpcHandle('api:GET/illust/poly/enum')
  illustPolyEnum(
    @Payload()
    [{ requiredType, row, desc }]: [
      { requiredType: string; row: string; desc: boolean },
    ],
  ) {
    return this.illustService.getPolyEnum(row, desc, requiredType)
  }

  @IpcHandle('api:GET/illust/remote-base/list')
  remoteBase(@Payload() [{ withIllust }]: [{ withIllust: boolean }]) {
    return this.illustService.getRemoteBaseList(withIllust)
  }

  @IpcHandle('api:POST/illust/remote-base')
  updateRemoteBase(
    @Payload() [, remoteBase]: [any, remoteBase: RemoteBaseDto],
  ) {
    return this.illustService.coverRemoteBase(remoteBase)
  }

  @IpcHandle('api:GET/illust/illust-today')
  illustToday(@Payload() [{ date }]: [{ date: string }]) {
    return this.illustService.getIllustToday(new Date(date))
  }

  @IpcHandle('api:PUT/illust/illust-today')
  coverIllustToday(
    @Payload() [{ date, illustId }]: [{ date: string; illustId: number }],
  ) {
    return this.illustService.coverIllustToday(new Date(date), illustId)
  }
}
