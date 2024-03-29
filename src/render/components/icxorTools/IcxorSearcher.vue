<script setup lang="ts">
import { ref } from 'vue'
import { Download, Search, Upload } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { SagiriResultDto } from '@render/ts/dto/sagiriResult'
import { PathHelper } from '@render/ts/util/path'
import { API } from '@render/ts/api'

const { ipcInvoke } = window.electron
const isLoading = ref(false)
const illusts = ref([])
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
async function getIllusts() {
  const files: string[] = await ipcInvoke('dialog:openFile', [{ name: 'Image', extensions: ['jpg', 'jpeg', 'png'] }])
  if (!files || files.length === 0)
    return
  isLoading.value = true
  illusts.value.length = 0
  ElMessage.info(`正在获取${files.length}张图像信息...`)
  try {
    for (const file of files) {
      const result: SagiriResultDto = await ipcInvoke('ss:run', file)
      illusts.value.push({ filename: PathHelper.getBasename(file), ...result })
      if (result.twitter && result.twitter.match(/status\/([\d]+)/))
        API.addDuplicate(result.pixiv || '', result.twitter.match(/status\/([\d]+)/)[1])

      await sleep(3000)
    }
    ElMessage.success('信息获取完成')
  }
  catch (err) {
    ElMessage.error(`错误: ${err}`)
  }
  finally {
    isLoading.value = false
  }
}
async function getJsons() {
  const files: string[] = await ipcInvoke('dialog:openFile', [{ name: 'JSON', extensions: ['json'] }])
  if (!files || files.length === 0)
    return
  isLoading.value = true
  illusts.value.length = 0
  ElMessage.info(`正在解析${files.length}个json信息...`)
  try {
    for (const file of files) {
      const result: SagiriResultDto = await ipcInvoke('ss:runJson', file)
      illusts.value.push({ filename: PathHelper.getBasename(file), ...result })
      if (result.twitter && result.twitter.match(/status\/([\d]+)/))
        API.addDuplicate(result.pixiv || '', result.twitter.match(/status\/([\d]+)/)[1])
    }
    ElMessage.success('信息获取完成')
  }
  catch (err) {
    ElMessage.error(`错误: ${err}`)
  }
  finally {
    isLoading.value = false
  }
}
async function handleDownload() {
  const dir = await ipcInvoke('dialog:openDirectory')
  if (!dir)
    return
  const pixiv_ids = Array.from(new Set(illusts.value.filter(illust => illust.pixiv).map(illust => illust.pixiv)))
  const twitter_urls = Array.from(new Set(illusts.value.filter(illust => illust.twitter).map(illust => illust.twitter)))
  await ipcInvoke('fs:saveStringToFile', PathHelper.joinFilenamePath(dir, 'pixiv_ids.txt'), pixiv_ids.join('\n'))
  await ipcInvoke('fs:saveStringToFile', PathHelper.joinFilenamePath(dir, 'twitter_urls.txt'), twitter_urls.join('\n'))
  await ipcInvoke('fs:saveStringToFile', PathHelper.joinFilenamePath(dir, 'pixiv_ids.json'), JSON.stringify(pixiv_ids))
  await ipcInvoke('fs:saveStringToFile', PathHelper.joinFilenamePath(dir, 'twitter_urls.json'), JSON.stringify(twitter_urls))
  ElMessage.success('保存完成')
}
</script>

<template>
  <div style="height: 100%">
    <div class="illust-form">
      <el-alert type="info" show-icon :closable="false" style="flex: none;margin-bottom: 10px;">
        <template #title>
          支持直接搜图, 或者导入之前保存的JSON数据。
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
            :icon="Upload"
            type="primary"
            :disabled="isLoading"
            @click="getJsons"
          />
          <el-button
            v-if="illusts.length !== 0"
            :icon="Download"
            type="primary"
            :disabled="isLoading"
            @click="handleDownload"
          />
        </el-form-item>
      </el-form>
    </div>
    <div class="illust-result">
      <el-table
        style="height: 100%"
        :data="illusts"
      >
        <el-table-column
          prop="filename"
          label="文件名"
          show-overflow-tooltip
        />
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
        >
          <template #default="{ row }">
            <el-tag
              v-if="row.pixiv"
            >
              Pixiv
            </el-tag>
            <el-tag
              v-if="row.twitter"
            >
              Twitter
            </el-tag>
            <el-tag
              v-if="!row.pixiv && !row.twitter"
              type="warning"
            >
              未找到
            </el-tag>
            <el-tag
              v-if="row.err"
              type="danger"
            >
              错误{{ row.err }}
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
