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
  const data = await graph.request(AGENTS_QUERY, { first });
  return c.json(data);
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

export default app;
