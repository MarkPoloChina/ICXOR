<script setup lang="ts">
import type { BatchLog } from '@render/ts/interface/batchLog'
import BatchResultTable from '@render/components/share/table/batchResultTable.vue'

defineProps({
  batchLogs: Array<BatchLog>,
})
const translatedType = {
  download: '下载',
  fetch: '抓取元',
  update: '置元',
  poly: '聚合',
  delete: '删除',
}
const translatedStatus = {
  padding: '未决',
  done: '完成',
  reject: '拒绝',
  processing: '进行中',
}
function logAdapter(batchLog: BatchLog) {
  switch (batchLog.status) {
    case 'padding':
      return {
        bar: {
          status: '',
          indeterminate: true,
          percentage: (batchLog.currentIdx / batchLog.total) * 100,
          textInline: '',
        },
        textOutsize: `- / ${batchLog.total}`,
      }
    case 'done':
      return {
        bar: {
          status: 'success',
          indeterminate: false,
          percentage: 100,
          textInline: 'Fin.',
        },
        textOutsize: `${batchLog.currentIdx || batchLog.total} / ${batchLog.total}`,
      }
    case 'reject':
      return {
        bar: {
          status: 'exception',
          indeterminate: false,
          percentage: 100,
          textInline: 'Reject.',
        },
        textOutsize: `- / ${batchLog.total}`,
      }
    case 'processing':
      return {
        bar: {
          status: '',
          indeterminate: false,
          percentage: (batchLog.currentIdx / batchLog.total) * 100,
          textInline: `${((batchLog.currentIdx / batchLog.total) * 100).toFixed(1)}%`,
        },
        textOutsize: `${batchLog.currentIdx} / ${batchLog.total}`,
      }
    default:
      break
  }
}
function handleShowTable(log: BatchLog) {
  log.showDialog = true
}
</script>

<template>
  <div class="log-container">
    <div
      v-for="(log, index) in batchLogs"
      :key="index"
      class="log-block"
    >
      <div class="line">
        <span class="title">批处理#{{ index }}</span>
        <span class="type">{{ translatedType[log.type] }}</span>
      </div>
      <div class="line">
        <el-progress
          style="width: 100%"
          :indeterminate="logAdapter(log).bar.indeterminate"
          :text-inside="true"
          :stroke-width="24"
          :percentage="logAdapter(log).bar.percentage"
          :status="logAdapter(log).bar.status"
        >
          <div style="text-align: center; font-size: 15px">
            {{ logAdapter(log).bar.textInline }}
          </div>
        </el-progress>
      </div>
      <div class="line">
        <span>当前状态:{{ translatedStatus[log.status] }}</span>
        <span>{{ logAdapter(log).textOutsize }}</span>
      </div>
      <div class="line">
        <el-button
          v-if="!logAdapter(log).bar.indeterminate"
          @click="handleShowTable(log)"
        >
          查看
        </el-button>
      </div>
      <el-dialog
        v-model="log.showDialog"
        title="批处理结果"
        width="80%"
      >
        <el-alert
          type="info"
          show-icon
          :closable="false"
          style="flex: none"
        >
          <template #title>
            如果成功反馈不是必须的, 表格中将不会出现操作成功的项目。
          </template>
        </el-alert>
        <BatchResultTable
          :dto="log.dto"
          :resp="log.resp"
        />
      </el-dialog>
    </div>
    <div>
      <el-empty
        v-if="batchLogs.length === 0"
        description="暂无批处理记录"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.log-container {
  width: 250px;
  padding: 10px;
  .log-block {
    padding: 10px;
    background-color: rgba(128, 128, 128, 0.08);
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
    height: 150px;
    width: calc(100% - 20px);
    border-radius: 8px;
    margin-bottom: 20px;
    .line {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
    }
    .title {
      font-weight: bold;
    }
  }
}
</style>
