import path from 'node:path'
import fs from 'fs-extra'
import { app } from 'electron'

const STORE_PATH = path.join(app.getPath('userData'), 'config.json')
const DEFAULT = { lastVisit: null }

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
