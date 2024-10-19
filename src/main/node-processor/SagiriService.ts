import type { Buffer } from 'node:buffer'
import type { Readable } from 'node:stream'
import type { Options, SagiriResult } from 'sagiri'
import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import sagiri from 'sagiri'
import { ConfigDB } from './DBService'

type File = string | Buffer | Readable
let client: (file: File, optionOverrides?: Options) => Promise<SagiriResult[]> = null
const sleep_func = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const RESULT_ROOT = path.join(app.getPath('userData'), 'sagiri_result')
const GLOBAL_SIMILARITY_THRESHOLD = 75

class ProcessCore {
  static pixivFilter(json_obj: SagiriResult[]) {
    for (const result of json_obj) {
      if (result.similarity > GLOBAL_SIMILARITY_THRESHOLD && result.site === 'Pixiv') {
        return (
          new URL(result.url).searchParams.get('illust_id')
            ?? result.url.split('/')[result.url.split('/').length - 1]
        )
      }

      if (
        result.similarity > GLOBAL_SIMILARITY_THRESHOLD
        && result.raw?.data?.source?.startsWith('https://i.pximg.net')
      ) {
        return result.raw?.data?.source?.split('/')[result.raw?.data?.source?.split('/').length - 1]
      }

      if (
        result.similarity > GLOBAL_SIMILARITY_THRESHOLD
        && result.raw?.data?.source?.startsWith('https://www.pixiv.net')
      ) {
        return result.raw?.data?.source?.split('/')[result.raw?.data?.source?.split('/').length - 1]
      }
    }
  }

  static twiiterAllFilter(json_obj: SagiriResult[]) {
    for (const result of json_obj) {
      if (result.similarity > GLOBAL_SIMILARITY_THRESHOLD && result.site === 'Twitter')
        return result.url

      if (
        result.similarity > GLOBAL_SIMILARITY_THRESHOLD
        && result.raw?.data?.source?.startsWith('https://twitter.com')
      ) {
        return result.raw?.data?.source.split(' ')[0]
      }
    }
  }

  static twiiterWithoutPixivFilter(json_obj: SagiriResult[]) {
    for (const result of json_obj) {
      if (result.similarity > GLOBAL_SIMILARITY_THRESHOLD && result.site === 'Pixiv')
        return

      if (
        result.similarity > GLOBAL_SIMILARITY_THRESHOLD
        && result.raw?.data?.source?.startsWith('https://i.pximg.net')
      ) {
        return
      }

      if (
        result.similarity > GLOBAL_SIMILARITY_THRESHOLD
        && result.raw?.data?.source?.startsWith('https://www.pixiv.net')
      ) {
        return
      }
    }
    return this.twiiterAllFilter(json_obj)
  }
}

export class SS {
  static async init() {
    if (!fs.existsSync(RESULT_ROOT))
      fs.mkdirSync(RESULT_ROOT)
    const token = ConfigDB.getByKey('sauceNAOToken')
    if (token)
      client = sagiri(token)
  }

  static async runBatchAndDump(dir: string) {
    if (!client)
      throw new Error('SauceNAO client not initialized')
    const files = fs
      .readdirSync(dir)
      .filter(file => ['.png', '.jpg', '.jpeg'].includes(path.extname(file).toLowerCase()))

    for (const file of files) {
      const prefix = path.basename(file, path.extname(file))
      if (fs.existsSync(path.join(RESULT_ROOT, `${prefix}.json`)))
        continue
      const fileSize = fs.statSync(path.join(dir, file)).size
      if (fileSize > 20 * 1024 * 1024)
        continue
      const process = async () => {
        try {
          const result = await client(path.join(dir, file))
          fs.writeFileSync(path.join(RESULT_ROOT, `${prefix}.json`), JSON.stringify(result))
          await sleep_func(3000)
        }
        catch (err) {
          if (err.statusCode !== 413) {
            await sleep_func(10000)
            await process()
          }
        }
      }
      await process()
    }
  }

  static async runAndProcess(filePath: string) {
    if (!client)
      throw new Error('SauceNAO client not initialized')

    if (!['.png', '.jpg', '.jpeg'].includes(path.extname(filePath).toLowerCase()))
      return { error: 'Invalid file type' }

    const prefix = path.basename(filePath, path.extname(filePath))
    if (fs.existsSync(path.join(RESULT_ROOT, `${prefix}.json`)))
      return { error: 'Result already exists' }

    const fileSize = fs.statSync(filePath).size
    if (fileSize > 20 * 1024 * 1024)
      return { error: 'File size too large' }

    let retry = 0

    const process = async () => {
      try {
        const result = await client(filePath)
        return {
          pixiv: ProcessCore.pixivFilter(result),
          twitter: ProcessCore.twiiterAllFilter(result),
        }
      }
      catch (err) {
        if (retry++ < 3) {
          await sleep_func(10000)
          return await process()
        }
        else {
          return { error: `Failed to process image ${err}` }
        }
      }
    }
    return await process()
  }

  static parseJsonResult(filePath: string) {
    const json = fs.readFileSync(filePath, 'utf-8')
    const result: SagiriResult[] = JSON.parse(json)
    return {
      pixiv: ProcessCore.pixivFilter(result),
      twitter: ProcessCore.twiiterAllFilter(result),
    }
  }
}

SS.init()
