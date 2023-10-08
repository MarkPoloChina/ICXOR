import path from 'node:path'
import type { AxiosRequestConfig } from 'axios'
import type { PixivIllust } from '@markpolochina/pixiv.ts'
import axios from 'axios'
import { FS } from './FSService'
import { ConfigDB } from './DBService'

export class DS {
  private static proxyStr = ''
  public static setProxy() {
    const proxyStr: string | null | undefined = ConfigDB.getByKey('pixivProxy')
    if (
      proxyStr
      && proxyStr.match(
        /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\:[1-9]\d{0,4}$/,
      )
    )
      this.proxyStr = proxyStr
  }

  private static async downloadFromUrl(
    url: string,
    isPixiv?: boolean,
  ): Promise<ArrayBuffer> {
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
    if (response.status === 200) {
      return response.data
    }
    else {
      throw new Error(
        `Failed to download image: HTTP status ${response.status}`,
      )
    }
  }

  public static async downloadAndSave(
    url: string,
    filename: string,
    dir: string,
  ): Promise<void> {
    await FS.saveArrayBufferTo(await this.downloadFromUrl(url), filename, dir)
  }

  public static async downloadFromIllustObj(
    illustObj: PixivIllust,
    dir: string,
    page?: number,
  ) {
    const urls = []
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
    const process = async (url: string) => {
      const ab = await this.downloadFromUrl(url, true)
      await FS.saveArrayBufferTo(ab, path.basename(url), dir)
    }
    const promises = urls.map(url => process(url))
    await Promise.all(promises)
  }
}
DS.setProxy()
