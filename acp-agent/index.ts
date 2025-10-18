import dotenv from "dotenv";
import AcpClient, {
	AcpContractClient,
	AcpJob,
	AcpJobPhases,
	baseAcpConfigV2,
	baseSepoliaAcpConfigV2,
} from "@virtuals-protocol/acp-node";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Tool } from "@langchain/core/tools";

dotenv.config();

function cleanJobData(job: any) {
	return {
		id: job.id,
		name: job.name,
		phase: job.phase,
		price: job.price,
		clientAddress: job.clientAddress,
		providerAddress: job.providerAddress,
		requirement: job.requirement ?? null,
		memos: Array.isArray(job.memos)
			? job.memos.map((m: any) => ({
					id: m.id,
					type: m.type,
					content: m.content,
					nextPhase: m.nextPhase,
				}))
			: [],
		deliverables: Array.isArray(job.deliverables)
			? job.deliverables.map((d: any) => ({ type: d.type, value: d.value }))
			: [],
	};
}

class RespondToJobTool extends Tool {
	name = "respond_to_job";
	description = "Evaluate and respond to incoming job requests";
	async _call(input: string): Promise<string> {
		console.log("LangChain Seller: Evaluating job request", input);
		return "Job request evaluated and decision made";
	}
}

class DeliverJobTool extends Tool {
	name = "deliver_job";
	description = "Generate and deliver completed job results";
	async _call(input: string): Promise<string> {
		console.log("LangChain Seller: Preparing job delivery", input);
		return "Job delivery prepared";
	}
}

class BrowseAgentsTool extends Tool {
	name = "browse_agents";
	description =
		"Browse registered agents from the server (enriched with tokenURI metadata). Input: JSON { first?: number }";
	async _call(input: string): Promise<string> {
		try {
			const body = input ? JSON.parse(input) : {};
			const first = Number(body.first ?? 20);
			const base = process.env.SERVER_BASE_URL ?? "http://localhost:3000";
			const url = `${base.replace(/\/$/, "")}/agents?first=${first}&enrich=true`;
			const resp = await fetch(url);
			const data = await resp.json().catch(() => ({}));
			return JSON.stringify(data);
		} catch (e) {
			return `Error: ${String(e)}`;
		}
	}
}

class RouteAgentTool extends Tool {
	name = "route_agent";
	description =
		"Choose the best agent for a given description using the server router. Input: JSON { description: string }";
	async _call(input: string): Promise<string> {
		try {
			const body = input ? JSON.parse(input) : {};
			const description = String(body.description ?? "");
			if (!description) return `Error: description required`;
			const base = process.env.SERVER_BASE_URL ?? "http://localhost:3000";
			const url = `${base.replace(/\/$/, "")}/route`;
			const resp = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ description }),
			});
			const data = await resp.json().catch(() => ({}));
			return JSON.stringify(data);
		} catch (e) {
			return `Error: ${String(e)}`;
		}
	}
}

class CallAgentChatTool extends Tool {
	name = "call_agent_chat";
	description =
		"Call a chosen agent's /chat endpoint via the server. Input: JSON { agentBase: string, question: string }";
	async _call(input: string): Promise<string> {
		try {
			const body = input ? JSON.parse(input) : {};
			const agentBase = String(body.agentBase ?? "");
			const question = String(body.question ?? "");
			if (!agentBase || !question)
				return `Error: agentBase and question required`;
			const base = process.env.SERVER_BASE_URL ?? "http://localhost:3000";
			const url = `${base.replace(/\/$/, "")}/chat`;
			const resp = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ agentBase, question }),
			});
			const data = await resp.json().catch(() => ({}));
			return JSON.stringify(data);
		} catch (e) {
			return `Error: ${String(e)}`;
		}
	}
}

class NegotiatePriceTool extends Tool {
	name = "negotiate_price";
	description = "Evaluate and potentially negotiate the job price";
	async _call(input: string): Promise<string> {
		console.log("LangChain Seller: Evaluating price", input);
		return "Price looks acceptable";
	}
}

async function createSellerAgent() {
	const model = new ChatGoogleGenerativeAI({
		model: "gemini-2.5-flash",
		temperature: 0.7,
	});

	const tools = [
		new RespondToJobTool(),
		new DeliverJobTool(),
		new BrowseAgentsTool(),
		new RouteAgentTool(),
		new CallAgentChatTool(),
		new NegotiatePriceTool(),
	];

	const prompt = ChatPromptTemplate.fromMessages([
		[
			"system",
			`You are an autonomous seller agent in the ACP (Agent Commerce Protocol) system.
Your role is to fulfill buyer requests by browsing registered agents and calling their chat endpoints when appropriate.

Tools available:
- browse_agents: fetch enriched registry entries (includes tokenURI metadata and inferred agentBase when possible)
- route_agent: choose a suitable agent for a description
- call_agent_chat: send the buyer's question to the selected agent via the server

When a job arrives:
1. Read the requirement/description and decide whether to accept.
2. If browsing is requested or necessary, use browse_agents and/or route_agent to select an agent.
3. Once an agent is selected, call call_agent_chat with the question to get a response.
4. Prepare delivery content from the response.

Always think carefully and explain your reasoning.`,
		],
		["human", "{input}"],
		["placeholder", "{agent_scratchpad}"],
	]);

	const agent = createToolCallingAgent({ llm: model, tools, prompt });

	return new AgentExecutor({ agent, tools, verbose: true });
}

async function main() {
	const sellerAgent = await createSellerAgent();

	const pk = process.env.WHITELISTED_WALLET_PRIVATE_KEY as `0x${string}`;
	const entityId = parseInt(process.env.SELLER_ENTITY_ID || "0", 10);
	const sellerAddress = process.env
		.SELLER_AGENT_WALLET_ADDRESS as `0x${string}`;

	if (!pk || !entityId || !sellerAddress) {
		console.error(
			"Missing env: WHITELISTED_WALLET_PRIVATE_KEY, SELLER_ENTITY_ID, SELLER_AGENT_WALLET_ADDRESS",
		);
		process.exit(1);
	}

	const acpNetwork = String(process.env.ACP_NETWORK || "base").toLowerCase();
	const acpConfig = acpNetwork === "base-sepolia" || acpNetwork === "sepolia" ? baseSepoliaAcpConfigV2 : baseAcpConfigV2;
	console.log(
		`Using ACP network: ${acpNetwork} (contract: ${acpConfig.contractAddress})`,
	);

	new AcpClient({
		acpContractClient: await AcpContractClient.build(
			pk,
			entityId,
			sellerAddress,
		),
		onNewTask: async (job: AcpJob) => {
			console.log("[ACP] New task:", {
				id: job.id,
				phase: AcpJobPhases[job.phase],
				name: job.name,
			});
			try {
				const result = await sellerAgent.invoke({
					input: `New job update: ${JSON.stringify(cleanJobData(job))}.\nCurrent phase: ${job.phase}. What action should we take?`,
				});
				console.log("[LangChain] Decision:", result?.output ?? result);

				if (job.phase === AcpJobPhases.REQUEST) {
					await job.respond(true, "Accepting request");
					console.log(`[ACP] Job ${job.id} responded (accepted)`);
				} else if (job.phase === AcpJobPhases.TRANSACTION) {
					const output = String((result as any)?.output ?? "");
					let deliverable = output;
					try {
						const parsed = JSON.parse(output);
						if (parsed?.data) deliverable = JSON.stringify(parsed.data);
					} catch {}
					await job.deliver(deliverable || "No response");
					console.log(`[ACP] Job ${job.id} delivered`);
				}
			} catch (e) {
				console.error(e);
			}
		},
	});

	console.log("Seller ACP agent is listening for jobs...");
}

main();
