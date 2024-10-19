<script setup lang="ts">
import type { PixivIllust } from '@markpolochina/pixiv.ts'
import { Download, RefreshLeft, Search, Star } from '@element-plus/icons-vue'
import { API } from '@render/ts/api'
import { ElMessage } from 'element-plus'
import { ref, toRaw } from 'vue'

const emit = defineEmits(['toIllust', 'toUser'])
const { ipcInvoke, ipcRemoveAll, ipcOnce, ipcSend, downloadPixivTo, downloadPixivUgoiraTo }
  = window.electron
const isLoading = ref(false)
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
async function handleDownloadAll() {
  const dir = await ipcInvoke('dialog:openDirectory')
  if (!dir)
    return
  const invisable: number[] = []
  success.value.length = 0
  failed.value.length = 0
  isLoading.value = true
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
  isLoading.value = false
  ElMessage.success(
    `下载完成: 完成${success.value.length}个, 忽略了${invisable.length}个不可访问项目`,
  )
}
async function handleBookmarkAll() {
  isLoading.value = true
  ElMessage.info('开始收藏')
  stat.value = `收藏 0 / ${illusts.value.length}`
  let idx = 0
  for (const illust of illusts.value) {
    if (illust.is_bookmarked || !illust.visible)
      continue
    try {
      await API.togglePixivBookmark(illust.id, true, false)
      illust.is_bookmarked = true
      await sleep(2000)
    }
    catch (err) {
      ElMessage.error(`错误: ${err}`)
    }
    stat.value = `收藏 ${++idx} / ${illusts.value.length}`
  }
  isLoading.value = false
  stat.value += ' - 已完成'
  ElMessage.success('收藏完成')
}
async function getIllusts() {
  const files: string[] = await ipcInvoke('dialog:openFile', [
    { name: 'Text', extensions: ['txt'] },
  ])
  if (!files || files.length === 0)
    return
  try {
    const pixiv_ids = (await ipcInvoke('fs:getStringFromFile', files[0])).toString().split('\n')
    if (pixiv_ids.length === 0)
      return
    isLoading.value = true
    ElMessage.info(`共${pixiv_ids.length}个PID信息获取中`)
    illusts.value.length = 0
    success.value.length = 0
    failed.value.length = 0
    stat.value = `获取 0 / ${pixiv_ids.length}`
    for (const pixiv_id of pixiv_ids) {
      try {
        const illust = await API.getPixivInfo(Number.parseInt(pixiv_id))
        illusts.value.push(illust)
      }
      catch (err) {
        ElMessage.error(`${pixiv_id}错误:${err}`)
      }
      stat.value = `获取 ${illusts.value.length} / ${pixiv_ids.length}`
      await sleep(2000)
    }
    isLoading.value = false
    stat.value += ' - 已完成'
    ElMessage.success('信息获取完成')
  }
  catch (err) {
    ElMessage.error(`文件错误: ${err}`)
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
  isLoading.value = true
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
  isLoading.value = false
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
      <el-alert
        type="info"
        show-icon
        :closable="false"
        style="margin-bottom: 10px"
      >
        <template #title>
          仅支持从txt文件批处理pixiv_id, 每行一个。
        </template>
      </el-alert>
      <el-form
        label-width="80px"
        style="width: 100%"
        label-position="left"
      >
        <el-form-item label="操作">
          <el-button
            :icon="Search"
            type="primary"
            :disabled="isLoading"
            @click="getIllusts"
          />
          <el-button
            v-if="illusts.length !== 0"
            :icon="Download"
            type="primary"
            :disabled="isLoading"
            @click="handleDownloadAll"
          />
          <el-button
            v-if="illusts.length !== 0"
            :icon="Star"
            type="warning"
            :disabled="isLoading"
            @click="handleBookmarkAll"
          />
          <el-button
            v-if="failed.length !== 0"
            :icon="RefreshLeft"
            type="primary"
            :disabled="isLoading"
            @click="handleRetry"
          />
        </el-form-item>
      </el-form>
    </div>
    <div class="main-block">
      <el-table
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
        <el-table-column
          label="状态"
          width="200"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <el-tag
              v-if="!row.visible"
              type="danger"
            >
              失效
            </el-tag>
            <el-tag
              v-else-if="row.is_bookmarked"
              type="success"
            >
              已收藏
            </el-tag>
            <el-tag
              v-else
              type="warning"
            >
              未收藏
            </el-tag>
          </template>
        </el-table-column>
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
