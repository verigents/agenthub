export const SUBGRAPH_URL =
  (process.env.NEXT_PUBLIC_SUBGRAPH_URL ||
    "https://api.studio.thegraph.com/query/119832/8004-agents/version/latest").replace(/\/$/, "");

export type SubgraphAgent = {
  id: string;
  identityRegistry: string;
  agentId: string;
  owner: string;
  tokenURI: string;
  meta?: any;
  agentBase?: string;
};

function toHttpFromTokenUri(uri: string): string {
  if (!uri) return uri;
  if (uri.startsWith("ipfs://")) {
    const cid = uri.replace("ipfs://", "");
    return `https://ipfs.io/ipfs/${cid}`;
  }
  if (uri.startsWith("ar://")) {
    const id = uri.replace("ar://", "");
    return `https://arweave.net/${id}`;
  }
  return uri;
}

async function fetchJsonWithTimeout(url: string, ms = 8000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  } finally {
    clearTimeout(timer);
  }
}

function deriveAgentBaseFromMeta(meta: any): string {
  try {
    const endpoints = Array.isArray(meta?.endpoints) ? meta.endpoints : [];
    const first = endpoints[0];
    if (first?.endpoint) {
      const u = new URL(first.endpoint);
      return `${u.protocol}//${u.host}`;
    }
    if (typeof meta?.endpoint === "string") {
      const u = new URL(meta.endpoint);
      return `${u.protocol}//${u.host}`;
    }
  } catch {}
  return "";
}

export async function fetchAgentsFromSubgraph(first = 24): Promise<SubgraphAgent[]> {
  const query = `query Agents($first: Int!) { agents(first: $first, orderBy: createdAt, orderDirection: desc) { id identityRegistry agentId owner tokenURI } }`;
  const res = await fetch(SUBGRAPH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { first } }),
    next: { revalidate: 30 },
  });
  const json = await res.json().catch(() => ({} as any));
  const agents: SubgraphAgent[] = json?.data?.agents ?? [];

  // Enrich with metadata client-side
  const enriched = await Promise.all(
    agents.map(async (a) => {
      let meta: any = null;
      let agentBase = "";
      try {
        const url = toHttpFromTokenUri(a.tokenURI);
        if (url) {
          meta = await fetchJsonWithTimeout(url).catch(() => null);
          agentBase = deriveAgentBaseFromMeta(meta);
        }
      } catch {}
      return { ...a, meta, agentBase } as SubgraphAgent;
    })
  );

  return enriched;
}


