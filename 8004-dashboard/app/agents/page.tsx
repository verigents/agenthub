"use client";

import React from "react";
import { usePublicClient, useReadContract } from "wagmi";
import { parseAbi } from "viem";
import AgentCard, { type Agent } from "@/components/AgentCard";
import { IDENTITY_REGISTRY_ADDRESS } from "@/lib/utils";

const identityAbi = parseAbi([
  "event Registered(uint256 indexed agentId, string tokenURI, address indexed owner)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
]);

export default function AgentsPage() {
  const publicClient = usePublicClient();
  const [agents, setAgents] = React.useState<Agent[]>([]);

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const latest = await publicClient.getBlockNumber();
        const from = latest - 200000n > 0n ? latest - 200000n : 0n; // scan recent range
        const logs = await publicClient.getLogs({
          address: IDENTITY_REGISTRY_ADDRESS as `0x${string}`,
          fromBlock: from,
          toBlock: latest,
          events: [{
            type: "event",
            inputs: [
              { indexed: true, name: "agentId", type: "uint256" },
              { indexed: false, name: "tokenURI", type: "string" },
              { indexed: true, name: "owner", type: "address" },
            ],
            name: "Registered",
          }],
        });
        const uniqueIds = Array.from(new Set(logs.map((l: any) => BigInt(l.args?.agentId as any).toString())));
        const list: Agent[] = await Promise.all(
          uniqueIds.map(async (id) => {
            try {
              const [owner, uri] = await Promise.all([
                publicClient.readContract({ address: IDENTITY_REGISTRY_ADDRESS as `0x${string}`, abi: identityAbi, functionName: "ownerOf", args: [BigInt(id)] }),
                publicClient.readContract({ address: IDENTITY_REGISTRY_ADDRESS as `0x${string}`, abi: identityAbi, functionName: "tokenURI", args: [BigInt(id)] }).catch(() => ""),
              ]);
              return { id, name: `Agent #${id}`, role: uri ? "URI set" : "No URI" } as Agent;
            } catch {
              return { id, name: `Agent #${id}` } as Agent;
            }
          })
        );
        if (mounted) setAgents(list);
      } catch {
        if (mounted) setAgents([]);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [publicClient]);

  return (
    <div className="p-6 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {agents.map((a) => (
        <AgentCard key={a.id} agent={a} />
      ))}
      {agents.length === 0 ? (
        <div className="text-white/70">No agents found in recent blocks.</div>
      ) : null}
    </div>
  );
}


