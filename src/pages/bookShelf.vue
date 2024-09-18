<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'
import { Dropdown as ADropdown, Menu as AMenu, MenuItem as AMenuItem, Modal } from 'ant-design-vue'
import { useDialog } from 'use-dialog-vue3'
import plusIcon from 'vue-material-design-icons/Plus.vue'

const bookList = ref(window.ipcRenderer.getBookList())

window.ipcRenderer.on('refreshBookList', () => {
  bookList.value = window.ipcRenderer.getBookList()
})

const addBook = () => {
  window.ipcRenderer.send('addBook')
}

const selectBook = (book: Book) => {
  window.ipcRenderer.setUserData('lastBook', book.path)
  window.ipcRenderer.send('change-page', 'book')
}

const { open } = useDialog()
const gotoByChapter = (book: Book) => {
  open(
    defineAsyncComponent(() => import('../components/chapterTitlesDialog.vue')),
    {
      book
    }
  ).then(newBook => {
    selectBook(newBook)
  })
}

const gotoBySearch = (book: Book) => {
  open(
    defineAsyncComponent(() => import('../components/bookSearchDialog.vue')),
    {
      book
    }
  ).then(newBook => {
    selectBook(newBook)
  })
}

const bookSettings = (book: Book) => {
  open(
    defineAsyncComponent(() => import('../components/bookSettingsDialog.vue')),
    {
      book
    }
  )
}

// const [modal, contextHolder] = Modal.useModal()
const deleteBook = (book: Book) => {
  Modal.confirm({
    title: '确认删除？',
    centered: true,
    okText: '确认',
    cancelText: '取消',
    onOk: () => {
      const newBookList = window.ipcRenderer.getBookList().filter(b => b.path !== book.path)
      window.ipcRenderer.send('setBookList', newBookList)
    }
  })
}
</script>

<template>
  <div class="book-shelf-page">
    <a-dropdown
      v-for="book in bookList"
      :key="book.path"
      :trigger="['contextmenu']"
    >
      <div
        class="book-item"
        :title="book.name"
        @click="selectBook(book)"
      >
        <div class="book-inner">
          <span class="book-name">{{ book.name }}</span>
          <span class="book-type">TXT</span>
        </div>
      </div>
      <template #overlay>
        <a-menu>
          <a-menu-item
            key="gotoByChapter"
            @click="gotoByChapter(book)"
          >
            章节跳转
          </a-menu-item>
          <a-menu-item
            key="gotoBySearch"
            @click="gotoBySearch(book)"
          >
            搜索跳转
          </a-menu-item>
          <a-menu-item
            key="bookSettings"
            @click="bookSettings(book)"
          >
            书籍设置
          </a-menu-item>
          <a-menu-item
            key="delete"
            @click="deleteBook(book)"
          >
            删除
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
    <div
      class="book-item add-book"
      @click="addBook"
    >
      <plus-icon
        :size="32"
        fill-color="#666666"
      ></plus-icon>
    </div>
  </div>
</template>

<style scoped>
.book-shelf-page {
  display: flex;
  flex-wrap: wrap;
  padding: 16px;
  width: calc(100% - 32px);
  height: calc(100% - 32px);
  background-color: #f4e9e7;
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
  overflow-y: auto;
}

.book-item {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  flex-grow: 0;
  margin: 8px;
  padding: 8px;
  width: 100px;
  height: 140px;
  background: #e8dcdc;
  border-radius: 4px;
  border: 1px solid #dfd4d3;
  box-shadow: 2px 4px 12px 0px rgba(0, 0, 0, 0.12);
  cursor: pointer;
}

.book-inner {
  position: relative;
  padding: 4px;
  width: calc(100% - 8px);
  height: calc(100% - 8px);
  font-size: 14px;
  color: #6d6260;
  border-radius: 4px;
  border: 1px solid #dfd4d3;
}

.book-name {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  line-clamp: 4;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

.book-type {
  position: absolute;
  bottom: 2px;
  display: block;
  width: 100%;
  text-align: center;
  font-size: 10px;
}
</style>
