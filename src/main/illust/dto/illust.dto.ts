export interface IllustDto {
  id?: number
  star?: number
  date?: Date | null
  tag?: Array<{
    id?: number
    name: string
    type?: string
  }>
  remote_endpoint?: string | null
  thumb_endpoint?: string | null
  meta?: {
    pid: number
    page: number
    title?: string
    limit?: string
    original_url?: string | null
    thumb_url?: string | null
    author_id?: number
    author?: string
    book_cnt?: number
    width?: number
    height?: number
  }
  remote_base?: {
    id: number | undefined
    name: string | undefined
  } | null
}
