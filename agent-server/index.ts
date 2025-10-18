import { Hono } from "hono";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import "dotenv/config";

const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0,
});
const app = new Hono();

app.get("/", (c) => {
    const url = new URL(c.req.url);
    const origin = `${url.protocol}//${url.host}`;

    // Read env (with sensible defaults)
    const agentName = process.env.AGENT_NAME ?? "atoa agent 1";
    const imageUrl =
        process.env.IMAGE_URL ??
        "https://pub-0a8e790cc12d4cd7a9b7c526531d29ba.r2.dev/wan-video/images/generated/68c75a10eed778c3afcf907e/generated_image.png";
    const identityRegistry = process.env.IDENTITY_REGISTRY ?? ""; // REQUIRED to fill registrations
    const chainId = process.env.CHAIN_ID ?? "11155111"; // sepolia default
    const agentId = Number(process.env.AGENT_ID ?? "9"); // update after register

    const body = {
        type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
        name: agentName,
        description: "A2A agent for chatting with Web3 Agent",
        image: imageUrl,
        endpoints: [
            {
                name: "A2A",
                endpoint: `${origin}/.well-known/agent-card.json`,
                version: "0.3.0",
            },
            {
                name: "chat",
                endpoint: `${origin}/chat`,
                version: "0.3.0",
            },
        ],
        registrations: identityRegistry
            ? [
                {
                    agentId,
                    agentRegistry: `eip155:${chainId}:${identityRegistry}`,
                },
            ]
            : [],
        supportedTrust: ["reputation"],
    };

    return c.json(body);
});

app.post("/chat", async (c) => {
    const { question } = await c.req.json().catch(() => ({}) as any);
    console.log(question);
    if (!question) {
        return c.text("Question is required");
    }

    try {
        const res = await model.invoke(question);
        return c.json({ answer: res?.content ?? "" });
    } catch (e) {
        return c.json({ error: "Model invocation failed", detail: String(e) }, 500);
    }
});

// ERC-8004 Agent Registration file (served at a well-known URL)
app.get("/.well-known/agent-card.json", (c) => {
    // Infer base URL from request
    const url = new URL(c.req.url);
    const origin = `${url.protocol}//${url.host}`;

    // Read env (with sensible defaults)
    const agentName = process.env.AGENT_NAME ?? "atoa agent 1";
    const imageUrl =
        process.env.IMAGE_URL ??
        "https://pub-0a8e790cc12d4cd7a9b7c526531d29ba.r2.dev/wan-video/images/generated/68c75a10eed778c3afcf907e/generated_image.png";
    const identityRegistry = process.env.IDENTITY_REGISTRY ?? ""; // REQUIRED to fill registrations
    const chainId = process.env.CHAIN_ID ?? "11155111"; // sepolia default
    const agentId = Number(process.env.AGENT_ID ?? "0"); // update after register

    const body = {
        type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
        name: agentName,
        description: "General-purpose agent registered via ERC-8004 demo.",
        image: imageUrl,
        endpoints: [
            {
                name: "A2A",
                endpoint: `${origin}/.well-known/agent-card.json`,
                version: "0.3.0",
            },
        ],
        registrations: identityRegistry
            ? [
                {
                    agentId,
                    agentRegistry: `eip155:${chainId}:${identityRegistry}`,
                },
            ]
            : [],
        supportedTrust: ["reputation"],
    };

    return c.json(body);
});

export default {
    port : process.env.PORT ? Number(process.env.PORT) : 3001,
    fetch: app.fetch,
    handler: app.fetch,
    get: app.get,
    post: app.post,
    put: app.put,
    delete: app.delete,
    options: app.options,
    patch: app.patch,
};
