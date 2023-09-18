<script setup lang="ts">
import { FilenameAdapter } from '@render/ts/util/filename'
import { Check, Download, Remove } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive, ref } from 'vue'
import { API } from '@render/ts/api'
import { BatchDto } from '@render/ts/dto/batch'
import PolyForm from '../reusable/polyForm.vue'
import FilterTable from './reusable/filterTable.vue'

const { ipcInvoke } = window.electron
const log = reactive({ message: '', list: [] })
const table = ref()
const polyForm = ref()
const showDialog = ref(false)
const loading = ref(false)
const importOption = reactive({
  paths: [''],
  pathDir: '',
  importType: 'directory',
  isTryAny: false,
  poly: { name: null },
})
function initTab() {
  importOption.importType = 'directory'
  importOption.paths = []
  importOption.pathDir = ''
  importOption.isTryAny = false
  log.list.length = 0
  log.message = ''
  polyForm.value.initForm()
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
      ? await ipcInvoke('fs:getFilenames',
        importOption.pathDir,
      )
      : importOption.paths
  const resp = await FilenameAdapter.getDtoList(
    paths,
    [],
    importOption.isTryAny,
  )
  ElMessage.info(`信息收集完成，共${resp.length}条数据`)
  loading.value = false
  log.list = resp
}
function handleUpload() {
  if (!importOption.poly.name) {
    ElMessage.error('至少应当填写聚合名')
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
  ElMessageBox.confirm(
    `将${selectedList.length}个项目进行聚合，确认？`,
    'Warning',
    {
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
      type: 'warning',
    },
  )
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
      dto.polyBase = { ...importOption.poly }
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
function updateInfo({ data }) {
  importOption.poly = { ...importOption.poly, ...data }
}
</script>

<template>
  <div class="importer-main">
    <el-alert type="info" show-icon :closable="false" style="flex: none">
      <template #title>
        识别Pixiv规则的文件名, 匹配对应的PID和Page,
        或者仅尝试匹配末端，然后生成聚合。
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
          <el-form-item>
            <el-row :gutter="20" style="width: 100%">
              <el-col :span="6">
                <el-button @click="showDialog = true">
                  聚合设置
                </el-button>
              </el-col>
              <el-col :span="12">
                <el-switch
                  v-model="importOption.isTryAny"
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
    <PolyForm
      ref="polyForm"
      v-model="showDialog"
      type="pixiv"
      @confirm="updateInfo"
    />
  </div>
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
