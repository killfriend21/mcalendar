import { NextResponse } from 'next/server'

export async function GET() {
  const csv = [
    'date,name',
    '2026-01-01,วันขึ้นปีใหม่',
    '2026-04-06,วันจักรี',
    '2026-04-13,วันสงกรานต์',
    '2026-04-14,วันสงกรานต์',
    '2026-04-15,วันสงกรานต์',
    '2026-05-01,วันแรงงานแห่งชาติ',
    '2026-05-04,วันฉัตรมงคล',
    '2026-12-05,วันพ่อแห่งชาติ',
    '2026-12-10,วันรัฐธรรมนูญไทย',
    '2026-12-31,วันสิ้นปี',
  ].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="company_holidays_template.csv"',
    },
  })
}
