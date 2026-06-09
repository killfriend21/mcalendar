import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const members = await prisma.member.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(members)
}

export async function POST(req: Request) {
  const body = await req.json()
  const member = await prisma.member.create({ data: { name: body.name, role: body.role || null } })
  return NextResponse.json(member)
}

export async function PUT(req: Request) {
  const body = await req.json()
  const member = await prisma.member.update({ where: { id: body.id }, data: { name: body.name, role: body.role || null } })
  return NextResponse.json(member)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get('id') || '0')
  await prisma.member.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
