import path from 'path-browserify'
import store from '@render/store/index'
import type { IllustObj } from '../interface/illustObj'

const { ipcSendSync } = window.electron
const STORE_PATH = ipcSendSync('app:getPath', null)

const ihs_base = store.state.useLocal
  ? store.state.localIHS
  : store.state.remoteIHS

const useLocal = store.state.useLocal

export class PathHelper {
  static getBaseUrl = () => {
    return STORE_PATH
  }

  static joinFilenamePath = (...paths) => {
    return path.join(...paths)
  }

  static getExtNameWithDot = (_path) => {
    return path.extname(_path)
  }

  static getBasename = (_path) => {
    return path.basename(_path)
  }

  static getPrefixName = (_path) => {
    const basename = path.basename(_path)
    return basename.substring(0, basename.lastIndexOf('.'))
  }
}

export class UrlGenerator {
  static getBlobUrl(obj: IllustObj, type: 'original' | 'medium' | 'large' | 'square_medium' | 's_large' = 'original') {
    if (obj.remote_base.type === 'pixiv') {
      if (type === 'original' || type === 's_large') {
        if (useLocal) {
          if (obj.remote_endpoint && obj.remote_base.origin_url) {
            return `${ihs_base}${obj.remote_base.origin_url}/${encodeURIComponent(
          obj.remote_endpoint,
        )}`
          }
          else if (obj.meta.original_url) {
            return this.getPixivUrlProxy(this.getPixivUrlSized(obj.meta.original_url, type))
          }
          else {
            return this.getPixivUrlCat(obj.meta.pid, obj.meta.page)
          }
        }
        else {
          if (obj.meta.original_url) {
            return this.getPixivUrlProxy(this.getPixivUrlSized(obj.meta.original_url, type))
          }
          else if (obj.remote_endpoint && obj.remote_base.origin_url) {
            return `${ihs_base}${obj.remote_base.origin_url}/${encodeURIComponent(
            obj.remote_endpoint,
          )}`
          }
          else {
            return this.getPixivUrlCat(obj.meta.pid, obj.meta.page)
          }
        }
      }
      else {
        if (obj.thumb_endpoint && obj.remote_base.thum_url) {
          return `${ihs_base}${obj.remote_base.thum_url}/${encodeURIComponent(
            obj.thumb_endpoint,
          )}`
        }
        else if (obj.meta.original_url) {
          return this.getPixivUrlProxy(this.getPixivUrlSized(obj.meta.original_url, type))
        }
        else { return this.getBlobUrl(obj, 'original') }
      }
    }
    else {
      if (type !== 'original' && type !== 's_large' && obj.remote_base.thum_url && obj.thumb_endpoint) {
        return `${obj.remote_base.type === 'cos' ? store.state.cos : ihs_base}${
          obj.remote_base.thum_url
        }/${encodeURIComponent(obj.thumb_endpoint)}`
      }
      else {
        return `${obj.remote_base.type === 'cos' ? store.state.cos : ihs_base}${
          obj.remote_base.origin_url
        }/${encodeURIComponent(obj.remote_endpoint)}`
      }
    }
  }

  static getPixivUrlProxy(url: string) {
    return url.replace('i.pximg.net', 'i.pixiv.re')
  }

  static getPixivUrlSized(url: string, size: 'original' | 'medium' | 'large' | 'square_medium' | 's_large' = 'original') {
    if (size === 'medium')
      return url.replace('img-original', 'c/540x540_70/img-master').replace(/\.[^.]*$/, '_master1200.jpg')
    else if (size === 'large')
      return url.replace('img-original', 'c/600x1200_90/img-master').replace(/\.[^.]*$/, '_master1200.jpg')
    else if (size === 'square_medium')
      return url.replace('img-original', 'c/360x360_70/img-master').replace(/\.[^.]*$/, '_square1200.jpg')
    else if (size === 's_large')
      return url.replace('img-original', 'img-master').replace(/\.[^.]*$/, '_master1200.jpg')
    else
      return url
  }

  static getPixivUrlCat(pid: number, page: number, ext?: string) {
    const url = new URL(
      `https://pixiv.re/${pid}${page === 0 ? '' : `-${page + 1}`}${
        ext ?? '.jpg'
      }`,
    )
    return url.href
  }
}
