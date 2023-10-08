import type { IllustDto } from './illust.dto'

export interface IllustBatchDto {
  control: {
    addIfNotFound: boolean
  }
  dtos: Array<{
    dto: IllustDto
    bid: number | string // 批处理对象标识符
  }>
  polyBase: {
    id: number
    type: string
    parent: string
    name: string
  } | null // 仅当poly参与批处理时使用
}
