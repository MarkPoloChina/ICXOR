<script setup lang="ts">
import { Check, Download, Remove } from '@element-plus/icons-vue'
import MetaForm from '@render/components/share/form/metaForm.vue'
import FilterTable from '@render/components/share/table/filterTable.vue'
import { API } from '@render/ts/api'
import { BatchDto } from '@render/ts/dto/batch'
import { FilenameAdapter } from '@render/ts/util/filename'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const { ipcInvoke } = window.electron

const remoteBaseList = ref([])
const log = reactive({ message: '', list: [] })
const showDialog = ref(false)
const metaForm = ref()
const table = ref()
const loading = ref(false)
const importOption = reactive<{
  importType: 'directory' | 'files'
  updatePolicy: 'cover' | 'onlyUpdate' | 'onlyAdd'
  autoInject: {
    defaultRemoteBaseId: number | undefined
    metaTitle: boolean
    remoteEndpointForPixiv: boolean
    thumbEndpoint: 'notSet' | 'same' | 'jpg'
    remoteEndpointPrefixForDefault: string
  }
  addition: Record<string, any>
}>({
  autoInject: {
    defaultRemoteBaseId: undefined,
    metaTitle: false,
    remoteEndpointForPixiv: false,
    thumbEndpoint: 'notSet',
    remoteEndpointPrefixForDefault: '',
  },
  importType: 'directory',
  updatePolicy: 'cover',
  addition: {},
})
function initTab() {
  importOption.importType = 'directory'
  importOption.updatePolicy = 'cover'
  importOption.autoInject = {
    defaultRemoteBaseId: undefined,
    metaTitle: false,
    remoteEndpointForPixiv: false,
    thumbEndpoint: 'notSet',
    remoteEndpointPrefixForDefault: '',
  }
  importOption.addition = {}
  log.list.length = 0
  log.message = ''
  metaForm.value.clearForm()
}
onMounted(() => {
  getRemoteBaseList()
})
async function getRemoteBaseList() {
  remoteBaseList.value = await API.getRemoteBase()
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
  const resp = await FilenameAdapter.getDtoList(paths, importOption.autoInject)
  ElMessage.info(`信息收集完成，共${resp.length}条数据`)
  loading.value = false
  log.list = resp
}
function handleUpload() {
  const selectedList = []
  log.list.forEach((ele) => {
    if (ele.checked)
      selectedList.push(ele.oriIdx)
  })
  if (selectedList.length === 0) {
    ElMessage.error('未选择任何数据')
    return
  }
  ElMessageBox.confirm(`将${selectedList.length}个项目进行上传，确认？`, 'Warning', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      loading.value = true
      const dto = new BatchDto()
      selectedList.forEach((idx) => {
        dto.dtos.push({
          bid: idx,
          dto: {
            ...importOption.addition,
            ...log.list[idx].dto,
          },
        })
      })
      dto.control.updatePolicy = importOption.updatePolicy
      try {
        const data = await API.updateIllusts(dto)
        ElMessage.info('处理完成')
        data.forEach((item) => {
          log.list[item.bid].status = item.status
          log.list[item.bid].message = item.message
        })
        log.list.forEach((ele) => {
          ele.checked = false
        })
        table.value.onReset()
      }
      catch {
        ElMessage.error('网络错误')
      }
      finally {
        loading.value = false
      }
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
          利用文件名创建Illust信息, 指向对应类型的Remote, 也可同时附加元数据。
        </template>
      </el-alert>
      <el-form
        :model="importOption"
        label-width="80px"
        style="width: 100%"
        label-position="left"
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
        <el-form-item label="默认识别">
          <el-row
            :gutter="20"
            style="width: 100%"
          >
            <el-col :span="6">
              <el-select
                v-model="importOption.autoInject.defaultRemoteBaseId"
                placeholder="选择默认基"
              >
                <el-option
                  v-for="item in remoteBaseList"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-col>
            <el-col :span="18">
              <el-input
                v-model="importOption.autoInject.remoteEndpointPrefixForDefault"
                placeholder="默认前导"
              />
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item label="信息注入">
          <el-checkbox
            v-model="importOption.autoInject.metaTitle"
            label="标题"
          />
          <el-checkbox
            v-model="importOption.autoInject.remoteEndpointForPixiv"
            label="Pixiv末端"
          />
          <el-select
            v-model="importOption.autoInject.thumbEndpoint"
            style="margin-left: 20px"
          >
            <el-option
              label="不变"
              value="notSet"
            />
            <el-option
              label="与原图一致"
              value="same"
            />
            <el-option
              label="jpg扩展名"
              value="jpg"
            />
          </el-select>
          <el-button
            style="margin-left: 20px"
            @click="showDialog = true"
          >
            附加元
          </el-button>
        </el-form-item>
        <el-form-item label="更新策略">
          <el-select v-model="importOption.updatePolicy">
            <el-option
              label="覆盖"
              value="cover"
            />
            <el-option
              label="仅更新"
              value="onlyUpdate"
            />
            <el-option
              label="仅添加"
              value="onlyAdd"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    <div class="main-block">
      <FilterTable
        ref="table"
        style="height: 100%; width: 100%"
        :list="log.list"
        :loading="loading"
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
  </div>
  <MetaForm
    ref="metaForm"
    v-model="showDialog"
    @update:addition="importOption.addition = $event"
  />
</template>

<style lang="scss" scoped>
@include Uni-SUFS-Container;
</style>
