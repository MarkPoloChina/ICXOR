import type { PixivIllust, UgoiraMetaData } from '@markpolochina/pixiv.ts'
import type { AxiosRequestConfig } from 'axios'
import path from 'node:path'
import axios from 'axios'
import { ConfigDB } from './DBService'
import { FS } from './FSService'
import { GifCoverter } from './MediaService'

export class DS {
  private static proxyStr = ''
  public static setProxy() {
    const proxyStr: string | null | undefined = ConfigDB.getByKey('pixivProxy')
    if (
      proxyStr
      && proxyStr.match(
        /^((25[0-5]|2[0-4]\d|[01]?\d{1,2})\.){3}(25[0-5]|2[0-4]\d|[01]?\d{1,2}):[1-9]\d{0,4}$/,
      )
    ) {
      this.proxyStr = proxyStr
    }
  }

  private static async downloadFromUrl(url: string, isPixiv?: boolean): Promise<ArrayBuffer> {
    const axiosConfig: AxiosRequestConfig = {
      responseType: 'arraybuffer',
    }
    if (isPixiv) {
      axiosConfig.headers = {
        Referer: 'https://www.pixiv.net/',
      }
      if (this.proxyStr) {
        axiosConfig.proxy = {
          protocol: 'http',
          host: this.proxyStr.split(':')[0],
          port: Number(this.proxyStr.split(':')[1]),
        }
      }
    }
    const response = await axios.get(url, axiosConfig)
    if (
      response.status === 200
      && response.headers['content-type'].toString().startsWith('image')
    ) {
      return response.data
    }
    else {
      throw new Error(`Failed to download image: HTTP status ${response.status}`)
    }
  }

  public static async downloadAndSave(
    url: string,
    dir: string,
    isPixiv?: boolean,
  ): Promise<boolean> {
    if (url.startsWith('icxorimg://'))
      url = decodeURIComponent(url.replace('icxorimg://s/?u=', ''))
    const filename = path.basename(url)
    if (!(await FS.isExists(path.join(dir, filename)))) {
      if (url.startsWith('http'))
        await FS.saveArrayBufferTo(await this.downloadFromUrl(url, isPixiv), filename, dir)
      else await FS.localCopy(url, path.join(dir, filename))
      return true
    }
    else {
      return false
    }
  }

  public static async download2xAndSave(url: string, dir: string): Promise<boolean> {
    if (url.startsWith('icxorimg://')) {
      url = decodeURIComponent(url.replace('icxorimg://s/?u=', ''))
      if (!(await FS.isExists(url))) {
        url = url.replace(/(\.[^/.]+)$/, `.png`)
        if (!(await FS.isExists(url)))
          throw new Error('Try ori and PNG but Neither.')
      }
      if (!(await FS.isExists(path.join(dir, path.basename(url))))) {
        await FS.localCopy(url, path.join(dir, path.basename(url)))
        return true
      }
      else {
        return false
      }
    }
    else {
      let ab: ArrayBuffer = null
      try {
        ab = await this.downloadFromUrl(url, false)
      }
      catch {
        url = url.replace(/(\.[^/.]+)$/, `.png`)
        try {
          ab = await this.downloadFromUrl(url, false)
        }
        catch {
          throw new Error('Try ori and PNG but Neither.')
        }
      }
      if (!(await FS.isExists(path.join(dir, path.basename(url))))) {
        await FS.saveArrayBufferTo(ab, path.basename(url), dir)
        return true
      }
      else {
        return false
      }
    }
  }

  public static async downloadFromIllustObj(illustObj: PixivIllust, dir: string, page?: number) {
    const urls: string[] = []
    if (!illustObj.visible)
      throw new Error('Visit Deny.')
    if (illustObj.type === 'ugoira')
      throw new Error('Ugoira type.')
    if (page === 0) {
      const url
        = illustObj.page_count === 1
          ? illustObj.meta_single_page.original_image_url
          : illustObj.meta_pages[0].image_urls.original
      urls.push(url)
    }
    else if (page) {
      if (illustObj.page_count <= page)
        throw new Error('No such page.')
      const url = illustObj.meta_pages[page].image_urls.original
      urls.push(url)
    }
    else {
      urls.push(
        ...(illustObj.page_count === 1
          ? [illustObj.meta_single_page.original_image_url]
          : illustObj.meta_pages.map(ele => ele.image_urls.original)),
      )
    }
    let hasRealDownload = false
    for (const url of urls) {
      const downloaded = await this.downloadAndSave(url, dir, true)
      if (downloaded)
        hasRealDownload = true
    }
    return hasRealDownload
  }

  public static async downloadFromUgoira(
    illustObj: PixivIllust,
    dir: string,
    meta: UgoiraMetaData,
  ) {
    if (!illustObj.visible)
      throw new Error('Visit Deny.')
    if (illustObj.type !== 'ugoira')
      throw new Error('Not Ugoira type.')
    if (!(await FS.isExists(path.join(dir, `${illustObj.id}.gif`)))) {
      const delay = meta.ugoira_metadata.frames[0].delay
      const url = illustObj.meta_single_page.original_image_url
        .replace('img-original', 'img-zip-ugoira')
        .replace(/_ugoira0\.(.*)/, '_ugoira1920x1080.zip')
      const ab = await this.downloadFromUrl(url, true)
      const filename = `${illustObj.id}@${delay}ms.zip`
      await FS.saveArrayBufferTo(ab, filename, dir)
      await GifCoverter.zipToGif(
        path.join(dir, filename),
        path.join(dir, `${illustObj.id}.gif`),
        delay,
      )
    }
    else {
      return false
    }
  }
}
DS.setProxy()
