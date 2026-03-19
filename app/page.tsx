'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, momentLocalizer, Views } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/th'
import 'react-big-calendar/lib/css/react-big-calendar.css'

moment.locale('th')

const localizer = momentLocalizer(moment)

function CustomToolbar({ label, onNavigate, onView, view, views, date }: any) {
  const monthLabel = moment(date).format('MMMM YYYY')
  return (
    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate('PREV')}
          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
        >
          ← Prev
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
        >
          Next →
        </button>
      </div>
      <h3 className="text-lg font-semibold text-gray-800">{monthLabel}</h3>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-3 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium transition-colors"
        >
          Today
        </button>
      </div>
    </div>
  )
}

interface Schedule {
  id: number
  date: string
  endDate: string | null
  projectName: string
  teamName: string
  peopleCount: number
  members: string
  shift: string
  notes: string | null
  color: string
}

export default function Home() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Schedule | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())

  // Thai public holidays (applies to every year)
  const thaiHolidays = [
    { date: '01-01', name: 'วันขึ้นปีใหม่' },
    { date: '04-06', name: 'วันจักรี' },
    { date: '04-13', name: 'วันสงกรานต์' },
    { date: '04-14', name: 'วันสงกรานต์' },
    { date: '04-15', name: 'วันสงกรานต์' },
    { date: '05-01', name: 'วันแรงงานแห่งชาติ' },
    { date: '05-04', name: 'วันฉัตรมงคล' },
    { date: '05-11', name: 'วันพืชมงคล' },
    { date: '06-03', name: 'วันเฉลิมพระชนมพรรษา สมเด็จพระนางเจ้าสุทิดา' },
    { date: '07-28', name: 'วันเฉลิมพระชนมพรรษา พระบาทสมเด็จพระบรมชนกาธิเบศร' },
    { date: '08-12', name: 'วันเฉลิมพระชนมพรรษา สมเด็จพระนางเจ้าสิริกิติ์' },
    { date: '10-23', name: 'วันปิยมหาราช' },
    { date: '12-05', name: 'วันพระบาทสมเด็จพระบรมชนกาธิเบศร มหาภูมิพลอดุลยเดช' },
    { date: '12-10', name: 'วันรัฐธรรมนูญไทย' },
    { date: '12-31', name: 'วันสิ้นปี' },
  ]

  const isThaiHoliday = (date: Date) => {
    const dateStr = moment(date).format('MM-DD')
    return thaiHolidays.find(h => h.date === dateStr)
  }

  const [formData, setFormData] = useState({
    date: moment().format('YYYY-MM-DD'),
    endDate: '',
    projectName: '',
    peopleCount: '',
    members: '',
    notes: '',
    color: '#3B82F6'
  })

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch('/api/schedules')
      const data = await res.json()
      setSchedules(data)
    } catch (error) {
      console.error('Error fetching:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  const events = schedules.flatMap(s => {
    const startDate = new Date(s.date)
    const endDate = s.endDate ? new Date(s.endDate) : startDate
    
    // Create events for each day in the range (skip weekends)
    const result = []
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay()
      // Skip Saturday (6) and Sunday (0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        result.push({
          id: s.id,
          title: `${s.projectName} (${s.members})`,
          start: new Date(currentDate),
          end: new Date(currentDate),
          resource: s
        })
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
    return result
  })

  const eventPropGetter = (event: { resource: Schedule }) => {
    const color = event.resource?.color || '#3B82F6'
    return {
      style: {
        backgroundColor: color,
        borderColor: color,
        borderRadius: '4px',
        color: 'white',
        fontSize: '12px'
      }
    }
  }

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setFormData({
      ...formData,
      date: moment(start).format('YYYY-MM-DD')
    })
    setSelectedEvent(null)
    setIsEditing(false)
    setShowModal(true)
  }

  const handleSelectEvent = (event: { resource: Schedule }) => {
    const s = event.resource
    setSelectedEvent(s)
    setFormData({
      date: moment(s.date).format('YYYY-MM-DD'),
      endDate: s.endDate ? moment(s.endDate).format('YYYY-MM-DD') : '',
      projectName: s.projectName,
      peopleCount: s.peopleCount.toString(),
      members: s.members,
      notes: s.notes || '',
      color: s.color || '#3B82F6'
    })
    setIsEditing(true)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const url = '/api/schedules'
    const method = isEditing ? 'PUT' : 'POST'

    const payload = isEditing
      ? { id: selectedEvent?.id, ...formData, teamName: '', shift: 'เช้า' }
      : { ...formData, teamName: '', shift: 'เช้า' }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setShowModal(false)
        fetchSchedules()
        resetForm()
      }
    } catch (error) {
      console.error('Error saving:', error)
    }
  }

  const handleDelete = async () => {
    if (!selectedEvent || !confirm('ยืนยันการลบ?')) return

    try {
      const res = await fetch(`/api/schedules?id=${selectedEvent.id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setShowModal(false)
        fetchSchedules()
        resetForm()
      }
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      date: moment().format('YYYY-MM-DD'),
      endDate: '',
      projectName: '',
      peopleCount: '',
      members: '',
      notes: '',
      color: '#3B82F6'
    })
    setSelectedEvent(null)
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">กำลังโหลด...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ปฏิทินทีม Test</h1>
            <p className="text-gray-500 text-sm mt-1">จัดการตารางงานของทีม</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + เพิ่มงาน
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            views={[Views.MONTH, Views.WEEK, Views.DAY]}
            defaultView={Views.MONTH}
            date={currentDate}
            onNavigate={setCurrentDate}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventPropGetter}
            dayPropGetter={(date: Date) => {
              const day = date.getDay()
              const holiday = isThaiHoliday(date)
              
              if (holiday) {
                return {
                  style: {
                    backgroundColor: '#fee2e2'
                  }
                }
              }
              if (day === 0 || day === 6) {
                return {
                  style: {
                    backgroundColor: '#e5e7eb'
                  }
                }
              }
              return {}
            }}
            getNow={() => new Date()}
            components={{
              toolbar: CustomToolbar,
              month: {
                dateHeader: ({ label, date }: { label: string; date: Date }) => {
                  const holiday = isThaiHoliday(date)
                  return (
                    <div className="flex flex-col items-center">
                      <span>{label}</span>
                      {holiday && (
                        <span className="text-[9px] text-red-600 font-medium text-center leading-tight block w-full">
                          {holiday.name}
                        </span>
                      )}
                    </div>
                  )
                }
              }
            }}
          />
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">
                    {isEditing ? 'แก้ไขงาน' : 'เพิ่มงานใหม่'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">วันเริ่มต้น</label>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">วันสิ้นสุด</label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อโปรเจกต์</label>
                    <input
                      type="text"
                      required
                      value={formData.projectName}
                      onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                      placeholder="เช่น Project A"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนคน (สูงสุด 4 คน)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="4"
                      value={formData.peopleCount}
                      onChange={(e) => {
                        const val = Math.min(4, Math.max(1, parseInt(e.target.value) || 1))
                        setFormData({ ...formData, peopleCount: val.toString() })
                      }}
                      placeholder="1-4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">รายชื่อ</label>
                    <div className="space-y-2">
                      {Array.from({ length: parseInt(formData.peopleCount) || 1 }, (_, i) => (
                        <input
                          key={i}
                          type="text"
                          required
                          value={formData.members.split(',')[i] || ''}
                          onChange={(e) => {
                            const membersArray = formData.members ? formData.members.split(',') : []
                            membersArray[i] = e.target.value
                            setFormData({ ...formData, members: membersArray.join(',') })
                          }}
                          placeholder={`ชื่อคนที่ ${i + 1}`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="(ไม่บังคับ)"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">สีของ Event</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <span className="text-sm text-gray-500">{formData.color}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    {isEditing && (
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        ลบ
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {isEditing ? 'บันทึก' : 'เพิ่ม'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}