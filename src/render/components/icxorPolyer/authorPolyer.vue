<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { API } from '@render/ts/api'
import GridViewer from './reusable/gridViewer.vue'
import InfoViewer from './reusable/InfoViewer.vue'

const { ipcRemoveAll, ipcOnce, ipcSend } = window.electron

const currentKey = ref('0')
const author = reactive([])
const dialogVisible = ref(false)
const currentInfo = reactive({ value: null })
onMounted(() => {
  getData()
})
async function getData() {
  author.length = 0
  const data = await API.getPolyWithIllust('author')
  data.forEach((item) => {
    author.push({
      id: item.id,
      name: item.parent ? `${item.parent}-${item.name}` : item.name,
      list: item.illusts,
    })
  })
}
function handleRightClick() {
  ipcRemoveAll('context:click')
  ipcOnce('context:click', (item) => {
    switch (item) {
      case '删除当前聚合':
        handleDeletePoly()
        break
      default:
        break
    }
  })
  ipcSend('context:popup', [{ label: '删除当前聚合' }])
}
function getInfo(obj) {
  currentInfo.value = obj
  if (currentInfo.value)
    dialogVisible.value = true
}
function handleRemove(obj) {
  ElMessageBox.confirm('将从本聚合移除该图，确认？', 'Warning', {
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancel',
    type: 'warning',
  })
    .then(() => {
      API.removePolyById(author[currentKey.value].id, [obj.id])
        .then(async () => {
          ElMessage.success('移除成功')
          const data = await API.getPolyWithIllust('author')
          data.forEach((item) => {
            if (item.id === author[currentKey.value].id)
              author[currentKey.value].list = item.illusts
          })
        })
        .catch((err) => {
          ElMessage.error(`错误: ${err}`)
        })
    })
    .catch(() => {})
}
function handleDeletePoly() {
  ElMessageBox.confirm('将删除本聚合，确认？', 'Warning', {
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancel',
    type: 'warning',
  })
    .then(() => {
      API.deletePoly(author[currentKey.value].id)
        .then(() => {
          ElMessage.success('删除成功')
          getData()
        })
        .catch((err) => {
          ElMessage.error(`错误: ${err}`)
        })
    })
    .catch(() => {})
}
</script>

<template>
  <el-tabs
    v-if="author.length !== 0"
    v-model="currentKey"
    tab-position="left"
    class="viewer-imgs"
  >
    <el-tab-pane
      v-for="(item, index) in author"
      :key="index"
      :label="item.name"
      lazy
      @contextmenu.prevent="handleRightClick"
    >
      <GridViewer
        :list="item.list"
        :total-cnt="item.list.length"
        :support-remove="true"
        @remove="handleRemove"
        @show-info="getInfo"
      />
    </el-tab-pane>
  </el-tabs>
  <el-empty v-else description="无插图" />
  <InfoViewer v-model="dialogVisible" :info="currentInfo.value" />
</template>

<style lang="scss" scoped>
.viewer-imgs {
  height: 100%;

  > :deep(.el-tabs__content) {
    height: 100%;
  }
}
</style>
