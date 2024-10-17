<script setup lang="ts">
import { Clock, Filter, MessageBox, Tickets } from '@element-plus/icons-vue'
import ViewerMain from '@render/components/icxorViewer/viewerMain.vue'
import ViewerFilter from '@render/components/icxorViewer/viewerFilter.vue'
import ViewerFunctions from '@render/components/icxorViewer/viewerFunctions.vue'
import ViewerInfo from '@render/components/icxorViewer/viewerInfo.vue'
import { reactive, ref, watch } from 'vue'
import ViewerBatchLog from '@render/components/icxorViewer/viewerBatch.vue'
import type { BatchLog } from '@render/ts/interface/batchLog'
import ViewerPoly from '@render/components/icxorViewer/viewerPoly.vue'
import type { FilterConditionObj } from '@main/illust/dto/filter_condition_obj.dto'
import type { FilterSortObj } from '@main/illust/dto/filter_sort_obj.dto'

const viewerMain = ref()
const viewerInfo = ref()
const viewerType = ref<'table' | 'grid' | 'focus'>('grid')
const viewerColShow = reactive({
  left: {
    filter: false,
    poly: false,
  },
  right: {
    info: false,
    batch: false,
  },
})
const currentMode = ref('filter')
const currentPicoltId = ref(-1)
const viewerFilterRef = ref()
const viewerPolyRef = ref()
const filter = ref<FilterConditionObj>({})
const sorter = ref<FilterSortObj>({ 'Illust.id': 'DESC' })
const batchLogs = ref<BatchLog[]>([])
const currentSelected = ref(null)
const illustCount = ref(0)
const selectionCount = ref(0)
const curPage = ref(1)
const pageSize = ref(100)
function handleToggle(e: MouseEvent, side: string, type: string) {
  if (viewerColShow[side][type]) {
    viewerColShow[side][type] = false
  }
  else {
    for (const key in viewerColShow[side])
      viewerColShow[side][key] = false
    viewerColShow[side][type] = true
  }
  if (side === 'left' && viewerColShow[side][type])
    currentMode.value = type
  let target = e.target as HTMLElement
  while (target.tagName.toLowerCase() !== 'button')
    target = target.parentElement
  target.blur()
}
watch(currentMode, (val) => {
  if (val === 'filter')
    viewerFilterRef.value.handleClear()
  else if (val === 'poly')
    viewerPolyRef.value.handleClear()
})
</script>

<template>
  <div class="viewer-container">
    <div class="title">
      <div class="btn-group">
        <el-button text :icon="Filter" :bg="viewerColShow.left.filter" @click="handleToggle($event, 'left', 'filter')" />
        <el-button text :icon="MessageBox" :bg="viewerColShow.left.poly" @click="handleToggle($event, 'left', 'poly')" />
      </div>
      <div>
        <span v-if="currentMode === 'poly'">聚合</span>视图
      </div>
      <div class="btn-group">
        <el-button text :icon="Tickets" :bg="viewerColShow.right.info" @click="handleToggle($event, 'right', 'info')" />
        <el-button text :icon="Clock" :bg="viewerColShow.right.batch" @click="handleToggle($event, 'right', 'batch')" />
      </div>
    </div>
    <div class="main">
      <div class="col selector-col">
        <ViewerFilter v-show="viewerColShow.left.filter" ref="viewerFilterRef" @update:filter="filter = $event" @update:sorter="sorter = $event" />
        <ViewerPoly v-show="viewerColShow.left.poly" ref="viewerPolyRef" @update:filter="filter = $event" @update:sorter="sorter = $event" @update:picolt="currentPicoltId = $event" />
      </div>
      <div class="col main-and-func-col">
        <div class="main-row">
          <ViewerMain
            ref="viewerMain"
            v-model:curPage="curPage"
            v-model:page-size="pageSize"
            v-model:currentSelected="currentSelected"
            :filter="filter"
            :sorter="sorter"
            :viewer-type="viewerType"
            :batch-logs="batchLogs"
            :picolt-id="currentPicoltId"
            @update:illust-count="illustCount = $event"
            @update:selection-count="selectionCount = $event"
            @update:star="viewerInfo.handleStarChange($event)"
          />
        </div>
        <div class="func-row">
          <ViewerFunctions
            v-model:curPage="curPage"
            v-model:page-size="pageSize"
            :illust-count="illustCount"
            :selection-count="selectionCount"
            @update:viewer-type="viewerType = $event"
            @focus-up="viewerMain.handleFocusIndexChange('up')"
            @focus-down="viewerMain.handleFocusIndexChange('down')"
          />
        </div>
      </div>
      <div class="col info-col">
        <ViewerInfo
          v-show="viewerColShow.right.info"
          ref="viewerInfo"
          v-model:info="currentSelected"
          @upload="viewerMain.handleSingleIllustChange($event)"
        />
        <ViewerBatchLog v-show="viewerColShow.right.batch" :batch-logs="batchLogs" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.viewer-container {
  @include Uni-Main-Container;
  overflow: auto;
  .title {
    @include Uni-Main-Title;
    display: flex;
    flex: none;
    justify-content: space-between;
    padding: 0;
    margin-bottom: 5px;
    .el-button {
      padding: 12px 10px;
      margin-bottom: 1px;
    }
    .el-button + .el-button {
      margin-left: 5px;
    }
    .btn-group {
      background-color: rgba(46, 137, 192, 0.15);
      padding: 5px;
      border-radius: 8px;
    }
  }
  .main {
    padding: 0;
    flex: auto;
    position: relative;
    display: flex;
    flex-direction: row;
    overflow: auto;
    .col {
      position: relative;
      padding: 10px 10px 10px 10px;
      margin: 0 3px 0 3px;
      border-radius: 8px;
      background-color: rgba(128, 128, 128, 0.1);
      height: calc(100% - 20px);
      &.selector-col {
        margin-left: 0;
        flex: none;
        padding: 0;
        height: 100%;
      }
      &.main-and-func-col {
        flex: auto;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: stretch;
        overflow: hidden;
        .main-row {
          flex: auto;
          overflow: hidden;
        }
        .func-row {
          align-self: center;
          flex: none;
          width: 100%;
        }
      }
      &.info-col {
        max-width: min-content;
        margin-right: 0;
        flex: none;
        padding: 0;
        height: 100%;
      }
    }
  }
}
</style>
