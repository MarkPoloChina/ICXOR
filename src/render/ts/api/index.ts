import { toRaw } from 'vue'

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

async function axiosAdapter(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  params: any,
  body?: any,
) {
  try {
    const ipcBack = await apiAdapter(url, method, params, toRaw(body))
    return {
      code: 200,
      message: 'OK',
      data: ipcBack,
    }
  }
  catch (err) {
    return {
      code: 500,
      message: 'IPC ERR',
    }
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

  static async getIllusts(conditionJson, limit, offset, orderJson) {
    const resp = await ax.get('/illust/base/list', {
      params: {
        orderAsJson: toRaw(orderJson),
        offset,
        limit,
        conditionJson: toRaw(conditionJson),
      },
    })
    return resp.data
  }

  static async getIllustsCount(conditionJson) {
    const resp = await ax.get('/illust/base/count', {
      params: {
        conditionJson: toRaw(conditionJson),
      },
    })
    return resp.data
  }

  static async newIllusts(illustList) {
    const resp = await ax.post('/illust/bases', illustList)
    return resp.data
  }

  static async updateIllusts(illustList) {
    const resp = await ax.put('/illust/bases', illustList)
    return resp.data
  }

  static async updateIllust(illustList, addIfNotFound) {
    const resp = await ax.put('/illust/base', illustList, {
      params: {
        addIfNotFound,
      },
    })
    return resp.data
  }

  static async deleteIllusts(illustIds) {
    const resp = await ax.delete('/illust/bases', {
      params: {
        illustIds: toRaw(illustIds),
      },
    })
    return resp
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
        illustList: toRaw(illustList),
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

  static async updatePixivMeta(illust) {
    const resp = await ax.put('/pixiv-api/pixiv-json/list', illust)
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

  static async coverIllustToday(date, illustId) {
    const resp = await ax.put('/illust/illust-today', null, {
      params: {
        date,
        illustId,
      },
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

  static async checkPixivOk() {
    const resp = await ax.get('/pixiv-api/ok')
    return resp.data
  }
}
