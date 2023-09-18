import { join } from 'node:path'
import { NestFactory } from '@nestjs/core'
import {
  BrowserWindow,
  Menu,
  MenuItem,
  app,
  dialog,
  ipcMain,
  nativeTheme,
  session,
  shell,
} from 'electron'
import type { MicroserviceOptions } from '@nestjs/microservices'
import { ElectronIpcTransport } from '@doubleshot/nest-electron'
import { AppModule } from '@main/app.module'
import { ConfigDB } from '@main/node-processor/DBService'
import { FS } from '@main/node-processor/FSService'
import { DS } from './node-processor/DownloadService'

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
    contextMenu.popup({
      window: win,
      x: params.x,
      y: params.y,
    })
  })

  const URL = isDev
    ? process.env.DS_RENDERER_URL
    : `file://${join(app.getAppPath(), 'dist/render/index.html')}`

  win.loadURL(URL)

  if (isDev)
    win.webContents.openDevTools()

  return { win }
}

let toReloadSignal = false

function prepareDB() {
  ipcMain.handle('db:init', () => {
    ConfigDB.initDB()
  })
  ipcMain.handle('db:get', (event, key) => {
    return ConfigDB.getByKey(key)
  })
  ipcMain.handle('db:set', (event, key, value) => {
    ConfigDB.setByKey(key, value)
  })
}

function prepareFS() {
  ipcMain.handle('fs:save', async (event, ab, filename, dir) => {
    await FS.saveArrayBufferTo(ab, filename, dir)
  })
  ipcMain.handle('fs:getFilenames', async (event, dir) => {
    return await FS.parseFilenamesFromDirectoryAsync(dir)
  })
}

function prepareDS() {
  ipcMain.handle('ds:download', async (event, url, filename, dir) => {
    await DS.downloadAndSave(url, filename, dir)
  })
}

function prepareEnv() {
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
            currentWin.webContents.send('router:go', '/about')
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
          label: '重载',
          click: () => {
            toReloadSignal = true
            BrowserWindow.getFocusedWindow().close()
            createWindow()
            toReloadSignal = false
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
            shell.openExternal(
              'https://github.com/MarkPoloChina/IllustComplexor',
            )
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
      win.webContents.send(
        'dark-mode:updated',
        nativeTheme.shouldUseDarkColors,
      )
    })
  })

  // activate dialog ipc
  ipcMain.handle('dialog:openFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif'] }],
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
    })
    const ctx = Menu.buildFromTemplate([
      ...templateMenu,
      {
        type: 'separator',
      },
      ...contextMenuTemplate,
    ])
    ctx.popup({
      window: BrowserWindow.fromWebContents(event.sender),
    })
  })

  // activate app ipc
  ipcMain.on('app:getPath', (event) => {
    event.returnValue = app.getPath('userData')
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
}

async function electronAppInit() {
  const isDev = !app.isPackaged
  app.on('window-all-closed', () => {
    if (process.platform === 'darwin' || toReloadSignal)
      return
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

  await app.whenReady()
  prepareEnv()
  prepareDB()
  prepareFS()
  prepareDS()
}

async function bootstrap() {
  try {
    await electronAppInit()

    const nestApp = await NestFactory.createMicroservice<MicroserviceOptions>(
      AppModule,
      {
        strategy: new ElectronIpcTransport('IpcTransport'),
      },
    )

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
