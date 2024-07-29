<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { API } from '@render/ts/api'
import GridViewer from './reusable/gridViewer.vue'
import InfoViewer from './reusable/InfoViewer.vue'

const currentKey = ref('0')
const author = reactive([])
const dialogVisible = ref(false)
const currentInfo = reactive({ value: null })
onMounted(() => {
  getAuthors()
})
watch(currentKey, async () => {
  if (author[currentKey.value].list.length === 0)
    author[currentKey.value].list = await getIllusts(author[currentKey.value].author_id)
})
async function getAuthors() {
  const tags = await API.getTags()
  author.length = 0
  currentKey.value = '0'
  author.push(...tags.filter(ele => ele.type === 'author' && !ele.name.startsWith('@')).map((ele) => {
    return {
      author: ele.name.replace(/^\[\d+\]/, '').trim().split('@')[0],
      author_id: /^\[(\d+)\]/.exec(ele.name)[1],
      list: [],
    }
  }))
  if (author[0])
    author[0].list = await getIllusts(author[0].author_id)
}
async function getIllusts(author_id: string) {
  const list = await API.getIllusts(
    { 'meta.author_id': author_id },
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
function reload() {
  getAuthors()
}
defineExpose({ reload })
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
      :label="item.author"
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
