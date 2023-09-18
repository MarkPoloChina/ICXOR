/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = {
  directories: {
    output: 'dist/electron',
    buildResources: 'build',
  },
  publish: null,
  npmRebuild: false,
  files: [
    'dist/main/**/*',
    'dist/preload/**/*',
    'dist/render/**/*',
  ],
  appId: 'com.mpsto.icxor',
  productName: 'ICXOR',
  copyright: 'Copyright © 2023 MPSTO',
  win: {
    target: ['msi', 'nsis'],
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
    darkModeSupport: true,
    icon: 'build/mac/icons/icon.icns',
    target: {
      target: 'dmg',
      arch: ['universal', 'x64', 'arm64'],
    },
  },
}

module.exports = config
