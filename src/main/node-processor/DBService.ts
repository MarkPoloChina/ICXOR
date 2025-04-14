import path from 'node:path'
import { app, session } from 'electron'
import fs from 'fs-extra'

const STORE_PATH = path.join(app.getPath('userData'), 'config.json')
const LOCAL_STORE_PATH = path.join(app.getPath('userData'), 'local.json')
const DEFAULT = { lastVisit: null }
const LOCAL_DEFAULT = { localBase: {} }

export class ConfigDB {
  static initDB = () => {
    this.setByKey('lastVisit', new Date().toISOString())
  }

  static getByKey = (key: string) => {
    if (!fs.existsSync(STORE_PATH))
      fs.writeJSONSync(STORE_PATH, DEFAULT)

    const data: any = fs.readJSONSync(STORE_PATH)
    return data[key]
  }

  static setByKey = (key: string, value: any) => {
    if (!fs.existsSync(STORE_PATH))
      fs.writeJSONSync(STORE_PATH, DEFAULT)

    const data: any = fs.readJSONSync(STORE_PATH)
    data[key] = value
    fs.writeJSONSync(STORE_PATH, data)
  }
}

export class LocalDiskDB {
  static initDB = () => {
    this.getByKey('localBase')
  }

  static getByKey = (key: string) => {
    if (!fs.existsSync(LOCAL_STORE_PATH))
      fs.writeJSONSync(LOCAL_STORE_PATH, LOCAL_DEFAULT)

    const data: any = fs.readJSONSync(LOCAL_STORE_PATH)
    return data[key]
  }

  static setByKey = (key: string, value: any) => {
    if (!fs.existsSync(LOCAL_STORE_PATH))
      fs.writeJSONSync(LOCAL_STORE_PATH, LOCAL_DEFAULT)

    const data: any = fs.readJSONSync(LOCAL_STORE_PATH)
    data[key] = value
    fs.writeJSONSync(LOCAL_STORE_PATH, data)
  }

  static getLocalBaseOriginalByName = (name: string) => {
    const localBase = this.getByKey('localBase')
    return localBase[name]?.original ?? null
  }

  static setLocalBaseOriginalByName = (name: string, original: string) => {
    const localBase = this.getByKey('localBase')
    if (!localBase[name])
      localBase[name] = {}
    localBase[name].original = original
    this.setByKey('localBase', localBase)
  }

  static getLocalBaseThumbnailByName = (name: string) => {
    const localBase = this.getByKey('localBase')
    return localBase[name]?.thumbnail ?? null
  }

  static setLocalBaseThumbnailByName = (name: string, thumbnail: string) => {
    const localBase = this.getByKey('localBase')
    if (!localBase[name])
      localBase[name] = {}
    localBase[name].thumbnail = thumbnail
    this.setByKey('localBase', localBase)
  }
}

export class ProxyParser {
  private static getSystemProxy = async () => {
    const proxyUrl = await session.defaultSession.resolveProxy('https://www.pixiv.com')
    if (proxyUrl.match(/^PROXY /)) {
      // proxyUrl 是这种格式: 'PROXY 127.0.0.1:6152'
      const hostAndPort = proxyUrl.split(' ')[1]
      const [proxyHost, proxyPort] = hostAndPort.split(':')
      return {
        protocol: 'http',
        host: proxyHost,
        port: Number(proxyPort),
      }
    }
    else {
      return null
    }
  }

  static getProxyObj = async () => {
    const mode: null | undefined | 'none' | 'system' | 'manual' = ConfigDB.getByKey('proxyMode')
    switch (mode) {
      case 'system':
      {
        return await this.getSystemProxy()
      }
      case 'manual':
      {
        const proxyRaw: string | null | undefined = ConfigDB.getByKey('proxyManual')
        if (
          proxyRaw
          && proxyRaw.match(
            /^((25[0-5]|2[0-4]\d|[01]?\d{1,2})\.){3}(25[0-5]|2[0-4]\d|[01]?\d{1,2}):[1-9]\d{0,4}$/,
          )
        ) {
          return {
            protocol: 'http',
            host: proxyRaw.split(':')[0],
            port: Number(proxyRaw.split(':')[1]),
          }
        }
        else {
          return null
        }
      }
      default:
        return null
    }
  }

  static getProxyStr = async () => {
    const proxyObj = await this.getProxyObj()
    if (proxyObj) {
      return `${proxyObj.protocol}://${proxyObj.host}:${proxyObj.port}`
    }
    else {
      return ''
    }
  }

  static setProxy = async () => {
    const proxyStr = await this.getProxyStr()
    if (proxyStr) {
      process.env.HTTP_PROXY = proxyStr
      process.env.HTTPS_PROXY = proxyStr
      return true
    }
    else {
      return false
    }
  }
}
