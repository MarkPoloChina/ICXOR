<script setup lang="ts">
import { ref } from 'vue'
import { CloseBold, Refresh } from '@element-plus/icons-vue'
import TimelinePolyer from '@render/components/icxorPolyer/timelinePolyer.vue'
import PicoltPolyer from '@render/components/icxorPolyer/picoltPolyer.vue'
import LnrPolyer from '@render/components/icxorPolyer/lnrPolyer.vue'
import AuthorPolyer from '@render/components/icxorPolyer/authorPolyer.vue'
import SourcePolyer from '@render/components/icxorPolyer/sourcePolyer.vue'

const currentTab = ref('timeline')
const timeline = ref()
const picolt = ref()
const lnr = ref()
const author = ref()
const source = ref()
function reload() {
  switch (currentTab.value) {
    case 'timeline':
      timeline.value.reload()
      break
    case 'picolt':
      picolt.value.reload()
      break
    case 'lnr':
      lnr.value.reload()
      break
    case 'author':
      author.value.reload()
      break
    case 'source':
      source.value.reload()
      break
  }
}
function deletePicolt() {
  picolt.value.removePoly()
}
</script>

<template>
  <div class="viewer-container">
    <div class="title">
      <div>
        聚合
      </div>
      <div>
        <el-button :icon="Refresh" circle @click="reload" />
        <el-button v-if="currentTab === 'picolt'" type="danger" plain :icon="CloseBold" circle @click="deletePicolt" />
      </div>
    </div>
    <el-tabs v-model="currentTab" class="tabs">
      <el-tab-pane label="时间线" name="timeline" lazy>
        <TimelinePolyer ref="timeline" />
      </el-tab-pane>
      <el-tab-pane label="PICOLT聚合" name="picolt" lazy>
        <PicoltPolyer ref="picolt" />
      </el-tab-pane>
      <el-tab-pane label="LNR聚合" name="lnr" lazy>
        <LnrPolyer ref="lnr" />
      </el-tab-pane>
      <el-tab-pane label="作者专题聚合" name="author" lazy>
        <AuthorPolyer ref="author" />
      </el-tab-pane>
      <el-tab-pane label="图源聚合" name="source" lazy>
        <SourcePolyer ref="source" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="scss" scoped>
.viewer-container {
  @include Uni-Main-Container;
  .title {
    @include Uni-Main-Title;
    display: flex;
    justify-content: space-between;
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
