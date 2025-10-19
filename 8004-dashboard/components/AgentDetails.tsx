"use client";

import React from "react";
import AgentCard, { type Agent } from "@/components/AgentCard";
import { Button } from "@/components/ui/button";
import { useAccount, useWriteContract } from "wagmi";
import { parseAbi, toHex } from "viem";
import { IDENTITY_REGISTRY_ADDRESS } from "@/lib/utils";

const identityAbi = parseAbi([
  "function setMetadata(uint256 agentId, string key, bytes value)",
  "function setAgentUri(uint256 agentId, string newUri)",
]);

export default function AgentDetails({ agent }: { agent: Agent }) {
  const { address } = useAccount();
  const isOwner = !!agent.owner && !!address && agent.owner.toLowerCase() === address.toLowerCase();
  const { writeContract, isPending } = useWriteContract();

  const [metaKey, setMetaKey] = React.useState("");
  const [metaValue, setMetaValue] = React.useState("");
  const [newUri, setNewUri] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  function onSetMetadata() {
    setError(null); setOk(null);
    if (!metaKey) { setError("Key required"); return; }
    try {
      writeContract({
        abi: identityAbi,
        address: IDENTITY_REGISTRY_ADDRESS as `0x${string}`,
        functionName: "setMetadata",
        args: [BigInt(agent.id), metaKey, toHex(metaValue)],
      }, {
        onSuccess: () => setOk("Metadata updated"),
        onError: (e) => setError(e.message || "Failed"),
      });
    } catch (e: unknown) {
      const message = typeof e === "object" && e && "message" in e ? String((e as { message?: unknown }).message) : String(e);
      setError(message || "Failed");
    }
  }

  function onSetUri() {
    setError(null); setOk(null);
    if (!newUri) { setError("URI required"); return; }
    try {
      writeContract({
        abi: identityAbi,
        address: IDENTITY_REGISTRY_ADDRESS as `0x${string}`,
        functionName: "setAgentUri",
        args: [BigInt(agent.id), newUri],
      }, {
        onSuccess: () => setOk("Token URI updated"),
        onError: (e) => setError(e.message || "Failed"),
      });
    } catch (e: unknown) {
      const message = typeof e === "object" && e && "message" in e ? String((e as { message?: unknown }).message) : String(e);
      setError(message || "Failed");
    }
  }

  return (
    <div className="space-y-4">
      <AgentCard agent={agent} highlight />
      <div className="bg-[#0f1020] ring-1 ring-white/10 p-3">
        <div className="text-xs uppercase tracking-widest text-[#a78bfa]">Ownership</div>
        <div className="mt-1 text-sm text-white/80">{isOwner ? "You own this agent" : "Read-only (not owned)"}</div>
      </div>

      {isOwner ? (
        <div className="space-y-3 bg-[#0f1020] ring-1 ring-white/10 p-3">
          <div className="text-xs uppercase tracking-widest text-[#a78bfa]">Update Metadata</div>
          <div className="grid gap-2">
            <input className="px-3 py-2 bg-[#11132a] ring-1 ring-white/10 outline-none" placeholder="key" value={metaKey} onChange={(e) => setMetaKey(e.target.value)} />
            <input className="px-3 py-2 bg-[#11132a] ring-1 ring-white/10 outline-none" placeholder="value (utf-8)" value={metaValue} onChange={(e) => setMetaValue(e.target.value)} />
            <Button onClick={onSetMetadata} disabled={isPending} className="bg-[#00F5D4] text-black ring-2 ring-black">{isPending ? "Submitting…" : "Set Metadata"}</Button>
          </div>
          <div className="h-px bg-white/10" />
          <div className="text-xs uppercase tracking-widest text-[#a78bfa]">Update Token URI</div>
          <div className="grid gap-2">
            <input className="px-3 py-2 bg-[#11132a] ring-1 ring-white/10 outline-none" placeholder="https://… (agent card JSON)" value={newUri} onChange={(e) => setNewUri(e.target.value)} />
            <Button onClick={onSetUri} disabled={isPending} className="bg-[#FEE440] text-black ring-2 ring-black">{isPending ? "Submitting…" : "Set URI"}</Button>
          </div>
          {error ? <div className="text-xs text-red-400">{error}</div> : null}
          {ok ? <div className="text-xs text-green-400">{ok}</div> : null}
        </div>
      ) : null}
    </div>
  );
}


