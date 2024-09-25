<script setup lang="ts">
import { computed, nextTick, onBeforeMount, onMounted, ref } from 'vue'
import { debounce } from '../utils/debounce'

let { fontSize, color, backgroundColor, pageDownKey, pageUpKey } = getConfig()

function getConfig() {
  return {
    fontSize: window.ipcRenderer.getStoreValue('book.fontSize', 14),
    color: window.ipcRenderer.getStoreValue('book.color', '#ffffff'),
    backgroundColor: window.ipcRenderer.getStoreValue('book.backgroundColor', 'rgba(0, 0, 0, 0)'),
    pageUpKey: window.ipcRenderer.getStoreValue('book.pageUpKey', 'W'),
    pageDownKey: window.ipcRenderer.getStoreValue('book.pageDownKey', 'S')
  }
}

const lastBook = window.ipcRenderer.getUserData('lastBook', '')
const book = window.ipcRenderer.getBookContent(lastBook)
const bookList = window.ipcRenderer.getBookList()
const bookDetail = bookList.find(b => b.path === lastBook)
if (!bookDetail) {
  window.ipcRenderer.send('change-page', 'bookShelf')
}

const chapterTitleRegExp = new RegExp(bookDetail?.chapterTitleRegExp || '(?<=\\n)第[一二三四五六七八九十百千万1234567890]+章\\s*.+', 'g')

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
  const startMark = pageMark.value[currentPage.value]
  const endMark = pageMark.value[currentPage.value + 1]
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
  div.style.position = 'absolute'
  div.style.margin = `0 8px`
  div.style.left = `-9999px`
  div.style.width = `${width}px`
  div.style.height = `${height}px`
  div.style.overflow = 'hidden'
  bookPageRef.value.appendChild(div)
  pageMark.value = [
    {
      paragraphIndex: 0,
      characterIndex: 0
    }
  ]

  for (let i = 0; i < chapter.value.length; i++) {
    const p = document.createElement('p')
    p.innerHTML = handleEmptyCharacter(chapter.value[i])
    div.appendChild(p)
    if (div.scrollHeight > div.clientHeight) {
      let characters = ''
      for (let j = 0; j < chapter.value[i].length; j++) {
        const currentCharacter = handleEmptyCharacter(chapter.value[i][j])
        characters = characters + currentCharacter
        p.innerHTML = characters
        if (div.scrollHeight > div.clientHeight) {
          const restParagraph = characters.slice(0, -currentCharacter.length)
          if (restParagraph !== '') {
            pageMark.value.push({
              paragraphIndex: i,
              characterIndex: j
            })
          } else {
            pageMark.value.push({
              paragraphIndex: i - 1,
              characterIndex: chapter.value[i - 1].length
            })
          }
          div.innerHTML = ''
          characters = characters.slice(-currentCharacter.length)
          p.innerHTML = characters
          div.appendChild(p)
        }
      }
    }
    if (
      i === chapter.value.length - 1 &&
      pageMark.value.findIndex(item => item.paragraphIndex === i && item.characterIndex === chapter.value[i].length) === -1
    ) {
      pageMark.value.push({
        paragraphIndex: i,
        characterIndex: chapter.value[i].length
      })
    }
  }
  bookPageRef.value.removeChild(div)
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
  ;({ fontSize, color, backgroundColor, pageDownKey, pageUpKey } = getConfig())
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
</script>

<template>
  <div
    ref="bookPageRef"
    class="book-page"
    :style="{
      fontSize,
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
      <div
        class="book-info-bar-item book-info-bar-button"
        :class="{ disabled: !canPrevChapter }"
        @click="prevChapter('start')"
      >
        <span>上一章</span>
      </div>
      <div
        class="book-info-bar-item book-info-bar-button"
        :class="{ disabled: !canNextChapter }"
        @click="nextChapter"
      >
        <span>下一章</span>
      </div>
      <div class="book-info-bar-item">{{ percent }}%</div>
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
    margin-bottom: 0;
  }
}

.book-content {
  flex-grow: 1;
  margin: 0 8px;
  width: calc(100% - 16px);
  height: 0;
  overflow: hidden;
}

.book-info-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin: 0 8px;
  width: calc(100% - 16px);
  height: 24px;
  font-size: 12px;

  .book-info-bar-item {
    position: relative;
    margin-left: 12px;
    padding-left: 12px;

    &:not(:first-child) {
      border-left: 1px solid #666666;
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
