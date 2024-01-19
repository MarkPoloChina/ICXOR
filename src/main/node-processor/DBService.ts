import path from 'node:path'
import fs from 'fs-extra'
import { app } from 'electron'

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
