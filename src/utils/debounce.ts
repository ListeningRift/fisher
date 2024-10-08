export function debounce<T extends (...args: any[]) => void>(func: T, wait: number, immediate?: boolean): T {
  let timeout: ReturnType<typeof setTimeout> | null = null

  const debouncedFunc = (...args: Parameters<T>): void => {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }

    const callNow = immediate && !timeout
    clearTimeout(timeout!)
    timeout = setTimeout(later, wait)

    if (callNow) func(...args)
  }

  return debouncedFunc as T
}
