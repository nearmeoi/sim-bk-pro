import '@testing-library/jest-dom/vitest'
import { expect } from 'vitest'

// Mock localStorage for jsdom
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem(key: string) {
    return this.store[key] ?? null
  },
  setItem(key: string, value: string) {
    this.store[key] = String(value)
  },
  removeItem(key: string) {
    delete this.store[key]
  },
  clear() {
    this.store = {}
  },
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

expect.extend({
  toBeAccessible(received: HTMLElement) {
    const issues: string[] = []
    const el = received
    
    // Check alt text on images
    const images = el.querySelectorAll('img') || []
    images.forEach((img, i) => {
      if (!img.hasAttribute('alt')) {
        issues.push(`Image ${i + 1} missing alt text`)
      }
    })
    
    // Check labels on inputs
    const inputs = el.querySelectorAll('input, select, textarea') || []
    inputs.forEach((input, i) => {
      const id = input.getAttribute('id')
      const ariaLabel = input.getAttribute('aria-label')
      const ariaLabelledBy = input.getAttribute('aria-labelledby')
      const label = id ? el.querySelector(`label[for="${id}"]`) : null
      
      if (!label && !ariaLabel && !ariaLabelledBy) {
        issues.push(`Input ${i + 1} missing label`)
      }
    })
    
    const pass = issues.length === 0
    
    return {
      pass,
      message: () => `Element is ${pass ? '' : 'not'} accessible. Issues: ${issues.join(', ')}`,
    }
  },
})
