<script setup lang="ts">
import type { Ref } from 'vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import MetaForm from '@render/components/share/form/metaForm.vue'
import PolyForm from '@render/components/share/form/polyForm.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { API } from '@render/ts/api'
import { BatchDto } from '@render/ts/dto/batch'
import type { BatchLog } from '@render/ts/interface/batchLog'
import { PathHelper, UrlGenerator } from '@render/ts/util/path'
import type { PixivIllust } from '@markpolochina/pixiv.ts'
import IllustTodayForm from '@render/components/share/form/illustTodayForm.vue'
import type { IllustObj } from '@render/ts/interface/illustObj'
import type { IllustTodayDto } from '@main/illust/dto/illust_today.dto'
import BatchLogDrawer from '../share/drawer/batchLogDrawer.vue'
import ViewerGrid from './main/viewerGrid.vue'
import ViewerFocus from './main/viewerFocus.vue'
import ViewerTable from './main/viewerTable.vue'

const props = defineProps({
  filter: Object,
  sorter: Object,
  viewerType: String,
  curPage: Number,
  pageSize: Number,
  currentSelected: Object,
})

const emit = defineEmits([
  'update:curPage',
  'update:pageSize',
  'update:currentSelected',
  'update:illust-count',
  'update:star',
])
const { ipcRemoveAll, ipcOnce, ipcSend, ipcInvoke, downloadTo }
  = window.electron
const viewer: Ref<typeof ViewerFocus | typeof ViewerGrid | typeof ViewerTable>
  = ref()
const metaForm: Ref<typeof MetaForm> = ref()
const polyForm: Ref<typeof PolyForm> = ref()
const itForm: Ref<typeof IllustTodayForm> = ref()
const writableCurPage = computed({
  get: () => {
    return props.curPage
  },
  set: (val) => {
    emit('update:curPage', val)
  },
})
const writablePageSize = computed({
  get: () => {
    return props.pageSize
  },
  set: (val) => {
    emit('update:pageSize', val)
  },
})
const isLoading = ref(false)
const illustList = ref<IllustObj[]>([])
const illustCount = ref(0)
watch(illustCount, (val) => {
  emit('update:illust-count', val)
})
const currentSelected = computed({
  get: () => {
    return props.currentSelected
  },
  set: (val) => {
    emit('update:currentSelected', val)
  },
})
const currentOperating = ref<IllustObj>(null)
const chooseAll = reactive({
  poly: false,
  update: false,
})

const show = reactive({
  poly: false,
  update: false,
  it: false,
  drawer: false,
})

function handleFocusIndexChange(action) {
  viewer.value.handleIndexChange(action)
}
onMounted(() => {
  getIllustsAndCount()
})
async function getIllusts() {
  isLoading.value = true
  const list = await API.getIllusts(
    props.filter,
    writablePageSize.value,
    (writableCurPage.value - 1) * writablePageSize.value,
    props.sorter,
  )
  isLoading.value = false
  if (list)
    illustList.value = list
  if (list[0])
    currentSelected.value = list[0]
}
async function getIllustsAndCount() {
  isLoading.value = true
  writableCurPage.value = 1
  currentSelected.value = null
  const { count } = await API.getIllustsCount(props.filter)
  illustCount.value = count
  isLoading.value = false
  getIllusts()
}
watch(
  () => props.filter,
  () => {
    getIllustsAndCount()
  },
  {
    deep: true,
  },
)
watch(
  () => [props.curPage, props.pageSize, props.sorter],
  () => {
    getIllusts()
  },
)
function handleSingleIllustChange(obj: IllustObj, withClear?: boolean) {
  API.updateIllust(obj)
    .then(() => {
      ElMessage.success('修改成功')
      if (withClear) {
        getIllustsAndCount()
        metaForm.value.clearForm()
      }
    })
    .catch((err) => {
      ElMessage.error(`错误: ${err}`)
    })
}

const batchLogs = ref<BatchLog[]>([])

function handleUpdate(addition: {
  date?: Date
  star?: number
  tag?: Array<{ name: string; type: string }>
}) {
  const waitingOperateDto = []
  if (!chooseAll.update && currentOperating.value) {
    waitingOperateDto.push(currentOperating.value)
  }
  else if (chooseAll.update) {
    illustList.value.forEach((item) => {
      if (item.checked)
        waitingOperateDto.push(item)
    })
  }
  if (waitingOperateDto.length === 0) {
    ElMessage.error('项目为空')
    return
  }
  ElMessageBox.confirm(
    `将为${waitingOperateDto.length}个项目进行更新，确认？`,
    'Warning',
    {
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
      type: 'warning',
    },
  )
    .then(() => {
      const batchLog: BatchLog = {
        total: waitingOperateDto.length,
        status: 'padding',
        type: 'update',
        resp: [],
        dto: waitingOperateDto,
      }
      const idx = batchLogs.value.length
      batchLogs.value.push(batchLog)
      const dto = new BatchDto()
      dto.control.updatePolicy = 'onlyUpdate'
      dto.dtos.push(
        ...waitingOperateDto.map((ele, index) => {
          return {
            bid: index,
            dto: {
              id: ele.id,
              ...addition,
              tag: addition.tag ? [...ele.tag, ...addition.tag] : undefined,
            },
          }
        }),
      )
      API.updateIllusts(dto)
        .then((resp: Array<any>) => {
          batchLogs.value[idx].resp = resp
          batchLogs.value[idx].status = 'done'
          ElMessage.success('一项置元批处理操作成功')
          getIllustsAndCount()
          metaForm.value.clearForm()
        })
        .catch((err) => {
          batchLogs.value[idx].status = 'reject'
          ElMessage.error(`一项置元批处理错误: ${err}`)
        })
    })
    .catch(() => {})
}

function handlePoly(polyOption: {
  type: string
  parent: string
  name: string
}) {
  const waitingOperateDto = []
  if (!chooseAll.poly && currentOperating.value) {
    waitingOperateDto.push(currentOperating.value)
  }
  else if (chooseAll.poly) {
    illustList.value.forEach((item) => {
      if (item.checked)
        waitingOperateDto.push(item)
    })
  }
  if (waitingOperateDto.length === 0) {
    ElMessage.error('项目为空')
    return
  }
  ElMessageBox.confirm(
    `将为${waitingOperateDto.length}个项目创建或添加聚合，确认？`,
    'Warning',
    {
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
      type: 'warning',
    },
  )
    .then(() => {
      const batchLog: BatchLog = {
        total: waitingOperateDto.length,
        status: 'padding',
        type: 'poly',
        resp: [],
        dto: waitingOperateDto,
      }
      const idx = batchLogs.value.length
      batchLogs.value.push(batchLog)
      const dto = new BatchDto()
      dto.dtos.push(
        ...waitingOperateDto.map((ele, index) => {
          return {
            bid: index,
            dto: ele,
          }
        }),
      )
      dto.polyBase = { ...polyOption }
      API.addPoly(dto)
        .then((resp) => {
          batchLogs.value[idx].resp = resp
          batchLogs.value[idx].status = 'done'
          ElMessage.success('一项聚合批处理操作成功')
          getIllustsAndCount()
          polyForm.value.clearForm()
        })
        .catch((err) => {
          batchLogs.value[idx].status = 'reject'
          ElMessage.error(`一项聚合批处理错误: ${err}`)
        })
    })
    .catch(() => {})
}

async function handleDownload() {
  if (!currentOperating.value) {
    ElMessage.error('项目为空')
    return
  }
  const dir = await ipcInvoke('dialog:openDirectory')
  if (!dir)
    return
  const url = UrlGenerator.getBlobUrl(currentOperating.value, 'original')
  try {
    await downloadTo(
      url,
      currentOperating.value.remote_base.type === 'pixiv'
        ? PathHelper.getBasename(url)
        : currentOperating.value.remote_endpoint,
      dir,
    )
    ElMessage.success('下载完成')
  }
  catch (err) {
    ElMessage.error('下载失败')
  }
}

async function handleDownloadBatch() {
  const waitingOperateDto = illustList.value.filter(value => value.checked)
  if (waitingOperateDto.length === 0) {
    ElMessage.error('项目为空')
    return
  }
  const dir = await ipcInvoke('dialog:openDirectory')
  if (!dir)
    return
  const batchLog: BatchLog = {
    currentIdx: 0,
    total: waitingOperateDto.length,
    status: 'processing',
    type: 'download',
    resp: [],
    dto: waitingOperateDto,
  }
  const idx = batchLogs.value.length
  batchLogs.value.push(batchLog)
  ElMessage.info('开始批处理')
  const process = async (obj, index: number) => {
    const url = UrlGenerator.getBlobUrl(obj, 'original')
    try {
      await downloadTo(
        url,
        obj.remote_base.type === 'pixiv'
          ? PathHelper.getBasename(url)
          : obj.remote_endpoint,
        dir,
      )
    }
    catch (err) {
      batchLogs.value[idx].resp.push({
        bid: index,
        message: err,
        status: 'error',
      })
    }
    finally {
      batchLogs.value[idx].currentIdx++
    }
  }
  const promises = waitingOperateDto.map((obj, index) => process(obj, index))
  Promise.all(promises).then(() => {
    batchLogs.value[idx].status = 'done'
    ElMessage.success(`一项下载批处理完成, 其中${batchLogs.value[idx].resp.length}项失败`)
  })
}

function handleFetch(chooseAll: boolean) {
  const waitingOperateDto = []
  if (!chooseAll && currentOperating.value) {
    waitingOperateDto.push(currentOperating.value)
  }
  else if (chooseAll) {
    illustList.value.forEach((item) => {
      if (item.checked)
        waitingOperateDto.push(item)
    })
  }
  if (waitingOperateDto.length === 0) {
    ElMessage.error('项目为空')
    return
  }
  ElMessageBox.confirm(
    `将为${waitingOperateDto.length}个项目抓取元，确认？`,
    'Warning',
    {
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
      type: 'warning',
    },
  )
    .then(() => {
      const batchLog: BatchLog = {
        total: waitingOperateDto.length,
        status: 'padding',
        type: 'fetch',
        resp: [],
        dto: waitingOperateDto,
      }
      const idx = batchLogs.value.length
      batchLogs.value.push(batchLog)
      const dto = new BatchDto()
      const process = async (ele, index) => {
        if (ele.meta) {
          try {
            const resp: PixivIllust = await API.getPixivInfo(ele.meta.pid)
            ele.meta.author = resp.user.name
            ele.meta.author_id = resp.user.id
            ele.meta.title = resp.title
            ele.meta.type = resp.type
            ele.meta.original_url
              = resp.meta_single_page.original_image_url
              || resp.meta_pages[ele.meta.page].image_urls.original
            ele.meta.limit
              = resp.x_restrict === 1
                ? 'R-18'
                : resp.x_restrict === 2
                  ? 'R-18G'
                  : 'normal'
            ele.meta.book_cnt = resp.total_bookmarks
            ele.meta.height = resp.height
            ele.meta.width = resp.width
            ele.meta.tags_str = resp.tags.map(tag => tag.name).join(',')
            dto.dtos.push({
              bid: index,
              dto: ele,
            })
          }
          catch (err) {
            batchLogs.value[idx].resp.push({
              bid: index,
              status: 'error',
              message: err,
            })
          }
        }
        else {
          batchLogs.value[idx].resp.push({
            bid: index,
            status: 'ignore',
            message: 'Not Pixiv Target',
          })
        }
      }
      const promises = waitingOperateDto.map((ele, index) =>
        process(ele, index),
      )
      Promise.all(promises).then(() => {
        API.updateIllusts(dto)
          .then((resp) => {
            batchLogs.value[idx].resp.push(...resp)
            batchLog.status = 'done'
            ElMessage.success('一项抓取元批处理完成')
            getIllustsAndCount()
          })
          .catch((err) => {
            batchLogs.value[idx].status = 'reject'
            ElMessage.error(`一项抓取元批处理错误: ${err}`)
          })
      })
    })
    .catch(() => {})
}

function handleIT(info: { date: string; char: string; tags: string[] }) {
  ElMessageBox.confirm('为当前项目建立IT, 确认?', 'Warning', {
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancel',
    type: 'warning',
  })
    .then(() => {
      const dto: IllustTodayDto = {
        char: info.char,
        tags: info.tags,
        type: currentOperating.value.remote_base.type,
        target: currentOperating.value.meta
          ? `${currentOperating.value.meta.pid}${
          currentOperating.value.meta.page ? `-${currentOperating.value.meta.page + 1}` : ''
          }`
          : `${currentOperating.value.remote_base.origin_url}/${currentOperating.value.remote_endpoint}`,
      }
      API.coverIllustToday(info.date, dto)
        .then(() => {
          ElMessage.success('请求成功')
          itForm.value.initForm()
        })
        .catch((err) => {
          ElMessage.error(`错误: ${err}`)
        })
    })
    .catch(() => {})
}

function handleDelete(chooseAll: boolean) {
  const waitingOperateDto = []
  if (!chooseAll && currentOperating.value) {
    waitingOperateDto.push(currentOperating.value)
  }
  else if (chooseAll) {
    illustList.value.forEach((item) => {
      if (item.checked)
        waitingOperateDto.push(item)
    })
  }
  if (waitingOperateDto.length === 0) {
    ElMessage.error('项目为空')
    return
  }
  ElMessageBox.confirm(
    `将永久删除${waitingOperateDto.length}个项目，确认？`,
    'Warning',
    {
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
      type: 'warning',
    },
  )
    .then(() => {
      const batchLog: BatchLog = {
        total: waitingOperateDto.length,
        status: 'padding',
        type: 'delete',
        resp: [],
        dto: waitingOperateDto,
      }
      const idx = batchLogs.value.length
      batchLogs.value.push(batchLog)
      API.deleteIllusts(waitingOperateDto.map(v => v.id))
        .then((resp) => {
          batchLogs.value[idx].resp = resp
          batchLogs.value[idx].status = 'done'
          ElMessage.success('一项删除批处理请求成功')
          getIllustsAndCount()
        })
        .catch((err) => {
          batchLogs.value[idx].status = 'reject'
          ElMessage.error(`一项删除批处理错误: ${err}`)
        })
    })
    .catch(() => {})
}

function handlePopupContext(row: IllustObj) {
  if (!row)
    return
  currentOperating.value = row
  ipcRemoveAll('context:click')
  ipcOnce('context:click', (item) => {
    switch (item) {
      case '标记':
        currentSelected.value = row
        break
      case '选定':
        row.checked = !row.checked
        break
      case '加入聚合':
        chooseAll.poly = false
        show.poly = true
        break
      case '选定项加入聚合':
        chooseAll.poly = true
        show.poly = true
        break
      case '置元':
        chooseAll.update = false
        show.update = true
        break
      case '选定项置元':
        chooseAll.update = true
        show.update = true
        break
      case '抓取元':
        handleFetch(false)
        break
      case '选定项抓取元':
        handleFetch(true)
        break
      case '注册为每日一图':
        show.it = true
        break
      case '下载':
        handleDownload()
        break
      case '下载选定项':
        handleDownloadBatch()
        break
      case '删除基':
        handleDelete(false)
        break
      case '选定项删除基':
        handleDelete(true)
        break
      case '打开批处理日志':
        show.drawer = true
        break
      default:
        break
    }
  })
  ipcSend('context:popup', [
    { label: '标记' },
    { type: 'separator' },
    {
      label: '选定',
      type: 'checkbox',
      checked: !!row.checked,
    },
    { type: 'separator' },
    {
      label: '加入聚合',
    },
    {
      label: '置元',
    },
    {
      label: '抓取元',
    },
    { type: 'separator' },
    {
      label: '选定项加入聚合',
    },
    {
      label: '选定项置元',
    },
    {
      label: '选定项抓取元',
    },
    { type: 'separator' },
    {
      label: '注册为每日一图',
    },
    { type: 'separator' },
    {
      label: '下载',
    },
    {
      label: '下载选定项',
    },
    { type: 'separator' },
    {
      label: '删除基',
    },
    {
      label: '选定项删除基',
    },
    { type: 'separator' },
    {
      label: '打开批处理日志',
    },
  ])
}

defineExpose({
  handleSingleIllustChange,
  handleFocusIndexChange,
})
</script>

<template>
  <div style="height: 100%">
    <KeepAlive>
      <component
        :is="
          viewerType === 'table'
            ? ViewerTable
            : viewerType === 'grid'
              ? ViewerGrid
              : ViewerFocus
        "
        ref="viewer"
        :table-data="illustList"
        :loading="isLoading"
        :current-selected="currentSelected"
        @select-change="currentSelected = $event"
        @popup-context="handlePopupContext"
        @star-change="emit('update:star', $event)"
      />
    </KeepAlive>
    <MetaForm
      ref="metaForm"
      v-model="show.update"
      @update:addition="handleUpdate"
    />
    <PolyForm
      ref="polyForm"
      v-model="show.poly"
      @update:poly-option="handlePoly"
    />
    <IllustTodayForm ref="itForm" v-model="show.it" :current-operating="currentOperating" @confirm="handleIT" />
    <BatchLogDrawer v-model="show.drawer" :batch-logs="batchLogs" />
  </div>
</template>

<style lang="scss" scoped></style>
