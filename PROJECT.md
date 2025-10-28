# Home Assistant MCP Server - Project Documentation

## Overview
A TypeScript-based Model Context Protocol (MCP) server that provides comprehensive Home Assistant integration for Claude Desktop. Enables Claude to directly control, monitor, and automate Home Assistant entities and services.

## Project Structure
```
ha-mcp-server/
├── src/
│   ├── index.ts           # Main MCP server implementation
│   ├── ha-client.ts       # Home Assistant API client
├── dist/                  # Compiled JavaScript output
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── test-tts.js           # TTS functionality test script
└── PROJECT.md            # This documentation
```

## Core Capabilities

### 1. Automation Management
- **List automations**: View all configured automations
- **Get automation details**: Inspect specific automation configuration
- **Trigger automations**: Manually execute automations
- **Toggle automations**: Enable/disable automations
- **Create/Update/Delete**: Full CRUD operations on automations
- **Reload automations**: Refresh automation configurations

### 2. Entity Management
- **List entities**: Browse all HA entities with optional domain filtering
- **Get entity details**: Inspect entity state and attributes
- **Entity history**: Retrieve historical data for entities
- **Call services**: Execute services on specific entities

### 3. Service Discovery & Execution
- **List services**: Discover all available HA services
- **Get service details**: Inspect service parameters and usage
- **Call services**: Execute any HA service with custom parameters

### 4. Event System
- **Get recent events**: Monitor HA event stream with filtering
- **Fire events**: Trigger custom events in HA
- **Event filtering**: Search events by type, time range

### 5. **TTS (Text-to-Speech) - NEW** 🔊
- **speak_text**: Speak text to specific or auto-discovered media players
- **announce_text**: Broadcast announcements to all compatible devices
- **list_tts_services**: Discover available TTS services and media players
- **Smart fallbacks**: Tries multiple TTS services automatically
- **Multi-device support**: Works with media_player, assist_satellite entities

## Configuration

### Environment Variables
```bash
# Required
export HA_URL="http://172.16.10.101:8123"        # Your Home Assistant URL
export HA_TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."     # Long-lived access token

# Optional
export HA_TIMEOUT="10000"                         # Request timeout (ms)
```

### Home Assistant Setup Requirements
1. **Long-lived access token** (Settings → People → Long-lived access tokens)
2. **Network access** from Claude Desktop machine to HA instance
3. **For TTS functionality**:
   - At least one `media_player` entity (e.g., `media_player.locho`)
   - TTS integration configured (Google Translate TTS works out of the box)

## Build & Development

### Setup
```bash
cd /home/bw-admin/mcp-servers/ha-mcp-server
npm install
```

### Build
```bash
npm run build          # Compile TypeScript to dist/
npm run dev           # Build and start server
npm start             # Start compiled server
```

### Testing TTS
```bash
export HA_URL="http://172.16.10.101:8123"
export HA_TOKEN="your_token_here"
node test-tts.js
```

## Claude Desktop Integration

### MCP Configuration
Add to Claude Desktop config (`.claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "ha-mcp-server": {
      "command": "node",
      "args": ["/home/bw-admin/mcp-servers/ha-mcp-server/dist/index.js"],
      "env": {
        "HA_URL": "http://172.16.10.101:8123",
        "HA_TOKEN": "your_long_lived_token_here"
      }
    }
  }
}
```

### Available Tools in Claude Desktop
- `list_automations` - Browse HA automations
- `get_automation` - Inspect automation details  
- `trigger_automation` - Execute automations
- `toggle_automation` - Enable/disable automations
- `create_automation` - Create new automations
- `update_automation` - Modify existing automations
- `delete_automation` - Remove automations
- `reload_automations` - Refresh automation config
- `list_entities` - Browse HA entities
- `get_entity` - Get entity details
- `call_service` - Execute HA services
- `get_entity_history` - Historical entity data
- `get_recent_events` - Monitor HA events
- `fire_event` - Trigger custom events
- `list_services` - Discover HA services
- `get_service_details` - Service documentation
- **`speak_text`** - TTS to specific media player 🔊
- **`announce_text`** - Broadcast announcements 🔊
- **`list_tts_services`** - TTS discovery 🔊

## TTS Implementation Details

### speak_text Tool
```typescript
// Usage in Claude Desktop
{
  "name": "speak_text",
  "arguments": {
    "text": "Hello from Claude!",
    "entity_id": "media_player.locho",  // Optional - auto-discovers if not specified
    "language": "en-US"                 // Optional
  }
}
```

### announce_text Tool  
```typescript
// Usage in Claude Desktop
{
  "name": "announce_text", 
  "arguments": {
    "text": "Important announcement from Claude!",
    "target": "all"  // Optional - broadcasts to all compatible devices
  }
}
```

### TTS Service Priority
1. **tts.google_translate_say** (primary - works out of the box)
2. **tts.cloud_say** (if HA Cloud configured)
3. **tts.speak** / **tts.google_say** (fallbacks)
4. **assist_satellite.announce** (for announcements)

### Auto-Discovery Logic
- **Media Players**: Finds first available `media_player.*` entity
- **TTS Services**: Tests multiple TTS services until one works
- **Fallback Strategy**: Graceful degradation if preferred services unavailable

## Architecture

### HomeAssistantClient (ha-client.ts)
- **Axios-based HTTP client** for HA REST API
- **Comprehensive error handling** with descriptive messages
- **Type-safe interfaces** for HA entities and responses
- **Auto-retry logic** for TTS service fallbacks
- **Smart entity discovery** for media players and TTS services

### MCP Server (index.ts)
- **Tool registration** with JSON Schema validation
- **Request routing** to appropriate client methods
- **Error handling** with user-friendly responses
- **Extensible architecture** for adding new capabilities

## Known Configurations

### User Setup
- **Home Assistant**: Running on `172.16.10.101:8123`
- **Primary Media Player**: `media_player.locho`
- **Network**: Bifrost infrastructure with Tailscale mesh
- **Development Environment**: WSL → Bifrost Docker setup

### Tested Scenarios
- ✅ Basic automation management
- ✅ Entity browsing and control
- ✅ Service discovery and execution
- ✅ TTS functionality with media_player.locho
- ✅ Multi-service TTS fallbacks
- ✅ Auto-discovery of media players

## Development Roadmap

### Current State (v1.0.0)
- Complete automation CRUD operations
- Full entity management
- Service discovery and execution
- Event monitoring and firing
- **TTS integration with smart fallbacks**

### Future Enhancements
- **Scene management** (activate, create scenes)
- **Area-based operations** (control all lights in room)
- **Device management** (device registry integration)
- **Template helpers** (evaluate HA templates)
- **Backup/restore** (configuration backup)
- **Dashboard integration** (read/modify dashboards)
- **Advanced TTS** (SSML support, voice selection)
- **Notification routing** (mobile app, email integrations)

## Troubleshooting

### Common Issues
1. **"HA_TOKEN environment variable is required"**
   - Set HA_TOKEN environment variable
   - Verify token is valid long-lived access token

2. **"No available media players found for TTS"**
   - Check `media_player.*` entities exist in HA
   - Verify media players are not in 'unavailable' state
   - Test with `media_player.locho` specifically

3. **"All TTS services failed"**
   - Verify TTS integration configured in HA
   - Check HA logs for TTS errors
   - Try `tts.google_translate_say` service manually in HA

4. **Connection errors**
   - Verify HA_URL is accessible from Claude Desktop machine
   - Check firewall/network restrictions
   - Test with curl: `curl -H "Authorization: Bearer $HA_TOKEN" "$HA_URL/api/"`

### Debug Commands
```bash
# Test HA connectivity
curl -H "Authorization: Bearer $HA_TOKEN" "$HA_URL/api/states" | jq length

# List media players
curl -H "Authorization: Bearer $HA_TOKEN" "$HA_URL/api/states" | jq '.[] | select(.entity_id | startswith("media_player"))'

# Test TTS service directly
curl -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  "$HA_URL/api/services/tts/google_translate_say" \
  -d '{"entity_id": "media_player.locho", "message": "Test message"}'
```

## Performance Notes
- **Response times**: Typically <200ms for entity operations
- **TTS latency**: 1-3 seconds depending on service and message length
- **Memory usage**: ~50MB for server process
- **Concurrent requests**: Handles multiple simultaneous Claude Desktop requests

---

**Last Updated**: 2025-07-01 | **Version**: 1.0.0 | **Status**: Production Ready + TTS Enhanced