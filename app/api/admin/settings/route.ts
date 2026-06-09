import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEFAULTS: Record<string, string> = {
  stockEnabled: 'false',
  stockRefreshInterval: '120',
  stockSlideInterval: '60',
}

export async function GET() {
  try {
    const rows = await prisma.appSetting.findMany()
    const result: Record<string, string> = { ...DEFAULTS }
    for (const r of rows) result[r.key] = r.value
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(DEFAULTS)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, string>
    const updates = await Promise.all(
      Object.entries(body).map(([key, value]) =>
        prisma.appSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    )
    return NextResponse.json(updates)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
