import type { MicroserviceOptions } from '@nestjs/microservices'
import { basename, dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ElectronIpcTransport } from '@doubleshot/nest-electron'
import { AppModule } from '@main/app.module'
import { ConfigDB, LocalDiskDB } from '@main/node-processor/DBService'
import { FS } from '@main/node-processor/FSService'
import { NestFactory } from '@nestjs/core'
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  MenuItem,
  nativeTheme,
  net,
  protocol,
  session,
  shell,
} from 'electron'
import log from 'electron-log'
import { autoUpdater } from 'electron-updater'
import fs from 'fs-extra'
import { CS } from './node-processor/CloudService'
import { DS } from './node-processor/DownloadService'
import { GifCoverter } from './node-processor/MediaService'
import { PS } from './node-processor/PathService'
import { SS } from './node-processor/SagiriService'

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

const contextMenuTemplate = [
  new MenuItem({ label: '撤销', role: 'undo' }),
  new MenuItem({ label: '重做', role: 'redo' }),
  new MenuItem({ type: 'separator' }),
  new MenuItem({ label: '剪切', role: 'cut', accelerator: 'CmdOrCtrl+X' }),
  new MenuItem({ label: '复制', role: 'copy', accelerator: 'CmdOrCtrl+C' }),
  new MenuItem({ label: '粘贴', role: 'paste', accelerator: 'CmdOrCtrl+V' }),
  new MenuItem({ label: '删除', role: 'delete' }),
  new MenuItem({ type: 'separator' }),
  new MenuItem({
    label: '全选',
    role: 'selectAll',
    accelerator: 'CmdOrCtrl+A',
  }),
]

async function createWindow() {
  const isDev = !app.isPackaged
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 650,
    webPreferences: {
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js'),
    },
  })

  win.on('closed', () => {
    win.destroy()
  })

  const contextMenu = Menu.buildFromTemplate(contextMenuTemplate)
  win.webContents.on('context-menu', (event, params) => {
    if (params.selectionText || params.isEditable) {
      contextMenu.popup({
        window: win,
        x: params.x,
        y: params.y,
      })
    }
  })

  win.webContents.session.webRequest.onBeforeSendHeaders(
    { urls: ['https://i.pximg.net/*'] },
    (details, callback) => {
      details.requestHeaders.Referer = 'https://www.pixiv.net/'
      callback({ requestHeaders: details.requestHeaders })
    },
  )

  const URL = isDev
    ? process.env.DS_RENDERER_URL
    : `file://${join(app.getAppPath(), 'dist/render/index.html')}`

  win.loadURL(URL)

  if (isDev)
    win.webContents.openDevTools()

  return { win }
}

function beforeReady() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'icxorimg',
      privileges: {
        supportFetchAPI: true,
        secure: true,
        standard: true,
      },
    },
  ])
}

function afterReady() {
  // 设置菜单模块
  const menu = Menu.buildFromTemplate([
    {
      label: '文件',
      submenu: [
        {
          label: '关于',
          role: 'about',
          click: async () => {
            if (BrowserWindow.getAllWindows().length === 0)
              await createWindow()
            const currentWin = BrowserWindow.getAllWindows()[0]
            currentWin.webContents.send('router:push', {
              name: 'settings',
              query: {
                redirect: 'about',
              },
            })
          },
        },
        {
          label: '检查更新',
          click: () => {
            autoUpdater.checkForUpdates()
          },
        },
        {
          type: 'separator',
        },
        {
          label: '打开调试窗口',
          click: () => {
            BrowserWindow.getFocusedWindow().webContents.openDevTools()
          },
        },
        {
          type: 'separator',
        },
        {
          label: '退出',
          role: 'quit',
        },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', role: 'undo' },
        { label: '重做', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', role: 'cut' },
        { label: '复制', role: 'copy' },
        { label: '粘贴', role: 'paste' },
        { label: '删除', role: 'delete' },
        { type: 'separator' },
        { label: '全选', role: 'selectAll' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { label: '重置视图', role: 'resetZoom' },
        { label: '放大', role: 'zoomIn' },
        { label: '缩小', role: 'zoomOut' },
        { type: 'separator' },
        { label: '全屏', role: 'togglefullscreen' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: 'Github主页',
          click: () => {
            shell.openExternal('https://github.com/MarkPoloChina/IllustComplexor')
          },
        },
        {
          label: '个人主页',
          click: () => {
            shell.openExternal('https://www.markpolo.cn')
          },
        },
      ],
    },
  ])
  Menu.setApplicationMenu(menu)

  // activate darkmode ipc
  ipcMain.handle('dark-mode:toggle', () => {
    if (nativeTheme.shouldUseDarkColors)
      nativeTheme.themeSource = 'light'
    else nativeTheme.themeSource = 'dark'

    return nativeTheme.shouldUseDarkColors
  })

  ipcMain.handle('dark-mode:system', () => {
    nativeTheme.themeSource = 'system'
  })

  ipcMain.handle('dark-mode:get', () => {
    return nativeTheme.shouldUseDarkColors
  })

  nativeTheme.on('updated', () => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('dark-mode:updated', nativeTheme.shouldUseDarkColors)
    })
  })

  // activate dialog ipc
  ipcMain.handle('dialog:openFile', async (event, filters) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters,
    })
    if (!canceled)
      return filePaths
  })

  ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    })
    if (!canceled)
      return filePaths[0]
  })

  // activate context ipc
  ipcMain.on('context:popup', (event, templateMenu) => {
    templateMenu.forEach((item) => {
      item.click = () => {
        event.sender.send('context:click', item.label)
      }
      if (item.submenu) {
        item.submenu.forEach((subItem) => {
          subItem.click = () => {
            event.sender.send('context:click', item.label, subItem.label)
          }
        })
      }
    })
    const ctx = Menu.buildFromTemplate([...templateMenu])
    ctx.popup({
      window: BrowserWindow.fromWebContents(event.sender),
    })
  })

  // activate app ipc
  ipcMain.on('app:getPath', (event) => {
    event.returnValue = app.getPath('userData')
  })

  ipcMain.on('app:getOS', (event) => {
    event.returnValue = process.platform
  })

  ipcMain.handle('app:getCacheSize', async () => {
    const size = await session.defaultSession.getCacheSize()
    return size
  })

  ipcMain.handle('app:clearCache', async () => {
    await session.defaultSession.clearCache()
  })

  ipcMain.on('app:openLink', (event, url) => {
    shell.openExternal(url)
  })

  ipcMain.on('app:openInFolder', (event, path) => {
    if (fs.pathExistsSync(path)) {
      shell.showItemInFolder(path)
    }
    else {
      shell.showItemInFolder(
        join(dirname(path), `${basename(path).substring(0, basename(path).lastIndexOf('.'))}.png`),
      )
    }
  })

  ipcMain.on('app:checkUpdate', () => {
    autoUpdater.checkForUpdates()
  })

  ipcMain.handle('db:init', () => {
    ConfigDB.initDB()
    LocalDiskDB.initDB()
  })
  ipcMain.handle('db:get', (event, key) => {
    return ConfigDB.getByKey(key)
  })
  ipcMain.handle('db:set', (event, key, value) => {
    ConfigDB.setByKey(key, value)
  })
  ipcMain.handle('db:getMap', () => {
    return LocalDiskDB.getByKey('localBase')
  })
  ipcMain.handle('db:getOriginal', (event, key) => {
    return LocalDiskDB.getLocalBaseOriginalByName(key)
  })
  ipcMain.handle('db:setOriginal', (event, key, value) => {
    LocalDiskDB.setLocalBaseOriginalByName(key, value)
  })
  ipcMain.handle('db:getThumb', (event, key) => {
    return LocalDiskDB.getLocalBaseThumbnailByName(key)
  })
  ipcMain.handle('db:setThumb', (event, key, value) => {
    LocalDiskDB.setLocalBaseThumbnailByName(key, value)
  })

  ipcMain.handle('fs:save', async (event, ab, filename, dir) => {
    await FS.saveArrayBufferTo(ab, filename, dir)
  })
  ipcMain.handle('fs:getFilenames', async (event, dir) => {
    return await FS.parseFilenamesFromDirectoryAsync(dir)
  })
  ipcMain.handle('fs:copy', async (event, src, dest) => {
    await FS.localCopy(src, dest)
  })
  ipcMain.handle('fs:getStringFromFile', async (event, filename) => {
    return await FS.loadStringFromFile(filename)
  })
  ipcMain.handle('fs:saveStringToFile', async (event, filename, content) => {
    await FS.saveStringToFile(filename, content)
  })

  ipcMain.handle('ds:download', async (event, url, dir, isPixiv) => {
    return await DS.downloadAndSave(url, dir, isPixiv)
  })
  ipcMain.handle('ds:download2x', async (event, url, dir) => {
    return await DS.download2xAndSave(url, dir)
  })
  ipcMain.handle('ds:downloadPixiv', async (event, illustObj, dir, page) => {
    return await DS.downloadFromIllustObj(illustObj, dir, page)
  })
  ipcMain.handle('ds:downloadUgoira', async (event, illustObj, dir, meta) => {
    return await DS.downloadFromUgoira(illustObj, dir, meta)
  })

  ipcMain.on('ps:basename', (event, _path) => {
    event.returnValue = PS.basename(_path)
  })
  ipcMain.on('ps:join', (event, ...paths) => {
    event.returnValue = PS.join(...paths)
  })
  ipcMain.on('ps:extname', (event, _path) => {
    event.returnValue = PS.extname(_path)
  })

  ipcMain.handle('cs:upload', async () => {
    return await CS.uploadFile()
  })
  ipcMain.handle('cs:download', async () => {
    return await CS.downloadFile()
  })
  ipcMain.handle('cs:getTimestamp', async () => {
    return await CS.getDoubleTimestamp()
  })

  ipcMain.handle('ss:run', async (event, filePath) => {
    return await SS.runAndProcess(filePath)
  })
  ipcMain.handle('ss:runJson', async (event, filePath) => {
    return SS.parseJsonResult(filePath)
  })

  ipcMain.handle('ms:convertGif', async (event, input, output, delay) => {
    await GifCoverter.zipToGif(input, output, delay)
  })

  autoUpdater.on('error', (err) => {
    const currentWin = BrowserWindow.getAllWindows()[0]
    if (!currentWin)
      return
    currentWin.webContents.send('app:message', 'error', `检查更新错误:${String(err)}`)
  })
  autoUpdater.on('update-not-available', (info) => {
    const currentWin = BrowserWindow.getAllWindows()[0]
    if (!currentWin)
      return
    currentWin.webContents.send('app:message', 'success', `当前(${info.version})已是最新版本`)
  })
  autoUpdater.on('checking-for-update', () => {
    const currentWin = BrowserWindow.getAllWindows()[0]
    if (!currentWin)
      return
    currentWin.webContents.send('app:message', 'info', '检查更新中...')
  })
  autoUpdater.on('update-downloaded', () => {
    const currentWin = BrowserWindow.getAllWindows()[0]
    if (!currentWin)
      return
    currentWin.webContents.send('app:message', 'success', '更新下载完成, 将在下次退出应用后更新')
    autoUpdater.autoInstallOnAppQuit = true
  })
  autoUpdater.on('update-available', async (info) => {
    const { response } = await dialog.showMessageBox({
      type: 'question',
      buttons: ['确定', '取消'],
      defaultId: 0,
      title: '发现新版本',
      message: `发现新版本(${info.version}), 是否更新?`,
    })
    if (response === 0)
      autoUpdater.downloadUpdate()
  })
  log.transports.file.level = 'debug'
  autoUpdater.logger = log
  autoUpdater.autoDownload = false

  protocol.handle('icxorimg', request =>
    net.fetch(
      pathToFileURL(decodeURIComponent(request.url.slice('icxorimg://s/?u='.length))).toString(),
    ))
}

async function electronAppInit() {
  const isDev = !app.isPackaged
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
      app.quit()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0)
      createWindow()
  })

  if (isDev) {
    if (process.platform === 'win32') {
      process.on('message', (data) => {
        if (data === 'graceful-exit')
          app.quit()
      })
    }
    else {
      process.on('SIGTERM', () => {
        app.quit()
      })
    }
  }

  beforeReady()
  await app.whenReady()
  afterReady()
}

async function bootstrap() {
  try {
    await electronAppInit()

    const nestApp = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
      strategy: new ElectronIpcTransport('IpcTransport'),
    })

    await nestApp.listen()
  }
  catch (error) {
    // eslint-disable-next-line no-console
    console.log(error)
    app.quit()
  }
}

bootstrap()

export { createWindow }
