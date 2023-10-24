<script setup lang="ts">
import { API } from '@render/ts/api'
import { UtilDate } from '@render/ts/util/date'
import {
  ArrowLeftBold,
  ArrowRightBold,
  Refresh,
} from '@element-plus/icons-vue'

import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { FilterConditionObj } from '@main/illust/dto/filter_condition_obj.dto'
import type { FilterSortObj } from '@main/illust/dto/filter_sort_obj.dto'

const emit = defineEmits(['update:filter', 'update:sorter'])
const show = ref(false)
const filterCondition = reactive<FilterConditionObj>({
  'illust.remote_endpoint': '',
  'remote_base.id': [],
  'illust.date': [],
  'illust.star': [],
  'poly.type': [],
  'poly.parent': [],
  'poly.name': [],
  'tag.name': [],
  'meta.pid': '',
  'meta.tags_str': '',
  'meta.author_id': '',
  'meta.author': '',
  'AR': 'all',
})
const filterSortKey = ref('Illust.id')
const filterSortDesc = ref<'DESC' | 'ASC'>('DESC')
const filterSort = computed<FilterSortObj>(() => {
  const obj = {}
  obj[filterSortKey.value] = filterSortDesc.value
  return obj
})
const options = {
  'tag.name': [],
  'meta.author_id': [],
  'remote_base.id': [],
  'illust.date': [],
  'poly.type': [
    {
      value: 'picolt',
      label: 'Picolt',
    },
  ],
  'AR': [
    {
      value: 'all',
      label: '所有纵横比',
    },
    {
      value: 'horizontal',
      label: '横版',
    },
    {
      value: 'vertical',
      label: '竖版',
    },
  ],
  'sortKey': [
    {
      value: 'Illust.id',
      label: '基ID',
    },
    {
      value: 'Illust.remote_endpoint',
      label: '末端',
    },
    {
      value: 'meta.pid',
      label: 'PID',
    },
    {
      value: 'meta.author_id',
      label: '作者ID',
    },
    {
      value: 'meta.book_cnt',
      label: '收藏数',
    },
  ],
  'sortDesc': [
    {
      value: 'ASC',
      label: '顺序',
    },
    {
      value: 'DESC',
      label: '倒序',
    },
  ],
}
const polyOptions = ref([])
const polyValue = ref()
watch(filterCondition, (val) => {
  emit('update:filter', val)
})
watch(filterSort, (val) => {
  emit('update:sorter', val)
})
onMounted(() => {
  getTypeOptions()
  getDateOptions()
  getTagsOptions()
})
async function getTagsOptions() {
  const data = await API.getTags()
  options['tag.name'] = data.filter((val) => {
    return val.type !== 'author'
  })
  options['meta.author_id'] = data.filter((val) => {
    return val.type === 'author'
  })
}
async function getTypeOptions() {
  const data = await API.getRemoteBase()
  options['remote_base.id'] = data
}
async function getDateOptions() {
  const data = await API.getEnumTimeline()
  data.forEach((ele) => {
    options['illust.date'].push({
      date: UtilDate.getDateCST(new Date(ele.date), '-'),
    })
  })
}
async function getPolyOptions(val) {
  polyOptions.value.length = 0
  filterCondition['poly.parent'] = []
  filterCondition['poly.name'] = []
  if (!val)
    return
  for (const p of val) {
    const polies = await API.getPoly(p)
    polies.forEach((poly) => {
      let index = polyOptions.value.findIndex((val) => {
        return val.value === poly.parent
      })
      if (index === -1) {
        polyOptions.value.push({
          value: poly.parent,
          label: poly.parent,
          children: [],
        })
        index = polyOptions.value.length - 1
      }
      polyOptions.value[index].children.push({
        value: poly.name,
        label: poly.name,
      })
    })
  }
}
function handlePolyChange(val) {
  filterCondition['poly.parent'] = []
  filterCondition['poly.name'] = []
  val.forEach((item) => {
    if (!filterCondition['poly.parent'].find(val => val === item[0]))
      filterCondition['poly.parent'].push(item[0])
    if (item[1] && !filterCondition['poly.name'].find(val => val === item[1]))
      filterCondition['poly.name'].push(item[1])
  })
}
async function handleClear() {
  await getTypeOptions()
  await getDateOptions()
  await getTagsOptions()
  filterCondition.AR = 'all'
  Object.keys(filterCondition)
    .filter(value => value !== 'AR')
    .forEach((key) => {
      if (Array.isArray(filterCondition[key]))
        filterCondition[key] = []
      else filterCondition[key] = ''
    })
  filterSortKey.value = 'Illust.id'
  filterSortDesc.value = 'DESC'
}
</script>

<template>
  <div class="container">
    <div class="item-bottom">
      <el-button
        :icon="show ? ArrowLeftBold : ArrowRightBold"
        circle
        @click="show = !show"
      />
    </div>
    <transition name="el-zoom-in-center">
      <el-scrollbar v-if="show" class="filter-container">
        <div class="filter">
          <div>
            <el-select
              v-model="filterCondition['remote_base.id']"
              placeholder="选择类型"
              multiple
            >
              <el-option
                v-for="item in options['remote_base.id']"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </div>
          <div>
            <el-select
              v-model="filterCondition['poly.type']"
              placeholder="选择聚合类型"
              multiple
              @change="getPolyOptions"
            >
              <el-option
                v-for="item in options['poly.type']"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
          <div v-if="filterCondition['poly.type'][0]">
            <el-cascader
              v-model="polyValue"
              :options="polyOptions"
              :props="{ multiple: true }"
              :show-all-levels="false"
              placeholder="选择聚合"
              @change="handlePolyChange"
            />
          </div>
          <div>
            <el-select
              v-model="filterCondition['illust.date']"
              placeholder="选择入库时间"
              multiple
            >
              <el-option
                v-for="item in options['illust.date']"
                :key="item.date"
                :label="item.date"
                :value="item.date"
              />
            </el-select>
          </div>
          <div>
            <el-select
              v-model="filterCondition['tag.name']"
              multiple
              filterable
              allow-create
              placeholder="填写筛选标签"
            >
              <el-option
                v-for="item in options['tag.name']"
                :key="item.id"
                :label="`[${item.type}]${item.name}`"
                :value="item.name"
              />
            </el-select>
          </div>
          <div>
            <el-select
              v-model="filterCondition['illust.star']"
              placeholder="选择评级"
              multiple
            >
              <el-option
                v-for="item in 6"
                :key="item - 1"
                :label="`${item - 1}星`"
                :value="item - 1"
              >
                <el-rate :model-value="item - 1" disabled />
              </el-option>
            </el-select>
          </div>
          <div>
            <el-select v-model="filterCondition.AR" placeholder="选择纵横比">
              <el-option
                v-for="item in options.AR"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
                {{ item.label }}
              </el-option>
            </el-select>
          </div>
          <div>
            <el-input v-model="filterCondition['meta.pid']" placeholder="PID" />
          </div>
          <div>
            <el-select
              v-model="filterCondition['meta.author_id']"
              filterable
              allow-create
              placeholder="UID"
            >
              <el-option
                v-for="item in options['meta.author_id']"
                :key="item.id"
                :label="item.name"
                :value="/^\[(\d+)\]/.exec(item.name)[1]"
              />
            </el-select>
          </div>
          <div>
            <el-input
              v-model="filterCondition['meta.author']"
              placeholder="模糊作者名"
            />
          </div>
          <div>
            <el-input
              v-model="filterCondition['meta.tags_str']"
              placeholder="模糊Pixiv标签"
            />
          </div>
          <div>
            <el-input
              v-model="filterCondition['illust.remote_endpoint']"
              placeholder="模糊末端"
            />
          </div>
          <div
            style="
              margin-top: 25px;
              padding-top: 25px;
              border-top: 1px solid rgba(0, 0, 0, 0.1);
            "
          >
            <el-select v-model="filterSortKey" placeholder="选择排序规则">
              <el-option
                v-for="item in options.sortKey"
                :key="item.value"
                :label="`按${item.label}排序`"
                :value="item.value"
              >
                {{ `按${item.label}排序` }}
              </el-option>
            </el-select>
          </div>
          <div>
            <el-select v-model="filterSortDesc" placeholder="选择顺序">
              <el-option
                v-for="item in options.sortDesc"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
                {{ item.label }}
              </el-option>
            </el-select>
          </div>
        </div>
      </el-scrollbar>
    </transition>
    <div class="item-bottom">
      <el-button :icon="Refresh" circle @click="handleClear" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.container {
  height: 100%;
  @include Flex-C-JSB;
  .item-bottom {
    margin: 10px 0 10px 0;
    flex: none;
  }
  .filter-container {
    .filter {
      > div {
        margin-bottom: 10px;
      }
    }
  }
}
</style>
