<script setup lang="ts">
import { computed } from 'vue'
import { Select as ASelect, Input as AInput } from 'ant-design-vue'

const props = defineProps<{
  value: string
}>()

const emits = defineEmits<{
  (e: 'update:value', value: string): void
}>()

const fnKey = computed({
  get() {
    if (!props.value.includes('+')) return ''
    const arr = props.value.split('+')
    return arr.slice(0, arr.length - 1).join('+')
  },
  set(key: string) {
    if (key === '') {
      const arr = props.value.split('+')
      emits('update:value', `${arr.slice(arr.length - 1)[0]}`)
    } else {
      const arr = props.value.split('+')
      emits('update:value', `${key}+${arr.slice(arr.length - 1)[0]}`)
    }
  }
})

const fnKeyList = [
  {
    label: 'CommandOrControl',
    value: 'CommandOrControl'
  },
  {
    label: 'Alt',
    value: 'Alt'
  },
  {
    label: 'Alt+CommandOrControl',
    value: 'Alt+CommandOrControl'
  },
  {
    label: '空',
    value: ''
  }
]

const otherKey = computed({
  get() {
    const arr = props.value.split('+')
    return arr.slice(arr.length - 1)[0]
  },
  set(key: string) {
    if (fnKey.value === '') {
      emits('update:value', `${key}`)
    } else {
      const arr = props.value.split('+')
      emits('update:value', `${arr.slice(0, arr.length - 1).join('+')}+${key}`)
    }
  }
})

const onKeydown = (e: KeyboardEvent) => {
  otherKey.value = e.key.toUpperCase()
  e.preventDefault()
}
</script>

<template>
  <div class="shortcuts-input">
    <a-select
      v-model:value="fnKey"
      :options="fnKeyList"
      class="fn-key"
    ></a-select>
    <span> + </span>
    <a-input
      v-model:value="otherKey"
      class="other-key"
      placeholder="请按下快捷键"
      @keydown="onKeydown"
    ></a-input>
  </div>
</template>

<style scoped>
.shortcuts-input {
  font-size: 18px;
}
.fn-key {
  width: 230px;
}
.other-key {
  width: 200px;
}
</style>
