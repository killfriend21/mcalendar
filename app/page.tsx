'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Calendar, momentLocalizer, Views, View } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/th'
import 'react-big-calendar/lib/css/react-big-calendar.css'

moment.locale('th')

const localizer = momentLocalizer(moment)

interface StockData {
  price: number
  change: number
  changePercent: number
  high: number
  low: number
  open: number
  volume: number
  time: number
  fetchedAt: number
}

interface StockSymbol {
  id: number
  symbol: string
  label: string | null
}

function StockWidget({ refreshInterval = 120, slideInterval = 60, compact = false }: { refreshInterval?: number; slideInterval?: number; compact?: boolean }) {
  const [symbols, setSymbols] = useState<StockSymbol[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [stockCache, setStockCache] = useState<Record<string, StockData>>({})
  const [errorSymbols, setErrorSymbols] = useState<Set<string>>(new Set())
  const fetchingRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/admin/stocks')
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) && d.length > 0 ? d : [{ id: 0, symbol: 'SICT.BK', label: null }]
        setSymbols(list)
      })
      .catch(() => setSymbols([{ id: 0, symbol: 'SICT.BK', label: null }]))
  }, [])

  const fetchPrice = useCallback(async (sym: string) => {
    if (fetchingRef.current.has(sym)) return
    fetchingRef.current.add(sym)
    try {
      const res = await fetch(`/api/stock?symbol=${encodeURIComponent(sym)}`)
      const d = await res.json()
      if (d.error) {
        setErrorSymbols(prev => { const s = new Set(prev); s.add(sym); return s })
      } else {
        setStockCache(prev => ({ ...prev, [sym]: d }))
        setErrorSymbols(prev => { const s = new Set(prev); s.delete(sym); return s })
      }
    } catch {
      setErrorSymbols(prev => { const s = new Set(prev); s.add(sym); return s })
    } finally {
      fetchingRef.current.delete(sym)
    }
  }, [])

  useEffect(() => {
    const sym = symbols[currentIdx]?.symbol
    if (!sym) return
    fetchPrice(sym)
    const interval = setInterval(() => fetchPrice(sym), refreshInterval * 1000)
    return () => clearInterval(interval)
  }, [currentIdx, symbols, fetchPrice])

  useEffect(() => {
    if (symbols.length <= 1) return
    const t = setInterval(() => setCurrentIdx(i => (i + 1) % symbols.length), slideInterval * 1000)
    return () => clearInterval(t)
  }, [symbols.length])

  const current = symbols[currentIdx]
  const stock = current ? stockCache[current.symbol] ?? null : null
  const isError = current ? errorSymbols.has(current.symbol) : false
  const isLoading = !stock && !isError && !!current

  const up = stock ? stock.change >= 0 : true
  const cardBg     = up ? 'linear-gradient(150deg,#F0FDF4 0%,#DCFCE7 100%)' : 'linear-gradient(150deg,#FFF5F5 0%,#FFE4E4 100%)'
  const cardBorder = up ? '#86EFAC' : '#FCA5A5'
  const accentColor = up ? '#16A34A' : '#DC2626'
  const accentLight = up ? '#DCFCE7' : '#FEE2E2'
  const labelColor  = up ? '#15803D' : '#B91C1C'
  const arrow = up ? '▲' : '▼'
  const displayName = current?.label || current?.symbol?.replace('.BK', '') || '—'
  const symbolFull  = current?.symbol || ''

  const fetchedDt = stock ? new Date((stock.fetchedAt ?? stock.time) * 1000) : null
  const updateDate = fetchedDt ? fetchedDt.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''
  const updateTime = fetchedDt ? fetchedDt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : ''

  if (compact) {
    return (
      <div
        onClick={() => symbols.length > 1 && setCurrentIdx(i => (i + 1) % symbols.length)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          borderRadius: '10px',
          border: `1px solid ${isError || isLoading ? '#E5E7EB' : cardBorder}`,
          background: isError || isLoading ? '#F9FAFB' : cardBg,
          padding: '6px 14px',
          cursor: symbols.length > 1 ? 'pointer' : 'default',
        }}
      >
        {isError ? (
          <span style={{ fontSize: '12px', color: '#9CA3AF' }}>โหลดราคาไม่ได้</span>
        ) : isLoading ? (
          <span style={{ fontSize: '12px', color: '#9CA3AF' }}>กำลังโหลด...</span>
        ) : (
          <>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>{displayName}</span>
            <span style={{ fontSize: '16px', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>
              {stock?.price?.toFixed(2) ?? '—'}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: accentColor }}>
              {arrow} {stock ? (stock.change >= 0 ? '+' : '') + stock.change.toFixed(2) + ' (' + (stock.change >= 0 ? '+' : '') + stock.changePercent.toFixed(2) + '%)' : '—'}
            </span>
          </>
        )}
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{
        flex: 1, minHeight: 0,
        borderRadius: '14px',
        border: `1px solid ${isError || isLoading ? '#E5E7EB' : cardBorder}`,
        background: isError || isLoading ? 'linear-gradient(150deg,#F9FAFB,#F3F4F6)' : cardBg,
        boxShadow: '0 2px 12px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.8)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {isError ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <p style={{ fontSize: '11px', color: '#9CA3AF', textAlign: 'center' }}>โหลดราคาไม่ได้</p>
          </div>
        ) : isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, justifyContent: 'center', padding: '16px' }}>
            <div style={{ height: '18px', background: '#E5E7EB', borderRadius: '4px', width: '50%' }} />
            <div style={{ height: '26px', background: '#E5E7EB', borderRadius: '4px', width: '70%' }} />
            <div style={{ height: '12px', background: '#E5E7EB', borderRadius: '4px', width: '90%' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '12px 14px 10px' }}>

            {/* Header: symbol name + time */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                <span style={{ fontSize: '2.8vh', fontWeight: 900, color: '#111827', letterSpacing: '-0.01em', lineHeight: 1 }}>
                  {displayName}
                </span>
                {symbolFull && symbolFull.toUpperCase() !== displayName.toUpperCase() && (
                  <span style={{ fontSize: '1.1vh', color: accentColor, fontWeight: 600, letterSpacing: '0.04em', opacity: 0.7 }}>
                    {symbolFull}
                  </span>
                )}
              </div>
              {fetchedDt && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px', paddingTop: '2px' }}>
                  <span style={{ fontSize: '1.1vh', fontWeight: 700, color: labelColor, letterSpacing: '0.04em', opacity: 0.6 }}>
                    {updateTime}
                  </span>
                  <span style={{ fontSize: '1vh', fontWeight: 600, color: labelColor, letterSpacing: '0.04em', opacity: 0.45 }}>
                    {updateDate}
                  </span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: cardBorder, opacity: 0.5, marginBottom: '8px' }} />

            {/* Price | change */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '4vh', fontWeight: 900, color: '#111827', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {stock?.price?.toFixed(2) ?? '—'}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                <span style={{ fontSize: '1.9vh', fontWeight: 800, color: accentColor, lineHeight: 1 }}>
                  {arrow} {stock ? (stock.change >= 0 ? '+' : '') + stock.change.toFixed(2) : '—'}
                </span>
                <span style={{
                  fontSize: '1.4vh', fontWeight: 700, color: accentColor, lineHeight: 1,
                  background: accentLight, borderRadius: '5px', padding: '2px 6px',
                }}>
                  {stock ? (stock.change >= 0 ? '+' : '') + stock.changePercent.toFixed(2) + '%' : '—'}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: cardBorder, opacity: 0.5, margin: '8px 0' }} />

            {/* Stats row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {([
                ['Open', stock?.open?.toFixed(2)],
                ['High', stock?.high?.toFixed(2)],
                ['Low', stock?.low?.toFixed(2)],
                ['Volume', stock?.volume ? (stock.volume >= 1000000 ? (stock.volume / 1000000).toFixed(1) + 'M' : (stock.volume / 1000).toFixed(0) + 'K') : '—'],
              ] as [string, string | undefined][]).map(([lbl, val]) => (
                <div key={lbl} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <span style={{ fontSize: '1vh', fontWeight: 700, color: labelColor, letterSpacing: '0.06em', opacity: 0.6 }}>{lbl}</span>
                  <span style={{ fontSize: '1.5vh', fontWeight: 800, color: '#1F2937' }}>{val ?? '—'}</span>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>

      {symbols.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', flexShrink: 0 }}>
          {symbols.map((_, i) => (
            <button key={i} type="button" onClick={() => setCurrentIdx(i)} style={{
              width: '7px', height: '7px', borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer',
              background: i === currentIdx ? '#3B82F6' : '#D1D5DB',
              transition: 'background 0.2s',
            }} />
          ))}
        </div>
      )}
    </div>
  )
}

function CustomToolbar({ onNavigate, date }: any) {
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

function DateCellWrapper({ children, value, leaves }: { children: React.ReactNode; value: Date; leaves: Leave[] }) {
  const dayStr = moment(value).format('YYYY-MM-DD')
  const dayLeaves = leaves.filter(l => dayStr >= moment(l.startDate).format('YYYY-MM-DD') && dayStr <= moment(l.endDate).format('YYYY-MM-DD'))
  const child = children as React.ReactElement<{ style?: React.CSSProperties; className?: string }>
  const styledChild = React.cloneElement(child, {
    style: { ...child.props.style, height: '100%', width: '100%' },
  })
  return (
    <div
      className={child.props.className}
      style={{
        position: 'relative',
        height: '100%',
        flex: '1 1 0%',
        width: '100%',
      }}
    >
      {styledChild}
      {dayLeaves.length > 0 && (
        <div style={{ position: 'absolute', bottom: 2, left: 2, right: 2, display: 'flex', zIndex: 1 }}>
          <span
            title={dayLeaves.map(l => l.name).join(', ')}
            style={{ fontSize: '9px', background: '#FDE68A', color: '#92400E', borderRadius: '4px', padding: '0 4px', lineHeight: '14px', fontWeight: 600, pointerEvents: 'auto', cursor: 'default' }}
          >
            🏖{dayLeaves.length > 1 ? ` ${dayLeaves.length}` : ''}
          </span>
        </div>
      )}
    </div>
  )
}

function WeekNumberGutter({ currentDate }: { currentDate: Date }) {
  const gridStart = moment(currentDate).startOf('month').startOf('week')
  const gridEnd = moment(currentDate).endOf('month').endOf('week')
  const weekCount = gridEnd.diff(gridStart, 'weeks') + 1
  const weekNumbers = Array.from({ length: weekCount }, (_, i) => moment(gridStart).add(i, 'weeks').isoWeek())

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '32px', flexShrink: 0 }}>
      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 3px', textAlign: 'center', fontWeight: 'bold', fontSize: '90%', minHeight: 0, borderBottom: '1px solid #DDD' }}>
        Wk
      </div>
      {weekNumbers.map((wk, i) => (
        <div
          key={i}
          style={{
            flex: '1 0 0%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 600,
            color: '#2563EB',
            borderBottom: i < weekNumbers.length - 1 ? '1px solid #DDD' : 'none',
            borderRight: '1px solid #DDD',
          }}
        >
          {wk}
        </div>
      ))}
    </div>
  )
}

function getQuarterStart(date: Date) {
  const q = Math.floor(date.getMonth() / 3)
  return moment(date).month(q * 3).startOf('month')
}

function QuarterToolbar({ currentDate, onPrev, onNext, onToday }: { currentDate: Date; onPrev: () => void; onNext: () => void; onToday: () => void }) {
  const start = getQuarterStart(currentDate)
  const end = moment(start).add(2, 'months')
  const q = Math.floor(currentDate.getMonth() / 3) + 1
  const label = `ไตรมาส ${q}/${start.format('YYYY')} (${start.format('MMM')} – ${end.format('MMM YYYY')})`
  return (
    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <button onClick={onPrev} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors">← Prev</button>
        <button onClick={onNext} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors">Next →</button>
      </div>
      <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
      <button onClick={onToday} className="px-3 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium transition-colors">Today</button>
    </div>
  )
}

function MonthMiniGrid({ monthStart, getDaySchedules, getDayLeaves, isCompanyHoliday, projects, projectTasks, onSelectDate }: {
  monthStart: moment.Moment
  getDaySchedules: (date: Date) => Schedule[]
  getDayLeaves: (date: Date) => Leave[]
  isCompanyHoliday: (date: Date) => { date: string; name: string; color: string } | undefined
  projects: { id: number; name: string; color: string }[]
  projectTasks: ProjectTask[]
  onSelectDate: (date: Date) => void
}) {
  const startOfGrid = moment(monthStart).startOf('week')
  const endOfGrid = moment(monthStart).endOf('month').endOf('week')
  const days: moment.Moment[] = []
  const cur = startOfGrid.clone()
  while (cur.isSameOrBefore(endOfGrid)) {
    days.push(cur.clone())
    cur.add(1, 'day')
  }

  const weeks: moment.Moment[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 border-b border-gray-200 text-center">
        {monthStart.format('MMMM YYYY')}
      </div>
      <div className="grid text-[10px] text-gray-400 border-b border-gray-100" style={{ gridTemplateColumns: '28px repeat(7, 1fr)' }}>
        <div className="text-center py-1">Wk</div>
        {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => (
          <div key={d} className="text-center py-1">{d}</div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid" style={{ gridTemplateColumns: '28px repeat(7, 1fr)' }}>
          <div className="flex items-center justify-center text-[11px] font-semibold text-blue-600 border-b border-r border-gray-100 bg-gray-50">
            {week[0].isoWeek()}
          </div>
          {week.map((day, i) => {
            const inMonth = day.month() === monthStart.month()
            const dateObj = day.toDate()
            const daySchedules = getDaySchedules(dateObj)
            const dayLeaves = getDayLeaves(dateObj)
            const holiday = isCompanyHoliday(dateObj)
            const dow = day.day()
            const isWeekend = dow === 0 || dow === 6
            const isToday = day.isSame(moment(), 'day')
            let bg = '#FFFFFF'
            if (holiday) bg = '#FEE2E2'
            else if (isWeekend) bg = '#D1D5DB'
            if (!inMonth) bg = '#E5E7EB'
            return (
              <div
                key={i}
                onClick={() => onSelectDate(dateObj)}
                className="border-b border-r border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors overflow-hidden min-w-0 flex flex-col"
                style={{
                  height: '150px',
                  backgroundColor: bg,
                  padding: '4px',
                  ...(isToday && { boxShadow: 'inset 0 0 0 2px #F97316' }),
                }}
              >
                <div className="flex items-center justify-between px-1">
                  <span className={`text-xs ${isToday ? 'font-bold text-blue-600' : !inMonth ? 'text-gray-300' : 'text-gray-500'}`}>{day.format('D')}</span>
                </div>
                <div className="flex flex-col gap-0.5 mt-0.5 flex-1 overflow-hidden">
                  {inMonth && daySchedules.slice(0, 4).map(s => {
                    const color = projects.find(p => p.name === s.projectName)?.color || s.color || '#3B82F6'
                    const members = s.members
                      ? s.members.split(',').map(m => m.trim()).filter(Boolean).join('\n  ')
                      : '-'
                    const linkedTask = projectTasks.find(t => t.scheduleId === s.id)
                    const status = linkedTask ? (linkedTask.done ? '✓ เสร็จแล้ว' : '⏳ กำลังทำ') : '-'
                    const tooltip = `Project: ${s.projectName || '-'}\nสถานะ: ${status}\nเพื่องาน: ${s.notes || '-'}\nไป:\n  ${members}`
                    return (
                      <div
                        key={s.id}
                        title={tooltip}
                        className="text-[10px] px-1 rounded truncate text-white leading-tight"
                        style={{ backgroundColor: color }}
                      >
                        {s.projectName}
                      </div>
                    )
                  })}
                  {inMonth && daySchedules.length > 4 && (
                    <div className="text-[10px] text-gray-400 px-1">+{daySchedules.length - 4}</div>
                  )}
                </div>
                {inMonth && dayLeaves.length > 0 && (
                  <div className="flex items-center px-1 mt-0.5 flex-shrink-0">
                    <span title={dayLeaves.map(l => l.name).join(', ')} style={{ fontSize: '11px', lineHeight: '12px', cursor: 'default' }}>
                      🏖{dayLeaves.length > 1 ? ` ${dayLeaves.length}` : ''}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function QuarterView({ currentDate, schedules, projects, leaves, projectTasks, isCompanyHoliday, onSelectDate, showLeaves }: {
  currentDate: Date
  schedules: Schedule[]
  projects: { id: number; name: string; color: string }[]
  leaves: Leave[]
  projectTasks: ProjectTask[]
  isCompanyHoliday: (date: Date) => { date: string; name: string; color: string } | undefined
  onSelectDate: (date: Date) => void
  showLeaves: boolean
}) {
  const quarterStart = getQuarterStart(currentDate)
  const months = [0, 1, 2].map(i => moment(quarterStart).add(i, 'months'))

  const getDaySchedules = (date: Date) => {
    const dayStr = moment(date).format('YYYY-MM-DD')
    return schedules.filter(s => {
      const start = moment(s.date).format('YYYY-MM-DD')
      const end = s.endDate ? moment(s.endDate).format('YYYY-MM-DD') : start
      return dayStr >= start && dayStr <= end
    })
  }

  const getDayLeaves = (date: Date) => {
    if (!showLeaves) return []
    const dayStr = moment(date).format('YYYY-MM-DD')
    return leaves.filter(l => dayStr >= moment(l.startDate).format('YYYY-MM-DD') && dayStr <= moment(l.endDate).format('YYYY-MM-DD'))
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {months.map(monthStart => (
        <MonthMiniGrid
          key={monthStart.format('YYYY-MM')}
          monthStart={monthStart}
          getDaySchedules={getDaySchedules}
          getDayLeaves={getDayLeaves}
          isCompanyHoliday={isCompanyHoliday}
          projects={projects}
          projectTasks={projectTasks}
          onSelectDate={onSelectDate}
        />
      ))}
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

interface Leave {
  id: number
  name: string
  startDate: string
  endDate: string
}

interface ProjectTask {
  id: number
  projectName: string
  title: string
  month: string
  dueDate: string | null
  done: boolean
  order: number
  parentId: number | null
  members: string | null
  scheduleId: number | null
}

export default function Home() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [stockEnabled, setStockEnabled] = useState(false)
  const [stockRefreshInterval, setStockRefreshInterval] = useState(120)
  const [stockSlideInterval, setStockSlideInterval] = useState(60)
  const [showModal, setShowModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Schedule | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarMode, setCalendarMode] = useState<'month' | 'quarter'>('month')
  const [calendarView, setCalendarView] = useState<View>(Views.MONTH)
  const [showLeavesInCalendar, setShowLeavesInCalendar] = useState(true)

  // Leave state
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [editingLeave, setEditingLeave] = useState<Leave | null>(null)
  const [leaveForm, setLeaveForm] = useState({ name: '', startDate: '', endDate: '' })
  const [teamMembers, setTeamMembers] = useState<{ id: number; name: string }[]>([])

  useEffect(() => {
    fetch('/api/admin/members')
      .then(r => r.json())
      .then(d => setTeamMembers(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(d => {
        setStockEnabled(d.stockEnabled === 'true')
        setStockRefreshInterval(Number(d.stockRefreshInterval) || 120)
        setStockSlideInterval(Number(d.stockSlideInterval) || 60)
        setShowLeavesInCalendar(d.showLeavesInCalendar !== 'false')
      })
      .catch(() => {})
  }, [])

  // Project tasks state
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([])
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null)
  const [taskForm, setTaskForm] = useState<{ projectName: string; title: string; month: string; dueDate: string; parentId: number | null }>({ projectName: '', title: '', month: '', dueDate: '', parentId: null })
  const [projects, setProjects] = useState<{ id: number; name: string; color: string }[]>([])
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set())
  const [collapsedTasks, setCollapsedTasks] = useState<Set<number>>(new Set())
  const [viewingTask, setViewingTask] = useState<ProjectTask | null>(null)

  const currentMonth = moment(currentDate).format('YYYY-MM')

  const visibleRange = calendarMode === 'quarter'
    ? { start: getQuarterStart(currentDate), end: moment(getQuarterStart(currentDate)).add(3, 'months') }
    : { start: moment(currentDate).startOf('month'), end: moment(currentDate).add(1, 'month').startOf('month') }
  const visibleLeaves = leaves.filter(l => moment(l.startDate).isBefore(visibleRange.end) && moment(l.endDate).isSameOrAfter(visibleRange.start))

  const fetchProjectTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/project-tasks')
      const data = await res.json()
      setProjectTasks(Array.isArray(data) ? data : [])
    } catch {}
  }, [])

  useEffect(() => { fetchProjectTasks() }, [fetchProjectTasks])

  useEffect(() => {
    fetch('/api/admin/projects')
      .then(r => r.json())
      .then(d => setProjects(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  const openAddTask = () => {
    setEditingTask(null)
    setTaskForm({ projectName: projects[0]?.name || '', title: '', month: currentMonth, dueDate: '', parentId: null })
    setShowTaskModal(true)
  }

  const openAddSubTask = (parent: ProjectTask) => {
    setEditingTask(null)
    setTaskForm({ projectName: parent.projectName, title: '', month: parent.month, dueDate: '', parentId: parent.id })
    setShowTaskModal(true)
  }

  const openEditTask = (t: ProjectTask) => {
    setEditingTask(t)
    setTaskForm({ projectName: t.projectName, title: t.title, month: t.month, dueDate: t.dueDate ? moment(t.dueDate).format('YYYY-MM-DD') : '', parentId: t.parentId })
    setShowTaskModal(true)
  }

  const submitTask = async (e: React.FormEvent) => {
    e.preventDefault()
    const dueDate = taskForm.dueDate || moment(taskForm.month).endOf('month').format('YYYY-MM-DD')
    const method = editingTask ? 'PUT' : 'POST'
    const body = editingTask
      ? { id: editingTask.id, ...taskForm, dueDate }
      : { ...taskForm, dueDate }
    await fetch('/api/project-tasks', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setShowTaskModal(false)
    fetchProjectTasks()
  }

  const moveTask = async (t: ProjectTask, dir: 'up' | 'down') => {
    const group = projectTasks.filter(x => x.projectName === t.projectName && x.parentId === t.parentId).sort((a, b) => a.order - b.order)
    const idx = group.findIndex(x => x.id === t.id)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= group.length) return
    const swapWith = group[swapIdx]
    await Promise.all([
      fetch('/api/project-tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: t.id, order: swapWith.order }) }),
      fetch('/api/project-tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: swapWith.id, order: t.order }) }),
    ])
    fetchProjectTasks()
  }

  const toggleTask = async (t: ProjectTask) => {
    await fetch('/api/project-tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: t.id, done: !t.done }),
    })
    fetchProjectTasks()
  }

  const deleteTask = async (id: number) => {
    if (!confirm('ยืนยันการลบ?')) return
    const task = projectTasks.find(t => t.id === id)
    await fetch(`/api/project-tasks?id=${id}`, { method: 'DELETE' })
    if (task?.scheduleId) {
      await fetch(`/api/schedules?id=${task.scheduleId}`, { method: 'DELETE' })
      fetchSchedules()
    }
    fetchProjectTasks()
  }

  const fetchLeaves = useCallback(async () => {
    try {
      const res = await fetch('/api/leaves')
      const data = await res.json()
      setLeaves(Array.isArray(data) ? data : [])
    } catch {}
  }, [])

  useEffect(() => { fetchLeaves() }, [fetchLeaves])

  const openAddLeave = () => {
    setEditingLeave(null)
    setLeaveForm({ name: '', startDate: moment().format('YYYY-MM-DD'), endDate: moment().format('YYYY-MM-DD') })
    setShowLeaveModal(true)
  }

  const openEditLeave = (leave: Leave) => {
    setEditingLeave(leave)
    setLeaveForm({
      name: leave.name,
      startDate: moment(leave.startDate).format('YYYY-MM-DD'),
      endDate: moment(leave.endDate).format('YYYY-MM-DD'),
    })
    setShowLeaveModal(true)
  }

  const submitLeave = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingLeave ? 'PUT' : 'POST'
    const body = editingLeave ? { id: editingLeave.id, ...leaveForm } : leaveForm
    await fetch('/api/leaves', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setShowLeaveModal(false)
    fetchLeaves()
  }

  const deleteLeave = async (id: number) => {
    if (!confirm('ยืนยันการลบ?')) return
    await fetch(`/api/leaves?id=${id}`, { method: 'DELETE' })
    fetchLeaves()
  }

  // Company holidays from DB
  const [companyHolidays, setCompanyHolidays] = useState<{ date: string; name: string; color: string }[]>([])

  useEffect(() => {
    fetch('/api/admin/holidays')
      .then(r => r.json())
      .then(d => setCompanyHolidays(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  const isCompanyHoliday = useCallback((date: Date) => {
    const iso = moment(date).format('YYYY-MM-DD')
    return companyHolidays.find(h => h.date.startsWith(iso))
  }, [companyHolidays])

  const HolidayDateHeader = useCallback(({ date, label }: { date: Date; label: string }) => {
    const holiday = isCompanyHoliday(date)
    return (
      <div style={{ textAlign: 'right', padding: '0 4px', lineHeight: 1, position: 'relative' }}>
        <span style={{ fontSize: '12px' }}>{label}</span>
        {holiday && (
          <div title={holiday.name} style={{ fontSize: '11px', color: '#DC2626', fontWeight: 700, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {holiday.name}
          </div>
        )}
      </div>
    )
  }, [isCompanyHoliday])

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
      setSchedules(Array.isArray(data) ? data : [])
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
          title: s.notes ? `${s.projectName} · ${s.notes}` : s.projectName,
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
    const projectColor = projects.find(p => p.name === event.resource?.projectName)?.color
    const color = projectColor || event.resource?.color || '#3B82F6'
    const linkedTask = projectTasks.find(t => t.scheduleId === event.resource?.id)
    const isDone = linkedTask?.done === true
    return {
      style: {
        backgroundColor: isDone ? '#D1D5DB' : color,
        borderColor: isDone ? '#9CA3AF' : color,
        borderRadius: '4px',
        color: isDone ? '#6B7280' : 'white',
        fontSize: '12px',
        opacity: isDone ? 0.75 : 1,
        textDecoration: isDone ? 'line-through' : 'none',
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
        if (!isEditing) {
          const savedSchedule = await res.json().catch(() => null)
          const newScheduleId = savedSchedule?.id ?? null
          const taskTitle = formData.notes?.trim() || formData.members
          await fetch('/api/project-tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectName: formData.projectName,
              title: taskTitle,
              month: moment(formData.date).format('YYYY-MM'),
              dueDate: formData.endDate || formData.date,
              parentId: null,
              members: formData.members || null,
              scheduleId: newScheduleId,
            }),
          })
          fetchProjectTasks()
        }
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
        const linkedTask = projectTasks.find(t => t.scheduleId === selectedEvent.id)
        if (linkedTask) {
          await fetch(`/api/project-tasks?id=${linkedTask.id}`, { method: 'DELETE' })
          fetchProjectTasks()
        }
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
    <div className="min-h-screen p-6 bg-gray-50 flex">
      {/* Center column — calendar, full width */}
      <div className="w-[78%] flex flex-col" style={{ height: 'calc(100vh - 3rem)' }}>
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">ปฏิทินทีม Test</h1>
              <p className="text-gray-500 text-sm mt-1">จัดการตารางงานของทีม</p>
            </div>
            {stockEnabled && (
              <StockWidget compact refreshInterval={stockRefreshInterval} slideInterval={stockSlideInterval} />
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              ⚙ Admin
            </Link>
            <button
              onClick={() => setCalendarMode(m => m === 'quarter' ? 'month' : 'quarter')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${calendarMode === 'quarter' ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            >
              ไตรมาส
            </button>
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
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex-1 flex flex-col" style={{ minHeight: 0 }}>
          {calendarMode === 'quarter' ? (
            <>
              <QuarterToolbar
                currentDate={currentDate}
                onPrev={() => setCurrentDate(moment(currentDate).subtract(3, 'months').toDate())}
                onNext={() => setCurrentDate(moment(currentDate).add(3, 'months').toDate())}
                onToday={() => setCurrentDate(new Date())}
              />
              <div className="flex-1 overflow-y-auto">
                <QuarterView
                  currentDate={currentDate}
                  schedules={schedules}
                  projects={projects}
                  leaves={leaves}
                  projectTasks={projectTasks}
                  isCompanyHoliday={isCompanyHoliday}
                  showLeaves={showLeavesInCalendar}
                  onSelectDate={(date) => {
                    setCurrentDate(date)
                    setCalendarMode('month')
                  }}
                />
              </div>
            </>
          ) : (
            <>
              <CustomToolbar
                label=""
                view={calendarView}
                views={[Views.MONTH, Views.WEEK, Views.DAY]}
                date={currentDate}
                onView={setCalendarView}
                onNavigate={(action: string) => {
                  if (action === 'TODAY') { setCurrentDate(new Date()); return }
                  const unit = calendarView === Views.MONTH ? 'month' : calendarView === Views.WEEK ? 'week' : 'day'
                  setCurrentDate(moment(currentDate).add(action === 'PREV' ? -1 : 1, unit).toDate())
                }}
              />
              <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
              {calendarView === Views.MONTH && <WeekNumberGutter currentDate={currentDate} />}
              <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%', flex: 1, minWidth: 0 }}
              views={[Views.MONTH, Views.WEEK, Views.DAY]}
              view={calendarView}
              onView={setCalendarView}
              date={currentDate}
              onNavigate={setCurrentDate}
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventPropGetter}
              tooltipAccessor={(event: { resource: Schedule }) => {
                const members = event.resource?.members
                  ? event.resource.members.split(',').map((m: string) => m.trim()).filter(Boolean).join('\n  ')
                  : '-'
                const linkedTask = projectTasks.find(t => t.scheduleId === event.resource?.id)
                const status = linkedTask ? (linkedTask.done ? '✓ เสร็จแล้ว' : '⏳ กำลังทำ') : '-'
                return `Project: ${event.resource?.projectName || '-'}\nสถานะ: ${status}\nเพื่องาน: ${event.resource?.notes || '-'}\nไป:\n  ${members}`
              }}
              dayPropGetter={(date: Date) => {
                const day = date.getDay()
                const companyHoliday = isCompanyHoliday(date)
                const style: React.CSSProperties = {}
                if (companyHoliday) {
                  style.backgroundColor = '#FEE2E2'
                } else if (day === 0 || day === 6) {
                  style.backgroundColor = '#D1D5DB'
                }
                if (moment(date).isSame(new Date(), 'day')) {
                  style.boxShadow = 'inset 0 0 0 2px #F97316'
                  style.zIndex = 2
                }
                return { style }
              }}
              getNow={() => new Date()}
              components={{
                toolbar: () => null,
                month: { dateHeader: HolidayDateHeader },
                ...(showLeavesInCalendar && {
                  dateCellWrapper: (props: { children: React.ReactNode; value: Date }) => (
                    <DateCellWrapper {...props} leaves={leaves} />
                  ),
                }),
              }}
              />
              </div>
            </>
          )}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                    {projects.length > 0 ? (
                      <select
                        required
                        value={formData.projectName}
                        onChange={(e) => {
                          const proj = projects.find(p => p.name === e.target.value)
                          setFormData({ ...formData, projectName: e.target.value, color: proj?.color || formData.color })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                      >
                        <option value="">-- เลือกโปรเจกต์ --</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        value={formData.projectName}
                        onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                        placeholder="เช่น Project A"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">เพื่องาน</label>
                    <textarea
                      required
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="ระบุงานที่ต้องทำ"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
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
                      {Array.from({ length: parseInt(formData.peopleCount) || 1 }, (_, i) => {
                        const membersArray = formData.members ? formData.members.split(',') : []
                        return teamMembers.length > 0 ? (
                          <select
                            key={i}
                            required
                            value={membersArray[i] || ''}
                            onChange={(e) => {
                              const arr = formData.members ? formData.members.split(',') : []
                              arr[i] = e.target.value
                              setFormData({ ...formData, members: arr.join(',') })
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                          >
                            <option value="">-- เลือกชื่อ --</option>
                            {teamMembers.map(m => (
                              <option key={m.id} value={m.name}>{m.name}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            key={i}
                            type="text"
                            required
                            value={membersArray[i] || ''}
                            onChange={(e) => {
                              const arr = formData.members ? formData.members.split(',') : []
                              arr[i] = e.target.value
                              setFormData({ ...formData, members: arr.join(',') })
                            }}
                            placeholder={`ชื่อคนที่ ${i + 1}`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                        )
                      })}
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

      {/* Right column 22% — project tasks 80% / leave table 20% */}
      <div className="w-[22%] pl-4 pt-1 flex flex-col" style={{ height: 'calc(100vh - 3rem)', gap: '12px' }}>
        <div className="flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden" style={{ flex: '4 1 0', minHeight: 0 }}>
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-700">Project Tasks</h2>
              <p className="text-xs text-gray-400 mt-0.5">{moment(currentDate).format('MMMM YYYY')}</p>
            </div>
            <div className="flex gap-1 items-center">
              <button
                onClick={() => setCollapsedProjects(new Set([...new Set(projectTasks.map(t => t.projectName))]))}
                className="text-xs text-gray-400 hover:text-gray-600 px-1 py-1"
                title="Fold all"
              >▶▶</button>
              <button
                onClick={() => setCollapsedProjects(new Set())}
                className="text-xs text-gray-400 hover:text-gray-600 px-1 py-1"
                title="Unfold all"
              >▼▼</button>
              <button onClick={openAddTask} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-lg hover:bg-indigo-700 transition-colors">+ เพิ่ม</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {projectTasks.filter(t => t.parentId === null && t.month === currentMonth).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <p className="text-sm text-gray-400">ยังไม่มีงาน</p>
                <button onClick={openAddTask} className="mt-3 text-xs text-indigo-600 hover:underline">+ เพิ่มงานแรก</button>
              </div>
            ) : (
              (() => {
                const renderTaskNode = (t: ProjectTask, siblings: ProjectTask[], idx: number, depth: number): React.ReactNode => {
                  const children = projectTasks.filter(c => c.parentId === t.id).sort((a, b) => a.order - b.order)
                  const isCollapsed = collapsedTasks.has(t.id)
                  const toggleTaskCollapse = () => setCollapsedTasks(prev => {
                    const next = new Set(prev)
                    isCollapsed ? next.delete(t.id) : next.add(t.id)
                    return next
                  })
                  return (
                    <div key={t.id}>
                      <div
                        className="flex items-center gap-1 py-1.5 group border-b border-gray-50 last:border-b-0"
                        style={{ paddingLeft: `${depth * 12}px` }}
                      >
                        <button
                          type="button"
                          onClick={toggleTaskCollapse}
                          className={`text-gray-300 hover:text-gray-500 text-[8px] w-3 flex-shrink-0 leading-none ${children.length === 0 ? 'invisible' : ''}`}
                        >{isCollapsed ? '▶' : '▼'}</button>
                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={() => moveTask(t, 'up')} disabled={idx === 0} className="text-gray-300 hover:text-gray-500 disabled:opacity-20 leading-none text-[9px]">▲</button>
                          <button onClick={() => moveTask(t, 'down')} disabled={idx === siblings.length - 1} className="text-gray-300 hover:text-gray-500 disabled:opacity-20 leading-none text-[9px]">▼</button>
                        </div>
                        <input
                          type="checkbox"
                          checked={t.done}
                          onChange={() => toggleTask(t)}
                          className="flex-shrink-0 w-4 h-4 cursor-pointer accent-indigo-600"
                        />
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setViewingTask(t)}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`text-sm truncate hover:text-indigo-600 ${t.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{t.title}</span>
                            {children.length > 0 && (
                              <span className={`text-[9px] font-medium px-1 rounded flex-shrink-0 ${children.filter(c => c.done).length === children.length ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                {children.filter(c => c.done).length}/{children.length}
                              </span>
                            )}
                          </div>
                          {(() => {
                            const sched = t.scheduleId ? schedules.find(s => s.id === t.scheduleId) : null
                            const overdue = !t.done && (sched ? sched.endDate && new Date(sched.endDate) < new Date() : t.dueDate && new Date(t.dueDate) < new Date())
                            const cls = `text-[10px] ${t.done ? 'text-gray-300' : overdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`
                            if (sched) {
                              const start = moment(sched.date).format('D MMM YY')
                              const end = sched.endDate ? moment(sched.endDate).format('D MMM YY') : null
                              return <span className={cls}>{start}{end && end !== start ? ` → ${end}` : ''}</span>
                            }
                            if (t.dueDate) return <span className={cls}>{moment(t.dueDate).format('D MMM YY')}</span>
                            return null
                          })()}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={() => openAddSubTask(t)} className="text-green-400 hover:text-green-600 text-xs" title="เพิ่ม subtask">+</button>
                          <button onClick={() => openEditTask(t)} className="text-blue-400 hover:text-blue-600 text-xs">✎</button>
                          <button onClick={() => deleteTask(t.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                        </div>
                      </div>
                      {!isCollapsed && children.map((c, ci) => renderTaskNode(c, children, ci, depth + 1))}
                    </div>
                  )
                }

                const grouped = projectTasks
                  .filter(t => t.parentId === null && t.month === currentMonth)
                  .reduce<Record<string, ProjectTask[]>>((acc, t) => {
                    if (!acc[t.projectName]) acc[t.projectName] = []
                    acc[t.projectName].push(t)
                    return acc
                  }, {})

                return Object.entries(grouped).map(([proj, rootTasks]) => {
                  const projColor = projects.find(p => p.name === proj)?.color || '#6B7280'
                  const allProjTasks = projectTasks.filter(t => t.projectName === proj)
                  const doneCount = allProjTasks.filter(t => t.done).length
                  const collapsed = collapsedProjects.has(proj)
                  const toggleCollapse = () => setCollapsedProjects(prev => {
                    const next = new Set(prev)
                    collapsed ? next.delete(proj) : next.add(proj)
                    return next
                  })
                  const sortedRoots = rootTasks.sort((a, b) => a.order - b.order)
                  return (
                    <div key={proj} className="border-b border-gray-100 last:border-b-0">
                      <div className="px-4 py-2 flex items-center justify-between transition-colors bg-gray-50">
                        <button
                          type="button"
                          onClick={toggleCollapse}
                          className="flex items-center gap-2 flex-1 min-w-0 text-left"
                        >
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: projColor }} />
                          <span className="text-sm font-semibold text-gray-700 truncate">{proj}</span>
                        </button>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-400">{doneCount}/{allProjTasks.length}</span>
                          <button
                            type="button"
                            onClick={() => { setEditingTask(null); setTaskForm({ projectName: proj, title: '', month: currentMonth, dueDate: '', parentId: null }); setShowTaskModal(true) }}
                            className="w-5 h-5 flex items-center justify-center rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-600 text-xs font-bold leading-none"
                            title="เพิ่มงาน"
                          >+</button>
                          <span className="text-gray-400 text-xs cursor-pointer" onClick={toggleCollapse}>{collapsed ? '▶' : '▼'}</span>
                        </div>
                      </div>
                      {!collapsed && (
                        <div className="px-4 py-1">
                          {sortedRoots.map((t, idx) => renderTaskNode(t, sortedRoots, idx, 0))}
                        </div>
                      )}
                    </div>
                  )
                })
              })()
            )}
          </div>
        </div>

        {/* Leave table 20% */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden" style={{ flex: '1 1 0', minHeight: 0 }}>
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <h2 className="text-sm font-bold text-gray-700">ตารางลา</h2>
            <button onClick={openAddLeave} className="text-xs bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700 transition-colors">
              + เพิ่ม
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {visibleLeaves.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">ไม่มีข้อมูล</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium" style={{ width: '55%' }}>ชื่อ</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium" style={{ width: '35%' }}>วันที่</th>
                    <th className="px-2 py-2" style={{ width: '10%' }} />
                  </tr>
                </thead>
                <tbody>
                  {visibleLeaves.map(leave => {
                    const isPast = new Date(leave.endDate) < new Date(new Date().setHours(0,0,0,0))
                    return (
                      <tr key={leave.id} className="border-t border-gray-50 hover:bg-gray-50 group">
                        <td className={`px-3 py-2.5 font-medium truncate max-w-[80px] ${isPast ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {leave.name}
                        </td>
                        <td className={`px-3 py-2.5 ${isPast ? 'line-through text-gray-400' : 'text-gray-500'}`}>
                          {moment(leave.startDate).format('D MMM')}
                          {leave.startDate !== leave.endDate ? ` – ${moment(leave.endDate).format('D MMM')}` : ''}
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditLeave(leave)} className="text-blue-500 hover:text-blue-700">✎</button>
                            <button onClick={() => deleteLeave(leave.id)} className="text-red-400 hover:text-red-600">✕</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-800">
                  {editingLeave ? 'แก้ไขการลา' : 'เพิ่มการลา'}
                </h2>
                <button onClick={() => setShowLeaveModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={submitLeave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ</label>
                  {teamMembers.length > 0 ? (
                    <select
                      required
                      value={leaveForm.name}
                      onChange={e => setLeaveForm({ ...leaveForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="">-- เลือกชื่อ --</option>
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={leaveForm.name}
                      onChange={e => setLeaveForm({ ...leaveForm, name: e.target.value })}
                      placeholder="ชื่อ-นามสกุล"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เริ่ม</label>
                    <input
                      type="date"
                      required
                      value={leaveForm.startDate}
                      onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">วันสิ้นสุด</label>
                    <input
                      type="date"
                      required
                      value={leaveForm.endDate}
                      onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  {editingLeave && (
                    <button
                      type="button"
                      onClick={() => { deleteLeave(editingLeave.id); setShowLeaveModal(false) }}
                      className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm"
                    >
                      ลบ
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    {editingLeave ? 'บันทึก' : 'เพิ่ม'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">{editingTask ? 'แก้ไขงาน' : taskForm.parentId ? 'เพิ่ม Subtask' : 'เพิ่มงาน'}</h2>
                  {taskForm.parentId && !editingTask && (
                    <p className="text-xs text-gray-400 mt-0.5">↳ {projectTasks.find(t => t.id === taskForm.parentId)?.title}</p>
                  )}
                </div>
                <button onClick={() => setShowTaskModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={submitTask} className="space-y-4">
                {!taskForm.parentId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">โปรเจกต์</label>
                    {projects.length > 0 ? (
                      <select
                        required
                        value={taskForm.projectName}
                        onChange={e => setTaskForm({ ...taskForm, projectName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                      >
                        <option value="">-- เลือกโปรเจกต์ --</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        value={taskForm.projectName}
                        onChange={e => setTaskForm({ ...taskForm, projectName: e.target.value })}
                        placeholder="ชื่อโปรเจกต์"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">งาน / Deliverable</label>
                  <textarea
                    required
                    rows={3}
                    value={taskForm.title}
                    onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                    placeholder="เช่น ส่ง Report ลูกค้า"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">เดือนที่ต้องปิด</label>
                    <input
                      type="month"
                      required
                      value={taskForm.month}
                      onChange={e => setTaskForm({ ...taskForm, month: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">กำหนดเสร็จ</label>
                    <input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  {editingTask && (
                    <button
                      type="button"
                      onClick={() => { deleteTask(editingTask.id); setShowTaskModal(false) }}
                      className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm"
                    >ลบ</button>
                  )}
                  <button type="submit" className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm">
                    {editingTask ? 'บันทึก' : 'เพิ่ม'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {viewingTask && (() => {
        const allDescendants = (id: number): ProjectTask[] => {
          const kids = projectTasks.filter(c => c.parentId === id).sort((a, b) => a.order - b.order)
          return kids.flatMap(k => [k, ...allDescendants(k.id)])
        }
        const directChildren = projectTasks.filter(c => c.parentId === viewingTask.id).sort((a, b) => a.order - b.order)
        const descendants = allDescendants(viewingTask.id)
        const doneDesc = descendants.filter(d => d.done).length
        const projColor = projects.find(p => p.name === viewingTask.projectName)?.color || '#6B7280'

        const renderSubTree = (tasks: ProjectTask[], depth: number): React.ReactNode =>
          tasks.map(t => {
            const kids = projectTasks.filter(c => c.parentId === t.id).sort((a, b) => a.order - b.order)
            return (
              <div key={t.id} style={{ paddingLeft: `${depth * 16}px` }}>
                <div className="flex items-center gap-2 py-1 border-b border-gray-50">
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() => toggleTask(t)}
                    className="flex-shrink-0 w-3.5 h-3.5 cursor-pointer accent-indigo-600"
                  />
                  <span className={`text-sm flex-1 ${t.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{t.title}</span>
                  {(() => {
                    const sched = t.scheduleId ? schedules.find(s => s.id === t.scheduleId) : null
                    const overdue = !t.done && (sched ? sched.endDate && new Date(sched.endDate) < new Date() : t.dueDate && new Date(t.dueDate) < new Date())
                    const cls = `text-[10px] flex-shrink-0 ${t.done ? 'text-gray-300' : overdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`
                    if (sched) {
                      const start = moment(sched.date).format('D MMM YY')
                      const end = sched.endDate ? moment(sched.endDate).format('D MMM YY') : null
                      return <span className={cls}>{start}{end && end !== start ? ` → ${end}` : ''}</span>
                    }
                    if (t.dueDate) return <span className={cls}>{moment(t.dueDate).format('D MMM YY')}</span>
                    return null
                  })()}
                </div>
                {kids.length > 0 && renderSubTree(kids, depth + 1)}
              </div>
            )
          })

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setViewingTask(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: projColor }} />
                      <span className="text-xs text-gray-500">{viewingTask.projectName}</span>
                    </div>
                    <h2 className={`text-lg font-bold ${viewingTask.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{viewingTask.title}</h2>
                  </div>
                  <button onClick={() => setViewingTask(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {viewingTask.members && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {viewingTask.members.split(',').map((m, i) => (
                      <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{m.trim()}</span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-xs text-gray-500">📅 {moment(viewingTask.month).format('MMM YYYY')}</span>
                  {(() => {
                    const linkedSched = viewingTask.scheduleId ? schedules.find(s => s.id === viewingTask.scheduleId) : null
                    if (linkedSched) {
                      const start = moment(linkedSched.date).format('D MMM YYYY')
                      const end = linkedSched.endDate ? moment(linkedSched.endDate).format('D MMM YYYY') : null
                      const overdue = !viewingTask.done && linkedSched.endDate && new Date(linkedSched.endDate) < new Date()
                      return (
                        <span className={`text-xs ${overdue ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                          ⏰ {start}{end && end !== start ? ` → ${end}` : ''}
                        </span>
                      )
                    }
                    if (viewingTask.dueDate) {
                      const overdue = !viewingTask.done && new Date(viewingTask.dueDate) < new Date()
                      return (
                        <span className={`text-xs ${overdue ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                          ⏰ {moment(viewingTask.dueDate).format('D MMM YYYY')}
                        </span>
                      )
                    }
                    return null
                  })()}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${viewingTask.done ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {viewingTask.done ? '✓ เสร็จแล้ว' : 'กำลังทำ'}
                  </span>
                  {descendants.length > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${doneDesc === descendants.length ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      subtask {doneDesc}/{descendants.length}
                    </span>
                  )}
                </div>
              </div>
              {directChildren.length > 0 && (
                <div className="flex-1 overflow-y-auto p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Subtasks</p>
                  {renderSubTree(directChildren, 0)}
                </div>
              )}
              <div className="p-4 border-t border-gray-100 flex gap-2">
                <button
                  onClick={() => { setViewingTask(null); openEditTask(viewingTask) }}
                  className="flex-1 text-sm px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                >✎ แก้ไข</button>
                <button
                  onClick={() => { setViewingTask(null); openAddSubTask(viewingTask) }}
                  className="flex-1 text-sm px-3 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100"
                >+ เพิ่ม Subtask</button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}