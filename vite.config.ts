import { join } from 'node:path'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig } from 'vite'
import { VitePluginDoubleshot } from 'vite-plugin-doubleshot'

// https://vitejs.dev/config/
export default defineConfig({
  root: join(__dirname, 'src/render'),
  plugins: [
    vue(),
    VitePluginDoubleshot({
      type: 'electron',
      main: 'dist/main/index.js',
      entry: 'src/main/index.ts',
      outDir: 'dist/main',
      external: ['electron'],
      electron: {
        build: {
          config: {
            directories: {
              output: 'dist/electron',
              buildResources: 'build',
            },
            publish: {
              provider: 'github',
              owner: 'MarkPoloChina',
              repo: 'ICXOR',
              releaseType: 'release',
            },
            npmRebuild: false,
            files: [
              'dist/main/**/*',
              'dist/preload/**/*',
              'dist/render/**/*',
              'resources/**/*',
            ],
            appId: 'com.mpsto.icxor',
            productName: 'ICXOR',
            copyright: 'Copyright © 2023 MPSTO',
            win: {
              icon: 'build/basic/icons/icon.ico',
            },
            nsis: {
              oneClick: false,
              language: '2052',
              allowToChangeInstallationDirectory: true,
              createDesktopShortcut: true,
              createStartMenuShortcut: true,
            },
            mac: {
              notarize: {
                teamId: process.env.DEVELOPER_TEAM_ID,
              },
              darkModeSupport: true,
              icon: 'build/mac/icons/icon.icns',
              entitlements: 'build/mac/entitlements.mac.plist',
              entitlementsInherit: 'build/mac/entitlements.mac.plist',
              target: [{
                target: 'default',
                arch: ['universal'],
              }],
            },
          },
        },
        preload: {
          entry: 'src/preload/index.ts',
          outDir: 'dist/preload',
        },
      },
    }),
    vueJsx(),
  ],
  resolve: {
    alias: {
      '@render': join(__dirname, 'src/render'),
      '@main': join(__dirname, 'src/main'),
    },
  },
  base: './',
  build: {
    outDir: join(__dirname, 'dist/render'),
    emptyOutDir: true,
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@use "@render/style/icxor.scss" as *;',
      },
    },
  },
})
