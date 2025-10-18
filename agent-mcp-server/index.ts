import { Hono } from "hono";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import "dotenv/config";

const model = new ChatGoogleGenerativeAI({
	model: "gemini-2.5-flash",
	temperature: 0,
});

// Parse MCP server configurations from environment variables
function parseMCPServers(): Record<string, any> {
	const mcpServers: Record<string, any> = {};

	// Parse MCP_SERVERS environment variable
	// Format: MCP_SERVERS='{"math":{"command":"python","args":["/path/to/math_server.py"],"transport":"stdio"},"weather":{"url":"http://localhost:8000/sse","transport":"sse"}}'
	const mcpServersEnvDemo = {
		"mcp-server-defillama": {
			command: "bunx",
			args: ["dcSpark/mcp-server-defillama"],
		},
	};

	try {
		const parsed = mcpServersEnvDemo;
		Object.assign(mcpServers, parsed);
	} catch (error) {
		console.error("Failed to parse MCP_SERVERS environment variable:", error);
	}

	// Parse individual MCP server configurations
	// Format: MCP_SERVER_MATH='{"command":"python","args":["/path/to/math_server.py"],"transport":"stdio"}'
	const envKeys = Object.keys(process.env);
	for (const key of envKeys) {
		if (key.startsWith("MCP_SERVER_")) {
			const serverName = key.replace("MCP_SERVER_", "").toLowerCase();
			try {
				const config = JSON.parse(process.env[key]!);
				mcpServers[serverName] = config;
			} catch (error) {
				console.error(`Failed to parse ${key} environment variable:`, error);
			}
		}
	}

	return mcpServers;
}

// Initialize MCP client and agent
let mcpClient: MultiServerMCPClient | null = null;
let agent: any = null;

async function initializeMCPAgent() {
	const mcpServers = parseMCPServers();

	if (Object.keys(mcpServers).length === 0) {
		console.log("No MCP servers configured. Running without MCP tools.");
		return;
	}

	try {
		console.log("Initializing MCP servers:", Object.keys(mcpServers));
		mcpClient = new MultiServerMCPClient({ mcpServers });

		const tools = await mcpClient.getTools();
		console.log(
			`Loaded ${tools.length} MCP tools:`,
			tools.map((t) => t.name),
		);

		agent = createReactAgent({
			llm: model,
			tools: tools,
		});

		console.log("MCP agent initialized successfully");
	} catch (error) {
		console.error("Failed to initialize MCP agent:", error);
		mcpClient = null;
		agent = null;
	}
}

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
		description:
			process.env.AGENT_DESCRIPTION ?? "A2A agent for chatting with Web3 Agent",
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
	console.log("Received question:", question);
	if (!question) {
		return c.text("Question is required");
	}

	try {
		let response;

		if (agent) {
			// Use MCP agent with tools
			console.log("Using MCP agent with tools");
			const result = await agent.invoke({
				messages: [{ role: "user", content: question }],
			});
			response = result.messages[result.messages.length - 1].content;
		} else {
			// Fallback to basic model without tools
			console.log("Using basic model without tools");
			const res = await model.invoke(question);
			response = res?.content ?? "";
		}

		return c.json({ answer: response });
	} catch (e) {
		console.error("Chat error:", e);
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
		description:
			process.env.AGENT_DESCRIPTION ??
			"General-purpose agent registered via ERC-8004 demo.",
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

initializeMCPAgent().catch(console.error);

// Graceful shutdown
process.on("SIGINT", async () => {
	console.log("Shutting down gracefully...");
	if (mcpClient) {
		await mcpClient.close();
	}
	process.exit(0);
});

process.on("SIGTERM", async () => {
	console.log("Shutting down gracefully...");
	if (mcpClient) {
		await mcpClient.close();
	}
	process.exit(0);
});

export default app;
