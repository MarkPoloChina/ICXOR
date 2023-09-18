<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, reactive, ref } from 'vue'
import { PathHelper, UrlGenerator } from '@render/ts/util/path'

const props = defineProps({
  modelValue: Boolean,
  downloadList: Array,
})

const emit = defineEmits(['update:modelValue'])
const { ipcInvoke, downloadTo } = window.electron
const downloadOption = reactive({
  pathDir: '',
})
const downloadCnt = ref(0)
async function getDirectory() {
  let _path = ''
  _path = await ipcInvoke('dialog:openDirectory')
  if (_path)
    downloadOption.pathDir = _path
}
const dialogVisible = computed({
  get: () => {
    return props.modelValue
  },
  set: (value) => {
    emit('update:modelValue', value)
  },
})
const writableList = computed({
  get: () => {
    return props.downloadList
  },
  set: () => {},
})
const progress = computed(() => {
  return (downloadCnt.value / writableList.value.length) * 100
})
function progressText() {
  return `${downloadCnt.value} / ${writableList.value.length}`
}
const status = computed({
  get: () => {
    if (status.value === 'warning')
      return status.value
    return progress.value === 100 ? 'success' : ''
  },
  set: () => {},
})
function handleDownload() {
  if (writableList.value.length === 0) {
    ElMessage.error('未选定数据')
    return
  }
  if (!downloadOption.pathDir) {
    ElMessage.error('路径非法')
    return
  }
  downloadCnt.value = 0
  const process = async (obj) => {
    const url = UrlGenerator.getBlobUrl(obj, 'original')
    try {
      await downloadTo(
        url,
        obj.remote_base.type === 'pixiv'
          ? PathHelper.getBasename(url)
          : obj.remote_endpoint,
        downloadOption.pathDir,
      )
    }
    catch (err) {
      ElMessage.error(`第${downloadCnt.value + 1}文件${obj.id}下载失败`)
      status.value = 'warning'
    }
    finally {
      downloadCnt.value++
    }
  }
  for (const obj of writableList.value) process(obj)
}
function handleClose() {
  downloadCnt.value = 0
  downloadOption.pathDir = ''
  dialogVisible.value = false
}
</script>

<template>
  <div>
    <el-dialog
      v-model="dialogVisible"
      title="下载表单"
      width="80%"
      @close="handleClose"
    >
      <el-form :model="downloadOption" label-width="100px" style="width: 100%">
        <el-form-item label="路径">
          <el-row :gutter="20" style="width: 100%">
            <el-col :span="6">
              <el-button @click="getDirectory">
                选择文件夹
              </el-button>
            </el-col>
            <el-col :span="18">
              <el-input :model-value="downloadOption.pathDir" disabled />
            </el-col>
          </el-row>
        </el-form-item>
      </el-form>
      <el-progress
        style="width: 100%; margin-bottom: 10px"
        :stroke-width="24"
        :percentage="progress"
        :status="status"
      >
        <div style="width: 100px; text-align: center; font-size: 15px">
          {{ progressText() }}
        </div>
      </el-progress>
      <el-table
        :data="writableList"
        :height="300"
        style="width: 100%"
        class="fliter-table"
      >
        <el-table-column
          prop="id"
          label="PID"
          width="100"
          show-overflow-tooltip
        />
        <el-table-column
          prop="remote_base.name"
          label="类型"
          width="100"
          show-overflow-tooltip
        />
        <el-table-column
          prop="meta.pid"
          label="PID"
          width="100"
          show-overflow-tooltip
        />
        <el-table-column label="标题/末端" show-overflow-tooltip>
          <template #default="scope">
            {{
              scope.row.meta ? scope.row.meta.title : scope.row.remote_endpoint
            }}
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleClose">Close</el-button>
          <el-button type="primary" @click="handleDownload">
            Confirm
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped></style>
