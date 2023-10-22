import path from 'node:path'
import { extract } from 'zip-lib'
import getPixels from 'get-pixels'
import imageSize from 'image-size'
import GifEncoder from 'gif-encoder'
import fs from 'fs-extra'
import { FS } from './FSService'

export class GifCoverter {
  static async zipToGif(input: string, output: string, delay: number) {
    const tempDir = output.replace('.gif', '_temp')
    await extract(input, tempDir)
    const files = (await FS.parseFilenamesFromDirectoryAsync(tempDir)).map(file => path.join(tempDir, file))
    const imagesData: Uint8Array[] = []
    const dimensions = imageSize(files[0])
    for (const imagePath of files) {
      const imageData = await getImageData(imagePath)
      imagesData.push(imageData)
    }

    await createGif(dimensions.width, dimensions.height, delay, imagesData)

    await fs.remove(tempDir)

    async function getImageData(path: string): Promise<Uint8Array> {
      return new Promise((resolve, reject) => {
        getPixels(path, (err, pixels) => {
          if (err)
            reject(err)
          else
            resolve(new Uint8Array(pixels.data))
        })
      })
    }

    async function createGif(width: number, height: number, delay: number, images: Uint8Array[]) {
      return new Promise<void>((resolve, reject) => {
        const encoder = new GifEncoder(width, height)
        const outputStream = fs.createWriteStream(output)
        encoder.pipe(outputStream)
        encoder.setDelay(delay)
        encoder.setRepeat(0)
        encoder.writeHeader()

        for (const image of images) {
          encoder.addFrame(image)
          encoder.read()
        }

        encoder.finish()
        encoder.on('error', err => reject(err))
        resolve()
      })
    }
  }
}
