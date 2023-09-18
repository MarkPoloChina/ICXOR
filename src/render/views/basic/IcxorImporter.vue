<script setup lang="ts">
import { ref } from 'vue'
import PolyImporter from '@render/components/icxorImporter/polyImporter.vue'
import PixivRemoteImporter from '@render/components/icxorImporter/pixivRemoteImporter.vue'
import BasicImporter from '@render/components/icxorImporter/basicImporter.vue'

const currentTab = ref('basic')
</script>

<template>
  <div class="importer-container">
    <div class="title">
      导入
    </div>
    <el-tabs v-model="currentTab" class="tabs">
      <el-tab-pane label="基导入" name="basic">
        <BasicImporter />
      </el-tab-pane>
      <el-tab-pane label="聚合" name="poly">
        <PolyImporter />
      </el-tab-pane>
      <el-tab-pane label="Pixiv收藏" name="bookmark">
        <PixivRemoteImporter />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="scss" scoped>
.importer-container {
  @include Uni-Main-Container;
  .title {
    @include Uni-Main-Title;
  }
  .tabs {
    padding: 0 10px 0 10px;
    flex: auto;
    overflow: hidden;
    :deep(.el-tabs__content) {
      height: calc(100% - 55px);
    }
    :deep(.el-tab-pane) {
      height: 100%;
    }
  }
}
</style>
