'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import apiClient from '@/lib/api-client'
import { LeaveRequest } from '@/types/leave'

interface CalendarEvent {
  date: Date
  type: 'APPROVED' | 'PENDING' | 'REJECTED' | 'HOLIDAY'
  title: string
  leaveType?: string
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  useEffect(() => {
    fetchLeaveData()
  }, [currentDate])

  const fetchLeaveData = async () => {
    try {
      setLoading(true)
      // Fetch user's leave history
      const response = await apiClient.get('/api/leave/history')
      const leaveRequests: LeaveRequest[] = response.data

      // Convert leave requests to calendar events
      const calendarEvents: CalendarEvent[] = []

      leaveRequests.forEach((request) => {
        const startDate = new Date(request.startDate)
        const endDate = new Date(request.endDate)
        
        // Add event for each day in the leave period
        const currentDay = new Date(startDate)
        while (currentDay <= endDate) {
          // Only add events for the current month
          if (
            currentDay.getMonth() === currentDate.getMonth() &&
            currentDay.getFullYear() === currentDate.getFullYear()
          ) {
            calendarEvents.push({
              date: new Date(currentDay),
              type: request.status as 'APPROVED' | 'PENDING' | 'REJECTED',
              title: request.leaveType,
              leaveType: request.leaveType,
            })
          }
          currentDay.setDate(currentDay.getDate() + 1)
        }
      })

      setEvents(calendarEvents)
    } catch (error) {
      console.error('Failed to fetch leave data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek }
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate)

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  const getEventsForDay = (day: number) => {
    return events.filter((event) => {
      return (
        event.date.getDate() === day &&
        event.date.getMonth() === currentDate.getMonth() &&
        event.date.getFullYear() === currentDate.getFullYear()
      )
    })
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'APPROVED':
        return 'bg-[#00ff9d]/20 text-[#00ff9d] border-[#00ff9d]/30'
      case 'PENDING':
        return 'bg-[#ffbd00]/20 text-[#ffbd00] border-[#ffbd00]/30'
      case 'REJECTED':
        return 'bg-[#ff0055]/20 text-[#ff0055] border-[#ff0055]/30'
      case 'HOLIDAY':
        return 'bg-[#7000ff]/20 text-[#7000ff] border-[#7000ff]/30'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const renderCalendarDays = () => {
    const days = []
    
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 glass-card p-2 opacity-50"></div>
      )
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isCurrentDay = isToday(day)
      const dayEvents = getEventsForDay(day)

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
          className={`h-24 glass-card p-2 cursor-pointer transition-all hover:scale-105 ${
            isCurrentDay ? 'ring-2 ring-[#00d4ff]' : ''
          }`}
        >
          <div className={`text-sm font-semibold mb-1 ${isCurrentDay ? 'text-[#00d4ff]' : 'text-black'}`}>
            {day}
          </div>
          {/* Display events for this day */}
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map((event, index) => (
              <div
                key={index}
                className={`text-xs px-2 py-1 rounded-full truncate border ${getEventColor(event.type)}`}
                title={`${event.leaveType} - ${event.type}`}
              >
                {event.leaveType}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-black/60 px-2">
                +{dayEvents.length - 2} more
              </div>
            )}
          </div>
        </div>
      )
    }

    return days
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Leave Calendar</h1>
            <p className="text-black/60">View your leave schedule and availability</p>
          </div>
        </div>

        {loading ? (
          <div className="glass-card p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7000ff] mx-auto mb-4"></div>
            <p className="text-black/60">Loading calendar...</p>
          </div>
        ) : (
          <>
            {/* Calendar */}
            <div className="glass-card p-6">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={previousMonth}
                  className="p-2 hover:bg-white/50 rounded-lg transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <h2 className="text-2xl font-bold text-black">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>

                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-white/50 rounded-lg transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Day Labels */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-black/60 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {renderCalendarDays()}
              </div>
            </div>

            {/* Legend */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-black mb-4">Legend</h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#00ff9d]"></div>
                  <span className="text-sm text-black">Approved Leave</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#ffbd00]"></div>
                  <span className="text-sm text-black">Pending Leave</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#ff0055]"></div>
                  <span className="text-sm text-black">Rejected Leave</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#7000ff]"></div>
                  <span className="text-sm text-black">Holiday</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}
