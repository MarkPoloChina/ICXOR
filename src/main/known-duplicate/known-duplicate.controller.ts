import { IpcHandle } from '@doubleshot/nest-electron'
import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { KnownDuplicateService } from './known-duplicate.service'

@Controller()
export class KnownDuplicateController {
  constructor(private readonly knownDuplicateService: KnownDuplicateService) {}

  @IpcHandle('api:GET/known-duplicate/pixiv')
  getDuplicateByPixivId(@Payload() [{ pixiv_id }]: [{ pixiv_id: string }]) {
    return this.knownDuplicateService.getDuplicateByPixivId(pixiv_id)
  }

  @IpcHandle('api:GET/known-duplicate/twitter')
  getDuplicateByTwitterStatusId(
    @Payload() [{ twitter_status_id }]: [{ twitter_status_id: string }],
  ) {
    return this.knownDuplicateService.getDuplicateByTwitterStatusId(twitter_status_id)
  }

  @IpcHandle('api:POST/known-duplicate/twitter')
  addDuplicate(
    @Payload() [{ pixiv_id, twitter_status_id }]: [{ pixiv_id: string, twitter_status_id: string }],
  ) {
    return this.knownDuplicateService.addDuplicate(pixiv_id, twitter_status_id)
  }
}
