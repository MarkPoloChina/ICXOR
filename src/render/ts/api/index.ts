import type { FilterConditionObj } from '@main/illust/dto/filter_condition_obj.dto'
import type { FilterSortObj } from '@main/illust/dto/filter_sort_obj.dto'
import type { IllustTodayDto } from '@main/illust/dto/illust_today.dto'
import type { RespListObjDto } from '@main/illust/dto/resp_list_obj.dto'
import type { Illust } from '@main/illust/entities/illust.entities'
import type { Poly } from '@main/illust/entities/poly.entities'
import type { RemoteBase } from '@main/illust/entities/remote_base.entities'
import type { Tag } from '@main/illust/entities/tag.entities'
import type { PixivIllust, PixivUserDetail, UgoiraMetaData } from '@markpolochina/pixiv.ts'
import type { BatchDto } from '@render/ts/dto/batch'
import type { IllustObj } from '@render/ts/interface/illustObj'
import type { DeleteResult } from 'typeorm'
import { isReactive, toRaw } from 'vue'

const { apiAdapter } = window.electron
const ax = {
  get: (url: string, options?: { params: object }) => {
    return axiosAdapter(
      url,
      'GET',
      options && options.params ? options.params : null,
    )
  },
  post: (url: string, body: any, options?: { params: object }) => {
    return axiosAdapter(
      url,
      'POST',
      options && options.params ? options.params : null,
      body,
    )
  },
  put: (url: string, body: any, options?: { params: object }) => {
    return axiosAdapter(
      url,
      'PUT',
      options && options.params ? options.params : null,
      body,
    )
  },
  delete: (url: string, options?: { params: object }) => {
    return axiosAdapter(
      url,
      'DELETE',
      options && options.params ? options.params : null,
    )
  },
}

function recursivelyConvertToRaw(obj: any) {
  if (isReactive(obj)) {
    return toRaw(obj)
  }
  else if (Array.isArray(obj)) {
    return obj.map(item => recursivelyConvertToRaw(item))
  }
  else if (typeof obj === 'object' && obj !== null) {
    const result = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key))
        result[key] = recursivelyConvertToRaw(obj[key])
    }
    return result
  }
  else {
    return obj
  }
}

async function axiosAdapter(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  params: any,
  body?: any,
) {
  try {
    const ipcBack = await apiAdapter(
      url,
      method,
      recursivelyConvertToRaw(params),
      recursivelyConvertToRaw(body),
    )
    return {
      code: 200,
      message: 'OK',
      data: ipcBack,
    }
  }
  catch (err) {
    const es = String(err)
    throw es.slice(es.lastIndexOf('Error'))
  }
}
/**
 * API Class
 * get - fetch info;
 * new - create info while no conflict data;
 * update - find and update or not found error;
 * cover - find and update or not found but create;
 * @class
 */
export class API {
  static async getEnumTimeline() {
    const resp = await ax.get('/illust/base/enum', {
      params: {
        row: 'date',
        desc: true,
      },
    })
    return resp.data as any[]
  }

  static async getEnumPolyParent(requiredType: string) {
    const resp = await ax.get('/illust/poly/enum', {
      params: {
        requiredType,
        row: 'parent',
        desc: false,
      },
    })
    return resp.data as any[]
  }

  static async getIllusts(
    conditionJson?: FilterConditionObj,
    limit?: number,
    offset?: number,
    orderAsJson?: FilterSortObj,
  ) {
    const resp = await ax.get('/illust/base/list', {
      params: {
        orderAsJson,
        offset,
        limit,
        conditionJson,
      },
    })
    return resp.data as Illust[]
  }

  static async getIllustsCount(conditionJson?: FilterConditionObj) {
    const resp = await ax.get('/illust/base/count', {
      params: {
        conditionJson,
      },
    })
    return resp.data as { count: number }
  }

  static async updateIllusts(illustList: BatchDto) {
    const resp = await ax.post('/illust/bases', illustList)
    return resp.data as RespListObjDto[]
  }

  static async updateIllust(illust: IllustObj) {
    const resp = await ax.put('/illust/base', illust)
    return resp.data as Illust
  }

  static async deleteIllusts(illustIds: number[]) {
    const resp = await ax.delete('/illust/bases', {
      params: {
        illustIds,
      },
    })
    return resp.data as RespListObjDto[]
  }

  static async getTags() {
    const resp = await ax.get('/illust/tag/list', {
      params: {},
    })
    return resp.data as Tag[]
  }

  static async updateTag(tag: Tag) {
    const resp = await ax.put('/illust/tag', tag, {
      params: {},
    })
    return resp.data as Tag
  }

  static async deleteTag(tagId: number) {
    const resp = await ax.delete('/illust/tag', {
      params: { tagId },
    })
    return resp.data as DeleteResult
  }

  static async addAuthorTag(tag: string) {
    const resp = await ax.post('/illust/tag/author', null, {
      params: { tag },
    })
    return resp.data as Tag
  }

  static async getPoly(type: string) {
    const resp = await ax.get('/illust/poly/list', {
      params: {
        withIllust: false,
        type,
      },
    })
    return resp.data as Poly[]
  }

  static async getPolyWithIllust(type: string) {
    const resp = await ax.get('/illust/poly/list', {
      params: {
        withIllust: true,
        type,
      },
    })
    return resp.data as Poly[]
  }

  static async addPoly(illustList: BatchDto) {
    const resp = await ax.post('/illust/poly/bases', illustList)
    return resp.data as RespListObjDto[]
  }

  static async removePolyById(polyId: number, illustList: number[]) {
    const resp = await ax.delete('/illust/poly/bases', {
      params: {
        polyId,
        illustList,
      },
    })
    return resp.data as RespListObjDto[]
  }

  static async deletePoly(polyId: number) {
    const resp = await ax.delete('/illust/poly', {
      params: {
        polyId,
      },
    })
    return resp.data as DeleteResult
  }

  static async updateRemotePoly(rp) {
    const resp = await ax.put('/illust/poly', rp)
    return resp.data as Poly
  }

  static async getBookmark(isPrivate: boolean, stopIn?: string) {
    const resp = await ax.get('/pixiv-api/pixiv-json/latest', {
      params: {
        isPrivate,
        stopIn,
      },
    })
    return resp.data as PixivIllust[]
  }

  static async getPixivImageUrl(pid: number, page: number, type: string) {
    const resp = await ax.get('/pixiv-api/url', {
      params: {
        pid,
        page,
        type,
      },
    })
    return resp.data as string
  }

  static async getRemoteBase() {
    const resp = await ax.get('/illust/remote-base/list', {
      params: {
        withIllust: false,
      },
    })
    return resp.data as RemoteBase[]
  }

  static async coverRemoteBase(rb) {
    const resp = await ax.post('/illust/remote-base', rb)
    return resp.data as RemoteBase
  }

  static async coverIllustToday(date: string, itdto: IllustTodayDto) {
    const resp = await ax.post('/illust/illust-today', itdto, {
      params: { date },
    })
    return resp.data
  }

  static async getPixivInfo(pid: number) {
    const resp = await ax.get('/pixiv-api/pixiv-json', {
      params: {
        pid,
      },
    })
    return resp.data as PixivIllust
  }

  static async getPixivUserInfo(uid: number) {
    const resp = await ax.get('/pixiv-api/user-json', {
      params: {
        uid,
      },
    })
    return resp.data as PixivUserDetail
  }

  static async getPixivUserIllusts(uid: number) {
    const resp = await ax.get('/pixiv-api/user-illusts', {
      params: {
        uid,
      },
    })
    return resp.data as { illusts: PixivIllust[], nextUrl: string }
  }

  static async getPixivNextRequest(nextUrl: string) {
    const resp = await ax.get('/pixiv-api/next', {
      params: {
        nextUrl,
      },
    })
    return resp.data
  }

  static async getPixivUgoiraJson(pid: number) {
    const resp = await ax.get('/pixiv-api/ugoira-json', {
      params: {
        pid,
      },
    })
    return resp.data as UgoiraMetaData
  }

  static async togglePixivBookmark(pid: number, op: boolean, isPrivate: boolean) {
    await ax.post('/pixiv-api/bookmark', null, {
      params: {
        pid,
        op,
        isPrivate,
      },
    })
  }

  static async getDuplicateByPixivId(pixiv_id: string) {
    const resp = await ax.get('/known-duplicate/pixiv', {
      params: {
        pixiv_id,
      },
    })
    return resp.data as { target: string } | undefined
  }

  static async getDuplicateByTwitterStatusId(twitter_status_id: string) {
    const resp = await ax.get('/known-duplicate/twitter', {
      params: {
        twitter_status_id,
      },
    })
    return resp.data as { target: string } | undefined
  }

  static async addDuplicate(pixiv_id: string, twitter_status_id: string) {
    await ax.post('/known-duplicate/twitter', null, {
      params: {
        pixiv_id,
        twitter_status_id,
      },
    })
  }
}
