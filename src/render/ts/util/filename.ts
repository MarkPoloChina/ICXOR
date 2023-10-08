import { PathHelper } from './path'

function getExt(filename: string) {
  return ['jpg', 'png', 'gif', 'jpeg'].find(
    str => `.${str}` === PathHelper.getExtNameWithDot(filename).toLowerCase(),
  )
}

const possibleMatch = {
  web: (basename) => {
    if (/^\d+_p\d+$/.test(basename)) {
      return {
        title: null,
        pid: /^(\d+)_p\d+$/.exec(basename)[1],
        page: /^\d+_p(\d+)$/.exec(basename)[1],
      }
    }
    else {
      return null
    }
  },
  webGif: (basename: string, ext?: string) => {
    if (ext === 'gif' && /^\d+$/.test(basename)) {
      return {
        title: null,
        pid: /^(\d+)$/.exec(basename)[1],
        page: 0,
      }
    }
    else {
      return null
    }
  },
  pxderMultiple: (basename) => {
    if (/^\(\d+\)/.test(basename) && /_p\d+$/.test(basename)) {
      return {
        title: /^\(\d+\)(.*)?_p\d+$/.exec(basename)[1] || '',
        pid: /^\((\d+)\)/.exec(basename)[1],
        page: /_p(\d+)$/.exec(basename)[1],
      }
    }
    else {
      return null
    }
  },
  pxderSingle: (basename) => {
    if (/^\(\d+\)/.test(basename)) {
      return {
        title: /^\(\d+\)(.*)?$/.exec(basename)[1] || '',
        pid: /^\((\d+)\)/.exec(basename)[1],
        page: '0',
      }
    }
    else {
      return null
    }
  },
  webWithBookmark: (basename) => {
    if (/^\d+ - \d+_p\d+$/.test(basename)) {
      return {
        title: null,
        pid: /^\d+ - (\d+)_p\d+$/.exec(basename)[1],
        page: /^\d+ - \d+_p(\d+)$/.exec(basename)[1],
      }
    }
    else {
      return null
    }
  },
  webWithBookmarkRank: (basename) => {
    if (/^\d+ - \d+ - \d+_p\d+$/.test(basename)) {
      return {
        title: null,
        pid: /^\d+ - \d+ - (\d+)_p\d+$/.exec(basename)[1],
        page: /^\d+ - \d+ - \d+_p(\d+)$/.exec(basename)[1],
      }
    }
    else {
      return null
    }
  },
  Bilibili: (basename) => {
    if (basename.startsWith('bili_')) {
      return {
        coreId: /^bili_(\S+)$/.exec(basename)[1],
      }
    }
    else {
      return null
    }
  },
  Arknights_Char: (basename) => {
    if (basename.startsWith('char_')) {
      return {
        coreId: basename,
      }
    }
    else {
      return null
    }
  },
  BA: (basename) => {
    if (basename.startsWith('BA_')) {
      return {
        coreId: basename,
      }
    }
    else {
      return null
    }
  },
}

export class FilenameResolver {
  static getObjFromFilename(filename) {
    const extname = getExt(filename)
    if (!extname)
      return
    for (const match of Object.keys(possibleMatch)) {
      const res = possibleMatch[match](PathHelper.getPrefixName(filename), extname)
      if (res) {
        return {
          extname,
          match,
          ...res,
        }
      }
    }
    return null
  }

  static generatePxderSingleFilename(pid, title, ext) {
    if (pid && ext)
      return `(${pid})${title || ''}.${ext}`
    else if (pid)
      return `(${pid})${title || ''}`
    else return null
  }

  static generatePxderMultipleFilename(pid, page, title, ext) {
    if (pid && page !== null && page !== '' && ext)
      return `(${pid})${title || ''}_p${page}.${ext}`
    else if (pid && page !== null && page !== '')
      return `(${pid})${title || ''}_p${page}`
    else return null
  }

  static generatePixivWebFilename(pid, page, ext) {
    if (pid && page !== null && page !== '' && ext)
      return `${pid}_p${page}.${ext}`
    else if (pid && page !== null && page !== '')
      return `${pid}_p${page}`
    else return null
  }
}

/**
 * Used to start load from file system.
 * @class
 */
export class FilenameAdapter {
  /**
   * 将文件名批量转化成dto, 含自动注入
   * @function
   */
  static getDtoList = async (
    paths: string[],
    autoInject: {
      defaultRemoteBaseId: number | undefined
      metaTitle: boolean
      remoteEndpointForPixiv: boolean
      jpgForThumbEndpoint: boolean
      remoteEndpointPrefixForDefault: string
    },
  ) => {
    const logs: {
      oriIdx: number
      filename: string
      status: string
      dto: any
      message: string
    }[] = []
    let index = 0
    for (const item of paths) {
      const filename = PathHelper.getBasename(item)
      const log = {
        oriIdx: index,
        filename,
        status: 'ready',
        dto: null,
        message: '',
      }
      const reso = FilenameResolver.getObjFromFilename(filename)
      if (
        reso === undefined
        || (reso === null && !autoInject.defaultRemoteBaseId)
      ) {
        log.status = 'ignore'
        log.message = '不可识别的文件'
      }
      else if (reso === null) {
        log.message = '一般图片文件'
        log.dto = {
          remote_endpoint: `${
            autoInject.remoteEndpointPrefixForDefault || ''
          }${filename}`,
          remote_base: {
            id: autoInject.defaultRemoteBaseId,
          },
        }
      }
      else if (reso.pid) {
        log.message = 'Pixiv Target OK'
        log.dto = {
          meta: {
            pid: reso.pid,
            page: reso.page,
            title: autoInject.metaTitle ? reso.title : null,
          },
          remote_base: {
            name: 'Pixiv',
          },
        }
        if (autoInject.remoteEndpointForPixiv)
          log.dto.remote_endpoint = `${filename}`
      }
      else {
        log.message = `Other Target OK with ${reso.match}`
        log.dto = {
          remote_endpoint: `${reso.coreId}.${reso.extname}`,
          remote_base: {
            name: reso.match,
          },
        }
      }
      if (log.dto && log.dto.remote_endpoint && autoInject.jpgForThumbEndpoint)
        log.dto.thumb_endpoint = `${PathHelper.getPrefixName(log.dto.remote_endpoint)}.jpg`
      logs.push(log)
      index++
    }
    return logs
  }

  /**
   * 将文件名批量转化成dto, 仅用作识别
   * @function
   */
  static getDtoRecoList = async (paths: string[]) => {
    const logs: {
      oriIdx: number
      filename: string
      status: string
      dto: any
      message: string
    }[] = []
    let index = 0
    for (const item of paths) {
      const filename = PathHelper.getBasename(item)
      const log = {
        oriIdx: index,
        filename,
        status: 'ready',
        dto: null,
        message: '',
      }
      const reso = FilenameResolver.getObjFromFilename(filename)
      if (reso === undefined) {
        log.status = 'ignore'
        log.message = '不可识别的文件'
      }
      else if (reso === null) {
        log.message = '一般图片文件'
        log.dto = {
          remote_endpoint: `${filename}`,
        }
      }
      else if (reso.pid) {
        log.message = 'Pixiv Target OK'
        log.dto = {
          meta: {
            pid: reso.pid,
            page: reso.page,
          },
        }
      }
      else {
        log.message = `Other Target OK with ${reso.match}`
        log.dto = {
          remote_endpoint: `${reso.coreId}.${reso.extname}`,
        }
      }
      logs.push(log)
      index++
    }
    return logs
  }
}
