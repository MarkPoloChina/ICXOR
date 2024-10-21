import path from 'node:path'
import { utilityProcess } from 'electron'

const childGifModule = path.join(__dirname, '../../resources/child-gif.js')
const childProcess = utilityProcess.fork(childGifModule)

export class GifCoverter {
  static async zipToGif(input: string, output: string, delay: number) {
    return new Promise<void>((resolve, reject) => {
      childProcess.on('message', (message) => {
        if (message === 'done') {
          childProcess.removeListener('message', () => {})
          resolve()
        }
        else if (message === 'err') {
          reject(new Error('GifCoverter error'))
        }
      })

      childProcess.postMessage({ message: 'start', input, output, delay })
    })
  }
}
