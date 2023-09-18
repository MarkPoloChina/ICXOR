<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { API } from '@render/ts/api'
import InfoViewer from './reusable/InfoViewer.vue'
import GridLargeViewer from './reusable/gridLargeViewer.vue'

const source = reactive([])
const dialogVisible = ref(false)
const currentInfo = reactive({ value: null })
const curTab = ref('0')
onMounted(() => {
  getEnum()
})
watch(curTab, async () => {
  if (source[curTab.value].list.length === 0)
    source[curTab.value].list = await getIllusts(source[curTab.value].type)

  if (!source[curTab.value].cnt)
    source[curTab.value].cnt = await getIllustsCount(source[curTab.value].type)
})
async function getEnum() {
  const data = await API.getRemoteBase()
  data.forEach((ele) => {
    source.push({
      type: ele.name,
      page: 0,
      list: [],
    })
  })
  if (source[0]) {
    getIllustsCount(source[0].type).then((data) => {
      source[0].cnt = data
    })
  }
  if (source[0])
    source[0].list = await getIllusts(source[0].type)
}
async function getIllusts(type, page = 0) {
  const list = await API.getIllusts(
    { 'remote_base.name': [type] },
    100,
    page * 100,
    null,
  )
  return list
}
async function getIllustsCount(type) {
  const { count } = await API.getIllustsCount({ 'remote_base.name': [type] })
  return count
}
function getInfo(obj) {
  currentInfo.value = obj
  if (currentInfo.value)
    dialogVisible.value = true
}
async function handleLoadMore() {
  source[curTab.value].list.push(
    ...(await getIllusts(
      source[curTab.value].type,
      ++source[curTab.value].page,
    )),
  )
}
</script>

<template>
  <el-tabs
    v-if="source.length !== 0"
    v-model="curTab"
    tab-position="left"
    class="viewer-imgs"
  >
    <el-tab-pane
      v-for="(item, index) in source"
      :key="index"
      :label="item.type"
      lazy
    >
      <GridLargeViewer
        :list="item.list"
        :total-cnt="item.cnt"
        @show-info="getInfo"
        @load-more="handleLoadMore"
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
