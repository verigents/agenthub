"use client";
import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { fetchAgentsFromSubgraph } from "@/lib/subgraph";
import AgentCard from "@/components/AgentCard";
import FlowMap, { type AgentGraph } from "@/components/FlowMap";
import Sidebar from "@/components/Sidebar";

import type { SubgraphAgent } from "@/lib/subgraph";

export default function Home() {
	const [agents, setAgents] = React.useState<SubgraphAgent[]>([]);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);


	React.useEffect(() => {
		fetchAgentsFromSubgraph(24).then(setAgents).catch(() => setAgents([]));
	}, []);

	return (
		<div className="w-screen h-screen min-h-0 grid grid-rows-[auto_minmax(0,1fr)] bg-[#0b0c1a] text-white">
			<div className="flex items-center justify-between px-4 py-3 bg-[#0f1020] border-b border-white/10">
				<div className="font-bold tracking-wide">ATOA Agents</div>
				<ConnectButton chainStatus="icon" showBalance={false} />
			</div>

    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] min-h-0">
				<div className="h-full min-h-0">
					<FlowMap
						graph={{
						agents: agents.map((a) => ({ id: String(a.agentId), name: a.meta?.name || `Agent #${a.agentId}`, purpose: a.meta?.description || a.agentBase })),
							edges: [],
						} as AgentGraph}
						onSelect={(a) => {
							setSelectedId(a.id);
							requestAnimationFrame(() => {
								const el = listRef.current?.querySelector(`[data-agent-id="${a.id}"]`);
								(el as HTMLElement | undefined)?.scrollIntoView({ behavior: "smooth", block: "center" });
							});
						}}
					/>
				</div>
        <div className="h-full min-h-0">
          <Sidebar
            selectedAgent={
              selectedId
                ? {
                    id: String(selectedId),
							name: agents.find((x) => String(x.agentId) === String(selectedId))?.meta?.name || `Agent #${selectedId}`,
                    role:
							  agents.find((x) => String(x.agentId) === String(selectedId))?.meta?.description ||
							  agents.find((x) => String(x.agentId) === String(selectedId))?.agentBase ||
                      "Autonomous Service",
							image: agents.find((x) => String(x.agentId) === String(selectedId))?.meta?.image,
							owner: agents.find((x) => String(x.agentId) === String(selectedId))?.owner,
							tokenURI: agents.find((x) => String(x.agentId) === String(selectedId))?.tokenURI,
                  }
                : null
            }
            onCollapse={() => {}}
          />
        </div>
			</div>
		</div>
	);
}
