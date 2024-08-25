<script setup lang="ts">
import { Picture } from '@element-plus/icons-vue'
import type { IllustObj } from '@render/ts/interface/illustObj'
import { PathHelper, UrlGenerator } from '@render/ts/util/path'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  list: Array as () => IllustObj[],
  totalCnt: Number,
  supportRemove: Boolean,
})

const emit = defineEmits(['showInfo', 'remove', 'loadMore'])

const { ipcRemoveAll, ipcOnce, ipcSend } = window.electron
const router = useRouter()

const image404s = ref({})

async function handleDownload(obj: IllustObj) {
  const { ipcInvoke, downloadTo } = window.electron

  const dir = await ipcInvoke('dialog:openDirectory')
  if (!dir)
    return
  const url = UrlGenerator.getBlobUrl(obj, 'original')
  try {
    await downloadTo(
      url,
      obj.remote_base.type === 'pixiv'
        ? PathHelper.getBasename(url)
        : obj.remote_endpoint,
      dir,
      url.includes('i.pximg.net'),
    )
    ElMessage.success('下载完成')
  }
  catch (err) {
    ElMessage.error('下载失败')
  }
}

function handleRightClick(event: MouseEvent, obj: IllustObj, supportToPixiv?: boolean) {
  if (event.stopPropagation)
    event.stopPropagation()

  ipcRemoveAll('context:click')
  ipcOnce('context:click', (item) => {
    switch (item) {
      case '详情':
        emit('showInfo', obj)
        break
      case '下载':
        handleDownload(obj)
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
  const popupTemplate: { type?: string; label?: string }[] = [{ label: '详情' }, { label: '下载' }]
  if (props.supportRemove)
    popupTemplate.push({ label: '移除' })
  if (supportToPixiv)
    popupTemplate.push({ type: 'separator' }, { label: '在Pixiv中打开' }, { label: '在Pixiv中打开作者' })
  ipcSend('context:popup', popupTemplate)
}
</script>

<template>
  <div class="viewer-main">
    <div class="scrollbar-container">
      <el-scrollbar style="height: 100%; border-radius: 5px">
        <div
          v-infinite-scroll="
            () => {
              emit('loadMore');
            }
          "
          :infinite-scroll-delay="100"
          :infinite-scroll-immediate="false"
          :infinite-scroll-distance="50"
          class="viewer-img-group"
        >
          <div
            v-for="(obj, index) in list"
            :key="index"
            class="viewer-img-container"
          >
            <div class="expo" />
            <el-image
              class="viewer-img"
              :src="image404s[obj.id] ? UrlGenerator.getBlobUrl(obj, 'original') : UrlGenerator.getBlobUrl(obj, 'square_medium')"
              :preview-src-list="[image404s[obj.id] ? UrlGenerator.getBlobUrl(obj, 'original') : UrlGenerator.getBlobUrl(obj, 's_large')]"
              fit="cover"
              lazy
              @error="image404s[obj.id] = true"
              @contextmenu.prevent="handleRightClick($event, obj, !!obj.meta)"
            >
              <template #error>
                <div class="image-slot">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </div>
        </div>
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
    .viewer-img-group {
      display: grid;
      justify-content: space-around;
      grid-template-columns: repeat(auto-fill, 220px);
    }
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
        width: 200px;
        height: 200px;
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
