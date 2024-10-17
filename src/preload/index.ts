import type { PixivIllust, UgoiraMetaData } from '@markpolochina/pixiv.ts'
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  // examples
  sendMsg: (msg: string): Promise<string> => ipcRenderer.invoke('msg', msg),
  onReplyMsg: (cb: (msg: string) => any) =>
    ipcRenderer.on('reply-msg', (e, msg: string) => {
      cb(msg)
    }),

  // ipcRenderX
  ipcInvoke: (channel: string, ...args: any[]): Promise<any> =>
    ipcRenderer.invoke(channel, ...args),
  ipcOn: (channel: string, cb: (...args: any[]) => any) =>
    ipcRenderer.on(channel, (event, ...args) => {
      cb(...args)
    }),
  ipcRemoveAll: (channel: string) => ipcRenderer.removeAllListeners(channel),
  ipcSend: (channel: string, ...args: any[]): void =>
    ipcRenderer.send(channel, ...args),
  ipcSendSync: (channel: string, ...args: any[]): any =>
    ipcRenderer.sendSync(channel, ...args),
  ipcOnce: (channel: string, cb: (...args: any[]) => any) => {
    ipcRenderer.once(channel, (event, ...args) => cb(...args))
  },

  // apiAdapter
  apiAdapter: (
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    params: any,
    body: any,
  ): Promise<any> => ipcRenderer.invoke(`api:${method}${url}`, params, body),

  // downloader
  downloadTo: (url: string, rename: string, dir: string, isPixiv = false): Promise<void> =>
    ipcRenderer.invoke('ds:download', url, rename, dir, isPixiv),

  downloadPixivTo: (illustObj: PixivIllust, dir: string, page?: number): Promise<void> =>
    ipcRenderer.invoke('ds:downloadPixiv', illustObj, dir, page),

  downloadPixivUgoiraTo: (
    illustObj: PixivIllust,
    dir: string,
    meta: UgoiraMetaData,
  ): Promise<void> =>
    ipcRenderer.invoke('ds:downloadUgoira', illustObj, dir, meta),
})
