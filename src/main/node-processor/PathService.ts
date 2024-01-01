import path from 'node:path'

export class PS {
  static join(...paths: string[]) {
    return path.join(...paths)
  }

  static extname(_path: string) {
    return path.extname(_path)
  }

  static basename(_path: string) {
    return path.basename(_path)
  }
}
