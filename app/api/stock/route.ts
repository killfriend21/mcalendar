import { NextRequest, NextResponse } from 'next/server'

async function fetchYahoo(symbol: string) {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`,
    { headers: { 'User-Agent': 'Mozilla/5.0' }, cache: 'no-store' }
  )
  if (!res.ok) return null
  const json = await res.json()
  const result = json?.chart?.result?.[0]
  const meta = result?.meta
  if (!meta?.regularMarketPrice) return null
  return { meta, result, resolvedSymbol: symbol }
}

export async function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get('symbol') || 'SICT.BK').trim().toUpperCase()

  try {
    let fetched = await fetchYahoo(raw)
    if (!fetched && !raw.includes('.')) {
      fetched = await fetchYahoo(raw + '.BK')
    }
    if (!fetched) throw new Error('No data')

    const { meta, result, resolvedSymbol } = fetched
    const closes: number[] = result?.indicators?.quote?.[0]?.close ?? []
    const opens: number[] = result?.indicators?.quote?.[0]?.open ?? []

    // Last close = today, second-to-last = previous trading day
    const validCloses = closes.filter((v: number) => v != null)
    const price: number = meta.regularMarketPrice
    const prior: number = validCloses.length >= 2
      ? validCloses[validCloses.length - 2]
      : (meta.chartPreviousClose ?? meta.previousClose ?? price)

    const validOpens = opens.filter((v: number) => v != null)
    const todayOpen: number = validOpens[validOpens.length - 1]
      ?? meta.regularMarketOpen
      ?? prior

    const change: number = price - prior
    const changePercent: number = (change / prior) * 100

    return NextResponse.json({
      symbol: resolvedSymbol,
      price,
      change,
      changePercent,
      high: meta.regularMarketDayHigh ?? meta.dayHigh,
      low: meta.regularMarketDayLow ?? meta.dayLow,
      open: todayOpen,
      volume: meta.regularMarketVolume ?? meta.volume,
      time: meta.regularMarketTime ?? Math.floor(Date.now() / 1000),
      fetchedAt: Math.floor(Date.now() / 1000),
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
