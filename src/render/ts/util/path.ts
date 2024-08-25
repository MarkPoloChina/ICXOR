import store from '@render/store/index'
import type { IllustObj } from '../interface/illustObj'
import { FilenameResolver } from './filename'

const { ipcSendSync } = window.electron
const STORE_PATH = ipcSendSync('app:getPath', null)

const ihs_base_local = store.state.localIHS

const ihs_base_remote = store.state.remoteIHS

const useLocal = store.state.useLocal

const local_base = store.state.localDiskRoot

const local_base_map = store.state.localDiskMap

const hasProxy = !!store.state.pixivProxy

export class PathHelper {
  static getBaseUrl = () => {
    return STORE_PATH
  }

  static joinFilenamePath = (...paths: string[]) => {
    return ipcSendSync('ps:join', ...paths) as string
  }

  static getExtNameWithDot = (_path: string) => {
    return ipcSendSync('ps:extname', _path) as string
  }

  static getBasename = (_path: string) => {
    return ipcSendSync('ps:basename', _path) as string
  }

  static getPrefixName = (_path: string) => {
    const basename = this.getBasename(_path)
    return basename.substring(0, basename.lastIndexOf('.'))
  }
}

export class UrlGenerator {
  static getBlobUrl(obj: IllustObj, type: 'original' | 'medium' | 'large' | 'square_medium' | 's_large' = 'original'): string {
    if (type === 'original' || type === 's_large') {
      if (useLocal) {
        if (obj.remote_endpoint && local_base_map[obj.remote_base.name]?.original)
          return this.getDiskOriginUrl(obj)
        else if (ihs_base_local && obj.remote_endpoint && obj.remote_base.origin_url)
          return this.getRemoteOriginUrl(obj, ihs_base_local)
        else if (obj.meta?.original_url)
          return this.getPixivUrlProxy(this.getPixivUrlSized(obj.meta.original_url, type))
        else if (obj.meta)
          return this.getPixivUrlCat(obj.meta.pid, obj.meta.page)
      }
      else {
        if (obj.meta?.original_url)
          return this.getPixivUrlProxy(this.getPixivUrlSized(obj.meta.original_url, type))
        else if (ihs_base_remote && obj.remote_endpoint && obj.remote_base.origin_url)
          return this.getRemoteOriginUrl(obj, ihs_base_remote)
        else if (obj.meta)
          return this.getPixivUrlCat(obj.meta.pid, obj.meta.page)
      }
    }
    else {
      if (useLocal && obj.thumb_endpoint && local_base_map[obj.remote_base.name]?.thumbnail)
        return this.getDiskThumbUrl(obj)
      else if (useLocal && ihs_base_local && obj.thumb_endpoint && obj.remote_base.thum_url)
        return this.getRemoteThumbUrl(obj, ihs_base_local)
      else if (ihs_base_remote && obj.thumb_endpoint && obj.remote_base.thum_url)
        return this.getRemoteThumbUrl(obj, ihs_base_remote)
      else if (obj.meta?.original_url)
        return this.getPixivUrlProxy(this.getPixivUrlSized(obj.meta.original_url, type))
      else return this.getBlobUrl(obj, 'original')
    }
    return ''
  }

  static getRemoteOriginUrl(obj: IllustObj, ihs_base: string) {
    return `${obj.remote_base.type === 'cos' ? store.state.cos : ihs_base}${
      obj.remote_base.origin_url
    }/${encodeURIComponent(obj.remote_endpoint)}`
  }

  static getRemoteThumbUrl(obj: IllustObj, ihs_base: string) {
    return `${obj.remote_base.type === 'cos' ? store.state.cos : ihs_base}${
      obj.remote_base.thum_url
    }/${encodeURIComponent(obj.thumb_endpoint)}`
  }

  static getDiskOriginUrl(obj: IllustObj) {
    return `icxorimg://s/?u=${encodeURIComponent(`${local_base}${local_base_map[obj.remote_base.name]?.original}${obj.remote_endpoint}`)}`
  }

  static getDiskThumbUrl(obj: IllustObj) {
    return `icxorimg://s/?u=${encodeURIComponent(`${local_base}${local_base_map[obj.remote_base.name]?.thumbnail}${obj.thumb_endpoint}`)}`
  }

  static getPixivUrlProxy(url: string) {
    if (hasProxy)
      return url
    else return url.replace('i.pximg.net', 'i.pixiv.re')
  }

  static getPixivUrlSized(url: string, size: 'original' | 'medium' | 'large' | 'square_medium' | 's_large' = 'original') {
    if (size === 'medium')
      return url.replace('_ugoira0', '').replace('img-original', 'c/540x540_70/img-master').replace(/\.[^.]*$/, '_master1200.jpg')
    else if (size === 'large')
      return url.replace('_ugoira0', '').replace('img-original', 'c/600x1200_90/img-master').replace(/\.[^.]*$/, '_master1200.jpg')
    else if (size === 'square_medium')
      return url.replace('_ugoira0', '').replace('img-original', 'c/360x360_70/img-master').replace(/\.[^.]*$/, '_square1200.jpg')
    else if (size === 's_large')
      return url.replace('_ugoira0', '').replace('img-original', 'img-master').replace(/\.[^.]*$/, '_master1200.jpg')
    else
      return url
  }

  static getPixivUrlCat(pid: number, page: number, ext?: string) {
    const url = new URL(
      `https://pixiv.cat/${pid}${page === 0 ? '' : `-${page + 1}`}${
        ext ?? '.jpg'
      }`,
    )
    return url.href
  }

  static getSourceLink(obj: IllustObj) {
    if (obj.remote_base.type === 'pixiv')
      return `https://www.pixiv.net/artworks/${obj.meta.pid}`
    if (obj.remote_base.name === 'Twitter' && obj.remote_endpoint) {
      const parser = FilenameResolver.getObjFromFilename(obj.remote_endpoint)
      if (parser?.statusId && parser?.authorId)
        return `https://twitter.com/${parser.authorId}/status/${parser.statusId}`
    }
    return ''
  }
}
