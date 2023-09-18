<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { API } from '@render/ts/api'
import { UtilDate } from '@render/ts/util/date'
import InfoViewer from './reusable/InfoViewer.vue'
import GridViewer from './reusable/gridViewer.vue'

const timeline = reactive([])
const dialogVisible = ref(false)
const currentInfo = reactive({ value: null })
const curTab = ref('0')
// const loadedSet = reactive({ value: new Set() });
onMounted(() => {
  getEnum()
})
watch(curTab, async () => {
  if (timeline[curTab.value].list.length === 0)
    timeline[curTab.value].list = await getIllusts(timeline[curTab.value].time)
})
async function getEnum() {
  const data = await API.getEnumTimeline()
  data.forEach((ele) => {
    timeline.push({
      time: UtilDate.getDateCST(new Date(ele.date), ''),
      list: [],
    })
  })
  if (timeline[0])
    timeline[0].list = await getIllusts(timeline[0].time)
}
async function getIllusts(timeline: string) {
  const dateStr = UtilDate.getDateCST(new Date(UtilDate.getISOFromDateCST(timeline)), '-')
  const list = await API.getIllusts({ 'illust.date': [dateStr] }, -1, null, null)
  return list
}
function getInfo(obj) {
  currentInfo.value = obj
  if (currentInfo.value)
    dialogVisible.value = true
}
</script>

<template>
  <el-tabs
    v-if="timeline.length !== 0"
    v-model="curTab"
    tab-position="left"
    class="viewer-imgs"
  >
    <el-tab-pane
      v-for="(item, index) in timeline"
      :key="index"
      :label="item.time"
      lazy
    >
      <GridViewer :list="item.list" @show-info="getInfo" />
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
