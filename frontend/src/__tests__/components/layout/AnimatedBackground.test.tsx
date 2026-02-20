import { render } from '@testing-library/react'
import AnimatedBackground from '@/components/layout/AnimatedBackground'

describe('AnimatedBackground', () => {
  it('renders without crashing', () => {
    const { container } = render(<AnimatedBackground />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders animated gradient background', () => {
    const { container } = render(<AnimatedBackground />)
    const gradientDiv = container.querySelector('.animate-gradient-shift')
    expect(gradientDiv).toBeInTheDocument()
  })

  it('renders animated orbs', () => {
    const { container } = render(<AnimatedBackground />)
    const floatOrb = container.querySelector('.animate-float')
    const floatDelayedOrb = container.querySelector('.animate-float-delayed')
    const pulseOrb = container.querySelector('.animate-pulse-slow')
    
    expect(floatOrb).toBeInTheDocument()
    expect(floatDelayedOrb).toBeInTheDocument()
    expect(pulseOrb).toBeInTheDocument()
  })
})
