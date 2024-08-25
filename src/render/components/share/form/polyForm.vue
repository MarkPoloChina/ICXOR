<script setup lang="ts">
import type { Poly } from '@main/illust/entities/poly.entities'
import { API } from '@render/ts/api'
import { computed, onMounted, reactive, ref } from 'vue'

const props = defineProps({
  modelValue: Boolean,
})

const emit = defineEmits(['update:modelValue', 'update:poly-option'])
const polyInfo = reactive({
  type: 'picolt',
  parent: '',
  name: '',
})
const polyParentEnum = ref<Poly[]>([])
const dialogVisible = computed({
  get: () => {
    return props.modelValue
  },
  set: (value) => {
    emit('update:modelValue', value)
  },
})
onMounted(() => {
  getPolyParentEnum(polyInfo.type)
})
function getPolyParentEnum(type?: string) {
  if (type) {
    API.getEnumPolyParent(type).then((data) => {
      polyParentEnum.value = data
    })
  }
}
function handleConfirm() {
  dialogVisible.value = false
  emit('update:poly-option', polyInfo)
}
function clearForm() {
  polyInfo.type = 'picolt'
  polyInfo.parent = ''
  polyInfo.name = ''
}
defineExpose({ clearForm })
</script>

<template>
  <div>
    <el-dialog v-model="dialogVisible" title="PICOLT聚合表单" width="60%">
      <el-form :model="polyInfo" label-width="100px" style="width: 100%">
        <el-form-item label="PICOLT簇">
          <el-select
            v-model="polyInfo.parent"
            style="width: 100%"
            filterable
            allow-create
            placeholder="选择或填写PICOLT簇,可以留空"
          >
            <el-option
              v-for="item in polyParentEnum"
              :key="item.parent"
              :label="item.parent"
              :value="item.parent"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="PICOLT名">
          <el-input v-model="polyInfo.name" placeholder="输入PICOLT名" />
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
