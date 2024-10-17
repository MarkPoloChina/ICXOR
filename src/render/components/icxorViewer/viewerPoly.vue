<script setup lang="ts">
import { API } from '@render/ts/api'
import { UtilDate } from '@render/ts/util/date'
import { ElMessage, ElMessageBox } from 'element-plus'

import { onMounted, reactive, ref } from 'vue'

const emit = defineEmits(['update:filter', 'update:sorter', 'update:picolt'])
const { ipcRemoveAll, ipcOnce, ipcSend } = window.electron

const currentTab = ref('timeline')
const tabsData = reactive({
  timeline: {
    info: [],
    currentKey: '0',
  },
  picolt: {
    info: [],
    currentKey: '0',
  },
  lnr: {
    info: [],
    currentKey: '0',
  },
  author: {
    info: [],
    currentKey: '0',
  },
  source: {
    info: [],
    currentKey: '0',
  },
})
const tabsGetEnumFunc = {
  timeline: async () => {
    const data = await API.getEnumTimeline()
    return data.map((ele) => {
      return {
        label: UtilDate.getDateCST(new Date(ele.date), ''),
      }
    })
  },
  picolt: async () => {
    const data = await API.getPoly('picolt')
    return data.map((item) => {
      return {
        id: item.id,
        label: `${item.parent}-${item.name}`.replace('picolt-', ''),
        parent: item.parent,
        name: item.name,
        remote_base: item.remote_base,
        remote2x_base: item.remote2x_base,
      }
    })
  },
  lnr: async () => {
    const data = await API.getTags()
    return data.filter(ele => ele.type !== 'author').map((ele) => {
      return {
        label: ele.name,
      }
    })
  },
  author: async () => {
    const data = await API.getTags()
    return data.filter(ele => ele.type === 'author' && !ele.name.startsWith('@')).map((ele) => {
      return {
        label: ele.name.replace(/^\[\d+\]/, '').trim().split('@')[0],
        author_id: /^\[(\d+)\]/.exec(ele.name)[1],
      }
    })
  },
  source: async () => {
    const data = await API.getRemoteBase()
    return data.map((ele) => {
      return {
        label: ele.name,
      }
    })
  },
}
const tabsGetFilterFunc = {
  timeline: (item: {
    label: string
  }) => {
    const dateStr = UtilDate.getDateCST(
      new Date(UtilDate.getISOFromDateCST(item.label)),
      '-',
    )
    return {
      filter: {
        'illust.date': [dateStr],
      },
      sorter: {
        'meta.pid': 'DESC',
      },
    }
  },
  picolt: (item: {
    parent: string
    name: string
  }) => {
    return {
      filter: {
        'poly.parent': [item.parent],
        'poly.name': [item.name],
      },
      sorter: {
        'remote_base.name': 'ASC',
        'meta.pid': 'ASC',
      },
    }
  },
  lnr: (item: {
    label: string
  }) => {
    return {
      filter: {
        'tag.name': [item.label],
      },
      sorter: {
        'meta.book_cnt': 'DESC',
      },
    }
  },
  author: (item: {
    author_id: string
  }) => {
    return {
      filter: {
        'meta.author_id': item.author_id,
      },
      sorter: {
        'meta.pid': 'DESC',
      },
    }
  },
  source: (item: {
    label: string
  }) => {
    return {
      filter: {
        'remote_base.name': [item.label],
      },
      sorter: item.label === 'Pixiv' ? { 'meta.pid': 'DESC' } : { 'Illust.remote_endpoint': 'ASC' },
    }
  },
}

onMounted(async () => {
  for (const key of Object.keys(tabsData))
    tabsData[key].info = await tabsGetEnumFunc[key]()
})
function handleCurrentChange() {
  const currentTabKey = currentTab.value
  const obj = tabsGetFilterFunc[currentTabKey](tabsData[currentTabKey].info[tabsData[currentTabKey].currentKey])
  emit('update:filter', obj.filter)
  emit('update:sorter', obj.sorter)
  if (currentTabKey === 'picolt' && tabsData.picolt.info[tabsData.picolt.currentKey])
    emit('update:picolt', tabsData.picolt.info[tabsData.picolt.currentKey].id)
  else emit('update:picolt', -1)
}

function handlePopupDelete(picoltId: number) {
  ipcRemoveAll('context:click')
  ipcOnce('context:click', (item) => {
    switch (item) {
      case '删除':
        ElMessageBox.confirm('将从本聚合移除所有图并删除聚合，确认？', 'Warning', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(() => {
            API.deletePoly(picoltId)
              .then(async () => {
                ElMessage.success('删除成功')
                tabsData.picolt.currentKey = '0'
                tabsData.picolt.info = await tabsGetEnumFunc.picolt()
              })
              .catch((err) => {
                ElMessage.error(`错误: ${err}`)
              })
          })
          .catch(() => {})
        break
      default:
        break
    }
  })
  ipcSend('context:popup', [{ label: '删除' }])
}

async function handleClear() {
  for (const key of Object.keys(tabsData)) {
    tabsData[key].currentKey = '0'
    tabsData[key].info = await tabsGetEnumFunc[key]()
  }
  currentTab.value = 'timeline'
  handleCurrentChange()
}
defineExpose({ handleClear })
</script>

<template>
  <div class="container">
    <el-tabs v-model="currentTab" class="tabs" tab-position="left" @tab-change="handleCurrentChange">
      <el-tab-pane label="时间线" name="timeline">
        <el-tabs
          v-if="tabsData.timeline.info.length !== 0"
          v-model="tabsData.timeline.currentKey"
          tab-position="left"
          class="tabs"
          @tab-change="handleCurrentChange"
        >
          <el-tab-pane
            v-for="(item, index) in tabsData.timeline.info"
            :key="index"
            :label="item.label"
            lazy
          />
        </el-tabs>
      </el-tab-pane>
      <el-tab-pane label="PICOLT聚合" name="picolt">
        <el-tabs
          v-if="tabsData.picolt.info.length !== 0"
          v-model="tabsData.picolt.currentKey"
          tab-position="left"
          class="tabs"
          @tab-change="handleCurrentChange"
        >
          <el-tab-pane
            v-for="(item, index) in tabsData.picolt.info"
            :key="index"
            lazy
          >
            <template #label>
              <span @contextmenu.stop="handlePopupDelete(item.id)">
                {{ item.label }}
              </span>
            </template>
          </el-tab-pane>
        </el-tabs>
      </el-tab-pane>
      <el-tab-pane label="LNR聚合" name="lnr">
        <el-tabs
          v-if="tabsData.lnr.info.length !== 0"
          v-model="tabsData.lnr.currentKey"
          tab-position="left"
          class="tabs"
          @tab-change="handleCurrentChange"
        >
          <el-tab-pane
            v-for="(item, index) in tabsData.lnr.info"
            :key="index"
            :label="item.label"
            lazy
          />
        </el-tabs>
      </el-tab-pane>
      <el-tab-pane label="作者专题聚合" name="author">
        <el-tabs
          v-if="tabsData.author.info.length !== 0"
          v-model="tabsData.author.currentKey"
          tab-position="left"
          class="tabs"
          @tab-change="handleCurrentChange"
        >
          <el-tab-pane
            v-for="(item, index) in tabsData.author.info"
            :key="index"
            :label="item.label"
            lazy
          />
        </el-tabs>
      </el-tab-pane>
      <el-tab-pane label="图源聚合" name="source">
        <el-tabs
          v-if="tabsData.source.info.length !== 0"
          v-model="tabsData.source.currentKey"
          tab-position="left"
          class="tabs"
          @tab-change="handleCurrentChange"
        >
          <el-tab-pane
            v-for="(item, index) in tabsData.source.info"
            :key="index"
            :label="item.label"
            lazy
          />
        </el-tabs>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="scss" scoped>
.container {
  height: calc(100% - 20px);
  padding: 10px 0;
  .tabs {
    height: 100%;
    > :deep(.el-tabs__content) {
      height: 100%;
      .el-tab-pane {
        height: 100%;
      }
    }
  }
}
</style>
