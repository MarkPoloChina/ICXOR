<script setup lang="ts">
import type { PixivIllust } from 'pixiv.ts'
import { Close, Finished, RefreshLeft } from '@element-plus/icons-vue'
import store from '@render/store/index'
import { API } from '@render/ts/api'
import { useStatusBar } from '@render/ts/composable/statusBar'
import { ElMessage } from 'element-plus'
import { ref, toRaw, watch } from 'vue'

const emit = defineEmits(['toIllust', 'toUser'])
const { ipcInvoke, ipcRemoveAll, ipcOnce, ipcSend, downloadPixivTo, downloadPixivUgoiraTo }
  = window.electron
const isLoading = ref(false)
const form = ref({
  task: 'download',
  source: 'user',
  sources: {
    user: {
      uid: '',
    },
  },
})
const statusController = useStatusBar()
interface PixivBatchDto {
  pid: number
  pixivObj: PixivIllust | null
  downloaded: boolean
  fails: {
    fetch: string | null
    bookmark: string | null
    download: string | null
  }
}
const illustDtos = ref<PixivBatchDto[]>([])
async function handleDownload(illustObj: PixivIllust) {
  const dir = await ipcInvoke('dialog:openDirectory')
  if (!dir)
    return
  if (!illustObj.visible) {
    ElMessage.error('本PID不可访问')
    return
  }
  try {
    if (illustObj.type === 'ugoira') {
      const meta = await API.getPixivUgoiraJson(illustObj.id)
      await downloadPixivUgoiraTo(toRaw(illustObj), dir, meta)
    }
    else {
      await downloadPixivTo(toRaw(illustObj), dir)
    }
    ElMessage.success('下载完成')
  }
  catch (err) {
    ElMessage.error(`下载失败: ${err}`)
  }
}
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
async function handleBookmarkAll() {
  statusController.initStart(illustDtos.value.length)
  for (const illustDto of illustDtos.value) {
    if (!illustDto.pixivObj || illustDto.pixivObj.is_bookmarked || !illustDto.pixivObj.visible) {
      statusController.step()
      continue
    }
    if (store.state.aibanBookmark && illustDto.pixivObj.illust_ai_type === 2) {
      illustDto.fails.bookmark = '跳过AI'
      statusController.step()
      continue
    }
    if (illustDto.fails.bookmark && illustDto.fails.bookmark.includes('[NRT]')) {
      statusController.step()
      continue
    }
    let retry = 0
    const process = async () => {
      try {
        await API.togglePixivBookmark(illustDto.pixivObj.id, true, false)
        illustDto.pixivObj.is_bookmarked = true
      }
      catch (err) {
        if (retry++ >= store.state.pixivReqMaxRetry || String(err).includes('[NRT]')) {
          ElMessage.error(`Too much retry in ${illustDto.pixivObj.id}`)
          illustDto.fails.bookmark = err.toString()
        }
        else {
          await sleep(store.state.pixivReqFailSleep)
          return await process()
        }
      }
    }
    await process()
    statusController.step()
    await sleep(store.state.pixivReqSleep)
  }
  statusController.finish()
}

function tableRowClassName({ row }: { row: PixivBatchDto }) {
  if (row.downloaded)
    return 'success-row'
  else if (row.fails.download)
    return 'danger-row'
  return ''
}

async function handleDownloadAll(defaultDir?: string) {
  const dir = defaultDir || (await ipcInvoke('dialog:openDirectory'))
  if (!dir)
    return
  statusController.initStart(illustDtos.value.length)
  for (const ele of illustDtos.value) {
    if (!ele.pixivObj || ele.downloaded) {
      statusController.step()
      continue
    }
    if (!ele.pixivObj.visible) {
      ele.fails.download = 'NOT VISIBLE'
      statusController.step()
      continue
    }
    if (ele.fails.download && ele.fails.download.includes('[NRT]')) {
      statusController.step()
      continue
    }
    let retrys = 0
    const process = async () => {
      try {
        if (ele.pixivObj.type === 'ugoira') {
          const meta = await API.getPixivUgoiraJson(ele.pixivObj.id)
          await downloadPixivUgoiraTo(toRaw(ele.pixivObj), dir, meta)
        }
        else {
          await downloadPixivTo(toRaw(ele.pixivObj), dir)
        }
        ele.downloaded = true
      }
      catch (err) {
        if (retrys++ >= store.state.downloadMaxRetry || String(err).includes('[NRT]')) {
          ElMessage.error(`Too much retry in ${ele.pixivObj.id}`)
          ele.fails.download = err.toString()
        }
        else {
          await sleep(store.state.downloadFailSleep)
          return await process()
        }
      }
    }
    await process()
    statusController.step()
    await sleep(store.state.downloadSleep)
  }
  statusController.finish()
}

async function handleFetch(retryMode = false) {
  let illusts: PixivIllust[]
  let d: string

  if (!retryMode) {
    try {
      if (form.value.source === 'user') {
        if (!form.value.sources.user.uid)
          return
        isLoading.value = true
        const r = await getUserIllusts(Number.parseInt(
          form.value.sources.user.uid,
        ), form.value.task === 'sync')
        illusts = r.illusts
        d = r.dir
      }
      else if (form.value.source === 'bookmark_public') {
        isLoading.value = true
        const r = await getBookmark(false, form.value.task === 'sync')
        illusts = r.illusts
        d = r.dir
      }
      else if (form.value.source === 'bookmark_private') {
        isLoading.value = true
        const r = await getBookmark(true, form.value.task === 'sync')
        illusts = r.illusts
        d = r.dir
      }
    }
    catch (err) {
      ElMessage.error(`获取失败: ${err}`)
      return
    }
    finally {
      isLoading.value = false
    }
  }

  if (illusts) {
    illustDtos.value = illusts.map(illust => ({
      pid: illust.id,
      pixivObj: illust,
      downloaded: false,
      fails: {
        fetch: null,
        bookmark: null,
        download: null,
      },
    }))
  }

  if (form.value.source === 'txt' && !retryMode)
    await getIllustsFromTxt()
  else if (form.value.source === 'txt' && retryMode)
    await retryGetIllustsFromTxt()

  if (form.value.task === 'download')
    await handleDownloadAll()
  else if (form.value.task === 'bookmark')
    await handleBookmarkAll()
  else if (form.value.task === 'sync' && d)
    await handleDownloadAll(d)
}

function handleAbort() {
  statusController.abort()
}

async function getIllustsFromTxt() {
  const files: string[] = await ipcInvoke('dialog:openFile', [
    { name: 'Text', extensions: ['txt'] },
  ])
  if (!files || files.length === 0)
    return
  const data = await ipcInvoke('fs:getStringFromFile', files[0])
  const pixiv_ids = data.toString().split('\n').map(s => s.trim()).filter(s => s.length > 0)

  illustDtos.value.length = 0
  statusController.initStart(pixiv_ids.length)
  for (const pixiv_id of pixiv_ids) {
    let retrys = 0
    const process = async () => {
      try {
        const illust = await API.getPixivInfo(Number.parseInt(pixiv_id))
        illustDtos.value.push({
          pid: illust.id,
          pixivObj: illust,
          downloaded: false,
          fails: {
            fetch: null,
            bookmark: null,
            download: null,
          },
        })
      }
      catch (err) {
        if (retrys++ >= store.state.pixivReqMaxRetry || String(err).includes('[NRT]')) {
          illustDtos.value.push({
            pid: Number.parseInt(pixiv_id),
            pixivObj: null,
            downloaded: false,
            fails: {
              fetch: err.toString(),
              bookmark: null,
              download: null,
            },
          })
        }
        else {
          await sleep(store.state.pixivReqFailSleep)
          return await process()
        }
      }
    }
    await process()
    statusController.step()
    await sleep(store.state.pixivReqSleep)
  }
  statusController.finish()
}

async function retryGetIllustsFromTxt() {
  statusController.initStart(illustDtos.value.length)
  for (const illustDto of illustDtos.value) {
    let retrys = 0
    if (illustDto.pixivObj) {
      statusController.step()
      continue
    }
    if (illustDto.fails.fetch && illustDto.fails.fetch.includes('[NRT]')) {
      statusController.step()
      continue
    }
    const process = async () => {
      try {
        const illust = await API.getPixivInfo(illustDto.pid)
        illustDto.pixivObj = illust
        illustDto.fails.fetch = null
      }
      catch (err) {
        if (retrys++ >= store.state.pixivReqMaxRetry || String(err).includes('[NRT]')) {
          illustDto.fails.fetch = err.toString()
        }
        else {
          await sleep(store.state.pixivReqFailSleep)
          return await process()
        }
      }
    }
    await process()
    statusController.step()
    await sleep(store.state.pixivReqSleep)
  }
  statusController.finish()
}

async function getBookmark(isPrivate: boolean, needStop: boolean) {
  let syncPath: string
  if (needStop) {
    syncPath = isPrivate
      ? store.state.pixivBookmarkPrivateDir
      : store.state.pixivBookmarkPublicDir
    if (!syncPath) {
      throw new Error('未设置同步目录')
    }
  }
  return {
    illusts: await API.getBookmark(isPrivate, syncPath),
    dir: syncPath,
  }
}

async function getUserIllusts(_uid: number, needStop: boolean) {
  let syncPath: string
  if (needStop) {
    const dir = store.state.pixivUserDir
    if (!dir) {
      throw new Error('未设置同步目录')
    }
    syncPath = `${dir}${_uid}`
  }

  const illustList: PixivIllust[] = []
  let firstReq = true
  let nextReq = null
  while (firstReq || nextReq) {
    if (firstReq) {
      const { illusts, nextUrl } = await API.getPixivUserIllusts(_uid, syncPath)
      illustList.push(...illusts)
      if (syncPath)
        break
      nextReq = nextUrl
      firstReq = false
    }
    else {
      const resp = await API.getPixivNextRequest(nextReq)
      illustList.push(...resp.illusts)
      nextReq = resp.next_url
    }
  }
  return {
    illusts: illustList,
    dir: syncPath,
  }
}

function handleRightClick(obj: PixivBatchDto) {
  if (!obj.pixivObj)
    return
  ipcRemoveAll('context:click')
  ipcOnce('context:click', (item) => {
    switch (item) {
      case '下载':
        handleDownload(obj.pixivObj)
        break
      case '在Pixiv中打开':
        emit('toIllust', { pid: obj.pixivObj.id, page: 0 })
        break
      default:
        break
    }
  })
  const popupTemplate = [{ label: '下载' }, { label: '在Pixiv中打开' }]
  ipcSend('context:popup', popupTemplate)
}
watch(
  () => form.value.task,
  (v: string) => {
    if (v === 'bookmark'
      && (form.value.source === 'bookmark_private' || form.value.source === 'bookmark_public')) {
      form.value.source = 'user'
    }
    else if (v === 'sync' && form.value.source === 'txt') {
      form.value.source = 'user'
    }
  },
)
</script>

<template>
  <div class="sufs-container">
    <div class="form-block">
      <el-form
        label-width="80px"
        style="width: 100%"
        label-position="left"
        @submit.prevent
      >
        <el-form-item label="任务">
          <el-row
            style="width: 100%"
            justify="space-between"
          >
            <el-col :span="12">
              <el-radio-group v-model="form.task" style="margin-right: 20px;">
                <el-radio label="download">
                  下载
                </el-radio>
                <el-radio label="sync">
                  下载同步
                </el-radio>
                <el-radio label="bookmark">
                  收藏
                </el-radio>
              </el-radio-group>
            </el-col>
            <el-col :span="8">
              <el-row justify="end">
                <el-button
                  v-if="!statusController.processingLock.value"
                  :icon="Finished"
                  type="primary"
                  :disabled="isLoading"
                  @click="handleFetch()"
                />
                <el-button
                  v-if="illustDtos.length > 0 && !statusController.processingLock.value"
                  :icon="RefreshLeft"
                  type="warning"
                  :disabled="isLoading"
                  @click="handleFetch(true)"
                />
                <el-button
                  v-if="statusController.processingLock.value"
                  :disabled="isLoading"
                  type="danger"
                  :icon="Close"
                  @click="handleAbort()"
                />
              </el-row>
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item label="来源">
          <el-row
            style="width: 100%"
            justify="space-between"
          >
            <el-col :span="12">
              <el-radio-group v-model="form.source">
                <el-radio label="user">
                  画师
                </el-radio>
                <el-radio v-if="form.task !== 'bookmark'" label="bookmark_public">
                  公开收藏
                </el-radio>
                <el-radio v-if="form.task !== 'bookmark'" label="bookmark_private">
                  私有收藏
                </el-radio>
                <el-radio v-if="form.task !== 'sync'" label="txt">
                  文本
                </el-radio>
              </el-radio-group>
            </el-col>
            <el-col :span="8">
              <el-row justify="end">
                <el-input
                  v-if="form.source === 'user'"
                  v-model="form.sources.user.uid"
                  placeholder="输入UID"
                />
              </el-row>
            </el-col>
          </el-row>
        </el-form-item>
      </el-form>
    </div>
    <div class="main-block">
      <el-table
        v-loading="isLoading"
        style="height: 100%"
        :data="illustDtos"
        :row-class-name="tableRowClassName"
        @row-contextmenu="handleRightClick"
      >
        <el-table-column
          label="PID"
          width="100"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.pixivObj?.pid ?? row.pid }}
          </template>
        </el-table-column>
        <el-table-column
          prop="pixivObj.page_count"
          label="总页数"
          width="80"
          show-overflow-tooltip
        />
        <el-table-column
          prop="pixivObj.user.name"
          label="作者"
          width="150"
          show-overflow-tooltip
        />
        <el-table-column
          prop="pixivObj.title"
          label="标题"
          show-overflow-tooltip
        />
        <el-table-column
          label="收藏状态"
          width="100"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <el-tag
              v-if="row.pixivObj && row.pixivObj.is_bookmarked"
              type="success"
            >
              已收藏
            </el-tag>
            <el-tag
              v-else-if="row.pixivObj && !row.pixivObj.is_bookmarked"
              type="warning"
            >
              未收藏
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="备注"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <el-tag
              v-if="row.pixivObj && !row.pixivObj.visible"
              type="danger"
            >
              失效
            </el-tag>
            <el-tag
              v-if="!row.pixivObj && !row.fails.fetch"
              type="warning"
            >
              未获取
            </el-tag>
            <el-tag
              v-if="row.fails.fetch"
              type="danger"
            >
              失败：{{ row.fails.fetch }}
            </el-tag>
            <el-tag
              v-if="row.fails.bookmark"
              type="danger"
            >
              失败：{{ row.fails.bookmark }}
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
