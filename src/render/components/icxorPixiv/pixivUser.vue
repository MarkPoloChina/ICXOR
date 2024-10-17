<script setup lang="ts">
import { reactive, ref, toRaw } from 'vue'
import { Download, Picture, Search, Star } from '@element-plus/icons-vue'
import { UrlGenerator } from '@render/ts/util/path'
import { ElMessage } from 'element-plus'
import { API } from '@render/ts/api'
import type { PixivIllust, PixivUser } from '@markpolochina/pixiv.ts'

const emit = defineEmits(['toIllust', 'toUser'])
const { ipcInvoke, ipcRemoveAll, ipcOnce, ipcSend, downloadPixivTo, downloadPixivUgoiraTo } = window.electron
const form = reactive({
  uid: '',
})
const uid = ref('')
const nextIllustsUrl = ref('')
const isLoading = ref(false)
const userObj = ref<PixivUser>(null)
const userIllusts = ref<PixivIllust[]>([])
function handleSearchByLink(_uid) {
  form.uid = _uid
  handleSearch(_uid)
}
async function handleDownload(illustObj: PixivIllust) {
  const dir = await ipcInvoke('dialog:openDirectory')
  if (!dir)
    return
  try {
    if (illustObj.type === 'ugoira') {
      const meta = await API.getPixivUgoiraJson(illustObj.id)
      await downloadPixivUgoiraTo(toRaw(illustObj), dir, meta)
    }
    else { await downloadPixivTo(toRaw(illustObj), dir) }
    ElMessage.success('下载完成')
  }
  catch (err) {
    ElMessage.error(`下载失败: ${err}`)
  }
}
async function handleDownloadAll() {
  const dir = await ipcInvoke('dialog:openDirectory')
  if (!dir)
    return
  while (nextIllustsUrl.value) {
    const hasError = await handleLoadNext()
    if (hasError)
      break
  }
  for (const ele of userIllusts.value) {
    try {
      if (ele.type === 'ugoira') {
        const meta = await API.getPixivUgoiraJson(ele.id)
        await downloadPixivUgoiraTo(toRaw(ele), dir, meta)
      }
      else { await downloadPixivTo(toRaw(ele), dir) }
    }
    catch (err) {
      ElMessage.error(`Failed for ${ele.id}: ${err}`)
    }
  }
  ElMessage.success('下载完成')
}
function handleSearchByBtn() {
  if (!form.uid || !/[1-9]+[0-9]*]*/.test(form.uid)) {
    ElMessage.error('UID非法')
    return
  }
  handleSearch(form.uid)
}
async function handleSearch(_uid) {
  isLoading.value = true
  userObj.value = null
  try {
    const resp = await API.getPixivUserInfo(_uid)
    uid.value = _uid
    userObj.value = resp.user
    const { illusts, nextUrl } = await API.getPixivUserIllusts(_uid)
    userIllusts.value.length = 0
    userIllusts.value.push(...illusts)
    nextIllustsUrl.value = nextUrl
  }
  catch (err) {
    ElMessage.error(`错误:${err}`)
  }
  finally {
    isLoading.value = false
  }
}
async function handleLoadNext() {
  try {
    if (!nextIllustsUrl.value)
      return
    const resp = await API.getPixivNextRequest(nextIllustsUrl.value)
    userIllusts.value.push(...resp.illusts)
    nextIllustsUrl.value = resp.next_url
  }
  catch (err) {
    ElMessage.error(`错误:${err}`)
    return err
  }
}
function handleRightClick(event, obj: PixivIllust) {
  if (event.stopPropagation)
    event.stopPropagation()

  ipcRemoveAll('context:click')
  ipcOnce('context:click', (item) => {
    switch (item) {
      case '下载':
        handleDownload(obj)
        break
      case '在Pixiv中打开':
        emit('toIllust', { pid: obj.id, page: 0 })
        break
      default:
        break
    }
  })
  const popupTemplate = [{ label: '下载' }, { label: '在Pixiv中打开' }]
  ipcSend('context:popup', popupTemplate)
}
defineExpose({ handleSearchByLink })
</script>

<template>
  <div v-loading="isLoading" style="height: 100%">
    <div class="illust-form">
      <el-form label-width="80px" style="width: 100%" label-position="left">
        <el-form-item label="UID">
          <el-row style="width: 100%" justify="space-between">
            <el-col :span="12">
              <el-input v-model="form.uid" placeholder="输入UID" />
            </el-col>
            <el-col :span="8">
              <el-row justify="end">
                <el-button
                  v-if="userObj"
                  :icon="Download"
                  type="primary"
                  @click="handleDownloadAll"
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
    <div v-if="userObj" class="illust-result">
      <div class="result-left">
        <el-scrollbar style="height: 100%; width: 100%; border-radius: 5px">
          <el-row
            v-infinite-scroll="handleLoadNext"
            :infinite-scroll-delay="100"
            :infinite-scroll-immediate="false"
            :infinite-scroll-distance="50"
          >
            <el-col
              v-for="(obj, index) in userIllusts"
              :key="index"
              :span="6"
              class="viewer-img-container"
            >
              <div class="expo" />
              <el-image
                class="viewer-img"
                :src="
                  UrlGenerator.getPixivUrlProxy(obj.image_urls.square_medium)
                "
                :preview-src-list="
                  obj.page_count === 1
                    ? [
                      UrlGenerator.getPixivUrlProxy(
                        obj.meta_single_page.original_image_url,
                      ),
                    ]
                    : obj.meta_pages.map((ele) =>
                      UrlGenerator.getPixivUrlProxy(ele.image_urls.original),
                    )
                "
                fit="cover"
                loading="lazy"
                @contextmenu.prevent="handleRightClick($event, obj)"
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
      <div class="result-right">
        <el-scrollbar class="right-container">
          <el-descriptions
            class="right"
            style="margin-bottom: 10px"
            title="PixivUser元数据"
            :column="1"
            border
            direction="vertical"
          >
            <!-- <template #extra>
              <el-button
                :icon="Star"
                circle
                type="warning"
                style="margin-left: 10px"
              />
            </template> -->
            <el-descriptions-item label="头像">
              <el-avatar
                :src="
                  UrlGenerator.getPixivUrlProxy(
                    userObj.profile_image_urls.medium,
                  )
                "
              />
            </el-descriptions-item>
            <el-descriptions-item label="ID">
              {{ userObj.id }}
            </el-descriptions-item>
            <el-descriptions-item label="昵称">
              {{ userObj.name }}
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
  height: calc(100% - 80px);
  .result-left {
    width: 80%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
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
  .result-right {
    width: calc(20% - 10px);
    margin-left: 10px;
    height: 100%;
    .right-container {
      height: 100%;
    }
  }
}
</style>
