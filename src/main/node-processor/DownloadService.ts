import axios from 'axios'
import { FS } from './FSService'

export class DS {
  public static async downloadFromUrl(url: string): Promise<ArrayBuffer> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
      })

      if (response.status === 200)
        return response.data

      else
        throw new Error(`Failed to download image: HTTP status ${response.status}`)
    }
    catch (error) {
      throw new Error(`Failed to download image: ${error.message}`)
    }
  }

  public static async downloadAndSave(url: string, filename: string, dir: string): Promise<void> {
    await FS.saveArrayBufferTo((await this.downloadFromUrl(url)), filename, dir)
  }
}
