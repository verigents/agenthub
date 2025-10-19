"use client";

import React, { useState } from "react";
import AgentCard, { type Agent } from "@/components/AgentCard";
import AgentDetails from "@/components/AgentDetails";
import { type AgentGraph } from "@/components/FlowMap";

export default function Sidebar({
	selectedAgent,
	onCollapse,
	graph,
	onGraphUpdate,
}: {
	selectedAgent: Agent | null;
	onCollapse: () => void;
	graph?: AgentGraph | null;
	onGraphUpdate?: (g: AgentGraph) => void;
}) {
    const [tab] = useState<"details">("details");

	return (
		<div className="h-full min-h-0 grid grid-rows-[auto_auto_minmax(0,1fr)] bg-[#0b0c1a] text-white border-l border-white/10 overflow-hidden">
			<div className="flex items-center justify-between px-3 py-2 bg-[#0f1020]">
				<div className="font-bold tracking-wide">ATOA Panel</div>
				<button
					className="text-xs px-2 py-1 ring-1 ring-white/20"
					onClick={onCollapse}
				>
					Collapse
				</button>
			</div>
            <div className="px-3 py-2 text-sm bg-[#141532]">Details</div>
			<div className="h-full overflow-hidden min-h-0">
                <div className="p-3 h-full overflow-y-auto">
                    {selectedAgent ? (
                        <AgentDetails agent={selectedAgent} />
                    ) : (
                        <div className="text-sm text-white/70">Select an agent on the map to see details.</div>
                    )}
                </div>
			</div>
		</div>
	);
}


