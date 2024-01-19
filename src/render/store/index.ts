import { createStore } from 'vuex'

const { ipcInvoke } = window.electron

export default createStore({
  state: {
    username: 'MarkPolo',
    modeServer: true,
    localIHS: '',
    remoteIHS: '',
    localDiskRoot: '',
    cos: '',
    useLocal: false,
    pixivUserId: '',
    pixivToken: '',
    pixivProxy: '',
    cosSecretId: '',
    cosSecretKey: '',
    cosBucket: '',
    cosRegion: '',
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
    initStore(state) {
      ipcInvoke('db:init').then(() => {
        Object.keys(state).forEach((key) => {
          if (key !== 'localDiskMap') {
            ipcInvoke('db:get', key).then((value) => {
              if (value === null || value === undefined)
                ipcInvoke('db:set', key, state[key])
              state[key] = value
            })
          }
          else {
            ipcInvoke('db:getMap').then((value) => {
              if (typeof value === 'object' && value !== null)
                state[key] = value
            })
          }
        })
      })
    },
  },
  actions: {},
  modules: {},
})
