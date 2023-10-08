export interface FilterConditionObj {
  'illust.id'?: number[]
  'illust.star'?: number[]
  'illust.date'?: Array<Date | string>
  'tag.name'?: string[]
  'illust.remote_endpoint'?: string[]
  'meta.pid'?: number[]
  'meta.title'?: string[]
  'meta.limit'?: string[]
  'meta.author_id'?: string[]
  'remote_base.id'?: number[]
  'remote_base.name'?: number[]
  'poly.type'?: string[]
  'poly.parent'?: string[]
  'poly.name'?: string[]
  'poly.id'?: number[]
  'AR'?: 'all' | 'horizontal' | 'vertical'
}
