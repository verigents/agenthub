// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";

/**
 * forge script script/RegisterAgent.s.sol:RegisterAgent \
 *   --rpc-url $RPC_URL --broadcast --private-key $PRIVATE_KEY \
 *   -vvvv
 *
 * Optional: set REGISTRY_ADDRESS env var to use an existing IdentityRegistry.
 */
contract RegisterAgent is Script {
    function run() external {
        // Configuration (customize if needed)
        string memory baseUrl = vm.envOr("AGENT_BASE_URL", string("https://0d3bbc4b762c.ngrok-free.app"));
        string memory tokenURI = string.concat(baseUrl, "/.well-known/agent-card.json");
        string memory agentName = "atoa agent 1";
        string memory imageUrl = "https://pub-0a8e790cc12d4cd7a9b7c526531d29ba.r2.dev/wan-video/images/generated/68c75a10eed778c3afcf907e/generated_image.png";
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(privateKey);

        // Use existing registry if provided (Sepolia), otherwise deploy a fresh one
        address registryAddr = vm.envOr("REGISTRY_ADDRESS", address(0x8004a6090Cd10A7288092483047B097295Fb8847));
        IdentityRegistry registry;
        if (registryAddr == address(0)) {
            registry = new IdentityRegistry();
            registryAddr = address(registry);
            console2.log("Deployed IdentityRegistry:", registryAddr);
        } else {
            registry = IdentityRegistry(registryAddr);
            console2.log("Using IdentityRegistry:", registryAddr);
        }

        // Prepare on-chain metadata entries (free-form key -> bytes value)
        IdentityRegistry.MetadataEntry[] memory metadata = new IdentityRegistry.MetadataEntry[](3);
        metadata[0] = IdentityRegistry.MetadataEntry({ key: "agentName", value: bytes(agentName) });
        metadata[1] = IdentityRegistry.MetadataEntry({ key: "image", value: bytes(imageUrl) });
        metadata[2] = IdentityRegistry.MetadataEntry({ key: "homepage", value: bytes(baseUrl) });

        // Register the agent with tokenURI + metadata
        uint256 agentId = registry.register(tokenURI, metadata);

        console2.log("Registered agentId:", agentId);
        console2.log("Owner:", registry.ownerOf(agentId));
        console2.log("tokenURI:", registry.tokenURI(agentId));
        console2.log("NOTE: Set these envs in agent-server and restart:");
        console2.log("IDENTITY_REGISTRY:", registryAddr);
        console2.log("AGENT_ID:", agentId);

        vm.stopBroadcast();
    }
}


