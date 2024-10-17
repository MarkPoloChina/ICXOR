<script setup lang="ts">
import type PixivIllust from '@render/components/icxorPixiv/pixivIllust.vue'
import type { Ref } from 'vue'
import IcxorGifConverter from '@render/components/icxorTools/IcxorGifConverter.vue'
import IcxorSearcher from '@render/components/icxorTools/IcxorSearcher.vue'
import { onActivated, ref } from 'vue'
import { useRoute } from 'vue-router'

const currentTab = ref('search')
const route = useRoute()
const illust: Ref<typeof PixivIllust> = ref()
onActivated(() => {
  switch (route.query.redirect) {
    case 'search':
      currentTab.value = 'search'
      illust.value.handleSearchByLink(route.query.pid, route.query.page)
      break
    default:
      break
  }
})
</script>

<template>
  <div class="importer-container">
    <div class="title">
      工具
    </div>
    <el-tabs
      v-model="currentTab"
      class="tabs"
    >
      <el-tab-pane
        label="搜图"
        name="search"
      >
        <IcxorSearcher />
      </el-tab-pane>
      <el-tab-pane
        label="GIF转换"
        name="gifConvert"
      >
        <IcxorGifConverter />
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
