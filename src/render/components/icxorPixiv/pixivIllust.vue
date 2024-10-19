<script setup lang="ts">
import type { PixivIllust } from '@markpolochina/pixiv.ts'
import { Download, Lock, Picture, Search, Star, Unlock } from '@element-plus/icons-vue'
import { API } from '@render/ts/api'
import { UrlGenerator } from '@render/ts/util/path'
import { ElMessage } from 'element-plus'
import { reactive, ref, toRaw, watch } from 'vue'

const emit = defineEmits(['toIllust', 'toUser'])
const { ipcInvoke, downloadPixivTo, downloadPixivUgoiraTo } = window.electron
const form = reactive({
  pid: '',
  page: 0,
})
const pid = ref('')
const page = ref(0)
const maxpage = ref(10000)
const isLoading = ref(false)
const isImgLoading = ref(false)
const illustObj = ref<PixivIllust>(null)
const isPrivate = ref(false)
watch(
  () => form.page,
  (v) => {
    if (illustObj.value)
      page.value = v
  },
)
function handleSearchByLink(_pid, _page) {
  form.page = Number.parseInt(_page)
  form.pid = _pid
  handleSearch(_pid, Number.parseInt(_page))
}
async function handleDownload() {
  const dir = await ipcInvoke('dialog:openDirectory')
  if (!dir)
    return
  try {
    if (illustObj.value.type === 'ugoira') {
      const meta = await API.getPixivUgoiraJson(illustObj.value.id)
      await downloadPixivUgoiraTo(toRaw(illustObj.value), dir, meta)
    }
    else {
      await downloadPixivTo(toRaw(illustObj.value), dir, page.value)
    }
    ElMessage.success('下载完成')
  }
  catch (err) {
    ElMessage.error(`下载失败: ${err}`)
  }
}
function handleSearchByBtn() {
  if (!form.pid || !/[1-9]\d*\]*/.test(form.pid)) {
    ElMessage.error('PID非法')
    return
  }
  handleSearch(form.pid, form.page)
}
function handleSearch(_pid, _page) {
  isLoading.value = true
  illustObj.value = null
  API.getPixivInfo(_pid)
    .then((resp) => {
      if (_page >= resp.page_count) {
        ElMessage.error('页数超出索引')
      }
      else {
        pid.value = _pid
        page.value = _page
        illustObj.value = resp
        maxpage.value = resp.page_count - 1
      }
    })
    .catch((err) => {
      ElMessage.error(`错误:${err}`)
    })
    .finally(() => {
      isLoading.value = false
    })
}
function handleBookmark() {
  API.togglePixivBookmark(illustObj.value.id, !illustObj.value.is_bookmarked, isPrivate.value)
    .then(() => {
      illustObj.value.is_bookmarked = !illustObj.value.is_bookmarked
      ElMessage.success(`${!illustObj.value.is_bookmarked ? '取消' : ''}收藏成功`)
    })
    .catch((err) => {
      ElMessage.error(`错误: ${err}`)
    })
}
watch(
  () => [illustObj.value, page.value],
  () => {
    isImgLoading.value = true
  },
)
defineExpose({ handleSearchByLink })
</script>

<template>
  <div
    v-loading="isLoading"
    class="sufs-container"
  >
    <div class="form-block">
      <el-form
        label-width="80px"
        style="width: 100%"
        label-position="left"
      >
        <el-form-item label="PID">
          <el-input
            v-model="form.pid"
            placeholder="输入PID"
          />
        </el-form-item>
        <el-form-item label="页号">
          <el-row
            style="width: 100%"
            justify="space-between"
          >
            <el-col :span="12">
              <el-input-number
                v-model="form.page"
                :min="0"
                :max="maxpage"
              />
            </el-col>
            <el-col :span="8">
              <el-row justify="end">
                <el-button
                  v-if="illustObj"
                  :icon="Download"
                  type="primary"
                  @click="handleDownload"
                />
                <el-button
                  :icon="Search"
                  type="primary"
                  @click="handleSearchByBtn"
                />
              </el-row>
            </el-col>
          </el-row>
        </el-form-item>
      </el-form>
    </div>
    <div
      v-if="illustObj"
      class="main-block"
    >
      <div class="result-left">
        <el-image
          v-loading="isImgLoading"
          class="viewer-img"
          :src="
            UrlGenerator.getPixivUrlProxy(
              illustObj.page_count === 1
                ? illustObj.image_urls.large
                : illustObj.meta_pages[page].image_urls.large,
            )
          "
          :preview-src-list="[
            UrlGenerator.getPixivUrlProxy(
              illustObj.page_count === 1
                ? illustObj.meta_single_page.original_image_url
                : illustObj.meta_pages[page].image_urls.original,
            ),
          ]"
          fit="contain"
          @load="isImgLoading = false"
        >
          <template #error>
            <div class="image-slot">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
        </el-image>
      </div>
      <div class="result-right">
        <el-scrollbar class="right-container">
          <el-descriptions
            class="right"
            style="margin-bottom: 10px"
            title="Pixiv元数据"
            :column="1"
            border
            direction="vertical"
          >
            <template #extra>
              <el-switch
                v-model="isPrivate"
                inline-prompt
                :active-icon="Lock"
                :inactive-icon="Unlock"
              />
              <el-button
                :plain="!illustObj.is_bookmarked"
                :icon="Star"
                circle
                type="warning"
                style="margin-left: 10px"
                @click="handleBookmark"
              />
            </template>
            <el-descriptions-item label="类型">
              <el-tag>
                {{ { ugoira: '动图', manga: '漫画', illust: '插画' }[illustObj.type] }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="ID">
              {{ illustObj.id }}
            </el-descriptions-item>
            <el-descriptions-item label="总页数">
              {{ illustObj.page_count }}
            </el-descriptions-item>
            <el-descriptions-item label="标题">
              {{ illustObj.title }}
            </el-descriptions-item>
            <el-descriptions-item label="总收藏数">
              {{ illustObj.total_bookmarks }}
            </el-descriptions-item>
            <el-descriptions-item label="作者">
              <el-link
                type="primary"
                :underline="false"
                @click="emit('toUser', { uid: illustObj.user.id })"
              >
                {{ `[${illustObj.user.id}] ${illustObj.user.name}` }}
              </el-link>
            </el-descriptions-item>
            <el-descriptions-item label="限制级">
              <el-tag
                v-if="illustObj.x_restrict === 0"
                type="success"
              >
                全年龄
              </el-tag>
              <el-tag
                v-else-if="illustObj.x_restrict === 1"
                type="warning"
              >
                R-18
              </el-tag>
              <el-tag
                v-else-if="illustObj.x_restrict === 2"
                type="danger"
              >
                R-18G
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="分辨率">
              {{ `H${illustObj.height} * W${illustObj.width}` }}
            </el-descriptions-item>
            <el-descriptions-item label="URL">
              {{ illustObj.url }}
            </el-descriptions-item>
          </el-descriptions>
        </el-scrollbar>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@include Uni-SUFS-Container;
.result-left {
  width: 70%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  .viewer-img {
    height: 100%;
    width: 100%;
    text-align: center;
  }
}
.result-right {
  width: calc(30% - 10px);
  margin-left: 10px;
  height: 100%;
  .right-container {
    height: 100%;
  }
}
</style>
