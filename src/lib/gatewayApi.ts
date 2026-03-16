const GATEWAY = 'http://localhost:18789'
const TOKEN = 'e4ccba5fa1bcc9afb2f43eff40ba9932b1e9ed91589f0d2d'

export async function invokeGatewayTool(tool: string, args: Record<string, unknown> = {}): Promise<unknown> {
  try {
    const res = await fetch(`${GATEWAY}/tools/invoke`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tool, args, sessionKey: 'main' }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.result?.details ?? data?.result ?? null
  } catch {
    return null
  }
}

export async function readFile(path: string): Promise<string | null> {
  try {
    const res = await fetch(`${GATEWAY}/tools/invoke`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tool: 'read', args: { path }, sessionKey: 'main' }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const content = data?.result?.details ?? data?.result?.content?.[0]?.text ?? null
    return typeof content === 'string' ? content : JSON.stringify(content)
  } catch {
    return null
  }
}
