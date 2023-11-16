<script setup lang="ts">
import { reactive, ref, toRaw } from 'vue'
import { Download, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { API } from '@render/ts/api'
import type { PixivIllust } from '@markpolochina/pixiv.ts'

const emit = defineEmits(['toIllust', 'toUser'])
const { ipcInvoke, ipcRemoveAll, ipcOnce, ipcSend, downloadPixivTo, downloadPixivUgoiraTo } = window.electron
const form = reactive({
  type: 'public',
})
const isLoading = ref(false)
const illusts = ref<PixivIllust[]>([])
const success = ref<number[]>([])
const retrys = ref<Record<number, number>>({})
async function handleDownload(illustObj: PixivIllust) {
  const dir = await ipcInvoke('dialog:openDirectory')
  if (!dir)
    return
  if (!illustObj.visible) {
    ElMessage.error('本PID不可访问')
    return
  }
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
function tableRowClassName({
  row,
}: {
  row: PixivIllust
}) {
  if (success.value.includes(row.id))
    return 'success-row'
  return ''
}
async function handleDownloadAll() {
  const dir = await ipcInvoke('dialog:openDirectory')
  if (!dir)
    return
  const invisable: number[] = []
  const promises = illusts.value
    .filter((ele) => {
      if (!ele.visible)
        invisable.push(ele.id)
      return ele.visible
    })
    .map((ele) => {
      const process = async () => {
        try {
          if (ele.type === 'ugoira') {
            const meta = await API.getPixivUgoiraJson(ele.id)
            await downloadPixivUgoiraTo(toRaw(ele), dir, meta)
          }
          else { await downloadPixivTo(toRaw(ele), dir) }
        }
        catch (err) {
          if (!retrys.value[ele.id])
            retrys.value[ele.id] = 0
          if (retrys.value[ele.id] >= 3) {
            throw new Error('Too much retry')
          }
          else {
            ElMessage.error(`下载失败${err}。3s秒后自动重试`)
            retrys.value[ele.id] += 1
            setTimeout(process, 3000)
          }
        }
        success.value.push(ele.id)
      }
      return process()
    })
  Promise.all(promises).then(() => {
    ElMessage.success('下载完成')
    if (invisable.length !== 0) {
      ElMessage.warning(
        `忽略了${invisable.length}个不可访问项目: ${invisable.toString()}`,
      )
    }
  }).catch((err) => {
    ElMessage.error(`下载失败: ${err}`)
  })
}
async function handleSearch() {
  isLoading.value = true
  try {
    const resp = await API.getBookmark(form.type === 'private')
    illusts.value.length = 0
    illusts.value.push(...resp)
  }
  catch (err) {
    ElMessage.error(`错误:${err}`)
  }
  finally {
    isLoading.value = false
  }
}
function handleRightClick(obj: PixivIllust) {
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
</script>

<template>
  <div style="height: 100%">
    <div class="illust-form">
      <el-form label-width="80px" style="width: 100%" label-position="left">
        <el-form-item label="类型">
          <el-row style="width: 100%" justify="space-between">
            <el-radio-group v-model="form.type">
              <el-radio label="public">
                公开(Public)
              </el-radio>
              <el-radio label="private">
                不公开(Private)
              </el-radio>
            </el-radio-group>
            <el-col :span="8">
              <el-row justify="end">
                <el-button
                  v-if="illusts.length !== 0"
                  :icon="Download"
                  type="primary"
                  @click="handleDownloadAll"
                />
                <el-button
                  :icon="Search"
                  type="primary"
                  @click="handleSearch"
                />
              </el-row>
            </el-col>
          </el-row>
        </el-form-item>
      </el-form>
    </div>
    <div class="illust-result">
      <el-table
        v-loading="isLoading"
        style="height: 100%"
        :data="illusts"
        :row-class-name="tableRowClassName"
        @row-contextmenu="handleRightClick"
      >
        <el-table-column
          prop="id"
          label="PID"
          width="100"
          show-overflow-tooltip
        />
        <el-table-column
          prop="page_count"
          label="总页数"
          width="100"
          show-overflow-tooltip
        />
        <el-table-column
          prop="user.name"
          label="作者"
          width="150"
          show-overflow-tooltip
        />
        <el-table-column prop="title" label="标题" show-overflow-tooltip />
      </el-table>
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
}
:deep(.warning-row) {
  background-color: var(--el-color-warning-light-9);
}
:deep(.success-row) {
  background-color: var(--el-color-success-light-9);
}
:deep(.danger-row) {
  background-color: var(--el-color-danger-light-9);
}
</style>
