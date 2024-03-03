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
const localBackupPath = path.join(app.getPath('userData'), 'main.db.bak')
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

function getCloudTimestamp() {
  return new Promise<number>((resolve, reject) => {
    cos.getObject(
      {
        Bucket: ConfigDB.getByKey('cosBucket'),
        Region: ConfigDB.getByKey('cosRegion'),
        Key: cloudRecordPath,
      },
      (err, data) => {
        if (err) {
          reject(err)
        }
        else {
          const cloud_timestamp = JSON.parse(data.Body.toString()).timestamp
          resolve(Number(cloud_timestamp))
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
          timestamp: Number(fs.statSync(localFilePath).mtime),
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

function backupLocalFile() {
  fs.copyFileSync(localFilePath, localBackupPath)
}

export class CS {
  static async uploadFile() {
    if (!checkParam())
      throw new Error('invalid config')

    await updateCloudFile()
    await updateCloudRecord()
  }

  static async downloadFile() {
    if (!checkParam())
      throw new Error('invalid config')

    backupLocalFile()
    await downloadCloudFile()
    const currentStats = fs.statSync(localFilePath)
    fs.utimesSync(localFilePath, currentStats.atime, (await getCloudTimestamp()) / 1000)
  }

  static async getDoubleTimestamp() {
    if (!checkParam())
      throw new Error('invalid config')
    let cloudTimestamp = -1
    try {
      cloudTimestamp = await getCloudTimestamp()
    }
    catch (err) {
      if (err.statusCode !== 404)
        throw err
    }
    return {
      local: Number(fs.statSync(localFilePath).mtime),
      cloud: cloudTimestamp,
    }
  }
}
