import type { FilterConditionObj } from '@main/illust/dto/filter_condition_obj.dto'
import type { FilterSortObj } from '@main/illust/dto/filter_sort_obj.dto'
import type { IllustTodayDto } from '@main/illust/dto/illust_today.dto'
import type { PixivIllust } from '@markpolochina/pixiv.ts'
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
    return resp.data
  }

  static async getEnumPolyParent(requiredType: string) {
    const resp = await ax.get('/illust/poly/enum', {
      params: {
        requiredType,
        row: 'parent',
        desc: false,
      },
    })
    return resp.data
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
    return resp.data
  }

  static async getIllustsCount(conditionJson?: FilterConditionObj) {
    const resp = await ax.get('/illust/base/count', {
      params: {
        conditionJson,
      },
    })
    return resp.data
  }

  static async updateIllusts(illustList) {
    const resp = await ax.post('/illust/bases', illustList)
    return resp.data
  }

  static async updateIllust(illust) {
    const resp = await ax.put('/illust/base', illust)
    return resp.data
  }

  static async deleteIllusts(illustIds) {
    const resp = await ax.delete('/illust/bases', {
      params: {
        illustIds,
      },
    })
    return resp.data
  }

  static async getPoly(type) {
    const resp = await ax.get('/illust/poly/list', {
      params: {
        withIllust: false,
        type,
      },
    })
    return resp.data
  }

  static async getPolyWithIllust(type) {
    const resp = await ax.get('/illust/poly/list', {
      params: {
        withIllust: true,
        type,
      },
    })
    return resp.data
  }

  static async addPoly(illustList) {
    const resp = await ax.post('/illust/poly/bases', illustList)
    return resp.data
  }

  static async removePolyById(polyId, illustList) {
    const resp = await ax.delete('/illust/poly/bases', {
      params: {
        polyId,
        illustList,
      },
    })
    return resp.data
  }

  static async deletePoly(polyId) {
    const resp = await ax.delete('/illust/poly', {
      params: {
        polyId,
      },
    })
    return resp.data
  }

  static async getBookmark(isPrivate) {
    const resp = await ax.get('/pixiv-api/pixiv-json/latest', {
      params: {
        isPrivate,
      },
    })
    return resp.data
  }

  static async getPixivImageUrl(pid, page, type) {
    const resp = await ax.get('/pixiv-api/url', {
      params: {
        pid,
        page,
        type,
      },
    })
    return resp.data
  }

  static async getRemoteBase() {
    const resp = await ax.get('/illust/remote-base/list', {
      params: {
        withIllust: false,
      },
    })
    return resp.data
  }

  static async coverRemoteBase(rb) {
    const resp = await ax.post('/illust/remote-base', rb)
    return resp.data
  }

  static async coverIllustToday(date: string, itdto: IllustTodayDto) {
    const resp = await ax.post('/illust/illust-today', itdto, {
      params: { date },
    })
    return resp.data
  }

  static async getPixivInfo(pid) {
    const resp = await ax.get('/pixiv-api/pixiv-json', {
      params: {
        pid,
      },
    })
    return resp.data
  }

  static async getPixivUserInfo(uid) {
    const resp = await ax.get('/pixiv-api/user-json', {
      params: {
        uid,
      },
    })
    return resp.data
  }

  static async getPixivUserIllusts(uid) {
    const resp = await ax.get('/pixiv-api/user-illusts', {
      params: {
        uid,
      },
    })
    return resp.data
  }

  static async getPixivNextRequest(nextUrl: string) {
    const resp = await ax.get('/pixiv-api/next', {
      params: {
        nextUrl,
      },
    })
    return resp.data
  }

  static async downloadPixivUgoira(url: string | PixivIllust, dest: string) {
    const resp = await ax.get('/pixiv-api/file/ugoira', {
      params: {
        url,
        dest,
      },
    })
    return resp.data
  }
}
