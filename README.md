# Home Assistant MCP Server

I couldn't get any of the HomeAssistant MCP servers to work properly, so I made my own.
I use it to help develop for my own HA improvements and it's provided everything I need so far.
If you have any suggestions, feel free to reach out.

A comprehensive Model Context Protocol (MCP) server for Home Assistant providing full control over automations, entities, services, events, TTS, and conversation agents.

## Features

**Automation Management:**
- List, create, update, and delete automations
- Trigger automations manually
- Enable/disable automations
- Reload automation configuration

**Entity Control:**
- List and filter entities by domain (lights, switches, sensors, etc.)
- Get detailed entity information and state
- Call services on entities (turn on/off, set values, etc.)
- Access entity history and historical data

**Events & Services:**
- Monitor recent Home Assistant events
- Fire custom events
- List all available services
- Get detailed service information and parameters

**TTS & Announcements:**
- Speak text through media players
- Announce to all compatible speakers/devices
- List available TTS services

**Conversation & LLM:**
- Process text through Home Assistant conversation service
- Support for Ollama and other LLM integrations
- List available conversation agents

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

### Automation Management
- `list_automations`: List all automations
- `get_automation`: Get details of a specific automation
- `trigger_automation`: Manually trigger an automation
- `toggle_automation`: Enable or disable an automation
- `create_automation`: Create a new automation
- `update_automation`: Update an existing automation
- `delete_automation`: Delete an automation
- `reload_automations`: Reload all automations

### Entity Control
- `list_entities`: List all entities, optionally filtered by domain
- `get_entity`: Get detailed information about a specific entity
- `call_service`: Call a service on an entity (turn_on, turn_off, etc.)
- `get_entity_history`: Get historical data for an entity

### Events
- `get_recent_events`: Get recent Home Assistant events
- `fire_event`: Fire a custom event in Home Assistant

### Services
- `list_services`: List all available Home Assistant services
- `get_service_details`: Get detailed information about a specific service

### TTS & Announcements
- `speak_text`: Speak text using Home Assistant TTS to media player
- `announce_text`: Announce text to all compatible speakers/devices
- `list_tts_services`: List all available TTS services and media players

### Conversation & LLM
- `conversation_process`: Process text through Home Assistant conversation service
- `list_conversation_agents`: List all available conversation agents (Ollama models, etc.)

## Requirements

- Home Assistant with API access
- Node.js 18+
- Long-lived access token

Built by Barclay.works Ltd
