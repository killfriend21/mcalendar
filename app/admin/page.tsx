'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import ColorPicker from '@/components/ColorPicker'

// ─── Types ───────────────────────────────────────────────
interface Member { id: number; name: string; role: string | null }
interface Project { id: number; name: string; color: string }
interface CompanyHoliday { id: number; date: string; name: string }
interface StatusDef { id: number; name: string; label: string; color: string; bgColor: string; order: number }

type Tab = 'members' | 'projects' | 'holidays' | 'stocks' | 'statuses' | 'general'

// ─── Shared modal shell ───────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-800">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── Members Tab ──────────────────────────────────────────
function MembersTab() {
  const [members, setMembers] = useState<Member[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Member | null>(null)
  const [form, setForm] = useState({ name: '', role: '' })

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/members')
      if (!res.ok) return
      const data = await res.json()
      setMembers(Array.isArray(data) ? data : [])
    } catch {}
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  const openAdd = () => { setEditing(null); setForm({ name: '', role: '' }); setShowModal(true) }
  const openEdit = (m: Member) => { setEditing(m); setForm({ name: m.name, role: m.role || '' }); setShowModal(true) }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const method = editing ? 'PUT' : 'POST'
      const body = editing ? { id: editing.id, ...form } : form
      await fetch('/api/admin/members', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      setShowModal(false)
      fetch_()
    } catch {}
  }

  const del = async (id: number) => {
    if (!confirm('ยืนยันการลบ?')) return
    try {
      await fetch(`/api/admin/members?id=${id}`, { method: 'DELETE' })
      fetch_()
    } catch {}
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{members.length} คน</p>
        <button onClick={openAdd} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          + เพิ่มสมาชิก
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {members.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">ยังไม่มีสมาชิก</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">ชื่อ</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">ตำแหน่ง</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                  <td className="px-4 py-3 text-gray-500">{m.role || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(m)} className="text-blue-500 hover:text-blue-700 text-xs px-2 py-1 rounded hover:bg-blue-50">แก้ไข</button>
                      <button onClick={() => del(m.id)} className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50">ลบ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title={editing ? 'แก้ไขสมาชิก' : 'เพิ่มสมาชิก'} onClose={() => setShowModal(false)}>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล</label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่ง (ถ้ามี)</label>
              <input type="text" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex gap-2 pt-1">
              {editing && (
                <button type="button" onClick={() => { del(editing.id); setShowModal(false) }}
                  className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm">ลบ</button>
              )}
              <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                {editing ? 'บันทึก' : 'เพิ่ม'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ─── Projects Tab ─────────────────────────────────────────
function ProjectsTab() {
  const [projects, setProjects] = useState<Project[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [form, setForm] = useState({ name: '', color: '#3B82F6' })

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/projects')
      if (!res.ok) return
      const data = await res.json()
      setProjects(Array.isArray(data) ? data : [])
    } catch {}
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  const PROJECT_COLORS = [
    '#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6',
    '#EC4899','#06B6D4','#84CC16','#F97316','#6366F1',
    '#14B8A6','#F43F5E','#A855F7','#22C55E','#EAB308',
  ]
  const pickColor = () => {
    const used = new Set(projects.map(p => p.color.toLowerCase()))
    return PROJECT_COLORS.find(c => !used.has(c.toLowerCase())) ?? PROJECT_COLORS[projects.length % PROJECT_COLORS.length]
  }
  const openAdd = () => { setEditing(null); setForm({ name: '', color: pickColor() }); setShowModal(true) }
  const openEdit = (p: Project) => { setEditing(p); setForm({ name: p.name, color: p.color }); setShowModal(true) }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const method = editing ? 'PUT' : 'POST'
      const body = editing ? { id: editing.id, ...form } : form
      await fetch('/api/admin/projects', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      setShowModal(false)
      fetch_()
    } catch {}
  }

  const del = async (id: number) => {
    if (!confirm('ยืนยันการลบ?')) return
    try {
      await fetch(`/api/admin/projects?id=${id}`, { method: 'DELETE' })
      fetch_()
    } catch {}
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{projects.length} โปรเจกต์</p>
        <button onClick={openAdd} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          + เพิ่มโปรเจกต์
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {projects.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">ยังไม่มีโปรเจกต์</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">ชื่อโปรเจกต์</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">สี</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full border border-gray-200" style={{ backgroundColor: p.color }} />
                      <span className="text-gray-400 text-xs font-mono">{p.color}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(p)} className="text-blue-500 hover:text-blue-700 text-xs px-2 py-1 rounded hover:bg-blue-50">แก้ไข</button>
                      <button onClick={() => del(p.id)} className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50">ลบ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title={editing ? 'แก้ไขโปรเจกต์' : 'เพิ่มโปรเจกต์'} onClose={() => setShowModal(false)}>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อโปรเจกต์</label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สี</label>
              <ColorPicker value={form.color} onChange={color => setForm({ ...form, color })} variant="vivid" />
            </div>
            <div className="flex gap-2 pt-1">
              {editing && (
                <button type="button" onClick={() => { del(editing.id); setShowModal(false) }}
                  className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm">ลบ</button>
              )}
              <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                {editing ? 'บันทึก' : 'เพิ่ม'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ─── Holidays Tab ─────────────────────────────────────────
function HolidaysTab() {
  const [holidays, setHolidays] = useState<CompanyHoliday[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<CompanyHoliday | null>(null)
  const [form, setForm] = useState({ date: '', name: '' })
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState('')

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/holidays')
      if (!res.ok) return
      const data = await res.json()
      setHolidays(Array.isArray(data) ? data : [])
    } catch {}
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  const openAdd = () => {
    setEditing(null)
    setForm({ date: new Date().toISOString().split('T')[0], name: '' })
    setShowModal(true)
  }
  const openEdit = (h: CompanyHoliday) => {
    setEditing(h)
    setForm({ date: h.date.split('T')[0], name: h.name })
    setShowModal(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const method = editing ? 'PUT' : 'POST'
      const body = editing ? { id: editing.id, ...form } : form
      await fetch('/api/admin/holidays', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      setShowModal(false)
      fetch_()
    } catch {}
  }

  const del = async (id: number) => {
    if (!confirm('ยืนยันการลบ?')) return
    try {
      await fetch(`/api/admin/holidays?id=${id}`, { method: 'DELETE' })
      fetch_()
    } catch {}
  }

  const clearAll = async () => {
    if (!confirm('ลบวันหยุดทั้งหมด?')) return
    await fetch('/api/admin/holidays?id=all', { method: 'DELETE' })
    fetch_()
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportMsg('')

    const text = await file.text()
    const lines = text.trim().split('\n').filter(Boolean)
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const dateIdx = headers.indexOf('date')
    const nameIdx = headers.indexOf('name')

    if (dateIdx === -1 || nameIdx === -1) {
      setImportMsg('ไฟล์ต้องมีคอลัมน์ date และ name')
      setImporting(false)
      e.target.value = ''
      return
    }

    const rows = lines.slice(1).map(line => {
      const cols = line.split(',').map(c => c.trim())
      return { date: cols[dateIdx], name: cols[nameIdx] }
    }).filter(r => r.date && r.name)

    const res = await fetch('/api/admin/holidays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows),
    })
    const result = await res.json()
    if (!res.ok) {
      setImportMsg(`Error: ${result.error || res.status}`)
      setImporting(false)
      e.target.value = ''
      return
    }
    setImportMsg(`นำเข้าสำเร็จ ${result.count} รายการ`)
    setImporting(false)
    e.target.value = ''
    fetch_()
  }

  const downloadTemplate = () => {
    window.open('/api/admin/holidays/template', '_blank')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className="text-sm text-gray-500">{holidays.length} วัน</p>
        <div className="flex gap-2 flex-wrap">
          <button onClick={downloadTemplate}
            className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
            ⬇ Download Template
          </button>
          <label className={`text-sm px-4 py-2 rounded-lg border border-emerald-500 text-emerald-700 hover:bg-emerald-50 cursor-pointer transition-colors ${importing ? 'opacity-50' : ''}`}>
            {importing ? 'กำลัง Import...' : '↑ Import CSV'}
            <input type="file" accept=".csv" onChange={handleImport} className="hidden" disabled={importing} />
          </label>
          {holidays.length > 0 && (
            <button onClick={clearAll} className="text-sm px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors">
              ลบทั้งหมด
            </button>
          )}
          <button onClick={openAdd} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            + เพิ่ม
          </button>
        </div>
      </div>

      {importMsg && (
        <div className="mb-4 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          {importMsg}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {holidays.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">ยังไม่มีวันหยุด — Import CSV หรือเพิ่มด้วยตนเอง</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">วันที่</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">ชื่อวันหยุด</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {holidays.map(h => (
                <tr key={h.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700 font-mono text-xs">
                    {new Date(h.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-gray-800">{h.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(h)} className="text-blue-500 hover:text-blue-700 text-xs px-2 py-1 rounded hover:bg-blue-50">แก้ไข</button>
                      <button onClick={() => del(h.id)} className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50">ลบ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title={editing ? 'แก้ไขวันหยุด' : 'เพิ่มวันหยุด'} onClose={() => setShowModal(false)}>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
              <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อวันหยุด</label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex gap-2 pt-1">
              {editing && (
                <button type="button" onClick={() => { del(editing.id); setShowModal(false) }}
                  className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm">ลบ</button>
              )}
              <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                {editing ? 'บันทึก' : 'เพิ่ม'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ─── Stocks Tab ───────────────────────────────────────────
interface StockWatchItem { id: number; symbol: string; label: string | null }

function StocksTab() {
  const [stocks, setStocks] = useState<StockWatchItem[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<StockWatchItem | null>(null)
  const [form, setForm] = useState({ symbol: '', label: '' })
  const [error, setError] = useState('')
  const [settings, setSettings] = useState({ stockEnabled: 'false', stockRefreshInterval: '120', stockSlideInterval: '60' })
  const [savingSettings, setSavingSettings] = useState(false)

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stocks')
      if (!res.ok) return
      const data = await res.json()
      setStocks(Array.isArray(data) ? data : [])
    } catch {}
  }, [])

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings')
      if (!res.ok) return
      const data = await res.json()
      setSettings(s => ({ ...s, ...data }))
    } catch {}
  }, [])

  useEffect(() => { fetch_(); fetchSettings() }, [fetch_, fetchSettings])

  const saveSettings = async (patch: Partial<typeof settings>) => {
    setSavingSettings(true)
    const next = { ...settings, ...patch }
    setSettings(next)
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
    } catch {}
    setSavingSettings(false)
  }

  const handleToggleEnable = async () => {
    if (settings.stockEnabled === 'false') {
      alert('⚠️ Feature นี้ต้องการ Internet ตลอดเวลาในการดึงข้อมูลราคาหุ้น')
    }
    await saveSettings({ stockEnabled: settings.stockEnabled === 'true' ? 'false' : 'true' })
  }

  const openAdd = () => { setEditing(null); setForm({ symbol: '', label: '' }); setShowModal(true) }
  const openEdit = (s: StockWatchItem) => { setEditing(s); setForm({ symbol: s.symbol, label: s.label || '' }); setShowModal(true) }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const method = editing ? 'PUT' : 'POST'
      const body = editing ? { id: editing.id, ...form } : form
      const res = await fetch('/api/admin/stocks', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { setError(data?.error || `Error ${res.status}`); return }
      setShowModal(false)
      fetch_()
    } catch (err) {
      setError(String(err))
    }
  }

  const del = async (id: number) => {
    if (!confirm('ยืนยันการลบ?')) return
    try {
      await fetch(`/api/admin/stocks?id=${id}`, { method: 'DELETE' })
      fetch_()
    } catch {}
  }

  return (
    <div className="space-y-6">
      {/* Stock Feature Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">ตั้งค่า Widget ราคาหุ้น</h3>

        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">แสดง Widget ราคาหุ้น</p>
            <p className="text-xs text-gray-400">ต้องการ Internet ตลอดเวลา</p>
          </div>
          <button
            onClick={handleToggleEnable}
            disabled={savingSettings}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.stockEnabled === 'true' ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${settings.stockEnabled === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Intervals (only show when enabled) */}
        {settings.stockEnabled === 'true' && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Refresh ราคา (วินาที)</label>
              <input
                type="number" min="30" max="3600"
                value={settings.stockRefreshInterval}
                onChange={e => setSettings(s => ({ ...s, stockRefreshInterval: e.target.value }))}
                onBlur={e => saveSettings({ stockRefreshInterval: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">ค่าแนะนำ: 120</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">เปลี่ยน Slide (วินาที)</label>
              <input
                type="number" min="5" max="600"
                value={settings.stockSlideInterval}
                onChange={e => setSettings(s => ({ ...s, stockSlideInterval: e.target.value }))}
                onBlur={e => saveSettings({ stockSlideInterval: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">ค่าแนะนำ: 60</p>
            </div>
          </div>
        )}
      </div>

      {/* Symbol list */}
      <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{stocks.length} หลักทรัพย์</p>
        <button onClick={openAdd} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          + เพิ่มหุ้น
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {stocks.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">ยังไม่มีหลักทรัพย์ — เพิ่ม Symbol เช่น SICT.BK, PTT.BK</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Symbol</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">ชื่อย่อ</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {stocks.map(s => (
                <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold text-gray-800">{s.symbol}</td>
                  <td className="px-4 py-3 text-gray-500">{s.label || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(s)} className="text-blue-500 hover:text-blue-700 text-xs px-2 py-1 rounded hover:bg-blue-50">แก้ไข</button>
                      <button onClick={() => del(s.id)} className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50">ลบ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-3">ตลาดไทย ใช้ .BK ต่อท้าย เช่น SICT.BK, PTT.BK • ตลาด US เช่น AAPL, TSLA</p>

      {showModal && (
        <Modal title={editing ? 'แก้ไขหลักทรัพย์' : 'เพิ่มหลักทรัพย์'} onClose={() => setShowModal(false)}>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
              <input type="text" required value={form.symbol}
                onChange={e => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                placeholder="เช่น SICT.BK"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อย่อ (ถ้ามี)</label>
              <input type="text" value={form.label}
                onChange={e => setForm({ ...form, label: e.target.value })}
                placeholder="เช่น SICT"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex gap-2 pt-1">
              {editing && (
                <button type="button" onClick={() => { del(editing.id); setShowModal(false) }}
                  className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm">ลบ</button>
              )}
              <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                {editing ? 'บันทึก' : 'เพิ่ม'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      </div>
    </div>
  )
}

// ─── Statuses Tab ─────────────────────────────────────────
function StatusesTab() {
  const [statuses, setStatuses] = useState<StatusDef[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<StatusDef | null>(null)
  const [form, setForm] = useState({ name: '', label: '', color: '#6B7280', bgColor: '#F3F4F6' })

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/milestone-statuses')
      if (!res.ok) return
      const data = await res.json()
      setStatuses(Array.isArray(data) ? data : [])
    } catch {}
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  const openAdd = () => { setEditing(null); setForm({ name: '', label: '', color: '#6B7280', bgColor: '#F3F4F6' }); setShowModal(true) }
  const openEdit = (s: StatusDef) => { setEditing(s); setForm({ name: s.name, label: s.label, color: s.color, bgColor: s.bgColor }); setShowModal(true) }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const method = editing ? 'PUT' : 'POST'
      const body = editing ? { id: editing.id, ...form } : { ...form, order: statuses.length }
      await fetch('/api/admin/milestone-statuses', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      setShowModal(false)
      fetch_()
    } catch {}
  }

  const del = async (id: number) => {
    if (!confirm('ลบ status นี้?')) return
    try {
      await fetch(`/api/admin/milestone-statuses?id=${id}`, { method: 'DELETE' })
      fetch_()
    } catch {}
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{statuses.length} สถานะ</p>
        <button onClick={openAdd} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          + เพิ่มสถานะ
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {statuses.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">ยังไม่มีสถานะ</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">ตัวอย่าง</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Key</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">ชื่อแสดงผล</th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {statuses.map(s => (
                <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold"
                      style={{ background: s.bgColor, color: s.color, border: `1px solid ${s.color}` }}>
                      ● {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{s.name}</td>
                  <td className="px-4 py-3 text-gray-700">{s.label}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(s)} className="text-blue-600 hover:text-blue-800 text-xs mr-3">แก้ไข</button>
                    <button onClick={() => del(s.id)} className="text-red-500 hover:text-red-700 text-xs">ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title={editing ? 'แก้ไขสถานะ' : 'เพิ่มสถานะ'} onClose={() => setShowModal(false)}>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key (ภาษาอังกฤษ ไม่มีช่องว่าง)</label>
              <input required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                placeholder="เช่น testing, review"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อแสดงผล</label>
              <input required value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder="เช่น กำลัง Test, รอ Review"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สีหลัก (dot / ตัวอักษร)</label>
              <ColorPicker value={form.color} onChange={color => setForm(f => ({ ...f, color }))} variant="vivid" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สีพื้นหลัง badge</label>
              <ColorPicker value={form.bgColor} onChange={bgColor => setForm(f => ({ ...f, bgColor }))} />
            </div>
            <div className="flex gap-2 pt-1">
              {editing && (
                <button type="button" onClick={() => { del(editing.id); setShowModal(false) }}
                  className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm">ลบ</button>
              )}
              <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                {editing ? 'บันทึก' : 'เพิ่ม'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ─── General Tab ──────────────────────────────────────────
function GeneralTab() {
  const [settings, setSettings] = useState({ showLeavesInCalendar: 'true' })
  const [savingSettings, setSavingSettings] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings')
      if (!res.ok) return
      const data = await res.json()
      setSettings(s => ({ ...s, ...data }))
    } catch {}
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const saveSettings = async (patch: Partial<typeof settings>) => {
    setSavingSettings(true)
    setSettings(s => ({ ...s, ...patch }))
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
    } catch {}
    setSavingSettings(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">ตั้งค่าทั่วไป</h3>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">แสดงวันลาใน calendar</p>
          <p className="text-xs text-gray-400">แสดง badge วันลาบนตารางปฏิทิน (เดือน/ไตรมาส)</p>
        </div>
        <button
          onClick={() => saveSettings({ showLeavesInCalendar: settings.showLeavesInCalendar === 'true' ? 'false' : 'true' })}
          disabled={savingSettings}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.showLeavesInCalendar === 'true' ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${settings.showLeavesInCalendar === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
    </div>
  )
}

// ─── Main Admin Page ──────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('members')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'members', label: 'สมาชิกทีม' },
    { key: 'projects', label: 'โปรเจกต์' },
    { key: 'holidays', label: 'วันหยุดบริษัท' },
    { key: 'stocks', label: 'หุ้น' },
    { key: 'statuses', label: 'สถานะ Milestone' },
    { key: 'general', label: 'ทั่วไป' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-0.5">จัดการสมาชิก โปรเจกต์ และวันหยุด</p>
        </div>
        <Link href="/" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
          ← กลับปฏิทิน
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'members' && <MembersTab />}
        {tab === 'projects' && <ProjectsTab />}
        {tab === 'holidays' && <HolidaysTab />}
        {tab === 'stocks' && <StocksTab />}
        {tab === 'statuses' && <StatusesTab />}
        {tab === 'general' && <GeneralTab />}
      </div>
    </div>
  )
}
