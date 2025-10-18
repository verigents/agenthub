export const SERVER_URL = (process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3002").replace(/\/$/, "");

export type SubgraphAgent = {
  id: string;
  identityRegistry: string;
  agentId: string;
  owner: string;
  tokenURI: string;
  meta?: any;
  agentBase?: string;
};

export async function fetchAgents(first = 24): Promise<SubgraphAgent[]> {
  const res = await fetch(`${SERVER_URL}/agents?first=${first}&enrich=true`, { next: { revalidate: 30 } });
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({ agents: [] }));
  return Array.isArray(data?.agents) ? data.agents : [];
}


