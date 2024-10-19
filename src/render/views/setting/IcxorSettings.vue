<script setup lang="ts">
import IcxorAbout from '@render/components/IcxorSettings/IcxorAbout.vue'
import IcxorConfig from '@render/components/IcxorSettings/IcxorConfig.vue'
import IcxorLocal from '@render/components/IcxorSettings/IcxorLocal.vue'
import IcxorPoly from '@render/components/IcxorSettings/IcxorPoly.vue'
import IcxorPreference from '@render/components/IcxorSettings/IcxorPreference.vue'
import IcxorRemote from '@render/components/IcxorSettings/IcxorRemote.vue'
import IcxorTag from '@render/components/IcxorSettings/IcxorTag.vue'
import { onActivated, ref } from 'vue'
import { useRoute } from 'vue-router'

const currentTab = ref('preference')
const route = useRoute()
onActivated(() => {
  if (route.query.redirect === 'about')
    currentTab.value = 'about'
})
</script>

<template>
  <div class="main-container">
    <div class="title">
      设置
    </div>
    <el-tabs
      v-model="currentTab"
      class="tabs"
    >
      <el-tab-pane
        label="偏好设置"
        name="preference"
        lazy
      >
        <IcxorPreference />
      </el-tab-pane>
      <el-tab-pane
        label="配置信息"
        name="config"
        lazy
      >
        <IcxorConfig />
      </el-tab-pane>
      <el-tab-pane
        label="远程基"
        name="remote"
        lazy
      >
        <IcxorRemote />
      </el-tab-pane>
      <el-tab-pane
        label="本地磁盘基"
        name="local"
        lazy
      >
        <IcxorLocal />
      </el-tab-pane>
      <el-tab-pane
        label="PICOLT聚合基"
        name="poly"
        lazy
      >
        <IcxorPoly />
      </el-tab-pane>
      <el-tab-pane
        label="标签"
        name="tag"
        lazy
      >
        <IcxorTag />
      </el-tab-pane>
      <el-tab-pane
        label="关于"
        name="about"
        lazy
      >
        <IcxorAbout />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="scss" scoped>
@include Uni-Main-Container;
</style>
