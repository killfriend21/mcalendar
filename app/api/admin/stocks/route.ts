import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const stocks = await prisma.stockWatch.findMany({ orderBy: { createdAt: 'asc' } })
    return NextResponse.json(stocks)
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const stock = await prisma.stockWatch.create({
      data: { symbol: (body.symbol as string).toUpperCase().trim(), label: body.label || null },
    })
    return NextResponse.json(stock)
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const stock = await prisma.stockWatch.update({
      where: { id: body.id },
      data: {
        ...(body.symbol !== undefined && { symbol: (body.symbol as string).toUpperCase().trim() }),
        ...(body.label !== undefined && { label: body.label || null }),
      },
    })
    return NextResponse.json(stock)
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    await prisma.stockWatch.delete({ where: { id: Number(id) } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
