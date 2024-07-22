import type { IllustTodayDto } from '@main/illust/dto/illust_today.dto'
import axios from 'axios'
import { ConfigDB } from './DBService'

axios.defaults.baseURL = ConfigDB.getByKey('mpsApiUrl') || ''

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
