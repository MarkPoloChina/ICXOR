<script setup lang="ts">
import BasicImporter from '@render/components/icxorImporter/basicImporter.vue'
import PixivRemoteImporter from '@render/components/icxorImporter/pixivRemoteImporter.vue'
import PolyImporter from '@render/components/icxorImporter/polyImporter.vue'
import { ref } from 'vue'

const currentTab = ref('basic')
</script>

<template>
  <div class="main-container">
    <div class="title">
      导入
    </div>
    <el-tabs
      v-model="currentTab"
      class="tabs"
    >
      <el-tab-pane
        label="基导入"
        name="basic"
      >
        <BasicImporter />
      </el-tab-pane>
      <el-tab-pane
        label="聚合"
        name="poly"
      >
        <PolyImporter />
      </el-tab-pane>
      <el-tab-pane
        label="Pixiv收藏"
        name="bookmark"
      >
        <PixivRemoteImporter />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="scss" scoped>
@include Uni-Main-Container;
</style>
