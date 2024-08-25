<script setup lang="ts">
import ViewerMain from '@render/components/icxorViewer/viewerMain.vue'
import ViewerFilter from '@render/components/icxorViewer/viewerFilter.vue'
import ViewerFunctions from '@render/components/icxorViewer/viewerFunctions.vue'
import ViewerInfo from '@render/components/icxorViewer/viewerInfo.vue'
import { ref } from 'vue'

const viewerMain = ref()
const viewerInfo = ref()
const viewerType = ref<'table' | 'grid' | 'focus'>('table')
const filter = ref({})
const sorter = ref({ 'Illust.id': 'DESC' })
const currentSelected = ref(null)
const illustCount = ref(0)
const selectionCount = ref(0)
const curPage = ref(1)
const pageSize = ref(100)
</script>

<template>
  <div class="viewer-container">
    <div class="title">
      视图
    </div>
    <div class="main">
      <div class="col selector-col">
        <ViewerFilter @update:filter="filter = $event" @update:sorter="sorter = $event" />
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
          ref="viewerInfo"
          v-model:info="currentSelected"
          @upload="viewerMain.handleSingleIllustChange($event)"
        />
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
    flex: none;
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
      background-color: rgba(128, 128, 128, 0.15);
      height: calc(100% - 20px);
      &.selector-col {
        margin-left: 0;
        flex: none;
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
