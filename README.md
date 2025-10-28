# Home Assistant MCP Server

I couldn't get any of the HomeAssistant MCP servers to work properly, so I made my own.  
I use it to help develop for my own HA improvements and it's provided everything I need so far.
If you have any suggestions, feel free to reach out.

## Features

- List all automations
- Get automation details and configuration
- Trigger automations manually
- Enable/disable automations
- Create new automations
- Update existing automations
- Delete automations
- Reload automation configuration

## Installation

```bash
npm install -g ./
```

## Configuration

Set the following environment variables:

- `HA_URL`: Your Home Assistant URL (default: http://172.16.10.101:8123)
- `HA_TOKEN`: Your Home Assistant long-lived access token (required)

## Claude Desktop Configuration

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "homeassistant": {
      "command": "ha-mcp-server",
      "env": {
        "HA_URL": "http://ha.server.ip:8123",
        "HA_TOKEN": "your_long_lived_access_token_here"
      }
    }
  }
}
```

## Home Assistant Setup

1. Generate a long-lived access token:
   - Go to Settings → My → Security
   - Click "Create Token"
   - Copy the token

2. Ensure the config API is enabled (usually enabled by default)

## Tools Available

- `list_automations`: List all automations
- `get_automation`: Get details of a specific automation
- `trigger_automation`: Manually trigger an automation
- `toggle_automation`: Enable or disable an automation
- `create_automation`: Create a new automation
- `update_automation`: Update an existing automation
- `delete_automation`: Delete an automation
- `reload_automations`: Reload all automations

## Requirements

- Home Assistant with API access
- Node.js 18+
- Long-lived access token

Built by Barclay.works Ltd
