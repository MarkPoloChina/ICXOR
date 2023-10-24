import path from 'path-browserify'
import store from '@render/store/index'
import type { IllustObj } from '../interface/illustObj'

const { ipcSendSync } = window.electron
const STORE_PATH = ipcSendSync('app:getPath', null)

const ihs_base = store.state.useLocal
  ? store.state.localIHS
  : store.state.remoteIHS

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
  static getBlobUrl(obj: IllustObj, type: string) {
    if (obj.remote_base.type === 'pixiv') {
      if (type === 'original') {
        if (obj.remote_endpoint && obj.remote_base.origin_url) {
          return `${ihs_base}${obj.remote_base.origin_url}/${encodeURIComponent(
            obj.remote_endpoint,
          )}`
        }
        else if (obj.meta.original_url) {
          return this.getPixivUrlProxy(obj.meta.original_url)
        }
        else {
          return this.getPixivUrlCat(obj.meta.pid, obj.meta.page)
        }
      }
      else {
        if (obj.thumb_endpoint && obj.remote_base.thum_url) {
          return `${ihs_base}${obj.remote_base.thum_url}/${encodeURIComponent(
            obj.thumb_endpoint,
          )}`
        }
        else if (obj.meta.thumb_url) {
          return this.getPixivUrlProxy(obj.meta.thumb_url)
        }
        else { return this.getPixivUrlCat(obj.meta.pid, obj.meta.page) }
      }
    }
    else {
      if (type !== 'original' && obj.remote_base.thum_url && obj.thumb_endpoint) {
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

  static getPixivUrlCat(pid: number, page: number, ext?: string) {
    const url = new URL(
      `https://pixiv.re/${pid}${page === 0 ? '' : `-${page + 1}`}${
        ext ?? '.jpg'
      }`,
    )
    return url.href
  }
}
