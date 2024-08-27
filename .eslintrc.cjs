/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  plugins: ['prettier'],
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:vue/vue3-recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    'no-console': 'error',
    'no-debugger': 'error',
    'prefer-const': ['warn', { destructuring: 'all', ignoreReadBeforeAssign: true }],

    // vue
    // 禁止使用v-html 防止xss攻击
    'vue/no-v-html': 'off',
    // 要求为每个props设置默认值（Boolean 除外）
    'vue/require-default-prop': 'off',
    // 要求组件名称始终为多单词，防止与 HTML 元素发生冲突
    'vue/multi-word-component-names': 'off',
    // 强制在 Vue 模板中的事件名称使用连字符
    'vue/v-on-event-hyphenation': 'off',
    // 强制要求组件属性的排序
    'vue/attributes-order': [
      'error',
      {
        order: [
          'GLOBAL', // 全局属性：id
          'DEFINITION', // 组件定义：:is, v-is
          'LIST_RENDERING', // 列表渲染：v-for
          'CONDITIONALS', // 条件渲染：v-if, v-else-if, v-else, v-show, v-cloak
          'RENDER_MODIFIERS', // 渲染修改：v-once, v-pre
          ['UNIQUE', 'SLOT'], // 唯一属性：ref, key, v-slot, slot
          'TWO_WAY_BINDING', // 双向绑定：v-model
          'OTHER_DIRECTIVES', // 自定义指令
          'OTHER_ATTR', // 组件自定义属性
          'EVENTS', // 事件：@click, v-on:event
          'CONTENT' // 内容：v-text, v-html
        ],
        // 是否按照A-Z的顺序排序
        alphabetical: false
      }
    ],
    // 禁止props，data，methods中没有同名的属性或方法
    'vue/no-dupe-keys': 'off',

    // prettier
    'prettier/prettier': 'error',

    // import
    'import/first': 'error',
    'import/no-duplicates': 'error',
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
        pathGroups: [
          {
            pattern: 'vue',
            group: 'external',
            position: 'before'
          }
        ],
        pathGroupsExcludedImportTypes: ['type']
      }
    ],
    'import/no-unresolved': 'off'
  },
  env: {
    browser: true,
    es2021: true,
    node: true
  }
}
