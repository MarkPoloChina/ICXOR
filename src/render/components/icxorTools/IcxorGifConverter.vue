<script setup lang="ts">
import { ref } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { PathHelper } from '@render/ts/util/path'

const { ipcInvoke } = window.electron
const isLoading = ref(false)
const illusts = ref([])
const stat = ref('就绪')
async function handleConvertGif() {
  const files: string[] = await ipcInvoke('dialog:openFile', [{ name: 'Zip', extensions: ['zip'] }])
  if (!files || files.length === 0)
    return
  isLoading.value = true
  illusts.value.length = 0
  ElMessage.info(`正在转换${files.length}个文件...`)
  stat.value = `0 / ${files.length}`
  for (const file of files) {
    const filename = PathHelper.getBasename(file)
    const output = file.replace(/\@\d+ms\.zip$/, '.gif')
    if (filename.match(/\@\d+ms/)) {
      const delay = Number.parseInt(filename.match(/\@(\d+)ms/)[1])
      try {
        await ipcInvoke('ms:convertGif', file, output, delay)
        illusts.value.push({ filename, status: 'success' })
      }
      catch (err) {
        illusts.value.push({ filename, status: 'failed', error: err })
      }
    }
    else {
      illusts.value.push({ filename, status: 'ignored' })
    }
    stat.value = `${illusts.value.length} / ${files.length}`
  }
  ElMessage.success('转换完成')
  stat.value += ' - 已完成'
  isLoading.value = false
}
</script>

<template>
  <div style="height: 100%">
    <div class="illust-form">
      <el-alert type="info" show-icon :closable="false" style="flex: none;margin-bottom: 10px;">
        <template #title>
          仅支持从带delay的zip文件转换成gif。
        </template>
      </el-alert>
      <el-form label-width="80px" style="width: 100%" label-position="left">
        <el-form-item label="操作">
          <el-button
            :icon="Search"
            type="primary"
            :disabled="isLoading"
            @click="handleConvertGif"
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
          label="状态"
          width="200"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <el-tag
              v-if="row.error"
              type="danger"
            >
              失败:{{ row.error }}
            </el-tag>
            <el-tag
              v-else-if="row.status === 'success'"
              type="success"
            >
              完成
            </el-tag>
            <el-tag
              v-else-if="row.status === 'ignored'"
              type="info"
            >
              忽略
            </el-tag>
            <el-tag
              v-else
              type="info"
            >
              未知
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="illust-stat">
      {{ stat }}
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
  height: calc(100% - 150px);
}
.illust-stat {
  color: $color-greengray-3;
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
