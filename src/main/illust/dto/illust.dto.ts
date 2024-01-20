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
    type?: string
    title?: string
    limit?: string
    original_url?: string | null
    author_id?: number
    author?: string
    book_cnt?: number
    width?: number
    height?: number
    tags_str?: string
  }
  remote_base?: {
    id?: number | undefined
    name: string | undefined
  } | null
}
