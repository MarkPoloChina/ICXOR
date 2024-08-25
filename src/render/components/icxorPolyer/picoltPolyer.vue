<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { API } from '@render/ts/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import InfoViewer from './reusable/InfoViewer.vue'
import GridViewer from './reusable/gridViewer.vue'

const currentKey = ref('0')

const picolt = reactive([])
const dialogVisible = ref(false)
const currentInfo = reactive({ value: null })
onMounted(() => {
  getData()
})
async function getData() {
  picolt.length = 0
  currentKey.value = '0'
  const data = await API.getPolyWithIllust('picolt')
  data.forEach((item) => {
    item.illusts.sort((a, b) => {
      if (a.remote_base.name === 'Pixiv' && b.remote_base.name !== 'Pixiv')
        return -1
      else if (a.remote_base.name !== 'Pixiv' && b.remote_base.name === 'Pixiv')
        return 1
      else return 0
    })
    picolt.push({
      id: item.id,
      name: `${item.parent}-${item.name}`,
      list: item.illusts,
    })
  })
}
function getInfo(obj) {
  currentInfo.value = obj
  if (currentInfo.value)
    dialogVisible.value = true
}
function handleRemove(obj) {
  ElMessageBox.confirm('将从本聚合移除该图，确认？', 'Warning', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      API.removePolyById(picolt[currentKey.value].id, [obj.id])
        .then(async () => {
          ElMessage.success('移除成功')
          const data = await API.getPolyWithIllust('picolt')
          data.forEach((item) => {
            if (item.id === picolt[currentKey.value].id) {
              item.illusts.sort((a, b) => {
                if (
                  a.remote_base.name === 'Pixiv'
                  && b.remote_base.name !== 'Pixiv'
                )
                  return -1
                else if (
                  a.remote_base.name !== 'Pixiv'
                  && b.remote_base.name === 'Pixiv'
                )
                  return 1
                else return 0
              })
              picolt[currentKey.value].list = item.illusts
            }
          })
        })
        .catch((err) => {
          ElMessage.error(`错误: ${err}`)
        })
    })
    .catch(() => {})
}
function reload() {
  getData()
}
function removePoly() {
  if (picolt.length === 0) {
    ElMessage.error('无聚合')
    return
  }
  ElMessageBox.confirm('将从本聚合移除所有图并删除聚合，确认？', 'Warning', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      API.deletePoly(picolt[currentKey.value].id)
        .then(() => {
          ElMessage.success('移除成功')
          reload()
        })
        .catch((err) => {
          ElMessage.error(`错误: ${err}`)
        })
    })
    .catch(() => {})
}
defineExpose({ reload, removePoly })
</script>

<template>
  <el-tabs
    v-if="picolt.length !== 0"
    v-model="currentKey"
    tab-position="left"
    class="viewer-imgs"
  >
    <el-tab-pane
      v-for="(item, index) in picolt"
      :key="index"
      :label="item.name.replace('picolt-', '')"
      lazy
    >
      <GridViewer
        :list="item.list"
        :total-cnt="item.list.length"
        :support-remove="true"
        @show-info="getInfo"
        @remove="handleRemove"
      />
    </el-tab-pane>
  </el-tabs>
  <el-empty v-else description="无插图" />
  <InfoViewer v-model="dialogVisible" :info="currentInfo.value" />
</template>

<style lang="scss" scoped>
.viewer-imgs {
  height: 100%;

  // > :deep(.el-tabs__header.is-left) {
  //   max-width: 100px;
  //   text-overflow: ellipsis;
  // }
  > :deep(.el-tabs__content) {
    height: 100%;
  }
}
</style>
