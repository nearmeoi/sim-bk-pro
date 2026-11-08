import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('should render without errors', () => {
    render(<App />)
    // App renders BerandaView which has h1 "SIM-BK"
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})
