<script setup lang="ts">
import { computed, reactive, ref, toRaw } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  disableChangeAuto: Boolean,
  type: String,
  chooseAll: Boolean,
})

const emit = defineEmits(['update:modelValue', 'confirm'])
const baseInfo = reactive({
  date: null,
  star: 0,
  tag: [],
  meta: {
    limit: null,
  },
})
const noChangeStar = ref(true)
const autoKeys = reactive({
  'meta.title': false,
  'REFORPIXIV': false,
  'thumb_endpoint': false,
  'remote_endpoint': '',
})
const limitOptions = [
  {
    value: 'R-18',
    label: 'R-18',
  },
  {
    value: 'R-15',
    label: 'R-15',
  },
  {
    value: 'normal',
    label: 'normal',
  },
]
const dialogVisible = computed({
  get: () => {
    return props.modelValue
  },
  set: (value) => {
    emit('update:modelValue', value)
  },
})
function initForm() {
  baseInfo.date = null
  baseInfo.star = 0
  baseInfo.meta.limit = null
  autoKeys['meta.title'] = false
  autoKeys.remote_endpoint = ''
  autoKeys.REFORPIXIV = false
  autoKeys.thumb_endpoint = false
}
function handleConfirm() {
  dialogVisible.value = false
  let controller = null
  let data = null
  if (props.type === 'basic') {
    controller = toRaw(autoKeys)
    data = {
      ...baseInfo,
      tag: baseInfo.tag.map((value) => {
        return { name: value }
      }),
    }
  }
  else if (props.type === 'viewer') {
    data = {
      ...baseInfo,
      tag: baseInfo.tag.map((value) => {
        return { name: value }
      }),
    }
    controller = props.chooseAll
  }
  if (noChangeStar.value && data)
    data.star = null
  emit('confirm', {
    data,
    controller,
  })
}

defineExpose({ initForm })
</script>

<template>
  <div>
    <el-dialog v-model="dialogVisible" title="元数据表单" width="60%">
      <el-form :model="baseInfo" label-width="100px" style="width: 100%">
        <el-form-item v-if="type === 'basic'" label="自动注入">
          <el-checkbox
            v-model="autoKeys['meta.title']"
            label="标题"
            :disabled="disableChangeAuto"
          />
          <el-checkbox
            v-model="autoKeys.REFORPIXIV"
            label="Pixiv末端"
            :disabled="disableChangeAuto"
          />
          <el-checkbox
            v-model="autoKeys.thumb_endpoint"
            label="jpg缩图末端"
            :disabled="disableChangeAuto"
          />
        </el-form-item>
        <el-form-item v-if="type === 'basic'">
          <template #label>
            <el-tooltip
              effect="dark"
              content="只有导入零散插画时才应该添加前导, 优先远程基。必须添加后导斜杠。"
              placement="right"
            >
              末端前导
            </el-tooltip>
          </template>
          <el-input
            v-model="autoKeys.remote_endpoint"
            :disabled="disableChangeAuto"
          />
        </el-form-item>
        <el-form-item label="入库时间">
          <el-date-picker
            v-model="baseInfo.date"
            value-format="YYYY-MM-DD"
            type="date"
            placeholder="Pick a day"
          />
        </el-form-item>
        <el-form-item label="评级">
          <el-rate v-model="baseInfo.star" clearable :disabled="noChangeStar" />
          <el-checkbox v-model="noChangeStar" label="不修改" />
        </el-form-item>
        <el-form-item label="标签">
          <el-select
            v-model="baseInfo.tag"
            multiple
            filterable
            allow-create
            placeholder="填写标签"
          />
        </el-form-item>
        <el-form-item label="分级">
          <el-select v-model="baseInfo.meta.limit" placeholder="Select">
            <el-option
              v-for="item in limitOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="handleConfirm"> Confirm </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped></style>
