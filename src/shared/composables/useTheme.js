import { ref, watch } from 'vue'

const storageKey = 'structura-theme'

function getPreferredTheme() {
  try {
    const savedTheme = window.localStorage.getItem(storageKey)
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function useTheme() {
  const theme = ref(getPreferredTheme())

  watch(
    theme,
    (value) => {
      document.documentElement.dataset.theme = value
      document.documentElement.style.colorScheme = value
      try {
        window.localStorage.setItem(storageKey, value)
      } catch {
        // The theme still works when browser storage is unavailable.
      }
    },
    { immediate: true },
  )

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return { theme, toggleTheme }
}
