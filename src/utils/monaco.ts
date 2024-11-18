import 'monaco-editor/esm/vs/editor/contrib/find/browser/findController.js'
import 'monaco-editor/esm/vs/base/browser/ui/codicons/codiconStyles.js'
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import { editor } from 'monaco-editor/esm/vs/editor/editor.api'

// 设置monaco editor使用的webworker环境
;(self as any).MonacoEnvironment = {
  getWorker: function () {
    return new editorWorker()
  }
}

class PlaceholderContentWidget {
  private static readonly ID = 'editor.widget.placeholderHint'
  private domNode: HTMLElement | null = null

  constructor(private placeholder: string, private readonly editor: editor.IStandaloneCodeEditor) {
    this.placeholder = placeholder
    this.editor = editor
    // register a listener for editor code changes
    editor.onDidChangeModelContent(() => this.onDidChangeModelContent())
    // ensure that on initial load the placeholder is shown
    this.onDidChangeModelContent()
  }

  onDidChangeModelContent() {
    if (this.editor.getValue() === '') {
      this.editor.addContentWidget(this)
    } else {
      this.editor.removeContentWidget(this)
    }
  }

  getId() {
    return PlaceholderContentWidget.ID
  }

  getDomNode() {
    if (!this.domNode) {
      this.domNode = document.createElement('div')
      this.domNode.style.width = 'max-content'
      this.domNode.innerHTML = this.placeholder.replace(/\n/g, '<br>')
      this.domNode.classList.add('monaco-placeholder-hint')
      this.editor.applyFontInfo(this.domNode)
    }

    return this.domNode
  }

  getPosition(): editor.IContentWidgetPosition {
    return {
      position: { lineNumber: 1, column: 1 },
      preference: [editor.ContentWidgetPositionPreference.EXACT]
    }
  }

  getEditor() {
    return this.editor
  }

  setPlaceholder(placeholder: string) {
    this.placeholder = placeholder
    this.editor.removeContentWidget(this)
    this.domNode = null
    if (this.editor.getValue() === '') {
      this.editor.addContentWidget(this)
    }
  }

  dispose() {
    this.editor.removeContentWidget(this)
  }
}

export { editor, PlaceholderContentWidget }
