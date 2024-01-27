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
const cloudRecordPath = 'icxor/latest.json'

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

function compareLatest(isDownload: boolean): Promise<boolean> {
  return new Promise((resolve, reject) => {
    cos.getObject(
      {
        Bucket: ConfigDB.getByKey('cosBucket'),
        Region: ConfigDB.getByKey('cosRegion'),
        Key: cloudRecordPath,
      },
      (err, data) => {
        if (err) {
          if (!isDownload && err.statusCode === 404)
            resolve(true)
          else
            reject(err)
        }
        else {
          const local_timestamp = fs.statSync(localFilePath).mtimeMs
          const cloud_timestamp = JSON.parse(data.Body.toString()).timestamp
          if (isDownload)
            resolve(cloud_timestamp > local_timestamp)
          else
            resolve(cloud_timestamp < local_timestamp)
        }
      },
    )
  })
}

function updateCloudRecord() {
  return new Promise<void>((resolve, reject) => {
    cos.putObject(
      {
        Bucket: ConfigDB.getByKey('cosBucket'),
        Region: ConfigDB.getByKey('cosRegion'),
        Key: cloudRecordPath,
        Body: JSON.stringify({
          timestamp: fs.statSync(localFilePath).mtimeMs,
        }),
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

function updateCloudFile() {
  return new Promise<void>((resolve, reject) => {
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

function downloadCloudFile() {
  return new Promise<void>((resolve, reject) => {
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

export class CS {
  static async uploadFile() {
    if (!checkParam())
      throw new Error('invalid config')

    const shouldUpload = await compareLatest(false)
    if (shouldUpload) {
      await updateCloudFile()
      await updateCloudRecord()
      return true
    }
    else {
      return false
    }
  }

  static async downloadFile() {
    if (!checkParam())
      throw new Error('invalid config')

    const shouldDownload = await compareLatest(true)
    if (shouldDownload) {
      await downloadCloudFile()
      return true
    }

    else { return false }
  }
}
