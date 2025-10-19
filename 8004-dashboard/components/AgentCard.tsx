import React from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import type { AgentMeta } from "@/lib/subgraph";

export type Agent = {
  id: string;
  name: string;
  role?: string;
  score?: number;
  capabilities?: string[];
  image?: string;
  owner?: string;
  tokenURI?: string;
  meta?: AgentMeta | null;
};

function toHttpFromTokenUri(uri?: string): string | undefined {
  if (!uri) return uri;
  if (uri.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${uri.replace("ipfs://", "")}`;
  if (uri.startsWith("ar://")) return `https://arweave.net/${uri.replace("ar://", "")}`;
  return uri;
}

export default function AgentCard({ agent, highlight }: { agent: Agent; highlight?: boolean }) {
  const { address } = useAccount();
  const imgSrc = toHttpFromTokenUri(agent.image || agent.meta?.image);
  const supportedTrust: string[] = Array.isArray(agent.meta?.supportedTrust) ? agent.meta!.supportedTrust! : (agent.capabilities ?? []);
  const endpoints: { name?: string; endpoint?: string; version?: string }[] = Array.isArray(agent.meta?.endpoints) ? agent.meta.endpoints : [];

  return (
    <div className={`relative bg-[#0f1020] text-white ring-2 ${highlight ? "ring-[#00F5D4]" : "ring-[#4f46e5]"} p-0 shadow-[0_0_0_2px_#000]`}>
      {imgSrc ? (
        <img src={imgSrc} alt="agent" className="w-full h-40 object-cover object-center" />
      ) : null}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-widest text-[#a78bfa]">Agent</div>
          <div className="text-[10px] text-[#00F5D4]">#{agent.id}</div>
        </div>
        <div className="text-xl font-extrabold text-white leading-tight">{agent.name}</div>
        {agent.role ? (
          <div className="text-sm text-white/80 leading-relaxed">{agent.role}</div>
        ) : null}
        {supportedTrust?.length ? (
          <div className="flex flex-wrap gap-2">
            {supportedTrust.slice(0, 6).map((t) => (
              <span key={t} className="px-2 py-0.5 text-[11px] rounded bg-[#141532] ring-1 ring-white/15 text-white/80">{t}</span>
            ))}
          </div>
        ) : null}
        {endpoints?.length ? (
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-widest text-[#a78bfa]">Endpoints</div>
            <div className="grid gap-1">
              {endpoints.slice(0, 3).map((ep, i) => (
                <a key={i} href={ep.endpoint} target="_blank" rel="noreferrer" className="text-xs text-[#00BBF9] hover:underline break-all">
                  {ep.name || "Endpoint"}: {ep.endpoint}
                </a>
              ))}
            </div>
          </div>
        ) : null}
        <div className="text-[11px] text-white/60 break-all space-y-1">
          {agent.owner ? (<div>Owner: {agent.owner}</div>) : null}
          {agent.tokenURI ? (
            <div>
              JSON: <a className="underline text-[#00BBF9]" href={toHttpFromTokenUri(agent.tokenURI)} target="_blank" rel="noreferrer">{agent.tokenURI}</a>
            </div>
          ) : null}
        </div>
        <div className="flex gap-2 pt-1">
          <Link className="bg-[#00BBF9] text-black ring-2 ring-black px-3 py-2 text-sm font-bold" href="https://app.virtuals.io/acp" target="_blank">
            Interact
          </Link>
        </div>
      </div>
    </div>
  );
}
