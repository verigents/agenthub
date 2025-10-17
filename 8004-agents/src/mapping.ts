// SPDX-License-Identifier: MIT
import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  Registered,
  MetadataSet,
  UriUpdated,
  Transfer,
  IdentityRegistry as IdentityRegistryContract
} from "../generated/IdentityRegistry/IdentityRegistry";
import { Agent, MetadataEvent, UriUpdatedEvent } from "../generated/schema";

function makeId(identity: Address, agentId: BigInt): string {
  return identity.toHexString() + ":" + agentId.toString();
}

export function handleRegistered(event: Registered): void {
  const identity = event.address;
  const agentId = event.params.agentId;
  const id = makeId(identity, agentId);

  const contract = IdentityRegistryContract.bind(identity);
  const owner = contract.ownerOf(agentId);
  const tokenURI = contract.tokenURI(agentId);

  let agent = new Agent(id);
  agent.identityRegistry = identity;
  agent.agentId = agentId;
  agent.owner = owner;
  agent.tokenURI = tokenURI;
  agent.createdAt = event.block.timestamp;
  agent.updatedAt = event.block.timestamp;
  agent.save();
}

export function handleMetadataSet(event: MetadataSet): void {
  const identity = event.address;
  const agentId = event.params.agentId;
  const id = makeId(identity, agentId);

  let agent = Agent.load(id);
  if (agent != null) {
    agent.updatedAt = event.block.timestamp;
    agent.save();
  }

  const metaId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let me = new MetadataEvent(metaId);
  me.identityRegistry = identity;
  me.agentId = agentId;
  me.key = event.params.key;
  me.value = event.params.value;
  me.txHash = event.transaction.hash;
  me.blockNumber = event.block.number;
  me.timestamp = event.block.timestamp;
  me.save();
}

export function handleUriUpdated(event: UriUpdated): void {
  const identity = event.address;
  const agentId = event.params.agentId;
  const id = makeId(identity, agentId);

  let agent = Agent.load(id);
  if (agent != null) {
    agent.tokenURI = event.params.newUri;
    agent.updatedAt = event.block.timestamp;
    agent.save();
  }

  const eId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let ue = new UriUpdatedEvent(eId);
  ue.identityRegistry = identity;
  ue.agentId = agentId;
  ue.newUri = event.params.newUri;
  ue.updatedBy = event.params.updatedBy;
  ue.txHash = event.transaction.hash;
  ue.blockNumber = event.block.number;
  ue.timestamp = event.block.timestamp;
  ue.save();
}

export function handleTransfer(event: Transfer): void {
  const identity = event.address;
  const agentId = event.params.tokenId;
  const id = makeId(identity, agentId);

  let agent = Agent.load(id);
  if (agent != null) {
    agent.owner = event.params.to;
    agent.updatedAt = event.block.timestamp;
    agent.save();
  }
}
