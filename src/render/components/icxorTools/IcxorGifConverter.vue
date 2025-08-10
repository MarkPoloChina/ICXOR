<script setup lang="ts">
import { Close, Search } from '@element-plus/icons-vue'
import { useStatusBar } from '@render/ts/composable/statusBar'
import { PathHelper } from '@render/ts/util/path'
import { ref } from 'vue'

const { ipcInvoke } = window.electron
const illusts = ref([])
const statusController = useStatusBar()
async function handleConvertGif() {
  const files: string[] = await ipcInvoke('dialog:openFile', [{ name: 'Zip', extensions: ['zip'] }])
  if (!files || files.length === 0)
    return
  illusts.value.length = 0
  statusController.initStart(files.length)
  for (const file of files) {
    const filename = PathHelper.getBasename(file)
    const output = file.replace(/@\d+ms\.zip$/, '.gif')
    if (filename.match(/@\d+ms/)) {
      const delay = Number.parseInt(filename.match(/@(\d+)ms/)[1])
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
    statusController.step()
  }
  statusController.finish()
}
function handleAbort() {
  statusController.abort()
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
          仅支持从带delay的zip文件转换成gif。
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
            :icon="Search"
            type="primary"
            @click="handleConvertGif"
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
    <div class="stat-block">
      {{ statusController.statusMessage.value }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
@include Uni-SUFS-Container;
</style>
