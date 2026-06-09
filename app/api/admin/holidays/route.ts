import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Parse d/m/yyyy, dd/mm/yyyy, or yyyy-mm-dd
function parseDate(dateStr: string): Date {
  const s = dateStr.trim()
  if (s.includes('/')) {
    const parts = s.split('/')
    if (parts.length === 3) {
      const [d, m, y] = parts
      return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
    }
  }
  return new Date(s)
}

export async function GET() {
  const holidays = await prisma.companyHoliday.findMany({ orderBy: { date: 'asc' } })
  return NextResponse.json(holidays)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Bulk import: array of { date, name, color? }
    if (Array.isArray(body)) {
      const created = await prisma.companyHoliday.createMany({
        data: body.map((h: { date: string; name: string; color?: string }) => ({
          date: parseDate(h.date),
          name: h.name,
          color: h.color || '#FEF3C7',
        })),
        skipDuplicates: false,
      })
      return NextResponse.json({ count: created.count })
    }

    // Single create
    const holiday = await prisma.companyHoliday.create({
      data: { date: parseDate(body.date), name: body.name, color: body.color || '#FEF3C7' },
    })
    return NextResponse.json(holiday)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const holiday = await prisma.companyHoliday.update({
      where: { id: body.id },
      data: { date: parseDate(body.date), name: body.name, color: body.color },
    })
    return NextResponse.json(holiday)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (id === 'all') {
    await prisma.companyHoliday.deleteMany()
    return NextResponse.json({ success: true })
  }

  await prisma.companyHoliday.delete({ where: { id: parseInt(id || '0') } })
  return NextResponse.json({ success: true })
}
