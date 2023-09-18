<script setup lang="ts">
import { ref } from 'vue'
import TimelinePolyer from '@render/components/icxorPolyer/timelinePolyer.vue'
import PicoltPolyer from '@render/components/icxorPolyer/picoltPolyer.vue'
import LnrPolyer from '@render/components/icxorPolyer/lnrPolyer.vue'
import AuthorPolyer from '@render/components/icxorPolyer/authorPolyer.vue'
import SourcePolyer from '@render/components/icxorPolyer/sourcePolyer.vue'

const currentTab = ref('timeline')
</script>

<template>
  <div class="viewer-container">
    <div class="title">
      聚合
    </div>
    <el-tabs v-model="currentTab" class="tabs">
      <el-tab-pane label="时间线" name="timeline" lazy>
        <TimelinePolyer />
      </el-tab-pane>
      <el-tab-pane label="PICOLT聚合" name="picolt" lazy>
        <PicoltPolyer />
      </el-tab-pane>
      <el-tab-pane label="LNR聚合" name="lnr" lazy>
        <LnrPolyer />
      </el-tab-pane>
      <el-tab-pane label="作者专题聚合" name="author" lazy>
        <AuthorPolyer />
      </el-tab-pane>
      <el-tab-pane label="图源聚合" name="source" lazy>
        <SourcePolyer />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="scss" scoped>
.viewer-container {
  @include Uni-Main-Container;
  .title {
    @include Uni-Main-Title;
  }
  .tabs {
    padding: 0 10px 0 10px;
    height: calc(100% - 52px);
    position: relative;
    :deep(.el-tab-pane) {
      height: 100%;
    }
    > :deep(.el-tabs__content) {
      height: calc(100% - 55px);
    }
  }
}
</style>
