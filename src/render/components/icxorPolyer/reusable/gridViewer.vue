<script setup lang="ts">
import { Picture } from '@element-plus/icons-vue'
import { UrlGenerator } from '@render/ts/util/path'
import { useRouter } from 'vue-router'

const props = defineProps({
  list: Array<any>,
  totalCnt: Number,
  supportRemove: Boolean,
})

const emit = defineEmits(['showInfo', 'remove', 'loadMore'])

const { ipcRemoveAll, ipcOnce, ipcSend } = window.electron
const router = useRouter()

function handleRightClick(event, obj, supportToPixiv?: boolean) {
  if (event.stopPropagation)
    event.stopPropagation()

  ipcRemoveAll('context:click')
  ipcOnce('context:click', (item) => {
    switch (item) {
      case '详情':
        emit('showInfo', obj)
        break
      case '移除':
        emit('remove', obj)
        break
      case '在Pixiv中打开':
        router.push({
          name: 'pixiv',
          query: {
            redirect: 'illust',
            pid: obj.meta.pid,
            page: obj.meta.page,
          },
        })
        break
      case '在Pixiv中打开作者':
        router.push({
          name: 'pixiv',
          query: {
            redirect: 'user',
            uid: obj.meta.author_id,
          },
        })
        break
      default:
        break
    }
  })
  const popupTemplate = [{ label: '详情' }]
  if (props.supportRemove)
    popupTemplate.push({ label: '移除' })
  if (supportToPixiv)
    popupTemplate.push({ label: '在Pixiv中打开' }, { label: '在Pixiv中打开作者' })
  ipcSend('context:popup', popupTemplate)
}
</script>

<template>
  <div class="viewer-main">
    <div class="scrollbar-container">
      <el-scrollbar style="height: 100%; border-radius: 5px">
        <el-row
          v-infinite-scroll="
            () => {
              emit('loadMore');
            }
          "
          :infinite-scroll-delay="100"
          :infinite-scroll-immediate="false"
          :infinite-scroll-distance="50"
        >
          <el-col
            v-for="(obj, index) in list"
            :key="index"
            :span="6"
            class="viewer-img-container"
          >
            <div class="expo" />
            <el-image
              class="viewer-img"
              :src="UrlGenerator.getBlobUrl(obj, 'square_medium')"
              :preview-src-list="[UrlGenerator.getBlobUrl(obj, 's_large')]"
              fit="cover"
              lazy
              @contextmenu.prevent="handleRightClick($event, obj, !!obj.meta)"
            />
            <template #error>
              <div class="image-slot">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-col>
        </el-row>
      </el-scrollbar>
    </div>
    <div class="viewer-info">
      共{{ totalCnt }}张插画
    </div>
  </div>
</template>

<style lang="scss" scoped>
.viewer-main {
  height: 100%;
  @include Flex-C;
  .scrollbar-container {
    flex: auto;
    overflow: hidden;
    .viewer-img-container {
      position: relative;
      .expo {
        position: relative;
        width: 100%;
        height: 0;
        padding: 0;
        padding-bottom: 100%;
      }
      .viewer-img {
        border-radius: 5px;
        position: absolute;
        top: 10px;
        right: 10px;
        bottom: 10px;
        left: 10px;
        .image-slot {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          background: var(--el-fill-color-light);
          color: var(--el-text-color-secondary);
          font-size: 30px;
        }
      }
    }
  }
  .viewer-info {
    height: 50px;
    @include Flex-R-AC;
    color: $color-greengray-2;
    margin-left: 10px;
    flex: none;
  }
}
</style>
