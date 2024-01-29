<script setup lang="ts">
import { ref, toRaw } from 'vue'
import { Download, Search, Star } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { API } from '@render/ts/api'
import type { PixivIllust } from '@markpolochina/pixiv.ts'

const emit = defineEmits(['toIllust', 'toUser'])
const { ipcInvoke, ipcRemoveAll, ipcOnce, ipcSend, downloadPixivTo, downloadPixivUgoiraTo } = window.electron
const isLoading = ref(false)
const illusts = ref<PixivIllust[]>([])
const success = ref<number[]>([])
const retrys = ref<Record<number, number>>({})
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
    else { await downloadPixivTo(toRaw(illustObj), dir) }
    ElMessage.success('下载完成')
  }
  catch (err) {
    ElMessage.error(`下载失败: ${err}`)
  }
}
function tableRowClassName({
  row,
}: {
  row: PixivIllust
}) {
  if (success.value.includes(row.id))
    return 'success-row'
  return ''
}
async function handleDownloadAll() {
  const dir = await ipcInvoke('dialog:openDirectory')
  if (!dir)
    return
  const invisable: number[] = []
  const promises = illusts.value
    .filter((ele) => {
      if (!ele.visible)
        invisable.push(ele.id)
      return ele.visible
    })
    .map((ele) => {
      const process = async () => {
        try {
          if (ele.type === 'ugoira') {
            const meta = await API.getPixivUgoiraJson(ele.id)
            await downloadPixivUgoiraTo(toRaw(ele), dir, meta)
          }
          else { await downloadPixivTo(toRaw(ele), dir) }
        }
        catch (err) {
          if (!retrys.value[ele.id])
            retrys.value[ele.id] = 0
          if (retrys.value[ele.id] >= 3) {
            throw new Error('Too much retry')
          }
          else {
            ElMessage.error(`下载失败${err}。3s秒后自动重试`)
            retrys.value[ele.id] += 1
            setTimeout(process, 3000)
          }
        }
        success.value.push(ele.id)
      }
      return process()
    })
  Promise.all(promises).then(() => {
    ElMessage.success('下载完成')
    if (invisable.length !== 0) {
      ElMessage.warning(
        `忽略了${invisable.length}个不可访问项目: ${invisable.toString()}`,
      )
    }
  }).catch((err) => {
    ElMessage.error(`下载失败: ${err}`)
  })
}
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
async function handleBookmarkAll() {
  isLoading.value = true
  ElMessage.info('开始收藏')
  for (const illust of illusts.value) {
    if (illust.is_bookmarked || !illust.visible)
      continue
    try {
      await API.togglePixivBookmark(illust.id, true)
      illust.is_bookmarked = true
      await sleep(2000)
    }
    catch (err) {
      ElMessage.error(`错误: ${err}`)
    }
  }
  isLoading.value = false
  ElMessage.success('收藏完成')
}
async function getIllusts() {
  const files: string[] = await ipcInvoke('dialog:openFile', [{ name: 'Text', extensions: ['txt'] }])
  if (!files || files.length === 0)
    return
  try {
    const pixiv_ids = (await ipcInvoke('fs:getStringFromFile', files[0])).toString().split('\n')
    if (pixiv_ids.length === 0)
      return
    isLoading.value = true
    ElMessage.info(`共${pixiv_ids.length}个PID信息获取中`)
    illusts.value.length = 0
    for (const pixiv_id of pixiv_ids) {
      try {
        const illust = await API.getPixivInfo(Number.parseInt(pixiv_id))
        illusts.value.push(illust)
        await sleep(2000)
      }
      catch (err) {
        ElMessage.error(`${pixiv_id}错误:${err}`)
      }
    }
    isLoading.value = false
    ElMessage.success('信息获取完成')
  }
  catch (err) {
    ElMessage.error(`文件错误: ${err}`)
  }
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
  <div style="height: 100%">
    <div class="illust-form">
      <el-alert type="info" show-icon :closable="false" style="flex: none;margin-bottom: 10px;">
        <template #title>
          仅支持从txt文件批处理pixiv_id, 每行一个。
        </template>
      </el-alert>
      <el-form label-width="80px" style="width: 100%" label-position="left">
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
        </el-form-item>
      </el-form>
    </div>
    <div class="illust-result">
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
        <el-table-column prop="title" label="标题" show-overflow-tooltip />
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
  </div>
</template>

<style lang="scss" scoped>
.illust-result {
  display: flex;
  flex-direction: row;
  width: 100%;
  margin-top: 20px;
  margin-bottom: 20px;
  height: calc(100% - 120px);
}
:deep(.warning-row) {
  background-color: var(--el-color-warning-light-9);
}
:deep(.success-row) {
  background-color: var(--el-color-success-light-9);
}
:deep(.danger-row) {
  background-color: var(--el-color-danger-light-9);
}
</style>
