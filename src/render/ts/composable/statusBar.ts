import { computed, ref } from 'vue'

export function useStatusBar() {
  const currentProgress = ref(0)
  const totalCount = ref(0)
  const currentStatus = ref<'Idle' | 'Cancelling' | 'Cancelled' | 'Processing' | 'Completed'>
  ('Idle')
  const currentStatusCN = computed(() => {
    switch (currentStatus.value) {
      case 'Idle':
        return '就绪'
      case 'Cancelled':
        return '已取消'
      case 'Cancelling':
        return '正在取消'
      case 'Processing':
        return '处理中'
      case 'Completed':
        return '已完成'
      default:
        return '未知状态'
    }
  })
  const processingLock = computed(() => {
    return currentStatus.value === 'Processing' || currentStatus.value === 'Cancelling'
  })

  const progressPercentage = computed(() => {
    return totalCount.value > 0 ? (currentProgress.value / totalCount.value) * 100 : 0
  })

  const statusMessage = computed(() => {
    if (currentStatus.value === 'Idle') {
      return `${currentStatusCN.value}`
    }
    return `${currentProgress.value}/${totalCount.value} (${progressPercentage.value.toFixed(2)}%) - ${currentStatusCN.value}`
  })

  const initStart = (totalCount_: number) => {
    currentProgress.value = 0
    totalCount.value = totalCount_
    currentStatus.value = 'Processing'
  }

  const abort = () => {
    if (currentStatus.value !== 'Processing')
      return
    currentStatus.value = 'Cancelling'
  }

  const finish = () => {
    currentStatus.value = 'Completed'
  }

  const step = () => {
    if (currentStatus.value === 'Cancelling') {
      currentStatus.value = 'Cancelled'
      throw new Error('Task was cancelled')
    }
    else if (currentStatus.value === 'Processing') {
      currentProgress.value += 1
    }
  }

  return {
    statusMessage,
    initStart,
    abort,
    finish,
    processingLock,
    step,
  }
}
