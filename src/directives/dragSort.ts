// 拖拽指令
import sortable from 'sortablejs'
import type { Directive, DirectiveBinding } from 'vue'
import type { SortableOptions } from 'sortablejs'

interface DragSortParams {
  el: string
  forceFallback: boolean
  handle: string
  filter: string
  draggable: string
  dragClass: string // 正在被拖拽中的css类名
  callback: (oldIndex: number, newIndex: number) => void
}

const dragSort: Directive<HTMLElement> = {
  mounted: (el: HTMLElement, binding: DirectiveBinding<DragSortParams>) => {
    const parentElement = binding.value?.el ? document.querySelector(binding.value.el) : el
    const params: SortableOptions = {
      forceFallback: binding.value?.forceFallback !== false,
      ghostClass: 'dragging',
      dragClass: binding.value.dragClass,
      onEnd: (evt: any) => {
        if (evt.newIndex !== evt.oldIndex) {
          binding.value?.callback(evt.oldIndex, evt.newIndex)
        }
      }
    }
    binding.value?.handle && (params.handle = binding.value.handle)
    binding.value?.filter && (params.filter = binding.value.filter)
    binding.value?.draggable && (params.draggable = binding.value.draggable)
    sortable.create(parentElement as HTMLElement, params)
  }
}

export default dragSort
