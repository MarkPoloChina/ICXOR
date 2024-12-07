<script setup lang="ts">
import type { FilterConditionObj } from '@main/illust/dto/filter_condition_obj.dto'
import type { FilterSortObj } from '@main/illust/dto/filter_sort_obj.dto'
import type { IllustTodayDto } from '@main/illust/dto/illust_today.dto'
import type { Poly } from '@main/illust/entities/poly.entities'
import type { PixivIllust } from '@markpolochina/pixiv.ts'
import type { BatchLog } from '@render/ts/interface/batchLog'
import type { IllustObj } from '@render/ts/interface/illustObj'
import type { Ref } from 'vue'
import IllustTodayForm from '@render/components/share/form/illustTodayForm.vue'
import MetaForm from '@render/components/share/form/metaForm.vue'
import PolyForm from '@render/components/share/form/polyForm.vue'
import { API } from '@render/ts/api'
import { BatchDto } from '@render/ts/dto/batch'
import { PathHelper, UrlGenerator } from '@render/ts/util/path'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import ViewerFocus from './main/viewerFocus.vue'
import ViewerGrid from './main/viewerGrid.vue'
import ViewerTable from './main/viewerTable.vue'

const props = defineProps({
  filter: Object as () => FilterConditionObj,
  sorter: Object as () => FilterSortObj,
  batchLogs: Array as () => BatchLog[],
  viewerType: String as () => 'focus' | 'grid' | 'table',
  curPage: Number,
  pageSize: Number,
  currentSelected: Object as () => IllustObj | null,
  picoltId: Number,
})

const emit = defineEmits([
  'update:curPage',
  'update:pageSize',
  'update:currentSelected',
  'update:illust-count',
  'update:selection-count',
  'update:star',
  'update:batchLogs',
])
const { ipcRemoveAll, ipcOnce, ipcSend, ipcSendSync, ipcInvoke, downloadTo, download2xTo }
  = window.electron
const osString = ipcSendSync('app:getOS') === 'darwin' ? 'Finder' : 'Explorer'
const viewerRef: Ref<InstanceType<typeof ViewerFocus | typeof ViewerGrid | typeof ViewerTable>>
  = ref()
const metaFormRef: Ref<InstanceType<typeof MetaForm>> = ref()
const polyFormRef: Ref<InstanceType<typeof PolyForm>> = ref()
const itFormRef: Ref<InstanceType<typeof IllustTodayForm>> = ref()
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
watch(
  illustList,
  () => {
    emit('update:selection-count', illustList.value.filter(v => v.checked).length)
  },
  {
    deep: true,
  },
)
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
const batchLogs = computed({
  get: () => {
    return props.batchLogs
  },
  set: (val) => {
    emit('update:batchLogs', val)
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
})

function handleFocusIndexChange(action) {
  (viewerRef.value as InstanceType<typeof ViewerFocus>).handleIndexChange(action)
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
        metaFormRef.value.clearForm()
      }
    })
    .catch((err) => {
      ElMessage.error(`错误: ${err}`)
    })
}

function handleUpdate(addition: {
  date?: Date
  star?: number
  tag?: Array<{ name: string, type: string }>
}) {
  const waitingOperateDto: IllustObj[] = []
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
  ElMessageBox.confirm(`将为${waitingOperateDto.length}个项目进行更新，确认？`, 'Warning', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
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
      ElMessage.info('开始批处理')
      API.updateIllusts(dto)
        .then((resp: Array<any>) => {
          batchLogs.value[idx].resp = resp
          batchLogs.value[idx].status = 'done'
          ElNotification.success({
            message: '一项置元批处理操作成功',
            duration: 0,
          })
          getIllustsAndCount()
          metaFormRef.value.clearForm()
        })
        .catch((err) => {
          batchLogs.value[idx].status = 'reject'
          ElNotification.error({
            message: `一项置元批处理错误: ${err}`,
            duration: 0,
          })
        })
    })
    .catch(() => {})
}

function handlePoly(polyOption: { type: string, parent: string, name: string }) {
  const waitingOperateDto: IllustObj[] = []
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
    `将为${waitingOperateDto.length}个项目创建或添加PICOLT聚合，确认？`,
    'Warning',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
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
      ElMessage.info('开始批处理')
      API.addPoly(dto)
        .then((resp) => {
          batchLogs.value[idx].resp = resp
          batchLogs.value[idx].status = 'done'
          ElNotification.success({
            message: '一项PICOLT聚合批处理操作成功',
            duration: 0,
          })
          getIllustsAndCount()
          polyFormRef.value.clearForm()
        })
        .catch((err) => {
          batchLogs.value[idx].status = 'reject'
          ElNotification.error({
            message: `一项PICOLT聚合批处理错误: ${err}`,
            duration: 0,
          })
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
  const ei = ElMessage.info({
    message: '正在导出',
    duration: 0,
  })
  try {
    await downloadTo(url, dir, url.includes('i.pximg.net'))
    ElMessage.success('导出完成')
  }
  catch {
    ElMessage.error('导出失败')
  }
  ei.close()
}

async function handleDownload2x(poly: Poly) {
  if (!currentOperating.value) {
    ElMessage.error('项目为空')
    return
  }
  const dir = await ipcInvoke('dialog:openDirectory')
  if (!dir)
    return
  const url = UrlGenerator.getPicolt2xUrl(currentOperating.value, poly)
  const ei = ElMessage.info({
    message: '正在导出',
    duration: 0,
  })
  try {
    await download2xTo(url, dir)
    ElMessage.success('导出完成')
  }
  catch {
    ElMessage.error('导出失败')
  }
  ei.close()
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
  for (const [index, obj] of waitingOperateDto.entries()) {
    const url = UrlGenerator.getBlobUrl(obj, 'original')
    try {
      await downloadTo(url, dir, url.includes('i.pximg.net'))
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
  batchLogs.value[idx].status = 'done'
  ElNotification.success({
    message: `一项导出批处理完成, 其中${batchLogs.value[idx].resp.length}项失败`,
    duration: 0,
  })
}

function handleFetch(chooseAll: boolean) {
  const waitingOperateDto: IllustObj[] = []
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
  ElMessageBox.confirm(`将为${waitingOperateDto.length}个项目抓取元，确认？`, 'Warning', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
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
      ElMessage.info('开始批处理')
      for (const [index, ele] of waitingOperateDto.entries()) {
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
              = resp.x_restrict === 1 ? 'R-18' : resp.x_restrict === 2 ? 'R-18G' : 'normal'
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
      API.updateIllusts(dto)
        .then((resp) => {
          batchLogs.value[idx].resp.push(...resp)
          batchLog.status = 'done'
          ElNotification.success({
            message: '一项抓取元批处理操作成功',
            duration: 0,
          })
          getIllustsAndCount()
        })
        .catch((err) => {
          batchLogs.value[idx].status = 'reject'
          ElNotification.error({
            message: `一项抓取元批处理错误: ${err}`,
            duration: 0,
          })
        })
    })
    .catch(() => {})
}

function handleIT(info: { date: string, char: string, tags: string[] }) {
  ElMessageBox.confirm('为当前项目建立IT, 确认?', 'Warning', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      if (!currentOperating.value.remote_endpoint) {
        ElMessage.error('无法为此项目建立IT')
        return
      }
      const dto: IllustTodayDto = {
        char: info.char,
        tags: info.tags,
        type: currentOperating.value.remote_base.name,
        base: currentOperating.value.remote_base.origin_url,
        target: currentOperating.value.remote_endpoint,
        source:
          currentOperating.value.link || UrlGenerator.getSourceLink(currentOperating.value) || null,
      }
      API.coverIllustToday(info.date, dto)
        .then(() => {
          ElMessage.success('请求成功')
          itFormRef.value.initForm()
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
  ElMessageBox.confirm(`将永久删除${waitingOperateDto.length}个项目，确认？`, 'Warning', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
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
      ElMessage.info('开始批处理')
      API.deleteIllusts(waitingOperateDto.map(v => v.id))
        .then((resp) => {
          batchLogs.value[idx].resp = resp
          batchLogs.value[idx].status = 'done'
          ElNotification.success({
            message: '一项删除批处理操作成功',
            duration: 0,
          })
          getIllustsAndCount()
        })
        .catch((err) => {
          batchLogs.value[idx].status = 'reject'
          ElNotification.error({
            message: `一项删除批处理错误: ${err}`,
            duration: 0,
          })
        })
    })
    .catch(() => {})
}

function handleRemoveFromPoly() {
  ElMessageBox.confirm('将从本聚合移除该图，确认？', 'Warning', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      API.removePolyById(props.picoltId, [currentOperating.value.id])
        .then(async () => {
          ElMessage.success('移除成功')
          getIllustsAndCount()
        })
        .catch((err) => {
          ElMessage.error(`错误: ${err}`)
        })
    })
    .catch(() => {})
}

function handlePopupContext(row: IllustObj) {
  if (!row)
    return
  currentOperating.value = row
  ipcRemoveAll('context:click')
  ipcOnce('context:click', (item, subItem) => {
    switch (item) {
      case '选择':
        currentSelected.value = row
        break
      case '选择并打开':
        currentSelected.value = row;
        (viewerRef.value as InstanceType<typeof ViewerGrid>).openViwer()
        break
      case '勾选':
        row.checked = !row.checked
        break
      case '加入PICOLT':
        chooseAll.poly = false
        show.poly = true
        break
      case '选定项加入PICOLT':
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
      case '导出':
        handleDownload()
        break
      case '导出选定项':
        handleDownloadBatch()
        break
      case '导出2x聚合':
        handleDownload2x(row.poly.find(p => p.parent === subItem))
        break
      case `在${osString}中打开`:
        ipcSend('app:openInFolder', PathHelper.getLocalPath(row))
        break
      case `在${osString}中打开聚合`:
        ipcSend(
          'app:openInFolder',
          PathHelper.getPicoltLocalPath(
            row,
            row.poly.find(p => p.parent === subItem),
            false,
          ),
        )
        break
      case `在${osString}中打开2x聚合`:
        ipcSend(
          'app:openInFolder',
          PathHelper.getPicoltLocalPath(
            row,
            row.poly.find(p => p.parent === subItem),
            true,
          ),
        )
        break
      case '删除基':
        handleDelete(false)
        break
      case '选定项删除基':
        handleDelete(true)
        break
      case '从当前聚合移除':
        handleRemoveFromPoly()
        break
      default:
        break
    }
  })
  ipcSend('context:popup', [
    { label: '选择' },
    ...(props.viewerType === 'grid' ? [{ label: '选择并打开' }] : []),
    {
      label: '勾选',
      type: 'checkbox',
      checked: !!row.checked,
    },
    { type: 'separator' },
    {
      label: '加入PICOLT',
    },
    {
      label: '置元',
    },
    {
      label: '抓取元',
    },
    {
      label: '注册为每日一图',
    },
    {
      label: '导出',
    },
    ...(row.poly.filter(v => UrlGenerator.getPicolt2xUrl(row, v)).length
      ? [
          {
            label: `导出2x聚合`,
            submenu: [
              ...row.poly
                .filter(v => UrlGenerator.getPicolt2xUrl(row, v))
                .map((v) => {
                  return {
                    label: v.parent,
                  }
                }),
            ],
          },
        ]
      : []),
    {
      label: '删除基',
    },
    { type: 'separator' },
    ...(UrlGenerator.getBlobUrl(row, 'original').startsWith('icxorimg://')
      ? [
          {
            label: `在${osString}中打开`,
          },
        ]
      : []),
    ...(row.poly.filter(v => v.remote_base).length
      ? [
          {
            label: `在${osString}中打开聚合`,
            submenu: [
              ...row.poly
                .filter(v => v.remote_base)
                .map((v) => {
                  return {
                    label: v.parent,
                  }
                }),
            ],
          },
        ]
      : []),
    ...(row.poly.filter(v => v.remote2x_base).length
      ? [
          {
            label: `在${osString}中打开2x聚合`,
            submenu: [
              ...row.poly
                .filter(v => v.remote2x_base)
                .map((v) => {
                  return {
                    label: v.parent,
                  }
                }),
            ],
          },
        ]
      : []),
    { type: 'separator' },
    ...(illustList.value.filter(value => value.checked).length
      ? [
          {
            label: '选定项加入PICOLT',
          },
          {
            label: '选定项置元',
          },
          {
            label: '选定项抓取元',
          },
          {
            label: '选定项导出',
          },
          {
            label: '选定项删除基',
          },
        ]
      : []),
    { type: 'separator' },
    ...(props.picoltId !== -1 ? [{ label: '从当前聚合移除' }] : []),
  ])
}

defineExpose({
  handleSingleIllustChange,
  handleFocusIndexChange,
  getIllustsAndCount,
})
</script>

<template>
  <div style="height: 100%">
    <KeepAlive>
      <component
        :is="
          viewerType === 'table' ? ViewerTable : viewerType === 'grid' ? ViewerGrid : ViewerFocus
        "
        ref="viewerRef"
        :table-data="illustList"
        :loading="isLoading"
        :current-selected="currentSelected"
        @select-change="currentSelected = $event"
        @popup-context="handlePopupContext"
        @star-change="emit('update:star', $event)"
      />
    </KeepAlive>
    <MetaForm
      ref="metaFormRef"
      v-model="show.update"
      @update:addition="handleUpdate"
    />
    <PolyForm
      ref="polyFormRef"
      v-model="show.poly"
      @update:poly-option="handlePoly"
    />
    <IllustTodayForm
      ref="itFormRef"
      v-model="show.it"
      :current-operating="currentOperating"
      @confirm="handleIT"
    />
  </div>
</template>

<style lang="scss" scoped></style>
