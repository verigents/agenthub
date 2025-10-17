import dotenv from "dotenv";
import AcpClient, {
  AcpContractClientV2,
  AcpJob,
  AcpJobPhases,
} from "@virtuals-protocol/acp-node";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentExecutor, createOpenAIFunctionsAgent, createToolCallingAgent } from "langchain/agents";
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
      ? job.memos.map((m: any) => ({ id: m.id, type: m.type, content: m.content, nextPhase: m.nextPhase }))
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

class GenerateMemeTool extends Tool {
  name = "generate_meme";
  description = "Generate a meme based on the job requirements";
  async _call(_input: string): Promise<string> {
    console.log("LangChain Seller: Generating meme");
    return "https://example.com/meme.png";
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
    new GenerateMemeTool(),
    new NegotiatePriceTool(),
  ];

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are an autonomous seller agent in the ACP (Agent Commerce Protocol) system.
Your role is to provide high-quality meme generation services.

You should:
1. Carefully evaluate incoming job requests
2. Consider the requirements, price, and buyer's needs
3. Make informed decisions about accepting or rejecting jobs
4. Generate appropriate memes based on requirements
5. Deliver high-quality results in a timely manner

Guidelines:
- Accept jobs that align with your capabilities and have reasonable requirements
- Consider the offered price relative to the work required
- Ensure you can deliver quality results on time
- Be professional in communications
- Maintain high standards for your meme generation service

Always think carefully and explain your reasoning.`,
    ],
    ["human", "{input}"],
    ["placeholder", "{agent_scratchpad}"],
  ]);

  const agent = await createToolCallingAgent({ llm: model, tools, prompt });

  return new AgentExecutor({ agent, tools, verbose: true });
}

async function main() {
  const sellerAgent = await createSellerAgent();

  const pk = process.env.WHITELISTED_WALLET_PRIVATE_KEY as `0x${string}`;
  const entityId = parseInt(process.env.SELLER_ENTITY_ID || "0", 10);
  const sellerAddress = process.env.SELLER_AGENT_WALLET_ADDRESS as `0x${string}`;

  if (!pk || !entityId || !sellerAddress) {
    console.error("Missing env: WHITELISTED_WALLET_PRIVATE_KEY, SELLER_ENTITY_ID, SELLER_AGENT_WALLET_ADDRESS");
    process.exit(1);
  }

  new AcpClient({
    acpContractClient: await AcpContractClientV2.build(pk, entityId, sellerAddress),
    onNewTask: async (job: AcpJob) => {
      console.log("[ACP] New task:", { id: job.id, phase: AcpJobPhases[job.phase], name: job.name });
      try {
        const result = await sellerAgent.invoke({
          input: `New job update: ${JSON.stringify(cleanJobData(job))}.\nCurrent phase: ${job.phase}. What action should we take?`,
        });
        console.log("[LangChain] Decision:", result?.output ?? result);

        if (job.phase === AcpJobPhases.REQUEST) {
          await job.respond(true, "Accepting request");
          console.log(`[ACP] Job ${job.id} responded (accepted)`);
        } else if (job.phase === AcpJobPhases.TRANSACTION) {
          // Deliver a URL as the result (replace with actual generated artifact)
          await job.deliver("https://example.com/meme.png");
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

