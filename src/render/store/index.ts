import { createStore } from 'vuex'

const { ipcInvoke } = window.electron

export default createStore({
  state: {
    username: 'MarkPoloChauvet',
    theme: 'system' as 'system' | 'light' | 'dark',

    mainMode: 'disk' as 'disk' | 'ihs' | 'both',
    diskRoot: '',
    diskMap: {} as Record<string, { original: string, thumbnail: string }>,

    localIHS: '',
    remoteIHS: '',
    useLocalIHS: false,

    picoltIHSBase: '',
    picoltDiskBase: '',

    pixivUserDir: '',
    pixivBookmarkPrivateDir: '',
    pixivBookmarkPublicDir: '',

    cos: '',
    mpsApiUrl: '',
    pixivUserId: '',
    pixivToken: '',
    pixivProxy: '',
    cosSecretId: '',
    cosSecretKey: '',
    cosBucket: '',
    cosRegion: '',
    sauceNAOToken: '',
  },
  getters: {},
  mutations: {
    reviseByKey(state, { key, value }) {
      state[key] = value
      ipcInvoke('db:set', key, value)
    },
    reviseMapByName(state, { name, original, thumbnail }) {
      state.diskMap[name] = { original, thumbnail }
      ipcInvoke('db:setOriginal', name, original)
      ipcInvoke('db:setThumb', name, thumbnail)
    },
    setByKey(state, { key, value }) {
      state[key] = value
    },
  },
  actions: {
    async initStoreAsync({ commit, state }) {
      await ipcInvoke('db:init')
      for (const key of Object.keys(state)) {
        if (key !== 'diskMap') {
          const value = await ipcInvoke('db:get', key)
          if (value === null || value === undefined)
            ipcInvoke('db:set', key, state[key])
          else commit('setByKey', { key, value })
        }
        else {
          const value = await ipcInvoke('db:getMap')
          if (typeof value === 'object' && value !== null)
            commit('setByKey', { key, value })
        }
      }
    },
  },
  modules: {},
})
