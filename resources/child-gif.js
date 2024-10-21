const path = require('node:path')
const fs = require('fs-extra')
const getPixels = require('get-pixels')
const GifEncoder = require('gif-encoder')
const imageSize = require('image-size')
const { extract } = require('zip-lib')

process.parentPort.on('message', async (e) => {
  if (e.data.message === 'start') {
    try {
      await zipToGif(e.data.input, e.data.output, e.data.delay)
      process.parentPort.postMessage('done')
    }
    catch {
      process.parentPort.postMessage('err')
    }
  }
  else if (e.data.message === 'exit') {
    process.exit()
  }
})

/**
 * Zip To GIF
 * @param {string} input
 * @param {string} output
 * @param {number} delay
 */
async function zipToGif(input, output, delay) {
  const tempDir = output.replace('.gif', '_temp')
  await extract(input, tempDir)
  const files = (await fs.readdir(tempDir))
    .filter((value) => {
      return fs.statSync(path.join(tempDir, value)).isFile()
    })
    .map(file => path.join(tempDir, file))

  /**
   * @type {Uint8Array[]}
   */
  const imagesData = []
  const dimensions = imageSize(files[0])
  for (const imagePath of files) {
    const imageData = await getImageData(imagePath)
    imagesData.push(imageData)
  }

  await createGif(dimensions.width, dimensions.height, delay, imagesData)

  await fs.remove(tempDir)

  /**
   * get Image Data
   * @param {string} path
   * @returns {Promise<Uint8Array>} imageData
   */
  async function getImageData(path) {
    return new Promise((resolve, reject) => {
      getPixels(path, (err, pixels) => {
        if (err)
          reject(err)
        else resolve(new Uint8Array(pixels.data))
      })
    })
  }

  /**
   * create Gif
   * @param {number} width
   * @param {number} height
   * @param {number} delay
   * @param {Uint8Array[]} images
   * @returns {Promise<void>}
   */
  async function createGif(width, height, delay, images) {
    return new Promise((resolve, reject) => {
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
