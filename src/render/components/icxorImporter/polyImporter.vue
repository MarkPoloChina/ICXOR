<script setup lang="ts">
import { Check, Download, Remove } from '@element-plus/icons-vue'
import PolyForm from '@render/components/share/form/polyForm.vue'
import FilterTable from '@render/components/share/table/filterTable.vue'
import { API } from '@render/ts/api'
import { BatchDto } from '@render/ts/dto/batch'
import { FilenameAdapter } from '@render/ts/util/filename'
import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive, ref } from 'vue'

const { ipcInvoke } = window.electron
const log = reactive({ message: '', list: [] })
const table = ref()
const polyForm = ref()
const showDialog = ref(false)
const loading = ref(false)
const importOption = reactive({
  importType: 'directory',
  polyOption: {
    id: 0,
    type: 'picolt',
    parent: '',
    name: '',
  },
})
function initTab() {
  importOption.importType = 'directory'
  importOption.polyOption.id = 0
  importOption.polyOption.type = 'picolt'
  importOption.polyOption.parent = ''
  importOption.polyOption.name = ''
  log.list.length = 0
  log.message = ''
  polyForm.value.clearForm()
}
async function startAction() {
  const paths = []
  if (importOption.importType === 'directory') {
    const dir = await ipcInvoke('dialog:openDirectory')
    if (!dir)
      return
    ElMessage.info('开始收集信息')
    loading.value = true
    paths.push(...(await ipcInvoke('fs:getFilenames', dir)))
  }
  else {
    const files: string[] = await ipcInvoke('dialog:openFile', [
      { name: 'Images', extensions: ['jpg', 'png', 'gif'] },
    ])
    if (!files)
      return
    ElMessage.info('开始收集信息')
    loading.value = true
    paths.push(...files)
  }
  const resp = await FilenameAdapter.getDtoRecoList(paths)
  ElMessage.info(`信息收集完成，共${resp.length}条数据`)
  loading.value = false
  log.list = resp
}
function handleUpload() {
  if (!importOption.polyOption.name) {
    ElMessage.error('至少应当填写PICOLT名')
    return
  }
  const selectedList = []
  log.list.forEach((ele) => {
    if (ele.checked)
      selectedList.push(ele.oriIdx)
  })
  if (selectedList.length === 0) {
    ElMessage.error('未选择任何数据')
    return
  }
  ElMessageBox.confirm(`将${selectedList.length}个项目进行聚合，确认？`, 'Warning', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      loading.value = true
      const dto = new BatchDto()
      selectedList.forEach((idx) => {
        dto.dtos.push({
          bid: idx,
          dto: {
            ...log.list[idx].dto,
          },
        })
      })
      dto.polyBase = { ...importOption.polyOption }
      API.addPoly(dto)
        .then((data) => {
          ElMessage.info('处理完成')
          data.forEach((item) => {
            log.list[item.bid].status = item.status
            log.list[item.bid].message = item.message
          })
          log.list.forEach((ele) => {
            ele.checked = false
          })
          table.value.onReset()
        })
        .catch((err) => {
          ElMessage.error(`错误: ${err}`)
        })
        .finally(() => {
          loading.value = false
        })
    })
    .catch(() => {})
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
          识别Pixiv规则的文件名, 匹配对应的PID和Page, 或者仅尝试匹配末端，然后生成PICOLT聚合。
        </template>
      </el-alert>
      <el-form
        :model="importOption"
        label-width="80px"
        style="width: 100%"
        label-position="left"
        :inline="true"
      >
        <el-form-item label="导入类型">
          <el-radio-group v-model="importOption.importType">
            <el-radio label="directory">
              文件夹
            </el-radio>
            <el-radio label="files">
              文件
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button @click="showDialog = true">
            聚合设置
          </el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="main-block">
      <FilterTable
        ref="table"
        :list="log.list"
        :loading="loading"
        style="height: 100%; width: 100%"
      />
    </div>
    <div class="btn-block">
      <el-button
        type="primary"
        :icon="Download"
        circle
        @click="startAction"
      />
      <el-button
        type="success"
        :icon="Check"
        circle
        @click="handleUpload"
      />
      <el-button
        type="danger"
        :icon="Remove"
        circle
        @click="initTab"
      />
    </div>
    <PolyForm
      ref="polyForm"
      v-model="showDialog"
      @update:poly-option="importOption.polyOption = { ...importOption.polyOption, ...$event }"
    />
  </div>
</template>

<style lang="scss" scoped>
@include Uni-SUFS-Container;
</style>
