import { Hono } from "hono";
import { GraphQLClient, gql } from "graphql-request";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import "dotenv/config";

// Env
const GRAPH_API =
  process.env.GRAPH_API ??
  "https://api.studio.thegraph.com/query/119832/8004-agents/version/latest";
const GRAPH_API_KEY = process.env.GRAPH_API_KEY ?? ""; // optional
const BASE_CHAT_PREFIX = process.env.BASE_CHAT_PREFIX ?? ""; // e.g., https://your-ngrok

const graph = new GraphQLClient(GRAPH_API, {
  headers: GRAPH_API_KEY ? { Authorization: `Bearer ${GRAPH_API_KEY}` } : {},
});

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0,
});

const app = new Hono();

// Helpers
const toHttpFromTokenUri = (uri: string): string => {
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
};

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

const AGENTS_QUERY = gql`
  query Agents($first: Int!) {
    agents(first: $first, orderBy: createdAt, orderDirection: desc) {
      id
      identityRegistry
      agentId
      owner
      tokenURI
    }
  }
`;

app.get("/agents", async (c) => {
  const first = Number(c.req.query("first") ?? "20");
  const enrich = (c.req.query("enrich") ?? "true").toLowerCase() !== "false";
  const { agents } = await graph.request(AGENTS_QUERY, { first });

  if (!enrich) return c.json({ agents });

  const enriched = await Promise.all(
    agents.map(async (a: any) => {
      let meta: any = null;
      let agentBase = "";
      try {
        const url = toHttpFromTokenUri(a.tokenURI);
        if (url) {
          meta = await fetchJsonWithTimeout(url).catch(() => null);
          agentBase = deriveAgentBaseFromMeta(meta);
        }
      } catch {}
      return { ...a, meta, agentBase };
    })
  );

  return c.json({ agents: enriched });
});

app.post("/route", async (c) => {
  const body = await c.req.json().catch(() => ({}) as any);
  const description: string = body?.description ?? "";
  if (!description) return c.json({ error: "description required" }, 400);

  // Fetch top agents
  const { agents } = await graph.request(AGENTS_QUERY, { first: 25 });

  const prompt = `You are a router. Given a user description, choose the single best agent from this list.
Return JSON { agentId: string, reason: string }.
User: ${description}
Agents: ${JSON.stringify(agents)}
`;
  const res = await model.invoke(prompt);
  let choice: any = {};
  try {
    choice = JSON.parse(String(res.content));
  } catch { }

  return c.json({ choice, agents });
});

app.post("/chat", async (c) => {
  const body = await c.req.json().catch(() => ({}) as any);
  const agentBase: string = body?.agentBase ?? BASE_CHAT_PREFIX;
  const question: string = body?.question ?? "";
  if (!agentBase || !question)
    return c.json({ error: "agentBase and question required" }, 400);

  const resp = await fetch(`${agentBase.replace(/\/$/, "")}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  const data = await resp.json().catch(() => ({}));
  return c.json({ ok: resp.ok, data });
});

// Fetch and decode tokenURI JSON and derive a suggested base
app.get("/agent-meta", async (c) => {
  const tokenURI = c.req.query("tokenURI") ?? "";
  if (!tokenURI) return c.json({ error: "tokenURI required" }, 400);
  const url = toHttpFromTokenUri(tokenURI);
  try {
    const meta = await fetchJsonWithTimeout(url);
    const agentBase = deriveAgentBaseFromMeta(meta);
    return c.json({ meta, agentBase, source: url });
  } catch (e) {
    return c.json({ error: "Failed to fetch tokenURI", detail: String(e) }, 500);
  }
});

export default app;
