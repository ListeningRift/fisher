// 导入指令定义文件
import dragSort from './dragSort'
import dragWindow from './dragWindow'
import type { App } from 'vue'

// 集成一起
const directivesList: any = {
  dragWindow,
  dragSort
}

//批量注册
const directives = {
  install: function (app: App<Element>) {
    Object.keys(directivesList).forEach(key => {
      app.directive(key, directivesList[key])
    })
  }
}

export default directives
