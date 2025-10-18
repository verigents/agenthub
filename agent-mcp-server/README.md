# Agent CMC Server

An ERC-8004 compliant agent server with MCP (Model Context Protocol) integration for enhanced tool capabilities.

## Installation

```bash
bun install
```

## Configuration

Create a `.env` file with the following variables:

### Basic Agent Configuration
```bash
AGENT_NAME="atoa agent 1"
IMAGE_URL="https://pub-0a8e790cc12d4cd7a9b7c526531d29ba.r2.dev/wan-video/images/generated/68c75a10eed778c3afcf907e/generated_image.png"
IDENTITY_REGISTRY=""
CHAIN_ID="11155111"
AGENT_ID="9"
GOOGLE_API_KEY="your-google-api-key-here"
```

### MCP Server Configuration

You can configure MCP servers in two ways:

#### Option 1: Single JSON string with all servers
```bash
MCP_SERVERS='{"math":{"command":"python","args":["/path/to/math_server.py"],"transport":"stdio"},"weather":{"url":"http://localhost:8000/sse","transport":"sse"}}'
```

#### Option 2: Individual server configurations
```bash
MCP_SERVER_MATH='{"command":"python","args":["/path/to/math_server.py"],"transport":"stdio"}'
MCP_SERVER_WEATHER='{"url":"http://localhost:8000/sse","transport":"sse"}'
```

### Example MCP Server Configurations

**Math Server (stdio transport):**
```bash
MCP_SERVER_MATH='{"command":"python","args":["/path/to/math_server.py"],"transport":"stdio"}'
```

**Weather Server (SSE transport):**
```bash
MCP_SERVER_WEATHER='{"url":"http://localhost:8000/sse","transport":"sse"}'
```

**File System Server (stdio transport):**
```bash
MCP_SERVER_FILES='{"command":"node","args":["/path/to/files_server.js"],"transport":"stdio"}'
```

**Database Server (stdio transport):**
```bash
MCP_SERVER_DB='{"command":"python","args":["/path/to/db_server.py"],"transport":"stdio"}'
```

## Running

```bash
bun run index.ts
```

## API Endpoints

- `GET /` - Agent registration information
- `POST /chat` - Chat endpoint with MCP tool support
- `GET /.well-known/agent-card.json` - ERC-8004 agent card

## Features

- **MCP Integration**: Automatically loads and uses tools from configured MCP servers
- **Fallback Support**: Falls back to basic model if MCP servers are not available
- **ERC-8004 Compliance**: Implements the Ethereum Agent Registration standard
- **Graceful Shutdown**: Properly closes MCP connections on termination

## Example MCP Server

Here's a simple Python MCP server example:

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Math")

@mcp.tool()
def add(a: int, b: int) -> int:
    """Add two numbers"""
    return a + b

@mcp.tool()
def multiply(a: int, b: int) -> int:
    """Multiply two numbers"""
    return a * b

if __name__ == "__main__":
    mcp.run(transport="stdio")
```

This project was created using `bun init` in bun v1.3.0. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
