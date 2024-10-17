<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
})

const emit = defineEmits(['update:modelValue', 'update:addition'])
const notChange = reactive({
  date: true,
  star: true,
  tag: true,
})
const tagType = ref('simple')
const dialogVisible = computed({
  get: () => {
    return props.modelValue
  },
  set: (value) => {
    emit('update:modelValue', value)
  },
})
const addition = reactive({
  date: null,
  star: 0,
  tag: [],
})
const defaultAddition = {
  date: null,
  star: 0,
  tag: [],
}
watch(
  () => notChange,
  (notChangeValue) => {
    Object.keys(notChangeValue).forEach((key) => {
      if (notChangeValue[key])
        addition[key] = defaultAddition[key]
    })
  },
  {
    deep: true,
  },
)
function handleConfirm() {
  const data = {
    date: notChange.date ? undefined : addition.date,
    star: notChange.star ? undefined : addition.star,
    tag: notChange.tag
      ? undefined
      : addition.tag.map((v: string) => {
        return { name: v, type: tagType.value }
      }),
  }
  dialogVisible.value = false
  emit('update:addition', data)
}
function clearForm() {
  tagType.value = 'simple'
  Object.keys(notChange).forEach((key) => {
    notChange[key] = true
  })
}
defineExpose({ clearForm })
</script>

<template>
  <div>
    <el-dialog
      v-model="dialogVisible"
      title="元数据表单"
      width="60%"
    >
      <el-form
        :model="addition"
        label-width="100px"
        style="width: 100%"
      >
        <el-form-item label="入库时间">
          <el-date-picker
            v-model="addition.date"
            value-format="YYYY-MM-DD"
            type="date"
            placeholder="选择入库时间"
            :disabled="notChange.date"
          />
          <el-checkbox
            v-model="notChange.date"
            label="不修改"
            style="margin-left: 20px"
          />
        </el-form-item>
        <el-form-item label="评级">
          <el-rate
            v-model="addition.star"
            clearable
            :disabled="notChange.star"
          />
          <el-checkbox
            v-model="notChange.star"
            label="不修改"
            style="margin-left: 20px"
          />
        </el-form-item>
        <el-form-item label="增加标签">
          <el-select
            v-model="tagType"
            placeholder="选择标签类型"
            :disabled="notChange.tag"
            style="width: 100px"
          >
            <el-option
              v-for="item in ['simple', 'works']"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
          <el-select
            v-model="addition.tag"
            multiple
            filterable
            allow-create
            placeholder="填写标签"
            :disabled="notChange.tag"
            style="margin-left: 20px"
          />
          <el-checkbox
            v-model="notChange.tag"
            label="不增加"
            style="margin-left: 20px"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="handleConfirm"
          >
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped></style>
