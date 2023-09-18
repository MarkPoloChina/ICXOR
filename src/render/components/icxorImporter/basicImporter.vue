<script setup lang="ts">
import { Check, Download, Remove } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { FilenameAdapter } from '@render/ts/util/filename'
import { onMounted, reactive, ref } from 'vue'
import { API } from '@render/ts/api'
import { BatchDto } from '@render/ts/dto/batch'
import MetaForm from '../reusable/metaForm.vue'
import FilterTable from './reusable/filterTable.vue'

const { ipcInvoke } = window.electron

const remoteBaseList = ref([])
const log = reactive({ message: '', list: [] })
const showDialog = ref(false)
const metaForm = ref()
const table = ref()
const loading = ref(false)
const importOption = reactive({
  paths: [],
  pathDir: '',
  autoKeys: {},
  importType: 'directory',
  importPolicy: 'add',
  acceptNormal: true,
  addition: {
    remote_base: { id: null },
    meta: {},
  },
})
function initTab() {
  importOption.importType = 'directory'
  importOption.importPolicy = 'add'
  importOption.autoKeys = {}
  importOption.paths = []
  importOption.pathDir = ''
  importOption.acceptNormal = true
  importOption.addition = {
    remote_base: { id: null },
    meta: {},
  }
  log.list.length = 0
  log.message = ''
  metaForm.value.initForm()
}
onMounted(() => {
  getRemoteBaseList()
})
async function getRemoteBaseList() {
  remoteBaseList.value = await API.getRemoteBase()
}
async function getDirectory() {
  let _path = ''
  _path = await ipcInvoke('dialog:openDirectory')
  if (_path)
    importOption.pathDir = _path
}
async function getFile() {
  let _path = []
  _path = await ipcInvoke('dialog:openFile')
  if (_path)
    importOption.paths = _path
}
async function startAction() {
  if (
    (importOption.importType === 'directory' && !importOption.pathDir)
    || (importOption.importType === 'files' && importOption.paths.length === 0)
  ) {
    ElMessage.error('路径非法')
    return
  }
  ElMessage.info('开始收集信息')
  loading.value = true
  const paths
    = importOption.importType === 'directory'
      ? await ipcInvoke(
        'fs:getFilenames',
        importOption.pathDir,
      )
      : importOption.paths
  const resp = await FilenameAdapter.getDtoList(
    paths,
    importOption.autoKeys,
    importOption.acceptNormal,
  )
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
  ElMessageBox.confirm(
    `将${selectedList.length}个项目进行上传，确认？`,
    'Warning',
    {
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
      type: 'warning',
    },
  )
    .then(async () => {
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
      dto.addition = { ...importOption.addition }
      if (importOption.importPolicy === 'cover')
        dto.control.addIfNotFound = true
      try {
        const data
          = importOption.importPolicy === 'add'
            ? await API.newIllusts(dto)
            : await API.updateIllusts(dto)
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
      catch (err) {
        ElMessage.error('网络错误')
      }
      finally {
        loading.value = false
      }
    })
    .catch(() => {})
}
function updateInfo({ data, controller }) {
  importOption.addition = { ...importOption.addition, ...data }
  if (controller)
    importOption.autoKeys = controller
}
</script>

<template>
  <div class="importer-main">
    <el-alert type="info" show-icon :closable="false" style="flex: none">
      <template #title>
        利用文件名创建Illust信息, 指向对应类型的Remote, 也可同时附加元数据。
      </template>
    </el-alert>
    <div class="import-area">
      <div class="title-block">
        导入选项
      </div>
      <div class="form-block">
        <el-form :model="importOption" label-width="100px" style="width: 100%">
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
          <el-form-item
            v-if="importOption.importType === 'directory'"
            label="路径"
          >
            <el-row :gutter="20" style="width: 100%">
              <el-col :span="6">
                <el-button @click="getDirectory">
                  选择文件夹
                </el-button>
              </el-col>
              <el-col :span="18">
                <el-input :model-value="importOption.pathDir" disabled />
              </el-col>
            </el-row>
          </el-form-item>
          <el-form-item v-else label="路径">
            <el-row :gutter="20" style="width: 100%">
              <el-col :span="6">
                <el-button @click="getFile">
                  选择文件
                </el-button>
              </el-col>
              <el-col :span="18">
                <el-input
                  :model-value="importOption.paths.toString()"
                  disabled
                />
              </el-col>
            </el-row>
          </el-form-item>
          <el-form-item label="默认基">
            <el-select
              v-model="importOption.addition.remote_base.id"
              placeholder="选择默认基"
            >
              <el-option
                v-for="item in remoteBaseList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="策略">
            <el-radio-group v-model="importOption.importPolicy">
              <el-radio label="add">
                增加
              </el-radio>
              <el-radio label="modify">
                更新
              </el-radio>
              <el-radio label="cover">
                覆盖
              </el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item>
            <el-row :gutter="20" style="width: 100%">
              <el-col :span="6">
                <el-button @click="showDialog = true">
                  附加元
                </el-button>
              </el-col>
              <el-col :span="12">
                <el-switch
                  v-model="importOption.acceptNormal"
                  active-text="全部图片"
                  inactive-text="仅可识别"
                />
              </el-col>
            </el-row>
          </el-form-item>
        </el-form>
      </div>
    </div>
    <div class="result-area">
      <div class="title-block">
        筛选器
      </div>
      <FilterTable
        ref="table"
        :list="log.list"
        :loading="loading"
        class="fliter-table"
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
    type="basic"
    @confirm="updateInfo"
  />
</template>

<style lang="scss" scoped>
.importer-main {
  height: 100%;
  @include Flex-C;
}
.import-area {
  padding: 0 10px 0 10px;
  flex: none;
  .form-block {
    @include Flex-C-AC;
  }
}
.result-area {
  padding: 0 10px 0 10px;
  flex: auto;
  overflow: hidden;
  .fliter-table {
    height: calc(100% - 45px) !important;
    width: 100%;
  }
}
.btn-block {
  margin: 10px 0 5px 0;
  flex: none;
  @include Flex-R-JC;
  .el-button + .el-button {
    margin-left: 30px;
  }
}
.title-block {
  padding: 10px 0 10px 0;
  font-size: 18px;
  color: $color-greengray-1;
}
</style>
