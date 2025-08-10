<script setup lang="ts">
import type { SagiriResultDto } from '@render/ts/dto/sagiriResult'
import { Close, Download, RefreshLeft, Search, Upload } from '@element-plus/icons-vue'
import store from '@render/store/index'
import { API } from '@render/ts/api'
import { useStatusBar } from '@render/ts/composable/statusBar'
import { UtilDate } from '@render/ts/util/date'
import { PathHelper } from '@render/ts/util/path'
import { ElMessage } from 'element-plus'
import { onMounted, onUnmounted, ref } from 'vue'

const { ipcInvoke } = window.electron
const illusts = ref([])
const statusController = useStatusBar()
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
async function getIllusts() {
  const files: string[] = await ipcInvoke('dialog:openFile', [
    { name: 'Image', extensions: ['jpg', 'jpeg', 'png'] },
  ])
  if (!files || files.length === 0)
    return
  await handleGetIlluts(files)
}
async function handleGetIlluts(files: string[]) {
  illusts.value.length = 0
  statusController.initStart(files.length)
  for (const file of files) {
    const result: SagiriResultDto = await ipcInvoke('ss:run', file)
    illusts.value.push({ filename: file, ...result })
    if (result.twitter && result.twitter.match(/status\/(\d+)/))
      API.addDuplicate(result.pixiv || '', result.twitter.match(/status\/(\d+)/)[1])

    statusController.step()
    await sleep(store.state.sagiriReqSleep)
  }

  statusController.finish()
}
function handleAbort() {
  statusController.abort()
}
async function handleRetry() {
  const failed = illusts.value.filter(illust => illust.error && !illust.error.includes('[NRT]'))
  statusController.initStart(failed.length)
  for (const illust of failed) {
    const result: SagiriResultDto = await ipcInvoke('ss:run', illust.filename)
    illust.error = undefined
    Object.assign(illust, result)
    if (result.twitter && result.twitter.match(/status\/(\d+)/))
      API.addDuplicate(result.pixiv || '', result.twitter.match(/status\/(\d+)/)[1])

    statusController.step()
    await sleep(store.state.sagiriReqSleep)
  }
  statusController.finish()
}
async function getJsons() {
  const files: string[] = await ipcInvoke('dialog:openFile', [
    { name: 'JSON', extensions: ['json'] },
  ])
  if (!files || files.length === 0)
    return
  illusts.value.length = 0
  statusController.initStart(files.length)
  for (const file of files) {
    const result: SagiriResultDto = await ipcInvoke('ss:runJson', file)
    illusts.value.push({ filename: file, ...result })
    if (result.twitter && result.twitter.match(/status\/(\d+)/))
      API.addDuplicate(result.pixiv || '', result.twitter.match(/status\/(\d+)/)[1])

    statusController.step()
  }

  statusController.finish()
}
async function handleDownload(type: 'json' | 'txt' | 'raw', target?: 'pixiv' | 'twitter') {
  const pixiv_ids = Array.from(
    new Set(illusts.value.filter(illust => illust.pixiv).map(illust => illust.pixiv)),
  )
  const twitter_urls = Array.from(
    new Set(illusts.value.filter(illust => illust.twitter).map(illust => illust.twitter)),
  )

  let content: string
  let filter: any
  let defaultName: string
  switch (type) {
    case 'json':
      content = JSON.stringify(target === 'pixiv' ? pixiv_ids : twitter_urls)
      filter = [{ name: 'JSON', extensions: ['json'] }]
      defaultName = `icxor-${target || 'all'}-illusts-${UtilDate.getFullTimeNumber(new Date())}.json`
      break
    case 'txt':
      content = target === 'pixiv' ? pixiv_ids.join('\n') : twitter_urls.join('\n')
      filter = [{ name: 'Text', extensions: ['txt'] }]
      defaultName = `icxor-${target || 'all'}-illusts-${UtilDate.getFullTimeNumber(new Date())}.txt`
      break
    case 'raw':
      content = JSON.stringify(illusts.value, null, 2)
      filter = [{ name: 'JSON', extensions: ['json'] }]
      defaultName = `icxor-raw-${UtilDate.getFullTimeNumber(new Date())}.json`
      break
  }

  const savePath = await ipcInvoke('dialog:saveFile', filter, defaultName)
  if (!savePath)
    return

  await ipcInvoke(
    'fs:saveStringToFile',
    savePath,
    content,
  )
  ElMessage.success('保存完成')
}
function filterHandler(value: string, row, _column) {
  if (value === 'both')
    return row.pixiv && row.twitter
  if (value === 'not')
    return !row.pixiv && !row.twitter
  if (value === 'twitter')
    return row.twitter && !row.pixiv
  if (value === 'pixiv')
    return row.pixiv && !row.twitter
}
function dropInit() {
  const dragWrapper = document.getElementById('dropArea')
  dragWrapper.addEventListener('drop', async (e) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files && files.length > 0)
      await handleGetIlluts(Array.from(files).map(file => file.path))
  })
  dragWrapper.addEventListener('dragover', (e) => {
    e.preventDefault()
  })
}
onMounted(() => {
  dropInit()
})
onUnmounted(() => {
  const dragWrapper = document.getElementById('dropArea')
  dragWrapper.removeEventListener('drop', () => {})
  dragWrapper.removeEventListener('dragover', () => {})
})
</script>

<template>
  <div class="sufs-container">
    <div class="form-block">
      <el-alert
        type="info"
        show-icon
        :closable="false"
        style="margin-bottom: 10px"
      >
        <template #title>
          支持点击或拖拽到按钮内搜图, 或者导入之前保存的JSON数据。
        </template>
      </el-alert>
      <el-form
        label-width="80px"
        style="width: 100%"
        label-position="left"
      >
        <el-form-item label="操作">
          <el-button
            v-if="!statusController.processingLock.value"
            id="dropArea"
            :icon="Search"
            type="primary"
            @click="getIllusts"
          />
          <el-button
            v-if="!statusController.processingLock.value"
            :icon="Upload"
            type="primary"
            @click="getJsons"
          />
          <el-popover
            v-if="!statusController.processingLock.value && illusts.length > 0"
            placement="right"
            :width="500"
            trigger="hover"
          >
            <template #reference>
              <el-button
                :icon="Download"
                type="primary"
              />
            </template>
            <el-button size="small" @click="handleDownload('json', 'pixiv')">
              Pixiv-JSON
            </el-button>
            <el-button size="small" @click="handleDownload('txt', 'pixiv')">
              Pixiv-TXT
            </el-button>
            <el-button size="small" @click="handleDownload('json', 'twitter')">
              Twitter-JSON
            </el-button>
            <el-button size="small" @click="handleDownload('txt', 'twitter')">
              Twitter-TXT
            </el-button>
            <el-button size="small" @click="handleDownload('raw')">
              RAW
            </el-button>
          </el-popover>

          <el-button
            v-if="!statusController.processingLock.value && illusts.find((illust) => illust.error)"
            :icon="RefreshLeft"
            type="primary"
            @click="handleRetry"
          />
          <el-button
            v-if="statusController.processingLock.value"
            type="danger"
            :icon="Close"
            @click="handleAbort()"
          />
        </el-form-item>
      </el-form>
    </div>
    <div class="main-block">
      <el-table
        style="height: 100%"
        :data="illusts"
      >
        <el-table-column
          label="文件名"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.filename ? PathHelper.getBasename(row.filename) : '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="PID"
          width="120"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.pixiv ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="Twitter URL"
          width="200"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.twitter ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="状态"
          show-overflow-tooltip
          :filters="[
            { text: '未找到', value: 'not' },
            { text: '仅pixiv', value: 'pixiv' },
            { text: '仅twitter', value: 'twitter' },
            { text: '两者都', value: 'both' },
          ]"
          :filter-method="filterHandler"
        >
          <template #default="{ row }">
            <el-tag v-if="row.pixiv">
              Pixiv
            </el-tag>
            <el-tag v-if="row.twitter">
              Twitter
            </el-tag>
            <el-tag
              v-if="!row.pixiv && !row.twitter && !row.error"
              type="warning"
            >
              未找到
            </el-tag>
            <el-tag
              v-if="row.error"
              type="danger"
            >
              错误{{ row.error }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="stat-block">
      {{ statusController.statusMessage.value }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
@include Uni-SUFS-Container;
</style>
