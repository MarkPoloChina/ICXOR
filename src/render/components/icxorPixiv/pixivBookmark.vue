<script setup lang="ts">
import type { PixivIllust } from '@markpolochina/pixiv.ts'
import { Download, FolderAdd, RefreshLeft, Search } from '@element-plus/icons-vue'
import { API } from '@render/ts/api'
import { ElMessage } from 'element-plus'
import { reactive, ref, toRaw } from 'vue'
import { useStore } from 'vuex'

const emit = defineEmits(['toIllust', 'toUser'])
const { ipcInvoke, ipcRemoveAll, ipcOnce, ipcSend, downloadPixivTo, downloadPixivUgoiraTo }
  = window.electron
const store = useStore()
const form = reactive({
  type: 'public',
})
const isLoading = ref(false)
const isDownloading = ref(false)
const illusts = ref<PixivIllust[]>([])
const success = ref<number[]>([])
const failed = ref<number[]>([])
const stat = ref('就绪')
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
function tableRowClassName({ row }: { row: PixivIllust }) {
  if (success.value.includes(row.id))
    return 'success-row'
  else if (failed.value.includes(row.id))
    return 'danger-row'
  return ''
}
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
async function handleDownloadAll(defaultDir?: string) {
  const dir = defaultDir || (await ipcInvoke('dialog:openDirectory'))
  if (!dir)
    return
  const invisable: number[] = []
  success.value.length = 0
  failed.value.length = 0
  isDownloading.value = true
  stat.value = `下载[S+I+F/T]  0 + 0 + 0 / ${illusts.value.length} 个项目`
  for (const ele of illusts.value) {
    if (!ele.visible) {
      invisable.push(ele.id)
    }
    else {
      let retrys = 0
      const process = async () => {
        try {
          if (ele.type === 'ugoira') {
            const meta = await API.getPixivUgoiraJson(ele.id)
            await downloadPixivUgoiraTo(toRaw(ele), dir, meta)
          }
          else {
            await downloadPixivTo(toRaw(ele), dir)
          }
          success.value.push(ele.id)
        }
        catch {
          if (retrys++ >= 3) {
            ElMessage.error(`Too much retry in ${ele.id}`)
            failed.value.push(ele.id)
          }
          else {
            await sleep(2000)
            return await process()
          }
        }
      }
      await process()
    }
    stat.value = `下载[S+I+F/T]  ${success.value.length} + ${invisable.length} + ${failed.value.length} / ${illusts.value.length} 个项目`
  }
  isDownloading.value = false
  ElMessage.success(
    `下载完成: 完成${success.value.length}个, 忽略了${invisable.length}个不可访问项目`,
  )
}
async function handleSync() {
  const dir: string
    = form.type === 'private'
      ? store.state.pixivBookmarkPrivateDir
      : store.state.pixivBookmarkPublicDir
  if (!dir) {
    ElMessage.error('未设置同步目录')
    return
  }
  const syncPath = `${store.state.localDiskRoot}${dir}`
  await handleSearch(syncPath)
  await handleDownloadAll(syncPath)
}
async function handleSearch(stopIn?: string) {
  isLoading.value = true
  try {
    const resp = await API.getBookmark(form.type === 'private', stopIn)
    illusts.value.length = 0
    success.value.length = 0
    failed.value.length = 0
    illusts.value.push(...resp)
    stat.value = `${illusts.value.length}个项目`
  }
  catch (err) {
    ElMessage.error(`错误:${err}`)
  }
  finally {
    isLoading.value = false
  }
}
async function handleRetry() {
  const dir = await ipcInvoke('dialog:openDirectory')
  if (!dir)
    return
  const failedIds = failed.value
  failed.value.length = 0
  stat.value = `重试 0 / ${failedIds.length}`
  let idx = 0
  isDownloading.value = true
  for (const id of failedIds) {
    const ele = illusts.value.find(ele => ele.id === id)
    if (!ele)
      continue
    let retrys = 0
    const process = async () => {
      try {
        if (ele.type === 'ugoira') {
          const meta = await API.getPixivUgoiraJson(ele.id)
          await downloadPixivUgoiraTo(toRaw(ele), dir, meta)
        }
        else {
          await downloadPixivTo(toRaw(ele), dir)
        }
        success.value.push(ele.id)
      }
      catch {
        if (retrys++ >= 3) {
          ElMessage.error(`Too much retry in ${ele.id}`)
          failed.value.push(ele.id)
        }
        else {
          await sleep(2000)
          return await process()
        }
      }
    }
    await process()
    stat.value = `重试 ${++idx} / ${failedIds.length}`
  }
  stat.value += ' - 已完成'
  isDownloading.value = false
  ElMessage.success('重试完成')
}
function handleRightClick(obj: PixivIllust) {
  ipcRemoveAll('context:click')
  ipcOnce('context:click', (item) => {
    switch (item) {
      case '下载':
        handleDownload(obj)
        break
      case '在Pixiv中打开':
        emit('toIllust', { pid: obj.id, page: 0 })
        break
      default:
        break
    }
  })
  const popupTemplate = [{ label: '下载' }, { label: '在Pixiv中打开' }]
  ipcSend('context:popup', popupTemplate)
}
</script>

<template>
  <div class="sufs-container">
    <div class="form-block">
      <el-form
        label-width="80px"
        style="width: 100%"
        label-position="left"
      >
        <el-form-item label="类型">
          <el-row
            style="width: 100%"
            justify="space-between"
          >
            <el-radio-group v-model="form.type">
              <el-radio label="public">
                公开(Public)
              </el-radio>
              <el-radio label="private">
                不公开(Private)
              </el-radio>
            </el-radio-group>
            <el-col :span="8">
              <el-row justify="end">
                <el-button
                  v-if="illusts.length !== 0"
                  :icon="Download"
                  type="primary"
                  :disabled="isLoading || isDownloading"
                  @click="handleDownloadAll()"
                />
                <el-button
                  :icon="Search"
                  type="primary"
                  :disabled="isLoading || isDownloading"
                  @click="handleSearch()"
                />
                <el-button
                  :icon="FolderAdd"
                  type="primary"
                  :disabled="isLoading || isDownloading"
                  @click="handleSync"
                />
                <el-button
                  v-if="failed.length !== 0"
                  :icon="RefreshLeft"
                  type="primary"
                  :disabled="isLoading || isDownloading"
                  @click="handleRetry"
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
        :data="illusts"
        :row-class-name="tableRowClassName"
        @row-contextmenu="handleRightClick"
      >
        <el-table-column
          prop="id"
          label="PID"
          width="100"
          show-overflow-tooltip
        />
        <el-table-column
          prop="page_count"
          label="总页数"
          width="100"
          show-overflow-tooltip
        />
        <el-table-column
          prop="user.name"
          label="作者"
          width="150"
          show-overflow-tooltip
        />
        <el-table-column
          prop="title"
          label="标题"
          show-overflow-tooltip
        />
      </el-table>
    </div>
    <div class="stat-block">
      {{ stat }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
@include Uni-SUFS-Container;
</style>
