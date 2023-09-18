import path from 'path-browserify'
import store from '@render/store/index'

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
  static getBlobUrl(obj: any, type: string) {
    if (obj.remote_endpoint) {
      return `${obj.remote_base.type === 'cos' ? store.state.cos : ihs_base}${
        type !== 'original' && obj.remote_base.thum_url
          ? obj.remote_base.thum_url
          : obj.remote_base.origin_url
      }/${encodeURIComponent(
        type !== 'original' && obj.thumb_endpoint
          ? obj.thumb_endpoint
          : obj.remote_endpoint,
      )}`
    }
    else if (obj.remote_base.type === 'pixiv') {
      if (type === 'original' && obj.meta.original_url)
        return obj.meta.original_url
      else if (obj.meta.thumb_url)
        return obj.meta.thumb_url
    }
    return ''
  }

  static getPixivUrlProxy(url: string) {
    return url.replace('i.pximg.net', 'i.pixiv.re')
  }

  static getPixivUrlCat(pid: number, page: number, ext: string) {
    const url = new URL(`https://pixiv.cat/${pid}-${page === 0 ? '' : page + 1}${ext}`)
    return url.href
  }
}
