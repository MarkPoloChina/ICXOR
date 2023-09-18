<script setup lang="ts">
import { Check, Remove } from '@element-plus/icons-vue'
import { useStore } from 'vuex'
import { onMounted, reactive, ref } from 'vue'
import { PathHelper } from '@render/ts/util/path'
import { ElMessage, ElMessageBox } from 'element-plus'

const { ipcInvoke } = window.electron
const configForm = reactive({
  username: '',
  localIHS: '',
  remoteIHS: '',
  useLocal: false,
  cos: '',
  pixivToken: '',
  pixivUserId: '',
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
</script>

<template>
  <div class="config">
    <div class="form-container">
      <el-scrollbar style="width: 100%">
        <div class="title-block">
          用户
        </div>
        <div class="form-block">
          <el-form :model="configForm" label-width="100px" style="width: 100%">
            <el-form-item label="用户名">
              <el-input
                v-model="configForm.username"
                placeholder="请输入用户名"
              />
            </el-form-item>
          </el-form>
        </div>
        <div class="title-block">
          本地存储
        </div>
        <div class="form-block">
          <el-form :model="configForm" label-width="100px" style="width: 100%">
            <el-form-item label="本地路径">
              <span>{{ PathHelper.getBaseUrl() }}</span>
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
          访图控制
        </div>
        <div class="form-block">
          <el-form :model="configForm" label-width="100px" style="width: 100%">
            <el-form-item label="IHS模式">
              <el-switch
                v-model="configForm.useLocal"
                active-text="内网"
                inactive-text="公网"
              />
            </el-form-item>
            <el-form-item label="公网IHS路径">
              <el-input
                v-model="configForm.remoteIHS"
                placeholder="请输入路径"
              />
            </el-form-item>
            <el-form-item label="内网IHS路径">
              <el-input
                v-model="configForm.localIHS"
                placeholder="请输入路径"
              />
            </el-form-item>
            <el-form-item label="COS路径">
              <el-input v-model="configForm.cos" placeholder="请输入路径" />
            </el-form-item>
          </el-form>
        </div>
        <div class="title-block">
          Pixiv API
        </div>
        <div class="form-block">
          <el-form :model="configForm" label-width="100px" style="width: 100%">
            <el-form-item label="Token">
              <el-input
                v-model="configForm.pixivToken"
                placeholder="请输入Token"
              />
            </el-form-item>
            <el-form-item label="UserID">
              <el-input
                v-model="configForm.pixivUserId"
                placeholder="请输入UserId"
              />
            </el-form-item>
          </el-form>
        </div>
      </el-scrollbar>
    </div>
    <div class="btn-block">
      <el-button
        type="success"
        :icon="Check"
        circle
        @click="commit"
      />
      <el-button
        type="danger"
        :icon="Remove"
        circle
        @click="revoke"
      />
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
