<script setup lang="ts">
import { ref } from 'vue'
import { Modal as AModal, Pagination as APagination, Input as AInput } from 'ant-design-vue'
import { useDialog } from 'use-dialog-vue3'
import magnifyIcon from 'vue-material-design-icons/Magnify.vue'
import { debounce } from '../utils/debounce'
import { defaultChapterTitleRegExpStr } from '../utils/constants'

const props = defineProps<{
  book: Book
}>()

const { visible, close } = useDialog()

const book = window.ipcRenderer.getBookContent(props.book.path)
const bookList = window.ipcRenderer.getBookList()
const chapterTitleRegExp = new RegExp(props.book.chapterTitleRegExp || defaultChapterTitleRegExpStr, 'g')
const chapterTitles = Array.from(book.matchAll(chapterTitleRegExp))
const bookDetail = bookList.find(b => b.path === props.book.path)

const searchValue = ref('')
const results = ref<
  {
    index: number
    context: string
    chapterTitle: string | undefined
    chapterIndex: number | undefined
    chapterStartIndex: number | undefined
  }[]
>([])

const currentPage = ref(1)

const canvas = document.createElement('canvas')
const context = canvas.getContext('2d')

function getTextWidth(text: string, font: string) {
  // 创建一个临时的canvas元素来测量文本宽度
  if (!context) return 0
  context.font = font
  return context.measureText(text).width
}

function highlightKeyword(prefixText: string, suffixText: string, keyword: string, container: HTMLElement) {
  const containerWidth = container.offsetWidth - 24 // 减去padding
  const font = window.getComputedStyle(container).font

  let resultText = '...' + prefixText + keyword + suffixText + '...'

  // 高亮关键词
  let highlightedText = prefixText + `<span class="highlight-text">${keyword}</span>` + suffixText

  let times = 0
  // 动态调整文本以适应容器宽度
  while (getTextWidth(resultText, font) > containerWidth) {
    if (times % 2 === 0) {
      suffixText = suffixText.slice(0, -1)
      resultText = '...' + prefixText + keyword + suffixText + '...'
    } else {
      prefixText = prefixText.slice(1)
      resultText = '...' + prefixText + keyword + suffixText + '...'
    }
    times++
    highlightedText = '...' + prefixText + `<span class="highlight-text">${keyword}</span>` + suffixText + '...'
  }

  return highlightedText
}

function findChapter(index: number) {
  for (let i = -1; i < chapterTitles.length; i++) {
    if (i === -1) continue
    if (chapterTitles[i].index < index) continue
    return i - 1
  }
  return undefined
}

const onSearch = debounce(() => {
  currentPage.value = 1
  if (!searchValue.value) {
    results.value = []
  }
  const searchResultList = document.querySelector('.search-result-list') as HTMLElement
  const noSpecialCharacterBook = book.replace(/[^\S\r\n]/g, '')
  results.value = Array.from(book.matchAll(new RegExp(searchValue.value, 'g'))).map(item => {
    const chapterIndex = findChapter(item.index)
    const chapter = chapterIndex !== undefined ? chapterTitles[chapterIndex] : undefined
    return {
      index: item.index,
      context: highlightKeyword(
        noSpecialCharacterBook.slice(item.index - 50, item.index),
        noSpecialCharacterBook.slice(item.index + item[0].length, item.index + item[0].length + 50),
        item[0],
        searchResultList
      ),
      chapterTitle: chapter?.[0],
      chapterIndex: chapterIndex,
      chapterStartIndex: chapter?.index
    }
  })
}, 300)

const goTo = (result: (typeof results.value)[0]) => {
  if (result.chapterStartIndex === undefined || result.chapterIndex === undefined) return
  const nextChapterStartIndex = result.chapterIndex + 1 >= chapterTitles.length ? book.length : chapterTitles[result.chapterIndex + 1].index
  const chapter = book.slice(result.chapterStartIndex, nextChapterStartIndex).split(/\r\n|\n/g)
  let characterIndex = result.index - result.chapterStartIndex
  for (let i = 0; i < chapter.length; i++) {
    if (characterIndex > chapter[i].length) {
      characterIndex -= chapter[i].length
    } else {
      bookDetail!.lastChapter = result.chapterIndex
      bookDetail!.lastPage = {
        paragraphIndex: i,
        characterIndex
      }
      window.ipcRenderer.send('setBookList', bookList)
      close(bookDetail)
      break
    }
  }
}
</script>

<template>
  <a-modal
    v-model:open="visible"
    :footer="null"
    centered
    title="搜索跳转"
  >
    <div class="search-input">
      <a-input
        v-model:value="searchValue"
        placeholder="请输入关键字"
        @keydown.enter="onSearch"
      >
        <template #suffix>
          <magnify-icon fill-color="#666666"></magnify-icon>
        </template>
      </a-input>
    </div>
    <div class="search-result-list">
      <div
        v-for="(res, index) in results.slice((currentPage - 1) * 100, (currentPage - 1) * 100 + 100)"
        :key="(currentPage - 1) * 100 + index"
        class="search-result"
        @click="goTo(res)"
      >
        <div
          class="search-context"
          v-html="res.context"
        ></div>
      </div>
    </div>
    <div class="pager">
      <a-pagination
        v-model:current="currentPage"
        :total="results.length"
        :show-size-changer="false"
        :page-size="100"
        show-less-items
      />
      <div>共{{ results.length }}个</div>
    </div>
  </a-modal>
</template>

<style scoped>
.search-input {
  margin: 16px 0;
}

.magnify-icon {
  display: flex;
}

.search-result-list {
  height: 200px;
  overflow-y: scroll;
}

.search-result {
  padding: 0 12px;
  height: 40px;
  line-height: 40px;
  border-bottom: 1px solid #e5e5e5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;

  &:hover {
    background-color: #f2f2f2;
  }
  :deep(.highlight-text) {
    color: #eb4847;
  }
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 16px;
  width: 100%;

  :last-child {
    margin-left: 8px;
  }
}
</style>
