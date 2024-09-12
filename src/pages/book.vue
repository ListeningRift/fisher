<script setup lang="ts">
import { computed, nextTick, onBeforeMount, onMounted, ref } from 'vue'

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

const chapterTitles = Array.from(book.matchAll(chapterTitleRegExp))

const currentChapter = ref(bookDetail?.lastChapter || -1) // 当前章节序号
function setUserDataChapter(value: number) {
  bookDetail!.lastChapter = value
  window.ipcRenderer.send('setBookList', bookList)
}

function handleCharacter(text: string) {
  text = text.replace(/<script>.*<\/script>/g, function (match) {
    return match.replace('<', '&lt;').replace('>', '&gt;')
  })
  const pattern = /(?<!<[^>]*)[^\S\r\n](?!>)/g
  const chunkSize = 1000
  let startIndex = 0
  let endIndex = Math.min(chunkSize, text.length)
  let newText = ''

  while (startIndex < text.length) {
    const chunk = text.substring(startIndex, endIndex)
    const newChunk = chunk.replace(pattern, '&emsp;')
    newText += newChunk

    startIndex = endIndex
    endIndex = Math.min(startIndex + chunkSize, text.length)
  }

  text = newText
  return text.split(/\r\n|\n/g)
}
const chapter = computed(() => {
  if ((chapterTitles[currentChapter.value]?.index === undefined || chapterTitles[currentChapter.value + 1]?.index === undefined) && currentChapter.value !== -1)
    return []
  return handleCharacter(book.slice(currentChapter.value === -1 ? 0 : chapterTitles[currentChapter.value].index, chapterTitles[currentChapter.value + 1].index))
})

const bookPageRef = ref<HTMLDivElement>()

const pageMark = ref<number[]>([])
const currentPage = ref(0) // 当前页码
function setUserDataPageIndex(value: number) {
  bookDetail!.lastParagraph = pageMark.value[value]
  window.ipcRenderer.send('setBookList', bookList)
}

const showChapter = computed(() => {
  return chapter.value.slice(pageMark.value[currentPage.value], pageMark.value[currentPage.value + 1])
})

function calculateParagraphNumber() {
  if (!bookPageRef.value) return
  const div = document.createElement('div')
  const { width, height } = bookPageRef.value.getBoundingClientRect()
  div.style.width = `${width}px`
  div.style.height = `${height}px`
  div.style.overflow = 'hidden'
  bookPageRef.value.appendChild(div)
  pageMark.value = [0]

  for (let i = 0; i < chapter.value.length; i++) {
    const p = document.createElement('p')
    p.textContent = chapter.value[i]
    div.appendChild(p)
    if (div.scrollHeight > div.offsetHeight) {
      pageMark.value.push(i)
      div.innerHTML = ''
      div.appendChild(p)
    }
    if (i === chapter.value.length - 1 && pageMark.value.indexOf(i) === -1) {
      pageMark.value.push(i)
    }
  }
  bookPageRef.value.removeChild(div)
}

function handlePageIndex() {
  const lastParagraph = bookDetail?.lastParagraph
  if (lastParagraph === undefined) return
  const index = pageMark.value.indexOf(lastParagraph)
  if (index > -1) {
    currentPage.value = index
  } else {
    for (let i = 0; i < pageMark.value.length; i++) {
      if (pageMark.value[i] < lastParagraph && pageMark.value[i + 1] > lastParagraph) {
        currentPage.value = i
        break
      }
    }
  }
}

const pageChange = (direction: 'up' | 'down') => {
  if (direction === 'down') {
    window.ipcRenderer.log('log', currentPage.value)
    window.ipcRenderer.log('log', chapter.value.length)
    if (currentPage.value < pageMark.value.length - 2) {
      currentPage.value++
      setUserDataPageIndex(currentPage.value)
    } else if (currentChapter.value < chapterTitles.length - 1) {
      currentChapter.value++
      setUserDataChapter(currentChapter.value)
      currentPage.value = 0
      setUserDataPageIndex(currentPage.value)
      nextTick(() => {
        calculateParagraphNumber()
      })
    }
  } else {
    if (currentPage.value > 0) {
      currentPage.value--
      setUserDataPageIndex(currentPage.value)
    } else if (currentChapter.value > -1) {
      currentChapter.value = currentChapter.value - 1
      setUserDataChapter(currentChapter.value)
      nextTick(() => {
        calculateParagraphNumber()
        currentPage.value = pageMark.value.length - 2
        setUserDataPageIndex(currentPage.value)
      })
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

onMounted(() => {
  handlePage()
  window.addEventListener('resize', handlePage)
  window.addEventListener('keydown', onKeyDown, true)
})
onBeforeMount(() => {
  window.removeEventListener('resize', handlePage)
  window.removeEventListener('keydown', onKeyDown)
})

window.ipcRenderer.on('update-settings', () => {
  ;({ fontSize, color, backgroundColor, pageDownKey, pageUpKey } = getConfig())
  handlePage()
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
    @wheel="onWheel"
  >
    <p
      v-for="(p, index) in showChapter"
      :key="p + index"
      v-html="p"
    ></p>
  </div>
</template>

<style scoped>
.book-page {
  padding: 0 8px;
  width: calc(100% - 16px);
  height: 100%;
  overflow: hidden;
}
</style>
