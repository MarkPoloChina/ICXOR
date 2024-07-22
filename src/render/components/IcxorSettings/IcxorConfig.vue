<script setup lang="ts">
import { Check, Remove } from '@element-plus/icons-vue'
import { useStore } from 'vuex'
import { onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const configForm = reactive({
  username: '',
  modeServer: true,
  localIHS: '',
  remoteIHS: '',
  localDiskRoot: '',
  useLocal: false,
  cos: '',
  mpsApiUrl: '',
  pixivToken: '',
  pixivUserId: '',
  pixivProxy: '',
  cosSecretId: '',
  cosSecretKey: '',
  cosBucket: '',
  cosRegion: '',
  sauceNAOToken: '',
})
const store = useStore()
onMounted(() => {
  initForm()
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
          COS云同步
        </div>
        <div class="form-block">
          <el-form :model="configForm" label-width="100px" style="width: 100%">
            <el-form-item label="SecretId">
              <el-input
                v-model="configForm.cosSecretId"
                placeholder="请输入SID"
              />
            </el-form-item>
            <el-form-item label="SecretKey">
              <el-input
                v-model="configForm.cosSecretKey"
                placeholder="请输入Skey"
              />
            </el-form-item>
            <el-form-item label="储存桶">
              <el-input v-model="configForm.cosBucket" placeholder="请输入储存桶名" />
            </el-form-item>
            <el-form-item label="区域">
              <el-input
                v-model="configForm.cosRegion"
                placeholder="请输入区域"
              />
            </el-form-item>
          </el-form>
        </div>
        <div class="title-block">
          访图控制
        </div>
        <div class="form-block">
          <el-form :model="configForm" label-width="100px" style="width: 100%">
            <el-form-item label="磁盘访问路径">
              <el-input v-model="configForm.localDiskRoot" placeholder="请输入路径" />
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
          MPS API
        </div>
        <div class="form-block">
          <el-form :model="configForm" label-width="100px" style="width: 100%">
            <el-form-item label="API路径">
              <el-input v-model="configForm.mpsApiUrl" placeholder="请输入路径" />
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
            <el-form-item label="代理">
              <el-input
                v-model="configForm.pixivProxy"
                placeholder="请输入形如host:port的代理"
              />
            </el-form-item>
          </el-form>
        </div>
        <div class="title-block">
          SauceNAO API
        </div>
        <el-form :model="configForm" label-width="100px" style="width: 100%">
          <el-form-item label="Token">
            <el-input
              v-model="configForm.sauceNAOToken"
              placeholder="请输入Token"
            />
          </el-form-item>
        </el-form>
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
