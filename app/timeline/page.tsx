'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import moment from 'moment'

interface Project {
  id: number
  name: string
  color: string
  order: number
}

interface Milestone {
  id: number
  projectName: string
  label: string
  date: string
  status: string
  order: number
}

interface StatusDef {
  id: number
  name: string
  label: string
  color: string
  bgColor: string
  order: number
}

const FALLBACK_STATUS: StatusDef = { id: 0, name: 'pending', label: 'รอ', color: '#9CA3AF', bgColor: '#F3F4F6', order: 0 }

export default function TimelinePage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [statusDefs, setStatusDefs] = useState<StatusDef[]>([])
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [form, setForm] = useState({ label: '', date: '', status: 'pending' })
  const [yearOffset, setYearOffset] = useState(0)

  const fetchAll = useCallback(async () => {
    const [p, m, s] = await Promise.all([
      fetch('/api/admin/projects').then(r => r.json()),
      fetch('/api/admin/project-milestones').then(r => r.json()),
      fetch('/api/admin/milestone-statuses').then(r => r.json()),
    ])
    setProjects(Array.isArray(p) ? p : [])
    setMilestones(Array.isArray(m) ? m : [])
    setStatusDefs(Array.isArray(s) ? s : [])
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const moveProject = async (proj: Project, dir: 'up' | 'down') => {
    const sorted = [...projects].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex(p => p.id === proj.id)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const swap = sorted[swapIdx]
    await Promise.all([
      fetch('/api/admin/projects', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: proj.id, order: swap.order }) }),
      fetch('/api/admin/projects', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: swap.id, order: proj.order }) }),
    ])
    fetchAll()
  }

  const saveMilestone = async () => {
    if (!form.label || !form.date) return
    if (editingMilestone) {
      await fetch('/api/admin/project-milestones', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingMilestone.id, label: form.label, date: form.date, status: form.status }) })
    } else if (addingTo) {
      const projectMilestones = milestones.filter(m => m.projectName === addingTo)
      await fetch('/api/admin/project-milestones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectName: addingTo, label: form.label, date: form.date, status: form.status, order: projectMilestones.length }) })
    }
    setEditingMilestone(null)
    setAddingTo(null)
    setForm({ label: '', date: '', status: 'pending' })
    fetchAll()
  }

  const deleteMilestone = async (id: number) => {
    await fetch(`/api/admin/project-milestones?id=${id}`, { method: 'DELETE' })
    fetchAll()
  }

  const year = moment().year() + yearOffset
  const months = Array.from({ length: 12 }, (_, i) => moment(`${year}-${String(i + 1).padStart(2, '0')}-01`))
  const today = moment()
  const sortedProjects = [...projects].sort((a, b) => a.order - b.order)

  // X position: fraction of year (0..1) → percentage
  const xPct = (date: string) => {
    const d = moment(date)
    const start = moment(`${year}-01-01`)
    const end = moment(`${year}-12-31`)
    const pct = d.diff(start, 'days') / end.diff(start, 'days')
    return Math.max(0, Math.min(1, pct)) * 100
  }

  const todayPct = xPct(today.format('YYYY-MM-DD'))

  const openEdit = (m: Milestone) => {
    setEditingMilestone(m)
    setAddingTo(null)
    setForm({ label: m.label, date: moment(m.date).format('YYYY-MM-DD'), status: m.status })
  }

  const openAdd = (projectName: string) => {
    setAddingTo(projectName)
    setEditingMilestone(null)
    setForm({ label: '', date: `${year}-01-01`, status: 'pending' })
  }

  const closeModal = () => {
    setEditingMilestone(null)
    setAddingTo(null)
    setForm({ label: '', date: '', status: 'pending' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← Calendar</Link>
          <h1 className="text-lg font-bold text-gray-800">Project Timeline</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setYearOffset(o => o - 1)} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">◀ {year - 1}</button>
          <span className="px-4 py-1.5 text-sm font-bold bg-indigo-600 text-white rounded-lg">{year}</span>
          <button onClick={() => setYearOffset(o => o + 1)} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">{year + 1} ▶</button>
        </div>
      </div>

      <div className="p-6">
        {/* Month header */}
        <div className="flex mb-2" style={{ paddingLeft: '180px' }}>
          {months.map(m => (
            <div key={m.format('MM')} className="flex-1 text-center text-xs font-medium text-gray-400 border-l border-gray-200 first:border-l-0 py-1">
              {m.format('MMM')}
            </div>
          ))}
        </div>

        {/* Today line label */}
        {year === today.year() && (
          <div className="relative" style={{ paddingLeft: '180px', height: 0 }}>
            <div
              className="absolute top-0 bottom-0 z-10 pointer-events-none"
              style={{ left: `calc(180px + ${todayPct}%)`, transform: 'translateX(-50%)' }}
            >
              <span className="text-[9px] font-bold text-red-500 bg-white px-0.5 rounded">{today.format('D MMM')}</span>
            </div>
          </div>
        )}

        {/* Project rows */}
        <div className="flex flex-col gap-0">
          {sortedProjects.length === 0 && (
            <div className="text-center text-sm text-gray-400 py-12">ยังไม่มี project — ไปเพิ่มที่ <Link href="/admin" className="text-indigo-600 underline">Admin</Link></div>
          )}
          {sortedProjects.map((proj, pi) => {
            const projMilestones = milestones
              .filter(m => m.projectName === proj.name)
              .sort((a, b) => moment(a.date).diff(moment(b.date)))
            const yearMilestones = projMilestones.filter(m => moment(m.date).year() === year)

            return (
              <div key={proj.id} className="flex items-center border-b border-gray-100 last:border-b-0 group" style={{ minHeight: '72px' }}>
                {/* Project label + controls */}
                <div className="flex items-center gap-2 flex-shrink-0" style={{ width: '180px' }}>
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveProject(proj, 'up')}
                      disabled={pi === 0}
                      className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-[10px] leading-none"
                    >▲</button>
                    <button
                      onClick={() => moveProject(proj, 'down')}
                      disabled={pi === sortedProjects.length - 1}
                      className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-[10px] leading-none"
                    >▼</button>
                  </div>
                  <button
                    onClick={() => openAdd(proj.name)}
                    className="flex-shrink-0 w-5 h-5 rounded-full border border-indigo-300 bg-indigo-50 hover:bg-indigo-600 text-indigo-500 hover:text-white transition-colors text-xs flex items-center justify-center font-bold leading-none"
                    title="เพิ่ม milestone"
                  >+</button>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: proj.color }} />
                  <span className="text-sm font-semibold text-gray-700 truncate">{proj.name}</span>
                </div>

                {/* Timeline track */}
                <div className="flex-1 relative overflow-hidden" style={{ height: '72px' }}>
                  {/* Month grid lines */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {months.map((m, mi) => (
                      <div key={mi} className="flex-1 border-l border-gray-100 first:border-l-0 h-full" />
                    ))}
                  </div>

                  {/* Today line */}
                  {year === today.year() && (
                    <div
                      className="absolute top-0 bottom-0 w-px bg-red-300 pointer-events-none z-10"
                      style={{ left: `${todayPct}%` }}
                    />
                  )}

                  {/* Connecting line between milestones in this year */}
                  {yearMilestones.length >= 2 && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                      <line
                        x1={`${xPct(yearMilestones[0].date)}%`}
                        y1="50%"
                        x2={`${xPct(yearMilestones[yearMilestones.length - 1].date)}%`}
                        y2="50%"
                        stroke={proj.color}
                        strokeWidth="2"
                        strokeOpacity="0.4"
                      />
                    </svg>
                  )}

                  {/* Milestone dots */}
                  {yearMilestones.map((m) => {
                    const statusDef = statusDefs.find(s => s.name === m.status) ?? FALLBACK_STATUS
                    const pct = xPct(m.date)
                    // Clamp dot so it stays fully inside the track (never clips at edges)
                    const isLeft = pct <= 1
                    const isRight = pct >= 99
                    const dotLeft = isLeft ? '6px' : isRight ? 'calc(100% - 6px)' : `${pct}%`
                    const dotTransform = isLeft || isRight ? 'translateY(-50%)' : 'translate(-50%, -50%)'
                    // Label/date offset from dot
                    const textAlign: React.CSSProperties = isLeft
                      ? { left: '20px' }
                      : isRight
                        ? { right: '20px' }
                        : pct <= 15
                          ? { left: `calc(${pct}% + 10px)` }
                          : pct >= 85
                            ? { left: `calc(${pct}% - 10px)`, transform: 'translateX(-100%)' }
                            : { left: `${pct}%`, transform: 'translateX(-50%)' }
                    return (
                      <React.Fragment key={m.id}>
                        {/* Label above dot */}
                        <div
                          className="absolute text-[10px] font-semibold whitespace-nowrap px-1.5 py-0.5 rounded cursor-pointer"
                          style={{
                            top: '4px',
                            ...textAlign,
                            background: statusDef.bgColor, color: statusDef.color, border: `1px solid ${statusDef.color}`,
                            maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis',
                            zIndex: 3,
                          }}
                          title={m.label}
                          onClick={() => openEdit(m)}
                        >
                          {m.status === 'done' ? '✓ ' : ''}{m.label}
                        </div>
                        {/* Dot at center */}
                        <div
                          className="absolute rounded-full border-2 cursor-pointer"
                          style={{
                            width: '12px', height: '12px',
                            left: dotLeft, top: '50%',
                            transform: dotTransform,
                            borderColor: statusDef.color, background: m.status === 'done' ? statusDef.color : 'white',
                            zIndex: 3,
                          }}
                          onClick={() => openEdit(m)}
                        />
                        {/* Date below dot */}
                        <div
                          className="absolute text-[9px] text-gray-400 whitespace-nowrap cursor-pointer"
                          style={{ bottom: '4px', ...textAlign, zIndex: 3 }}
                          onClick={() => openEdit(m)}
                        >
                          {moment(m.date).format('D MMM')}
                        </div>
                      </React.Fragment>
                    )
                  })}

                  {/* Out-of-year milestones: show as collapsed count on edges */}
                  {(() => {
                    const before = projMilestones.filter(m => moment(m.date).year() < year)
                    const after = projMilestones.filter(m => moment(m.date).year() > year)
                    return (
                      <>
                        {before.length > 0 && (
                          <div className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 z-2">
                            ◀ {before.length} ก่อนหน้า
                          </div>
                        )}
                        {after.length > 0 && (
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 z-2">
                            {after.length} ถัดไป ▶
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-4 text-xs text-gray-500">
          <span className="font-medium">สถานะ:</span>
          {statusDefs.map(s => (
            <span key={s.name} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: s.color }} />
              <span style={{ color: s.color }}>{s.label}</span>
            </span>
          ))}
          <span className="ml-4 flex items-center gap-1"><span className="w-4 h-px bg-red-300 inline-block" /> วันนี้</span>
        </div>
      </div>

      {/* Modal */}
      {(editingMilestone || addingTo) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-80" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-gray-800 mb-4">
              {editingMilestone ? `แก้ไข Milestone` : `เพิ่ม Milestone — ${addingTo}`}
            </h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">ชื่อ Phase</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.label}
                  onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="เช่น Tape Out, CES, RFS"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">วันที่</label>
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">สถานะ</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                >
                  {statusDefs.map(s => (
                    <option key={s.name} value={s.name}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={saveMilestone} className="flex-1 bg-indigo-600 text-white text-sm py-2 rounded-lg hover:bg-indigo-700">
                {editingMilestone ? 'บันทึก' : 'เพิ่ม'}
              </button>
              {editingMilestone && (
                <button onClick={() => { deleteMilestone(editingMilestone.id); closeModal() }} className="px-3 py-2 text-red-500 hover:text-red-700 text-sm">
                  ลบ
                </button>
              )}
              <button onClick={closeModal} className="px-3 py-2 text-gray-400 hover:text-gray-600 text-sm">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
