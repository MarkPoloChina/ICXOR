import path from 'node:path'
import fs from 'fs-extra'
import { app } from 'electron'

const STORE_PATH = path.join(app.getPath('userData'), 'config.json')
const DEFAULT = { initStatus: false, lastVisit: null }

export class ConfigDB {
  static initDB = () => {
    if (!fs.existsSync(STORE_PATH))
      fs.writeJSONSync(STORE_PATH, DEFAULT)

    const data: any = fs.readJSONSync(STORE_PATH)
    if (!data.initStatus)
      data.initStatus = true

    data.lastVisit = new Date().toISOString()
    fs.writeJSONSync(STORE_PATH, data)
  }

  static getByKey = (key: string) => {
    const data: any = fs.readJSONSync(STORE_PATH)
    return data[key]
  }

  static setByKey = (key: string, value: any) => {
    const data: any = fs.readJSONSync(STORE_PATH)
    data[key] = value
    fs.writeJSONSync(STORE_PATH, data)
  }
}
