<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onBeforeMount, onMounted, ref } from 'vue'
import { useDialog } from 'use-dialog-vue3'
import { debounce } from '../utils/debounce'

function getConfig() {
  return {
    fontSize: window.ipcRenderer.getStoreValue('book.fontSize', 14),
    color: window.ipcRenderer.getStoreValue('book.color', '#ffffff'),
    backgroundColor: window.ipcRenderer.getStoreValue('book.backgroundColor', 'rgba(0, 0, 0, 0)'),
    pageUpKey: window.ipcRenderer.getStoreValue('book.pageUpKey', 'W'),
    pageDownKey: window.ipcRenderer.getStoreValue('book.pageDownKey', 'S')
  }
}

const initialConfig = getConfig()
const fontSize = ref(initialConfig.fontSize)
const color = ref(initialConfig.color)
const backgroundColor = ref(initialConfig.backgroundColor)
let pageUpKey = initialConfig.pageUpKey
let pageDownKey = initialConfig.pageDownKey

const lastBook = window.ipcRenderer.getUserData('lastBook', '')
const book = window.ipcRenderer.getBookContent(lastBook)
const bookList = window.ipcRenderer.getBookList()
const bookDetail = bookList.find(b => b.path === lastBook)
if (!bookDetail) {
  window.ipcRenderer.send('change-page', 'bookShelf')
}

const chapterTitleRegExp = new RegExp(bookDetail?.chapterTitleRegExp || '(?<=\\n)\\s*第[一二三四五六七八九十百千万1234567890]+章\\s*.+', 'g')

function getChapterTitles(): {
  text: string
  index: number
}[] {
  const titles = Array.from(book.matchAll(chapterTitleRegExp))
  if (titles.length) {
    return titles.map(match => {
      return {
        text: match[0],
        index: match.index
      }
    })
  } else {
    const chapterNum = Math.ceil(book.length / 5000)
    const chapterTitles: ReturnType<typeof getChapterTitles> = []
    for (let index = 0; index < chapterNum; index++) {
      chapterTitles.push({
        index: index * 5000,
        text: `第${index + 1}章`
      })
    }
    return chapterTitles
  }
}

const chapterTitles = getChapterTitles()

const currentChapter = ref(bookDetail?.lastChapter || (chapterTitles[0]?.index === 0 ? 0 : -1)) // 当前章节序号
function setUserDataChapter(value: number) {
  bookDetail!.lastChapter = value
  window.ipcRenderer.send('setBookList', bookList)
}

function handleCharacter(text: string) {
  text = text.replace(/<script>.*<\/script>/g, function (match) {
    return match.replace('<', '&lt;').replace('>', '&gt;')
  })
  const chunkSize = 1000
  let startIndex = 0
  let endIndex = Math.min(chunkSize, text.length)
  let newText = ''

  while (startIndex < text.length) {
    const chunk = text.substring(startIndex, endIndex)
    newText += chunk

    startIndex = endIndex
    endIndex = Math.min(startIndex + chunkSize, text.length)
  }

  text = newText
  return text.split(/\r\n|\n/g)
}
function handleEmptyCharacter(text: string) {
  const pattern = /(?<!<[^>]*)[^\S\r\n](?!>)/g
  return text.replace(pattern, '&emsp;')
}

const chapter = computed(() => {
  if (chapterTitles[currentChapter.value]?.index === undefined && currentChapter.value !== -1) {
    return []
  }
  if (chapterTitles[currentChapter.value + 1]?.index === undefined) {
    return handleCharacter(book.slice(chapterTitles[currentChapter.value].index))
  }

  return handleCharacter(book.slice(currentChapter.value === -1 ? 0 : chapterTitles[currentChapter.value].index, chapterTitles[currentChapter.value + 1].index))
})

const bookPageRef = ref<HTMLDivElement>()
const bookContentRef = ref<HTMLDivElement>()

const pageMark = ref<PageMark[]>([])
const currentPage = ref(0) // 当前页码
function setUserDataPageIndex(value: number) {
  bookDetail!.lastPage = JSON.parse(JSON.stringify(pageMark.value[value]))
  window.ipcRenderer.send('setBookList', bookList)
}

const showChapter = computed(() => {
  // 确保pageMark有足够的元素，避免空白页
  if (pageMark.value.length < 2) {
    // 如果章节内容存在，返回章节的第一部分
    if (chapter.value.length > 0) {
      const endIndex = Math.min(100, chapter.value[0].length) // 显示前100个字符或全部
      return [chapter.value[0].slice(0, endIndex)]
    }
    return []
  }

  // 获取安全的页面索引
  const safeCurrentPage = currentPage.value >= pageMark.value.length - 1 ? pageMark.value.length - 2 : currentPage.value

  const startMark = pageMark.value[safeCurrentPage]
  const endMark = pageMark.value[safeCurrentPage + 1]

  if (!endMark || !startMark) return []
  if (endMark.paragraphIndex === startMark.paragraphIndex) {
    return [chapter.value[startMark.paragraphIndex].slice(startMark.characterIndex, endMark.characterIndex)]
  }
  const firstParagraph = chapter.value[startMark.paragraphIndex].slice(startMark.characterIndex)
  const endParagraph = chapter.value[endMark.paragraphIndex].slice(0, endMark.characterIndex)
  if (endMark.paragraphIndex - startMark.paragraphIndex === 1) {
    return [firstParagraph, endParagraph]
  }
  return [firstParagraph, ...chapter.value.slice(startMark.paragraphIndex + 1, endMark.paragraphIndex), endParagraph]
})

async function calculateParagraphNumber() {
  if (!bookContentRef.value || !bookPageRef.value) return
  const div = document.createElement('div')
  const { width, height } = bookContentRef.value.getBoundingClientRect()
  const computedStyle = window.getComputedStyle(bookContentRef.value)
  div.style.position = 'absolute'
  div.style.padding = `0 8px`
  div.style.left = `-9999px`
  div.style.width = `${width}px`
  div.style.height = `${height}px`
  div.style.overflow = 'hidden'
  div.style.fontSize = computedStyle.fontSize
  div.style.lineHeight = computedStyle.lineHeight
  div.style.fontFamily = computedStyle.fontFamily
  div.style.fontWeight = computedStyle.fontWeight
  div.style.letterSpacing = computedStyle.letterSpacing
  div.style.wordSpacing = computedStyle.wordSpacing
  bookPageRef.value.appendChild(div)

  pageMark.value = [{ paragraphIndex: 0, characterIndex: 0 }]

  for (let i = 0; i < chapter.value.length; i++) {
    const p = document.createElement('p')
    p.style.marginTop = '12px'
    p.style.marginBottom = '0'
    p.innerHTML = handleEmptyCharacter(chapter.value[i])
    div.appendChild(p)

    while (div.scrollHeight > div.clientHeight) {
      if (div.children.length === 1) {
        // 单段落超出，使用二分查找最大可容纳字符数
        const currentParagraph = chapter.value[i]
        let left = 0
        let right = currentParagraph.length
        let bestSplit = 0

        while (left < right) {
          const mid = Math.floor((left + right + 1) / 2)
          p.innerHTML = handleEmptyCharacter(currentParagraph.slice(0, mid))

          if (div.scrollHeight <= div.clientHeight) {
            bestSplit = mid
            left = mid
          } else {
            right = mid - 1
          }
        }

        if (bestSplit > 0) {
          pageMark.value.push({ paragraphIndex: i, characterIndex: bestSplit })
          div.innerHTML = ''
          const newP = document.createElement('p')
          newP.style.marginTop = '12px'
          newP.style.marginBottom = '0'
          newP.innerHTML = handleEmptyCharacter(currentParagraph.slice(bestSplit))
          div.appendChild(newP)
        } else {
          // 前面段落太多，移除当前段落重新开始
          div.removeChild(div.lastChild!)
          const lastPIndex = i - 1
          pageMark.value.push({ paragraphIndex: lastPIndex, characterIndex: chapter.value[lastPIndex].length })
          div.innerHTML = ''
          const newP = document.createElement('p')
          newP.style.marginTop = '12px'
          newP.style.marginBottom = '0'
          newP.innerHTML = handleEmptyCharacter(chapter.value[i])
          div.appendChild(newP)
        }
      } else {
        // 多段落超出，尝试在最后一个段落中找到最佳分割点
        const lastP = div.lastChild as HTMLParagraphElement
        const lastPIndex = i
        const currentParagraph = chapter.value[lastPIndex]

        // 二分查找当前段落能放下多少字符
        let left = 0
        let right = currentParagraph.length
        let bestSplit = 0

        while (left < right) {
          const mid = Math.floor((left + right + 1) / 2)
          lastP.innerHTML = handleEmptyCharacter(currentParagraph.slice(0, mid))

          if (div.scrollHeight <= div.clientHeight) {
            bestSplit = mid
            left = mid
          } else {
            right = mid - 1
          }
        }

        if (bestSplit > 0) {
          // 能放下部分内容
          pageMark.value.push({ paragraphIndex: lastPIndex, characterIndex: bestSplit })
          div.innerHTML = ''
          const newP = document.createElement('p')
          newP.style.marginTop = '12px'
          newP.style.marginBottom = '0'
          newP.innerHTML = handleEmptyCharacter(currentParagraph.slice(bestSplit))
          div.appendChild(newP)
        } else {
          // 一个字都放不下，移除最后段落
          div.removeChild(div.lastChild!)
          const prevPIndex = i - 1
          pageMark.value.push({ paragraphIndex: prevPIndex, characterIndex: chapter.value[prevPIndex].length })
          div.innerHTML = ''
          const newP = document.createElement('p')
          newP.style.marginTop = '12px'
          newP.style.marginBottom = '0'
          newP.innerHTML = handleEmptyCharacter(chapter.value[i])
          div.appendChild(newP)
        }
      }
    }
  }

  const lastIndex = chapter.value.length - 1
  if (lastIndex >= 0 && pageMark.value.findIndex(item => item.paragraphIndex === lastIndex && item.characterIndex === chapter.value[lastIndex].length) === -1) {
    pageMark.value.push({ paragraphIndex: lastIndex, characterIndex: chapter.value[lastIndex].length })
  }

  bookPageRef.value.removeChild(div)

  if (pageMark.value.length < 2 && chapter.value.length > 0) {
    pageMark.value.push({ paragraphIndex: 0, characterIndex: chapter.value[0].length })
  }

  if (currentPage.value >= pageMark.value.length - 1) {
    currentPage.value = Math.max(0, pageMark.value.length - 2)
  }
}

function handlePageIndex() {
  const lastPage = bookDetail?.lastPage
  if (lastPage === undefined) return
  const index = pageMark.value.findIndex(item => item.paragraphIndex === lastPage.paragraphIndex && item.characterIndex === lastPage.characterIndex)
  if (index > -1) {
    currentPage.value = index
  } else {
    for (let i = 0; i < pageMark.value.length - 1; i++) {
      if (
        pageMark.value[i].paragraphIndex <= lastPage.paragraphIndex &&
        pageMark.value[i].characterIndex <= lastPage.characterIndex &&
        pageMark.value[i + 1].paragraphIndex > lastPage.characterIndex &&
        pageMark.value[i + 1].characterIndex > lastPage.characterIndex
      ) {
        currentPage.value = i
        break
      }
      if (i === pageMark.value.length - 2) {
        currentPage.value = pageMark.value.length - 1
      }
    }
  }

  // 确保currentPage.value在有效范围内
  if (pageMark.value.length < 2) {
    currentPage.value = 0
  } else if (currentPage.value >= pageMark.value.length - 1) {
    currentPage.value = pageMark.value.length - 2
  }
}

function nextChapter() {
  if (!canNextChapter.value) return
  currentChapter.value++
  setUserDataChapter(currentChapter.value)
  currentPage.value = 0
  setUserDataPageIndex(currentPage.value)
  nextTick(() => {
    calculateParagraphNumber()
  })
}

function prevChapter(target: 'start' | 'end') {
  if (!canPrevChapter.value) return
  currentChapter.value = currentChapter.value - 1
  setUserDataChapter(currentChapter.value)
  nextTick(() => {
    calculateParagraphNumber()
    currentPage.value = target === 'start' ? 0 : pageMark.value.length - 2
    setUserDataPageIndex(currentPage.value)
  })
}

const pageChange = (direction: 'up' | 'down') => {
  if (direction === 'down') {
    if (currentPage.value < pageMark.value.length - 2) {
      currentPage.value++
      setUserDataPageIndex(currentPage.value)
    } else if (currentChapter.value < chapterTitles.length - 1) {
      nextChapter()
    }
  } else {
    if (currentPage.value > 0) {
      currentPage.value--
      setUserDataPageIndex(currentPage.value)
    } else if (currentChapter.value > -1) {
      prevChapter('end')
    }
  }
}

const onWheel = (e: WheelEvent) => {
  pageChange(e.deltaY > 0 ? 'down' : 'up')
}

const onKeyDown = (e: KeyboardEvent) => {
  let key = e.key.toUpperCase()
  if (e.ctrlKey) {
    key = 'CommandOrControl+' + key
  }
  if (e.altKey) {
    key = 'Alt+' + key
  }
  if (key === pageDownKey) {
    pageChange('down')
  } else if (key === pageUpKey) {
    pageChange('up')
  }
}

const handlePage = () => {
  calculateParagraphNumber()
  handlePageIndex()
}
const debounceHandlePage = debounce(handlePage, 200)
onMounted(() => {
  handlePage()
  window.addEventListener('resize', debounceHandlePage)
  window.addEventListener('keydown', onKeyDown, true)
})
onBeforeMount(() => {
  window.removeEventListener('resize', debounceHandlePage)
  window.removeEventListener('keydown', onKeyDown)
})

window.ipcRenderer.on('update-settings', () => {
  const config = getConfig()
  fontSize.value = config.fontSize
  color.value = config.color
  backgroundColor.value = config.backgroundColor
  pageDownKey = config.pageDownKey
  pageUpKey = config.pageUpKey
  handlePage()
})

const percent = computed(() => {
  const chapterPercent = currentChapter.value / (chapterTitles.length - 1)
  const pagePercent = currentPage.value / ((chapterTitles.length - 1) * pageMark.value.length - 2)
  return ((chapterPercent + pagePercent) * 100).toFixed(2)
})

const canNextChapter = computed(() => {
  return currentChapter.value < chapterTitles.length - 1
})
const canPrevChapter = computed(() => {
  return currentChapter.value > -1
})

const { open } = useDialog()
const showChapterDialog = () => {
  open(
    defineAsyncComponent(() => import('../components/chapterTitlesDialog.vue')),
    {
      book: bookDetail
    }
  ).then(newBook => {
    if (newBook && newBook.lastChapter !== undefined) {
      currentChapter.value = newBook.lastChapter
      setUserDataChapter(currentChapter.value)
      currentPage.value = 0
      setUserDataPageIndex(currentPage.value)
      nextTick(() => {
        calculateParagraphNumber()
      })
    }
  })
}
</script>

<template>
  <div
    ref="bookPageRef"
    class="book-page"
    :style="{
      fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
      color,
      backgroundColor
    }"
  >
    <div
      ref="bookContentRef"
      class="book-content"
      @wheel="onWheel"
    >
      <p
        v-for="(p, index) in showChapter"
        :key="p + index"
        v-html="handleEmptyCharacter(p)"
      ></p>
    </div>
    <div class="book-info-bar">
      <div class="book-info-bar-left">
        <div class="book-info-bar-item book-info-bar-button chapter-title">
          <span
            v-if="chapterTitles[currentChapter]"
            :title="`当前章节：${chapterTitles[currentChapter]?.text}`"
          >
            当前章节：{{ chapterTitles[currentChapter]?.text }}
          </span>
        </div>
      </div>
      <div class="book-info-bar-right">
        <div
          class="book-info-bar-item book-info-bar-button"
          @click="showChapterDialog"
        >
          <span title="目录">目录</span>
        </div>
        <div
          class="book-info-bar-item book-info-bar-button"
          :class="{ disabled: !canPrevChapter }"
          @click="prevChapter('start')"
        >
          <span title="上一章">上一章</span>
        </div>
        <div
          class="book-info-bar-item book-info-bar-button"
          :class="{ disabled: !canNextChapter }"
          @click="nextChapter"
        >
          <span title="下一章">下一章</span>
        </div>
        <div class="book-info-bar-item">
          <span :title="`${percent}%`">{{ percent }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.book-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;

  :deep(p) {
    margin-top: 12px;
    margin-bottom: 0;
  }
}

.book-content {
  flex-grow: 1;
  padding: 0 8px;
  width: 100%;
  height: 0;
  overflow: hidden;
}

.book-info-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 8px;
  width: 100%;
  height: 24px;
  font-size: 12px;

  .book-info-bar-left {
    display: flex;
    align-items: center;
    margin-right: auto;
    flex: 1;
    min-width: 0;

    .book-info-bar-item {
      margin-right: 12px;

      &:not(:first-child) {
        padding-left: 12px;
        border-left: 1px solid #666666;
      }

      &.chapter-title {
        flex: 1;
        min-width: 0;

        span {
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
  }

  .book-info-bar-right {
    display: flex;
    align-items: center;
    flex-shrink: 0;

    .book-info-bar-item {
      margin-left: 12px;
      padding-left: 12px;
    }
  }

  .book-info-bar-item {
    position: relative;

    &:not(:first-child) {
      border-left: 1px solid #666666;
    }

    span {
      display: inline-block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    &.book-info-bar-button {
      cursor: pointer;

      &.disabled {
        cursor: not-allowed;
        span {
          opacity: 0.4;
        }
      }
    }
  }
}
</style>
