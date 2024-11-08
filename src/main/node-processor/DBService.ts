import path from 'node:path'
import { app } from 'electron'
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
  static getProxyStr = () => {
    const proxyRaw: string | null | undefined = ConfigDB.getByKey('pixivProxy')
    if (
      proxyRaw
      && proxyRaw.match(
        /^((25[0-5]|2[0-4]\d|[01]?\d{1,2})\.){3}(25[0-5]|2[0-4]\d|[01]?\d{1,2}):[1-9]\d{0,4}$/,
      )
    ) {
      return `http://${proxyRaw}`
    }
    return ''
  }

  static getProxyObj = () => {
    const proxyStr = this.getProxyStr()
    if (proxyStr) {
      return {
        protocol: 'http',
        host: proxyStr.split(':')[0],
        port: Number(proxyStr.split(':')[1]),
      }
    }
    else {
      return null
    }
  }

  static setProxy = () => {
    const proxyStr = this.getProxyStr()
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
