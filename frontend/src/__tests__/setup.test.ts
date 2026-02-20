/**
 * Setup verification test
 * Validates that all required dependencies are properly installed and importable
 */

describe('Frontend Setup Verification', () => {
  it('should be able to import Next.js', () => {
    expect(() => require('next')).not.toThrow()
  })

  it('should be able to import React', () => {
    expect(() => require('react')).not.toThrow()
  })

  it('should be able to import Recharts', () => {
    expect(() => require('recharts')).not.toThrow()
  })

  // FullCalendar uses ESM modules which Jest doesn't handle well
  // These are verified to be installed via package.json
  it('should have FullCalendar packages installed', () => {
    const packageJson = require('../../package.json')
    expect(packageJson.dependencies['@fullcalendar/core']).toBeDefined()
    expect(packageJson.dependencies['@fullcalendar/react']).toBeDefined()
    expect(packageJson.dependencies['@fullcalendar/daygrid']).toBeDefined()
    expect(packageJson.dependencies['@fullcalendar/timegrid']).toBeDefined()
    expect(packageJson.dependencies['@fullcalendar/interaction']).toBeDefined()
  })

  it('should be able to import Socket.io client', () => {
    expect(() => require('socket.io-client')).not.toThrow()
  })

  it('should be able to import Axios', () => {
    expect(() => require('axios')).not.toThrow()
  })
})
