<script setup lang="ts">
import PixivIllust from '@render/components/icxorPixiv/pixivIllust.vue'
import { onActivated, ref } from 'vue'
import { useRoute } from 'vue-router'

const currentTab = ref('illust')
const route = useRoute()
const illust = ref(null)
onActivated(() => {
  if (route.fullPath.startsWith('/pixiv/illust')) {
    currentTab.value = 'illust'
    illust.value.handleSearchByLink(route.params.pid, route.params.page)
  }
})
</script>

<template>
  <div class="importer-container">
    <div class="title">
      Pixiv
    </div>
    <el-tabs v-model="currentTab" class="tabs">
      <el-tab-pane label="插画" name="illust">
        <PixivIllust ref="illust" />
      </el-tab-pane>
      <el-tab-pane label="画师" name="user" />
      <el-tab-pane label="收藏" name="bookmark" />
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
    height: calc(100% - 52px);
    :deep(.el-tabs__content) {
      height: calc(100% - 55px);
    }
    :deep(.el-tab-pane) {
      height: 100%;
    }
  }
}
</style>
