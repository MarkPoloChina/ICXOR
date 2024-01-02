import { createStore } from 'vuex'

const { ipcInvoke } = window.electron

const defaultSetting = {
  username: 'MarkPolo',
  localIHS: '',
  remoteIHS: '',
  cos: '',
  useLocal: false,
  pixivUserId: '',
  pixivToken: '',
  pixivProxy: '',
  cosSecretId: '',
  cosSecretKey: '',
  cosBucket: '',
  cosRegion: '',
}

export default createStore({
  state: {
    username: '',
    localIHS: '',
    remoteIHS: '',
    cos: '',
    useLocal: false,
    pixivUserId: '',
    pixivToken: '',
    pixivProxy: '',
    cosSecretId: '',
    cosSecretKey: '',
    cosBucket: '',
    cosRegion: '',
  },
  getters: {},
  mutations: {
    reviseByKey(state, { key, value }) {
      state[key] = value
      ipcInvoke('db:set', key, value)
    },
    initStore(state) {
      ipcInvoke('db:init').then(() => {
        Object.keys(state).forEach((key) => {
          ipcInvoke('db:get', key).then((value) => {
            if (value === null || value === undefined) {
              ipcInvoke('db:set', key, defaultSetting[key])
              value = defaultSetting[key]
            }
            state[key] = value
          })
        })
      })
    },
  },
  actions: {},
  modules: {},
})
