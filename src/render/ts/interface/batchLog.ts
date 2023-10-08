import type { RespListObjDto } from '@render/ts/dto/respList'

export interface BatchLog {
  currentIdx?: number
  total: number
  status: 'padding' | 'processing' | 'reject' | 'done'
  type: 'download' | 'fetch' | 'update' | 'poly' | 'delete'
  resp?: Array<RespListObjDto>
  dto?: Array<any>
  showDialog?: boolean
}
