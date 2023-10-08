<script setup lang="ts">
import { reactive, ref, toRaw, watch } from 'vue'
import { Download, Picture, Search, Star } from '@element-plus/icons-vue'
import { PathHelper, UrlGenerator } from '@render/ts/util/path'
import { ElMessage } from 'element-plus'
import { API } from '@render/ts/api'
import type { PixivIllust } from '@markpolochina/pixiv.ts'

const { ipcInvoke, downloadPixivTo } = window.electron
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
    if (illustObj.value.type === 'ugoira')
      await API.downloadPixivUgoira(illustObj.value, dir)
    else
      await downloadPixivTo(toRaw(illustObj.value), dir, page.value)
    ElMessage.success('下载完成')
  }
  catch (err) {
    ElMessage.error(`下载失败: ${err}`)
  }
}
function handleSearchByBtn() {
  if (!form.pid || !/[1-9]+[0-9]*]*/.test(form.pid)) {
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
watch(
  () => [illustObj.value, page.value],
  () => {
    isImgLoading.value = true
  },
)
defineExpose({ handleSearchByLink })
</script>

<template>
  <div v-loading="isLoading" style="height: 100%">
    <div class="illust-form">
      <el-form label-width="80px" style="width: 100%" label-position="left">
        <el-form-item label="PID">
          <el-input v-model="form.pid" placeholder="输入PID" />
        </el-form-item>
        <el-form-item label="页号">
          <el-row style="width: 100%" justify="space-between">
            <el-col :span="12">
              <el-input-number v-model="form.page" :min="0" :max="maxpage" />
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
    <div v-if="illustObj" class="illust-result">
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
              <el-button
                :icon="Star"
                circle
                type="warning"
                style="margin-left: 10px"
              />
            </template>
            <el-descriptions-item label="类型">
              <el-tag>
                {{
                  { ugoira: "动图", manga: "漫画", illust: "插画" }[
                    illustObj.type
                  ]
                }}
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
            <el-descriptions-item label="作者id">
              {{ illustObj.user.id }}
            </el-descriptions-item>
            <el-descriptions-item label="作者名">
              {{ illustObj.user.name }}
            </el-descriptions-item>
            <el-descriptions-item label="限制级">
              <el-tag v-if="illustObj.x_restrict === 0" type="success">
                普通
              </el-tag>
              <el-tag v-else-if="illustObj.x_restrict === 1" type="warning">
                R-18
              </el-tag>
              <el-tag v-else-if="illustObj.x_restrict === 2" type="danger">
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
.illust-result {
  display: flex;
  flex-direction: row;
  width: 100%;
  margin-top: 20px;
  margin-bottom: 20px;
  height: calc(100% - 120px);
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
}
</style>
