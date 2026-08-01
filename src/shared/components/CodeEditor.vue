<script setup>
import { basicSetup } from 'codemirror'
import { php } from '@codemirror/lang-php'
import { json } from '@codemirror/lang-json'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { Compartment, EditorState } from '@codemirror/state'
import { EditorView, placeholder as editorPlaceholder } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  language: { type: String, default: 'json' },
  placeholder: { type: String, default: '' },
  ariaLabel: { type: String, default: 'Редактор кода' },
  lineWrapping: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'input', 'keydown'])

const host = ref(null)
const languageConfiguration = new Compartment()
let view

const structuraHighlightStyle = HighlightStyle.define([
  { tag: [tags.string, tags.special(tags.string)], color: 'var(--syntax-string)' },
  { tag: [tags.number, tags.bool, tags.null], color: 'var(--syntax-value)' },
  { tag: [tags.propertyName, tags.labelName], color: 'var(--syntax-property)' },
  { tag: [tags.keyword, tags.controlKeyword, tags.definitionKeyword], color: 'var(--syntax-keyword)' },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: 'var(--syntax-comment)', fontStyle: 'italic' },
  { tag: [tags.variableName, tags.typeName, tags.className], color: 'var(--syntax-variable)' },
  { tag: [tags.operator, tags.punctuation, tags.bracket], color: 'var(--syntax-punctuation)' },
])

function languageExtension(language) {
  return language === 'php' ? php() : json()
}

onMounted(() => {
  view = new EditorView({
    parent: host.value,
    state: EditorState.create({
      doc: props.modelValue,
      extensions: [
        basicSetup,
        props.lineWrapping ? EditorView.lineWrapping : [],
        syntaxHighlighting(structuraHighlightStyle),
        languageConfiguration.of(languageExtension(props.language)),
        editorPlaceholder(props.placeholder),
        EditorView.contentAttributes.of({
          'aria-label': props.ariaLabel,
          autocapitalize: 'off',
          autocomplete: 'off',
          spellcheck: 'false',
        }),
        EditorView.domEventHandlers({
          keydown(event) {
            emit('keydown', event)
            return event.defaultPrevented
          },
        }),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return
          const value = update.state.doc.toString()
          emit('update:modelValue', value)
          emit('input', value)
        }),
      ],
    }),
  })
})

watch(() => props.modelValue, (value) => {
  if (!view || value === view.state.doc.toString()) return
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: value },
  })
})

watch(() => props.language, (language) => {
  if (!view) return
  view.dispatch({
    effects: languageConfiguration.reconfigure(languageExtension(language)),
  })
})

onBeforeUnmount(() => view?.destroy())

function focus() {
  view?.focus()
}

function selectRange(from, to = from) {
  if (!view) return
  const safeFrom = Math.min(Math.max(0, from), view.state.doc.length)
  const safeTo = Math.min(Math.max(safeFrom, to), view.state.doc.length)
  view.dispatch({
    selection: { anchor: safeFrom, head: safeTo },
    effects: EditorView.scrollIntoView(safeFrom, { y: 'center' }),
  })
  view.focus()
}

function selectAll() {
  selectRange(0, view?.state.doc.length ?? 0)
}

defineExpose({ focus, selectAll, selectRange })
</script>

<template>
  <div ref="host" class="code-editor"></div>
</template>

<style>
.code-editor {
  --code-bg: #101311;
  --code-gutter: #131715;
  --code-gutter-border: #252b27;
  --code-gutter-text: #59615b;
  --code-text: #d9e0db;
  --code-selection: rgba(185, 244, 137, 0.16);
  --code-active-line: rgba(255, 255, 255, 0.025);
  --code-cursor: #b9f489;
  --syntax-string: #b9f489;
  --syntax-value: #7cc8ff;
  --syntax-property: #f0c878;
  --syntax-keyword: #d6a2ff;
  --syntax-comment: #6d766f;
  --syntax-variable: #7fdac7;
  --syntax-punctuation: #a9b2ab;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: var(--code-bg);
}

.code-editor .cm-editor {
  width: 100%;
  height: 100%;
  background: var(--code-bg);
  color: var(--code-text);
  font: 13px/24px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.code-editor .cm-editor.cm-focused {
  outline: none;
}

.code-editor .cm-scroller {
  overflow: auto;
  font-family: inherit;
}

.code-editor .cm-content {
  min-height: 100%;
  padding: 22px 0 60px;
  caret-color: var(--code-cursor);
}

.code-editor .cm-line {
  padding: 0 30px 0 16px;
}

.code-editor .cm-gutters {
  border-right: 1px solid var(--code-gutter-border);
  background: var(--code-gutter);
  color: var(--code-gutter-text);
}

.code-editor .cm-gutterElement {
  padding: 0 7px 0 5px;
}

.code-editor .cm-foldGutter .cm-gutterElement {
  color: #879189;
  cursor: pointer;
}

.code-editor .cm-activeLine,
.code-editor .cm-activeLineGutter {
  background: var(--code-active-line);
}

.code-editor .cm-selectionBackground,
.code-editor .cm-content ::selection {
  background: var(--code-selection) !important;
}

.code-editor .cm-cursor,
.code-editor .cm-dropCursor {
  border-left-color: var(--code-cursor);
}

.code-editor .cm-placeholder {
  color: #59615b;
  font-style: normal;
}

html[data-theme='light'] .code-editor {
  --code-bg: #ffffff;
  --code-gutter: #f5f7f5;
  --code-gutter-border: #dce2dd;
  --code-gutter-text: #8a928c;
  --code-text: #273029;
  --code-selection: rgba(73, 145, 33, 0.18);
  --code-active-line: rgba(43, 62, 48, 0.035);
  --code-cursor: #4c8b2d;
  --syntax-string: #397f24;
  --syntax-value: #1674a3;
  --syntax-property: #9a6500;
  --syntax-keyword: #7f3ca3;
  --syntax-comment: #7c857f;
  --syntax-variable: #087a69;
  --syntax-punctuation: #5f6962;
}

html[data-theme='light'] .code-editor .cm-placeholder {
  color: #9aa29c;
}

</style>
