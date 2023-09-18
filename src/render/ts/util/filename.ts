import path from 'path-browserify'

const extAllow = ['jpg', 'png', 'gif', 'jpeg']

// const sleep = async () => {
//   return await new Promise((resolve) => {
//     setTimeout(resolve, 1);
//   });
// };

function getEXt(filename: string) {
  return extAllow.find(
    str => `.${str}` === path.extname(filename).toLowerCase(),
  )
}

function getBasename(filename: string) {
  return filename.substring(0, filename.lastIndexOf('.'))
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
    else { return null }
  },
  pxderMultiple: (basename) => {
    if (/^\(\d+\)/.test(basename) && /_p\d+$/.test(basename)) {
      return {
        title: /^\(\d+\)(.*)?_p\d+$/.exec(basename)[1] || '',
        pid: /^\((\d+)\)/.exec(basename)[1],
        page: /_p(\d+)$/.exec(basename)[1],
      }
    }
    else { return null }
  },
  pxderSingle: (basename) => {
    if (/^\(\d+\)/.test(basename)) {
      return {
        title: /^\(\d+\)(.*)?$/.exec(basename)[1] || '',
        pid: /^\((\d+)\)/.exec(basename)[1],
        page: '0',
      }
    }
    else { return null }
  },
  webWithBookmark: (basename) => {
    if (/^\d+ - \d+_p\d+$/.test(basename)) {
      return {
        title: null,
        pid: /^\d+ - (\d+)_p\d+$/.exec(basename)[1],
        page: /^\d+ - \d+_p(\d+)$/.exec(basename)[1],
      }
    }
    else { return null }
  },
  webWithBookmarkRank: (basename) => {
    if (/^\d+ - \d+ - \d+_p\d+$/.test(basename)) {
      return {
        title: null,
        pid: /^\d+ - \d+ - (\d+)_p\d+$/.exec(basename)[1],
        page: /^\d+ - \d+ - \d+_p(\d+)$/.exec(basename)[1],
      }
    }
    else { return null }
  },
  Bilibili: (basename) => {
    if (basename.startsWith('bili_')) {
      return {
        coreId: /^bili_(\S+)$/.exec(basename)[1],
      }
    }
    else { return null }
  },
  Arknights_Char: (basename) => {
    if (basename.startsWith('char_')) {
      return {
        coreId: basename,
      }
    }
    else { return null }
  },
  BA: (basename) => {
    if (basename.startsWith('BA_')) {
      return {
        coreId: basename,
      }
    }
    else { return null }
  },
}

export class FilenameResolver {
  static getObjFromFilename(filename) {
    const extname = getEXt(filename)
    if (!extname)
      return
    for (const match of Object.keys(possibleMatch)) {
      const res = possibleMatch[match](getBasename(filename))
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
  // 将文件名批量转化成dto
  static getDtoList = async (paths: string[], autokeys: any, acceptNormal: boolean) => {
    const logs = []
    let index = 0
    for (const item of paths) {
      const filename = path.basename(item)
      const log = {
        oriIdx: index,
        filename,
        status: 'ready',
        dto: null,
        message: '',
      }
      const reso = FilenameResolver.getObjFromFilename(filename)
      if (reso === undefined || (reso === null && !acceptNormal)) {
        log.status = 'ignore'
        log.message = '不可识别的文件'
      }
      else if (reso === null) {
        log.message = '一般图片文件'
        log.dto = {
          remote_endpoint: `${autokeys.remote_endpoint || ''}${filename}`,
        }
      }
      else if (reso.pid) {
        log.message = 'Pixiv Target OK'
        log.dto = {
          meta: {
            pid: reso.pid,
            page: reso.page,
            title: autokeys['meta.title'] ? reso.title : null,
          },
          remote_base: {
            name: 'Pixiv',
          },
        }
        if (autokeys.REFORPIXIV)
          log.dto.remote_endpoint = `${filename}`
      }
      else {
        log.message = `Other Target OK with ${reso.match}`
        log.dto = {
          remote_endpoint: `${autokeys.remote_endpoint || ''}${
            reso.coreId
          }.${reso.extname}`,
          remote_base: {
            name: reso.match,
          },
        }
      }
      if (log.dto && log.dto.remote_endpoint && autokeys.thumb_endpoint)
        log.dto.thumb_endpoint = `${getBasename(log.dto.remote_endpoint)}.jpg`
      logs.push(log)
      index++
    }
    return logs
  }
}
