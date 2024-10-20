import type { Poly } from '@main/illust/entities/poly.entities'
import type { IllustObj } from '../interface/illustObj'
import store from '@render/store/index'
import urlJoin from 'url-join'
import { FilenameResolver } from './filename'

const { ipcSendSync } = window.electron
const STORE_PATH = ipcSendSync('app:getPath', null)
const ihsBase = store.state.useLocalIHS ? store.state.localIHS : store.state.remoteIHS
const useDisk = store.state.mainMode === 'disk' || store.state.mainMode === 'both'
const useIHS = store.state.mainMode === 'ihs' || store.state.mainMode === 'both'

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

  static getLocalPath(obj: IllustObj) {
    if (store.state.diskMap[obj.remote_base.name]?.original && obj.remote_endpoint) {
      return this.joinFilenamePath(
        store.state.diskRoot,
        store.state.diskMap[obj.remote_base.name].original,
        obj.remote_endpoint,
      )
    }
    else {
      return null
    }
  }

  static getLocalThumbPath(obj: IllustObj) {
    if (store.state.diskMap[obj.remote_base.name]?.thumbnail && obj.thumb_endpoint) {
      return this.joinFilenamePath(
        store.state.diskRoot,
        store.state.diskMap[obj.remote_base.name]?.thumbnail,
        obj.thumb_endpoint,
      )
    }
    else {
      return null
    }
  }

  static getPicoltLocalPath(obj: IllustObj, targetPoly: Poly, need2x = false) {
    const base = need2x ? targetPoly.remote2x_base : targetPoly.remote_base
    if (base && obj.remote_endpoint) {
      return this.joinFilenamePath(store.state.picoltDiskBase, base, obj.remote_endpoint)
    }
    else {
      return null
    }
  }
}

export class UrlGenerator {
  static getBlobUrl(
    obj: IllustObj,
    type: 'original' | 'medium' | 'large' | 'square_medium' | 's_large' = 'original',
  ): string {
    if (type === 'original' || type === 's_large') {
      if (useDisk && obj.remote_endpoint && store.state.diskMap[obj.remote_base.name]?.original)
        return this.makeDiskUrl(PathHelper.getLocalPath(obj))
      if (
        useIHS
        && store.state.useLocalIHS
        && ihsBase
        && obj.remote_endpoint
        && obj.remote_base.origin_url
      ) {
        return this.getRemoteOriginUrl(obj)
      }
      if (obj.meta?.original_url)
        return this.getPixivUrlProxy(this.getPixivUrlSized(obj.meta.original_url, type))
      if (
        useIHS
        && !store.state.useLocalIHS
        && ihsBase
        && obj.remote_endpoint
        && obj.remote_base.origin_url
      ) {
        return this.getRemoteOriginUrl(obj)
      }
      if (obj.meta)
        return this.getPixivUrlCat(obj.meta.pid, obj.meta.page)
    }
    else {
      if (useDisk && obj.thumb_endpoint && store.state.diskMap[obj.remote_base.name]?.thumbnail)
        return this.makeDiskUrl(PathHelper.getLocalThumbPath(obj))
      if (useIHS && ihsBase && obj.thumb_endpoint && obj.remote_base.thum_url) {
        return this.getRemoteThumbUrl(obj)
      }
      if (obj.meta?.original_url)
        return this.getPixivUrlProxy(this.getPixivUrlSized(obj.meta.original_url, type))
      else return this.getBlobUrl(obj, 'original')
    }
    return ''
  }

  static getPicolt2xUrl(obj: IllustObj, targetPoly: Poly) {
    if (useDisk && targetPoly.remote2x_base && obj.remote_endpoint) {
      return this.makeDiskUrl(PathHelper.getPicoltLocalPath(obj, targetPoly, true))
    }
    else if (useIHS && ihsBase && targetPoly.remote2x_base && obj.remote_endpoint) {
      return urlJoin(
        ihsBase,
        store.state.picoltIHSBase,
        targetPoly.remote2x_base,
        obj.remote_endpoint,
      )
    }
    else {
      return null
    }
  }

  static getRemoteOriginUrl(obj: IllustObj) {
    return urlJoin(
      obj.remote_base.type === 'cos' ? store.state.cos : ihsBase,
      obj.remote_base.origin_url,
      encodeURIComponent(obj.remote_endpoint),
    )
  }

  static getRemoteThumbUrl(obj: IllustObj) {
    return urlJoin(
      obj.remote_base.type === 'cos' ? store.state.cos : ihsBase,
      obj.remote_base.thum_url,
      encodeURIComponent(obj.thumb_endpoint),
    )
  }

  private static makeDiskUrl(diskPath: string) {
    if (diskPath)
      return `icxorimg://s/?u=${encodeURIComponent(diskPath)}`
    else return ''
  }

  static getPixivUrlProxy(url: string) {
    if (store.state.pixivProxy)
      return url
    else return url.replace('i.pximg.net', 'i.pixiv.re')
  }

  static getPixivUrlSized(
    url: string,
    size: 'original' | 'medium' | 'large' | 'square_medium' | 's_large' = 'original',
  ) {
    if (size === 'medium') {
      return url
        .replace('_ugoira0', '')
        .replace('img-original', 'c/540x540_70/img-master')
        .replace(/\.[^.]*$/, '_master1200.jpg')
    }
    else if (size === 'large') {
      return url
        .replace('_ugoira0', '')
        .replace('img-original', 'c/600x1200_90/img-master')
        .replace(/\.[^.]*$/, '_master1200.jpg')
    }
    else if (size === 'square_medium') {
      return url
        .replace('_ugoira0', '')
        .replace('img-original', 'c/360x360_70/img-master')
        .replace(/\.[^.]*$/, '_square1200.jpg')
    }
    else if (size === 's_large') {
      return url
        .replace('_ugoira0', '')
        .replace('img-original', 'img-master')
        .replace(/\.[^.]*$/, '_master1200.jpg')
    }
    else {
      return url
    }
  }

  static getPixivUrlCat(pid: number, page: number, ext?: string) {
    const url = new URL(
      `https://pixiv.cat/${pid}${page === 0 ? '' : `-${page + 1}`}${ext ?? '.jpg'}`,
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
