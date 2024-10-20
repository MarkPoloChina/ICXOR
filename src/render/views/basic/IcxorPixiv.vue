<script setup lang="ts">
import type { Ref } from 'vue'
import PixivBatch from '@render/components/icxorPixiv/pixivBatch.vue'
import PixivBookmark from '@render/components/icxorPixiv/pixivBookmark.vue'
import PixivIllust from '@render/components/icxorPixiv/pixivIllust.vue'
import PixivUser from '@render/components/icxorPixiv/pixivUser.vue'
import { onActivated, ref } from 'vue'
import { useRoute } from 'vue-router'

const currentTab = ref('illust')
const route = useRoute()
const pixivIllustRef: Ref<InstanceType<typeof PixivIllust>> = ref()
const pixivUserRef: Ref<InstanceType<typeof PixivUser>> = ref()
onActivated(() => {
  switch (route.query.redirect) {
    case 'illust':
      currentTab.value = 'illust'
      pixivIllustRef.value.handleSearchByLink(route.query.pid, route.query.page)
      break
    case 'user':
      currentTab.value = 'user'
      pixivUserRef.value.handleSearchByLink(route.query.uid)
      break
    case 'bookmark':
      currentTab.value = 'bookmark'
      break
    case 'batch':
      currentTab.value = 'batch'
      break
    default:
      break
  }
})
</script>

<template>
  <div class="main-container">
    <div class="title">
      Pixiv
    </div>
    <el-tabs
      v-model="currentTab"
      class="tabs"
    >
      <el-tab-pane
        label="插画"
        name="illust"
      >
        <PixivIllust
          ref="pixivIllustRef"
          @to-user="
            ($event) => {
              currentTab = 'user'
              pixivUserRef.handleSearchByLink($event.uid)
            }
          "
        />
      </el-tab-pane>
      <el-tab-pane
        label="画师"
        name="user"
      >
        <PixivUser
          ref="pixivUserRef"
          @to-illust="
            ($event) => {
              currentTab = 'illust'
              pixivIllustRef.handleSearchByLink($event.pid, $event.page)
            }
          "
        />
      </el-tab-pane>
      <el-tab-pane
        label="收藏"
        name="bookmark"
      >
        <PixivBookmark
          @to-illust="
            ($event) => {
              currentTab = 'illust'
              pixivIllustRef.handleSearchByLink($event.pid, $event.page)
            }
          "
        />
      </el-tab-pane>
      <el-tab-pane
        label="批处理"
        name="batch"
      >
        <PixivBatch
          @to-illust="
            ($event) => {
              currentTab = 'illust'
              pixivIllustRef.handleSearchByLink($event.pid, $event.page)
            }
          "
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="scss" scoped>
@include Uni-Main-Container;
</style>
