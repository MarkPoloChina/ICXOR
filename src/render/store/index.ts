import { createStore } from 'vuex'

const { ipcInvoke } = window.electron

export default createStore({
  state: {
    username: 'MarkPoloChauvet',
    theme: 'system',
    localIHS: '',
    remoteIHS: '',
    picoltRemoteBase: '',
    picoltLocalBase: '',
    localDiskRoot: '',
    pixivUserDir: '',
    pixivBookmarkPrivateDir: '',
    pixivBookmarkPublicDir: '',
    cos: '',
    mpsApiUrl: '',
    useLocal: false,
    pixivUserId: '',
    pixivToken: '',
    pixivProxy: '',
    cosSecretId: '',
    cosSecretKey: '',
    cosBucket: '',
    cosRegion: '',
    sauceNAOToken: '',
    localDiskMap: {},
  },
  getters: {},
  mutations: {
    reviseByKey(state, { key, value }) {
      state[key] = value
      ipcInvoke('db:set', key, value)
    },
    reviseMapByName(state, { name, original, thumbnail }) {
      state.localDiskMap[name] = { original, thumbnail }
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
        if (key !== 'localDiskMap') {
          const value = await ipcInvoke('db:get', key)
          if (value === null || value === undefined)
            ipcInvoke('db:set', key, state[key])
          else
            commit('setByKey', { key, value })
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
