import type { IllustDto } from '@main/illust/dto/illust.dto'

export class BatchDto {
  control: {
    updatePolicy: 'cover' | 'onlyUpdate' | 'onlyAdd'
  } = {
      updatePolicy: 'cover',
    }

  dtos: Array<{
    bid: number | string
    dto: IllustDto
  }> = []

  polyBase: {
    id?: number
    type: string
    parent?: string
    name: string
  } | null = null
}
