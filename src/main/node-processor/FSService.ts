import path from 'node:path'
import { Buffer } from 'node:buffer'
import fs from 'fs-extra'

export class FS {
  static saveArrayBufferTo(ab, filename: string, dir: string) {
    return fs.outputFile(path.join(dir, filename), Buffer.from(ab))
  }

  static async parseFilenamesFromDirectoryAsync(dir: string) {
    return (await fs.readdir(dir)).filter((value) => {
      return fs.statSync(path.join(dir, value)).isFile()
    })
  }

  static async localCopy(source: string, dest: string) {
    return fs.copyFile(source, dest)
  }

  static async isExists(path: string) {
    return await fs.pathExists(path)
  }

  static async loadStringFromFile(path: string) {
    return await fs.readFile(path, 'utf8')
  }
}
