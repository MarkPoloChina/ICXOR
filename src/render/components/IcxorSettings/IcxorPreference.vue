<script setup lang="ts">
import { Check, Remove } from '@element-plus/icons-vue'
import { useStore } from 'vuex'
import { onMounted, reactive, ref } from 'vue'
import { PathHelper } from '@render/ts/util/path'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UtilDate } from '@render/ts/util/date'

const { ipcInvoke, ipcSend, ipcSendSync } = window.electron
const configForm = reactive({
  modeServer: true,
  useLocal: false,
  theme: 'system',
})
const store = useStore()
onMounted(() => {
  initForm()
  getCacheSize()
})
function initForm() {
  Object.keys(configForm).forEach((key) => {
    configForm[key] = store.state[key]
  })
}
function commit() {
  Object.keys(configForm).forEach((key) => {
    store.commit('reviseByKey', { key, value: configForm[key] })
  })
  ElMessage.success('修改成功,重载后生效')
}
function revoke() {
  initForm()
}
const cacheSize = ref(null)
async function getCacheSize() {
  const size = await ipcInvoke('app:getCacheSize')
  const formatBytes = (bytes) => {
    if (bytes === 0)
      return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
  }
  cacheSize.value = formatBytes(size)
}
function clearCache() {
  ElMessageBox.confirm('将清空全部缓存，确认？', 'Warning', {
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancel',
    type: 'warning',
  })
    .then(async () => {
      try {
        await ipcInvoke('app:clearCache')
        ElMessage.success('缓存已清空')
      }
      catch (error) {
        ElMessage.error('缓存清空失败')
      }
      finally {
        getCacheSize()
      }
    })
    .catch(() => {})
}
async function exportFile(filename: string) {
  const dir = await ipcInvoke('dialog:openDirectory')
  if (!dir)
    return
  try {
    await ipcInvoke(
      'fs:copy',
      PathHelper.joinFilenamePath(PathHelper.getBaseUrl(), filename),
      PathHelper.joinFilenamePath(
        dir,
        `${PathHelper.getPrefixName(filename)}_${UtilDate.getFullTimeNumber(
          new Date(),
        )}${PathHelper.getExtNameWithDot(filename)}`,
      ),
    )
    ElMessage.success('导出成功')
  }
  catch (error) {
    ElMessage.error('导出失败')
  }
}
async function openDir(filename: string) {
  const dir = PathHelper.getBaseUrl()
  ipcSend('app:openInFolder', PathHelper.joinFilenamePath(dir, filename))
}
async function upload() {
  try {
    const timestamp: { cloud: number;local: number } = await ipcInvoke('cs:getTimestamp')
    if (timestamp.local === timestamp.cloud) {
      ElMessage.info('本地数据库与云端数据库一致, 无需上传')
      return
    }
    ElMessageBox.confirm(`确认时间戳: 本地修改时间:${new Date(timestamp.local).toLocaleString()} ; 云端修改时间:${timestamp.cloud === -1 ? ' - ' : new Date(timestamp.cloud).toLocaleString()}。${timestamp.local < timestamp.cloud ? '注意!云端比本地更新' : ''}`, 'Warning',
      {
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }).then(async () => {
      try {
        ElMessage.info('上传中, 请勿关闭窗口')
        await ipcInvoke('cs:upload')
        ElMessage.success('上传成功')
      }
      catch (error) {
        ElMessage.error(`上传失败: ${error}`)
      }
    }).catch(() => {})
  }
  catch (error) {
    ElMessage.error(`获取时间戳失败: ${error}`)
  }
}
async function download() {
  try {
    const timestamp: { cloud: number;local: number } = await ipcInvoke('cs:getTimestamp')
    if (timestamp.cloud === -1) {
      ElMessage.error('云端数据库不存在, 请先上传')
      return
    }
    if (timestamp.local === timestamp.cloud) {
      ElMessage.info('本地数据库与云端数据库一致, 无需下载')
      return
    }
    ElMessageBox.confirm(`确认时间戳: 本地修改时间:${new Date(timestamp.local).toLocaleString()} ; 云端修改时间:${new Date(timestamp.cloud).toLocaleString()}。${timestamp.local > timestamp.cloud ? '注意!本地比云端更新' : ''}`, 'Warning',
      {
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }).then(async () => {
      try {
        ElMessage.info('下载中, 请勿关闭窗口')
        await ipcInvoke('cs:download')
        ElMessage.success('下载成功')
      }
      catch (error) {
        ElMessage.error(`下载失败: ${error}`)
      }
    }).catch(() => {})
  }
  catch (error) {
    ElMessage.error(`获取时间戳失败: ${error}`)
  }
}
</script>

<template>
  <div class="config">
    <div class="form-container">
      <el-scrollbar style="width: 100%">
        <div class="title-block">
          外观
        </div>
        <div class="form-block">
          <el-form :model="configForm" label-width="100px" style="width: 100%">
            <el-form-item label="主题">
              <el-radio-group v-model="configForm.theme">
                <el-radio label="system">
                  系统跟随
                </el-radio>
                <el-radio label="light">
                  明亮
                </el-radio>
                <el-radio label="dark">
                  黑暗
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </div>
        <div class="title-block">
          本地存储
        </div>
        <div class="form-block">
          <el-form :model="configForm" label-width="100px" style="width: 100%">
            <el-form-item label="配置文件">
              <el-button
                type="primary"
                size="small"
                @click="openDir('config.json')"
              >
                在{{ ipcSendSync('app:getOS') === 'darwin' ? 'Finder' : 'Explorer' }}中打开
              </el-button>
              <el-button
                type="primary"
                size="small"
                style="margin-left: 20px"
                @click="exportFile('config.json')"
              >
                导出
              </el-button>
            </el-form-item>
            <el-form-item label="数据库">
              <el-button
                type="primary"
                size="small"
                @click="openDir('main.db')"
              >
                在{{ ipcSendSync('app:getOS') === 'darwin' ? 'Finder' : 'Explorer' }}中打开
              </el-button>
              <el-button
                type="primary"
                size="small"
                style="margin-left: 20px"
                @click="exportFile('main.db')"
              >
                导出
              </el-button>
            </el-form-item>
            <el-form-item label="缓存大小">
              <span>{{ cacheSize ?? "正在计算中" }}</span>
              <el-button
                type="danger"
                size="small"
                style="margin-left: 20px"
                @click="clearCache"
              >
                清空
              </el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="title-block">
          COS云同步
        </div>
        <div class="form-block">
          <el-form :model="configForm" label-width="100px" style="width: 100%">
            <el-form-item label="同步">
              <el-button
                type="primary"
                size="small"
                @click="upload"
              >
                上传
              </el-button>
              <el-button
                type="primary"
                size="small"
                style="margin-left: 20px"
                @click="download"
              >
                下载
              </el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="title-block">
          访图控制
        </div>
        <div class="form-block">
          <el-form :model="configForm" label-width="100px" style="width: 100%">
            <el-form-item label="主模式">
              <el-switch
                v-model="configForm.modeServer"
                active-text="IHS文件服务器"
                inactive-text="磁盘"
              />
            </el-form-item>
            <template v-if="configForm.modeServer">
              <el-form-item label="IHS模式">
                <el-switch
                  v-model="configForm.useLocal"
                  active-text="内网"
                  inactive-text="公网"
                />
              </el-form-item>
            </template>
          </el-form>
        </div>
      </el-scrollbar>
    </div>
    <div class="btn-block">
      <el-button type="success" :icon="Check" circle @click="commit" />
      <el-button type="danger" :icon="Remove" circle @click="revoke" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.config {
  @include Flex-C;
  height: 100%;
  .form-container {
    @include Flex-C-AC;
    overflow: hidden;
    flex: auto;
    .title-block {
      padding: 10px 0 10px 0;
      font-size: 18px;
      color: $color-greengray-1;
    }
    .form-block {
      @include Flex-C-AC;
    }
  }
  .btn-block {
    @include Flex-R-JC;
    flex: none;
    margin: 20px 0 10px 0;
  }
}
</style>
