const HOMER_WEB_URL = process.env.HOMER_WEB_URL
const HOMER_WEB_API_KEY = process.env.HOMER_WEB_API_KEY

async function postToHomer(path: string, body: unknown) {
  if (!HOMER_WEB_URL || !HOMER_WEB_API_KEY) return

  try {
    const res = await fetch(`${HOMER_WEB_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': HOMER_WEB_API_KEY,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      console.error(`homer-web sync failed (${path}): ${res.status} ${await res.text()}`)
    }
  } catch (err) {
    console.error(`homer-web sync error (${path}):`, err)
  }
}

export function syncMilestoneToNews(milestone: {
  id: number
  projectName: string
  label: string
  date: Date
}) {
  return postToHomer('/api/integrations/news', {
    title: `New milestone: ${milestone.label}`,
    content: `Project: ${milestone.projectName}\nDate: ${milestone.date.toLocaleDateString('th-TH')}`,
    source: 'mcalendar',
    externalId: `mcalendar:milestone:${milestone.id}`,
  })
}

export function syncTaskToHomer(task: {
  id: number
  projectName: string
  title: string
  month: string
  dueDate: Date | null
}) {
  return postToHomer('/api/integrations/tasks', {
    title: `${task.title} (${task.projectName})`,
    description: `Month: ${task.month}`,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    source: 'mcalendar',
    externalId: `mcalendar:task:${task.id}`,
  })
}
