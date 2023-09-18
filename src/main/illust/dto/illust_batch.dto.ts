export interface IllustBatchDto {
  conditionObject: object | null
  addition: {
    star: number | null
    date: Date | null
    tag: Array<{
      id: number
      name: string
      type: string
    }> | null
    meta: {
      limit: string | null
    }
    remote_base: {
      id: number | null
    } // 只有dto没有rb才使用这里
  }
  control: {
    addIfNotFound: boolean
  }
  dtos: Array<{
    dto: {
      id: number | null
      remote_endpoint: string
      thumb_endpoint: string
      meta: {
        pid: number
        page: number
        title: string | null
      }
      remote_base: {
        name: string | null
      }
    }
    bid: number | string // 批处理对象标识符
  }>
  polyBase: {
    id: number
    type: string
    parent: string
    name: string
  } | null // 仅当poly参与批处理时使用
}
