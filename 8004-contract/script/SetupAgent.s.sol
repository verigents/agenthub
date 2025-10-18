// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";

/**
 * Comprehensive agent setup script
 * 
 * Usage:
 * forge script script/SetupAgent.s.sol:SetupAgent \
 *   --rpc-url $RPC_URL --broadcast --private-key $PRIVATE_KEY \
 *   -vvvv
 * 
 * Environment variables:
 * - REGISTRY_ADDRESS: Address of existing IdentityRegistry (optional)
 * - AGENT_ID: Agent ID to update (optional, will register new if not provided)
 * - AGENT_NAME: Name of the agent
 * - AGENT_DESCRIPTION: Description of the agent
 * - AGENT_IMAGE: Image URL for the agent
 * - AGENT_BASE_URL: Base URL for the agent (e.g., https://your-domain.com)
 * - AGENT_PORT: Port number (optional, defaults to 3001)
 * - SUPPORTED_TRUST: Comma-separated list of supported trust types
 * - ENS_NAME: ENS name (optional)
 * - AGENT_ACCOUNT: Agent account address (optional)
 */
contract SetupAgent is Script {
    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(privateKey);

        // Get registry address (use existing or deploy new)
        address registryAddr = vm.envOr("REGISTRY_ADDRESS", address(0x8004a6090Cd10A7288092483047B097295Fb8847));
        IdentityRegistry registry;
        
        if (registryAddr == address(0)) {
            registry = new IdentityRegistry();
            registryAddr = address(registry);
            console.log("Deployed new IdentityRegistry:", registryAddr);
        } else {
            registry = IdentityRegistry(registryAddr);
            console.log("Using existing IdentityRegistry:", registryAddr);
        }

        // Configuration from environment variables
        string memory agentName = vm.envOr("AGENT_NAME", string("atoa agent 1"));
        string memory agentDescription = vm.envOr("AGENT_DESCRIPTION", string("General-purpose agent registered via ERC-8004 demo."));
        string memory agentImage = vm.envOr("AGENT_IMAGE", string("https://pub-0a8e790cc12d4cd7a9b7c526531d29ba.r2.dev/wan-video/images/generated/68c75a10eed778c3afcf907e/generated_image.png"));
        string memory agentBaseUrl = vm.envOr("AGENT_BASE_URL", string("http://ec2-3-88-34-252.compute-1.amazonaws.com"));
        string memory agentPort = vm.envOr("AGENT_PORT", string("3001"));
        string memory supportedTrust = vm.envOr("SUPPORTED_TRUST", string("reputation"));
        string memory ensName = vm.envOr("ENS_NAME", string("default.eth")); // Optional
        string memory agentAccount = vm.envOr("AGENT_ACCOUNT", string("0x0000000000000000000000000000000000000000")); // Optional

        // Construct the full agent URL
        string memory fullAgentUrl = string.concat(agentBaseUrl, ":", agentPort);
        string memory tokenURI = string.concat(fullAgentUrl, "/.well-known/agent-card.json");

        console.log("Agent Configuration:");
        console.log("  Name:", agentName);
        console.log("  Description:", agentDescription);
        console.log("  Image:", agentImage);
        console.log("  Base URL:", fullAgentUrl);
        console.log("  Token URI:", tokenURI);
        console.log("  Supported Trust:", supportedTrust);

        uint256 agentId;
        bool isNewRegistration = false;

        // Check if we're updating an existing agent or registering a new one
        try vm.envUint("AGENT_ID") returns (uint256 existingAgentId) {
            agentId = existingAgentId;
            console.log("Updating existing agent ID:", agentId);
            
            // Update the token URI
            registry.setAgentUri(agentId, tokenURI);
            console.log("Updated token URI for agent", agentId);
            
        } catch {
            // Register new agent
            isNewRegistration = true;
            console.log("Registering new agent...");
            
            // Prepare metadata entries
            IdentityRegistry.MetadataEntry[] memory metadata = new IdentityRegistry.MetadataEntry[](6);
            metadata[0] = IdentityRegistry.MetadataEntry({ key: "agentName", value: bytes(agentName) });
            metadata[1] = IdentityRegistry.MetadataEntry({ key: "description", value: bytes(agentDescription) });
            metadata[2] = IdentityRegistry.MetadataEntry({ key: "image", value: bytes(agentImage) });
            metadata[3] = IdentityRegistry.MetadataEntry({ key: "agentBase", value: bytes(fullAgentUrl) });
            metadata[4] = IdentityRegistry.MetadataEntry({ key: "supportedTrust", value: bytes(supportedTrust) });
            
            // Add ENS name if provided
            if (bytes(ensName).length > 0) {
                metadata[5] = IdentityRegistry.MetadataEntry({ key: "ensName", value: bytes(ensName) });
                console.log("  ENS Name:", ensName);
            } else {
                // Remove the last metadata entry if ENS is not provided
                IdentityRegistry.MetadataEntry[] memory finalMetadata = new IdentityRegistry.MetadataEntry[](5);
                for (uint256 i = 0; i < 5; i++) {
                    finalMetadata[i] = metadata[i];
                }
                metadata = finalMetadata;
            }
            
            // Add agent account if provided
            if (bytes(agentAccount).length > 0) {
                IdentityRegistry.MetadataEntry[] memory extendedMetadata = new IdentityRegistry.MetadataEntry[](metadata.length + 1);
                for (uint256 i = 0; i < metadata.length; i++) {
                    extendedMetadata[i] = metadata[i];
                }
                extendedMetadata[metadata.length] = IdentityRegistry.MetadataEntry({ key: "agentAccount", value: bytes(agentAccount) });
                metadata = extendedMetadata;
                console.log("  Agent Account:", agentAccount);
            }

            agentId = registry.register(tokenURI, metadata);
            console.log("Registered new agent with ID:", agentId);
        }

        // Display final configuration
        console.log("\n=== AGENT SETUP COMPLETE ===");
        console.log("Agent ID:", agentId);
        console.log("Owner:", registry.ownerOf(agentId));
        console.log("Token URI:", registry.tokenURI(agentId));
        console.log("Registry Address:", registryAddr);
        
        console.log("\n=== ENVIRONMENT VARIABLES FOR AGENT SERVER ===");
        console.log("IDENTITY_REGISTRY=", registryAddr);
        console.log("AGENT_ID=", agentId);
        console.log("AGENT_NAME=", agentName);
        console.log("AGENT_BASE_URL=", fullAgentUrl);
        console.log("CHAIN_ID=11155111");
        
        console.log("\n=== EXPECTED AGENT CARD JSON ===");
        console.log("{");
        console.log('  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",');
        console.log('  "name": "', agentName, '",');
        console.log('  "description": "', agentDescription, '",');
        console.log('  "image": "', agentImage, '",');
        console.log('  "endpoints": [');
        console.log('    {');
        console.log('      "name": "A2A",');
        console.log('      "endpoint": "', tokenURI, '",');
        console.log('      "version": "0.3.0"');
        console.log('    }');
        
        if (bytes(ensName).length > 0) {
            console.log('    ,{');
            console.log('      "name": "ENS",');
            console.log('      "endpoint": "', ensName, '",');
            console.log('      "version": "v1"');
            console.log('    }');
        }
        
        if (bytes(agentAccount).length > 0) {
            console.log('    ,{');
            console.log('      "name": "agentAccount",');
            console.log('      "endpoint": "eip155:11155111:', agentAccount, '",');
            console.log('      "version": "v1"');
            console.log('    }');
        }
        
        console.log('  ],');
        console.log('  "registrations": [');
        console.log('    {');
        console.log('      "agentId": ', agentId, ',');
        console.log('      "agentRegistry": "eip155:11155111:', registryAddr, '"');
        console.log('    }');
        console.log('  ],');
        console.log('  "supportedTrust": [');
        
        // Parse supported trust types
        string[] memory trustTypes = parseCommaSeparated(supportedTrust);
        for (uint256 i = 0; i < trustTypes.length; i++) {
            console.log('    "', trustTypes[i], '"');
            if (i < trustTypes.length - 1) {
                console.log('    ,');
            }
        }
        
        console.log('  ]');
        console.log('}');

        vm.stopBroadcast();
    }
    
    function parseCommaSeparated(string memory input) internal pure returns (string[] memory) {
        // Simple implementation - in production you might want a more robust parser
        bytes memory inputBytes = bytes(input);
        uint256 count = 1;
        
        // Count commas to determine array size
        for (uint256 i = 0; i < inputBytes.length; i++) {
            if (inputBytes[i] == ',') {
                count++;
            }
        }
        
        string[] memory result = new string[](count);
        uint256 currentIndex = 0;
        uint256 startIndex = 0;
        
        for (uint256 i = 0; i <= inputBytes.length; i++) {
            if (i == inputBytes.length || inputBytes[i] == ',') {
                bytes memory item = new bytes(i - startIndex);
                for (uint256 j = startIndex; j < i; j++) {
                    item[j - startIndex] = inputBytes[j];
                }
                result[currentIndex] = string(item);
                currentIndex++;
                startIndex = i + 1;
            }
        }
        
        return result;
    }
}
