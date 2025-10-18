// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";

/**
 * Script to update agent metadata and URI
 * 
 * Usage:
 * forge script script/MetaDataChange.s.sol:MetaDataChange \
 *   --rpc-url $RPC_URL --broadcast --private-key $PRIVATE_KEY \
 *   -vvvv
 * 
 * Environment variables:
 * - REGISTRY_ADDRESS: Address of IdentityRegistry
 * - AGENT_ID: Agent ID to update
 * - AGENT_BASE_URL: New base URL for the agent
 * - AGENT_PORT: Port number (optional, defaults to 3001)
 * - METADATA_KEY: Key for metadata to set (optional)
 * - METADATA_VALUE: Value for metadata to set (optional)
 */
contract MetaDataChange is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Get configuration from environment
        address registryAddr = vm.envOr("REGISTRY_ADDRESS", address(0x8004a6090Cd10A7288092483047B097295Fb8847));
        uint256 agentId = vm.envOr("AGENT_ID", uint256(9));
        string memory agentBaseUrl = vm.envOr("AGENT_BASE_URL", string("http://ec2-3-88-34-252.compute-1.amazonaws.com"));
        string memory agentPort = vm.envOr("AGENT_PORT", string("3001"));
        
        IdentityRegistry registry = IdentityRegistry(registryAddr);
        
        // Construct the full token URI
        string memory tokenURI = string.concat(agentBaseUrl, ":", agentPort, "/.well-known/agent-card.json");
        
        console.log("Updating agent configuration:");
        console.log("  Registry:", registryAddr);
        console.log("  Agent ID:", agentId);
        console.log("  Base URL:", agentBaseUrl);
        console.log("  Port:", agentPort);
        console.log("  Token URI:", tokenURI);
        
        // Update the token URI
        registry.setAgentUri(agentId, tokenURI);
        console.log("Updated token URI for agent", agentId);
        
        // Update metadata if provided
        try vm.envString("METADATA_KEY") returns (string memory metadataKey) {
            string memory metadataValue = vm.envString("METADATA_VALUE");
            registry.setMetadata(agentId, metadataKey, bytes(metadataValue));
            console.log("Updated metadata for agent", agentId, "key:", metadataKey, "value:", metadataValue);
        } catch {
            console.log("No metadata update requested");
        }
        
        // Display current agent info
        console.log("\n=== AGENT INFO ===");
        console.log("Agent ID:", agentId);
        console.log("Owner:", registry.ownerOf(agentId));
        console.log("Token URI:", registry.tokenURI(agentId));
        
        vm.stopBroadcast();
    }
}
