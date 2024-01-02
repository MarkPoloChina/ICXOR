import path from 'node:path'
import fs from 'node:fs'
import COS from 'cos-nodejs-sdk-v5'
import { app } from 'electron'
import { ConfigDB } from './DBService'

let cos: COS = null

const cosParam = {
  cosSecretId: null,
  cosSecretKey: null,
  cosBucket: null,
  cosRegion: null,
}

const localFilePath = path.join(app.getPath('userData'), 'main.db')
const cloudFilePath = 'icxor/main.db'

function checkParam() {
  Object.keys(cosParam).forEach((key) => {
    if (!cosParam[key])
      cosParam[key] = ConfigDB.getByKey(key)
  })
  if (Object.keys(cosParam).find(key => !cosParam[key]))
    return false
  if (!cos) {
    cos = new COS({
      SecretId: cosParam.cosSecretId,
      SecretKey: cosParam.cosSecretKey,
    })
  }
  return true
}

export class CS {
  static async uploadFile(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!checkParam()) {
        reject(new Error('invalid config'))
        return
      }

      cos.uploadFile(
        {
          Bucket: ConfigDB.getByKey('cosBucket'),
          Region: ConfigDB.getByKey('cosRegion'),
          Key: cloudFilePath,
          FilePath: localFilePath,
        },
        (err) => {
          if (err)
            reject(err)

          else
            resolve()
        },
      )
    })
  }

  static async downloadFile(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!checkParam()) {
        reject(new Error('invalid config'))
        return
      }

      cos.getObject(
        {
          Bucket: ConfigDB.getByKey('cosBucket'),
          Region: ConfigDB.getByKey('cosRegion'),
          Key: cloudFilePath,
          Output: fs.createWriteStream(localFilePath),
        },
        (err) => {
          if (err)
            reject(err)

          else
            resolve()
        },
      )
    })
  }
}
