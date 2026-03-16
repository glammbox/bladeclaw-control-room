const PROXY = 'http://localhost:18790'
const GATEWAY = 'http://localhost:18789'
const TOKEN = 'e4ccba5fa1bcc9afb2f43eff40ba9932b1e9ed91589f0d2d'

export async function getBuilds(): Promise<any[]> {
  try {
    const res = await fetch(`${PROXY}/api/builds`)
    const data = await res.json()
    return data?.builds ?? []
  } catch { return [] }
}

export async function getChainState(): Promise<any> {
  try {
    const res = await fetch(`${PROXY}/api/chain-state`)
    return await res.json()
  } catch { return null }
}

export async function getSessions(): Promise<any[]> {
  try {
    const res = await fetch(`${PROXY}/api/sessions`)
    const data = await res.json()
    return data?.sessions ?? []
  } catch { return [] }
}

export async function getSubagents(): Promise<any> {
  try {
    const res = await fetch(`${PROXY}/api/subagents`)
    return await res.json()
  } catch { return { active: [], recent: [] } }
}

export async function getAgentMemory(agent: string): Promise<any> {
  try {
    const res = await fetch(`${PROXY}/api/agent-memory?agent=${agent}`)
    return await res.json()
  } catch { return null }
}

export async function invokeGatewayTool(tool: string, args: Record<string, unknown> = {}): Promise<unknown> {
  try {
    const res = await fetch(`${GATEWAY}/tools/invoke`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tool, args, sessionKey: 'main' }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.result?.details ?? null
  } catch { return null }
}

export async function readFile(_path: string): Promise<string | null> {
  return null
}
