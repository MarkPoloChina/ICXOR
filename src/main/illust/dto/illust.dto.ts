export interface IllustDto {
  id: number | null
  star: number | null
  date: Date | null
  tag: Array<{
    id: number
    name: string
    type: string
  }> | null
  remote_endpoint: string
  thumb_endpoint: string
  meta: {
    pid: number
    page: number
    title: string | null
    limit: string | null
    original_url: string | null
    thumb_url: string | null
  }
  remote_base: {
    id: number | null
    name: string | null
  }
}
