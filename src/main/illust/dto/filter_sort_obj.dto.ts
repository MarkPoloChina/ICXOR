export interface FilterSortObj {
  'Illust.id'?: 'DESC' | 'ASC'
  'Illust.remote_endpoint'?: 'DESC' | 'ASC'
  'meta.pid'?: 'DESC' | 'ASC'
  'meta.author_id'?: 'DESC' | 'ASC'
  'meta.book_cnt'?: 'DESC' | 'ASC'
}
export interface FilterPolySortObj {
  type?: 'DESC' | 'ASC'
  parent?: 'DESC' | 'ASC'
  name?: 'DESC' | 'ASC'
  illusts?: {
    meta?: {
      pid: 'DESC' | 'ASC'
      page: 'DESC' | 'ASC'
    }
    remote_endpoint?: 'DESC' | 'ASC'
    id?: 'DESC' | 'ASC'
  }
}
