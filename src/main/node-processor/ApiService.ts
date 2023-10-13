import type { IllustTodayDto } from '@main/illust/dto/illust_today.dto'
import axios from 'axios'

axios.defaults.baseURL = 'https://api.markpolo.cn/v1'
// axios.defaults.baseURL = 'http://localhost:3000/v1'
export class MPAPI {
  static async getIllustToday(date: string) {
    const resp = await axios.get(`/illust-today/${date}`)
    return resp.data
  }

  static async updateIllustToday(date: string, illustToday: IllustTodayDto) {
    const resp = await axios.post(`/illust-today/${date}`, illustToday)
    return resp.data
  }
}
