<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { API } from '@render/ts/api'
import GridViewer from './reusable/gridViewer.vue'
import InfoViewer from './reusable/InfoViewer.vue'

const currentKey = ref('0')
const lnr = reactive([])
const dialogVisible = ref(false)
const currentInfo = reactive({ value: null })
onMounted(() => {
  getTags()
})
watch(currentKey, async () => {
  if (lnr[currentKey.value].list.length === 0)
    lnr[currentKey.value].list = await getIllusts(lnr[currentKey.value].name)
})
async function getTags() {
  const tags = await API.getTags()
  lnr.length = 0
  lnr.push(...tags.filter(ele => ele.type !== 'author').map((ele) => {
    return {
      name: ele.name,
      list: [],
    }
  }))
  if (lnr[0])
    lnr[0].list = await getIllusts(lnr[0].name)
}
async function getIllusts(name: string) {
  const list = await API.getIllusts(
    { 'tag.name': [name] },
    -1,
    undefined,
    {
      'meta.pid': 'DESC',
    },
  )
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
    v-if="lnr.length !== 0"
    v-model="currentKey"
    tab-position="left"
    class="viewer-imgs"
  >
    <el-tab-pane
      v-for="(item, index) in lnr"
      :key="index"
      :label="item.name"
      lazy
    >
      <GridViewer
        :list="item.list"
        :total-cnt="item.list.length"
        :support-remove="false"
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
