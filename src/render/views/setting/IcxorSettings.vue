<script setup lang="ts">
import IcxorConfig from '@render/components/IcxorSettings/IcxorConfig.vue'
import IcxorAbout from '@render/components/IcxorSettings/IcxorAbout.vue'
import IcxorRemote from '@render/components/IcxorSettings/IcxorRemote.vue'
import { onActivated, ref } from 'vue'
import { useRoute } from 'vue-router'
import IcxorTag from '@render/components/IcxorSettings/IcxorTag.vue'
import IcxorLocal from '@render/components/IcxorSettings/IcxorLocal.vue'
import IcxorPreference from '@render/components/IcxorSettings/IcxorPreference.vue'

const currentTab = ref('preference')
const route = useRoute()
onActivated(() => {
  if (route.query.redirect === 'about')
    currentTab.value = 'about'
})
</script>

<template>
  <div class="setting-container">
    <div class="title">
      设置
    </div>
    <el-tabs v-model="currentTab" class="tabs">
      <el-tab-pane label="偏好设置" name="preference" lazy>
        <IcxorPreference />
      </el-tab-pane>
      <el-tab-pane label="配置信息" name="config" lazy>
        <IcxorConfig />
      </el-tab-pane>
      <el-tab-pane label="远程基" name="remote" lazy>
        <IcxorRemote />
      </el-tab-pane>
      <el-tab-pane label="本地磁盘基" name="local" lazy>
        <IcxorLocal />
      </el-tab-pane>
      <el-tab-pane label="标签" name="tag" lazy>
        <IcxorTag />
      </el-tab-pane>
      <el-tab-pane label="关于" name="about" lazy>
        <IcxorAbout />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="scss" scoped>
.setting-container {
  width: calc(100% - 20px);
  height: calc(100% - 10px);
  padding: 10px 10px 0 10px;
  overflow: hidden;
  @include Flex-C;
  .title {
    padding: 10px;
    font-size: 24px;
    font-weight: bold;
    color: $color-greengray-1;
    flex: none;
  }
  .tabs {
    padding: 0 10px 0 10px;
    flex: auto;
    overflow: hidden;
    position: relative;
    :deep(.el-tab-pane) {
      height: 100%;
    }
    :deep(.el-tabs__content) {
      height: calc(100% - 55px);
    }
  }
}
</style>
