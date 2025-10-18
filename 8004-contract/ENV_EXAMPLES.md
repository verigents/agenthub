# Environment Configuration Examples for 8004 Contract Setup

## Basic Agent Registration (New Agent)

```bash
# Required
PRIVATE_KEY=0x1234567890abcdef...
RPC_URL=https://sepolia.infura.io/v3/your-api-key

# Agent Configuration
AGENT_NAME="atoa agent 1"
AGENT_DESCRIPTION="General-purpose agent registered via ERC-8004 demo."
AGENT_IMAGE="https://pub-0a8e790cc12d4cd7a9b7c526531d29ba.r2.dev/wan-video/images/generated/68c75a10eed778c3afcf907e/generated_image.png"
AGENT_BASE_URL="http://ec2-3-88-34-252.compute-1.amazonaws.com"
AGENT_PORT="3001"
SUPPORTED_TRUST="reputation"

# Optional
REGISTRY_ADDRESS=0x8004a6090Cd10A7288092483047B097295Fb8847
ENS_NAME="abcagent.orgtrust.eth"
AGENT_ACCOUNT="0x578F70CeA2976006CC85582A856fC0Ef646e879a"
```

## Update Existing Agent

```bash
# Required
PRIVATE_KEY=0x1234567890abcdef...
RPC_URL=https://sepolia.infura.io/v3/your-api-key

# Agent to Update
REGISTRY_ADDRESS=0x8004a6090Cd10A7288092483047B097295Fb8847
AGENT_ID=9

# New Configuration
AGENT_BASE_URL="https://your-new-domain.com"
AGENT_PORT="3001"

# Optional metadata updates
METADATA_KEY="agentBase"
METADATA_VALUE="https://your-new-domain.com:3001"
```

## Advanced Configuration with Multiple Trust Types

```bash
# Required
PRIVATE_KEY=0x1234567890abcdef...
RPC_URL=https://sepolia.infura.io/v3/your-api-key

# Agent Configuration
AGENT_NAME="Advanced ATOA Agent"
AGENT_DESCRIPTION="Advanced agent with multiple trust mechanisms"
AGENT_IMAGE="https://your-image-url.com/agent-image.png"
AGENT_BASE_URL="https://your-domain.com"
AGENT_PORT="3001"
SUPPORTED_TRUST="reputation,crypto-economic,tee-attestation"

# Optional Advanced Features
ENS_NAME="your-agent.eth"
AGENT_ACCOUNT="0xYourAgentAccountAddress"
```

## Usage Examples

### 1. Register New Agent
```bash
forge script script/SetupAgent.s.sol:SetupAgent \
  --rpc-url $RPC_URL --broadcast --private-key $PRIVATE_KEY \
  -vvvv
```

### 2. Update Existing Agent URI
```bash
forge script script/MetaDataChange.s.sol:MetaDataChange \
  --rpc-url $RPC_URL --broadcast --private-key $PRIVATE_KEY \
  -vvvv
```

### 3. Update Specific Agent ID
```bash
AGENT_ID=9 forge script script/MetaDataChange.s.sol:MetaDataChange \
  --rpc-url $RPC_URL --broadcast --private-key $PRIVATE_KEY \
  -vvvv
```

## Expected Agent Card JSON Output

Based on your configuration, the agent card JSON will be generated as:

```json
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "atoa agent 1",
  "description": "General-purpose agent registered via ERC-8004 demo.",
  "image": "https://pub-0a8e790cc12d4cd7a9b7c526531d29ba.r2.dev/wan-video/images/generated/68c75a10eed778c3afcf907e/generated_image.png",
  "endpoints": [
    {
      "name": "A2A",
      "endpoint": "http://ec2-3-88-34-252.compute-1.amazonaws.com:3001/.well-known/agent-card.json",
      "version": "0.3.0"
    },
    {
      "name": "ENS",
      "endpoint": "abcagent.orgtrust.eth",
      "version": "v1"
    },
    {
      "name": "agentAccount",
      "endpoint": "eip155:11155111:0x578F70CeA2976006CC85582A856fC0Ef646e879a",
      "version": "v1"
    }
  ],
  "registrations": [
    {
      "agentId": 9,
      "agentRegistry": "eip155:11155111:0x8004a6090Cd10A7288092483047B097295Fb8847"
    }
  ],
  "supportedTrust": [
    "reputation"
  ]
}
```

## Environment Variables for Agent Server

After running the setup script, use these environment variables in your agent server:

```bash
IDENTITY_REGISTRY=0x8004a6090Cd10A7288092483047B097295Fb8847
AGENT_ID=9
AGENT_NAME="atoa agent 1"
AGENT_BASE_URL="http://ec2-3-88-34-252.compute-1.amazonaws.com:3001"
CHAIN_ID=11155111
```

## Notes

- The `REGISTRY_ADDRESS` defaults to the Sepolia testnet registry
- If `AGENT_ID` is not provided, a new agent will be registered
- The `SUPPORTED_TRUST` field accepts comma-separated values
- ENS name and agent account are optional but will be included in endpoints if provided
- The script will output the exact environment variables needed for your agent server
