#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { HomeAssistantClient } from './ha-client.js';

class HomeAssistantMCPServer {
  private server: Server;
  private haClient: HomeAssistantClient;

  constructor() {
    this.server = new Server(
      {
        name: 'ha-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.haClient = new HomeAssistantClient();
    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'list_automations',
            description: 'List all Home Assistant automations',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_automation',
            description: 'Get details of a specific automation',
            inputSchema: {
              type: 'object',
              properties: {
                automation_id: {
                  type: 'string',
                  description: 'The ID of the automation (e.g., automation.living_room_lights)',
                },
              },
              required: ['automation_id'],
            },
          },
          {
            name: 'trigger_automation',
            description: 'Trigger an automation manually',
            inputSchema: {
              type: 'object',
              properties: {
                automation_id: {
                  type: 'string',
                  description: 'The ID of the automation to trigger',
                },
              },
              required: ['automation_id'],
            },
          },
          {
            name: 'toggle_automation',
            description: 'Enable or disable an automation',
            inputSchema: {
              type: 'object',
              properties: {
                automation_id: {
                  type: 'string',
                  description: 'The ID of the automation',
                },
                enabled: {
                  type: 'boolean',
                  description: 'Whether to enable (true) or disable (false) the automation',
                },
              },
              required: ['automation_id', 'enabled'],
            },
          },
          {
            name: 'create_automation',
            description: 'Create a new automation',
            inputSchema: {
              type: 'object',
              properties: {
                automation_config: {
                  type: 'object',
                  description: 'The automation configuration (YAML as object)',
                },
              },
              required: ['automation_config'],
            },
          },
          {
            name: 'update_automation',
            description: 'Update an existing automation',
            inputSchema: {
              type: 'object',
              properties: {
                automation_id: {
                  type: 'string',
                  description: 'The ID of the automation to update',
                },
                automation_config: {
                  type: 'object',
                  description: 'The new automation configuration',
                },
              },
              required: ['automation_id', 'automation_config'],
            },
          },
          {
            name: 'delete_automation',
            description: 'Delete an automation',
            inputSchema: {
              type: 'object',
              properties: {
                automation_id: {
                  type: 'string',
                  description: 'The ID of the automation to delete',
                },
              },
              required: ['automation_id'],
            },
          },
          {
            name: 'reload_automations',
            description: 'Reload all automations from configuration',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'list_entities',
            description: 'List all Home Assistant entities, optionally filtered by domain',
            inputSchema: {
              type: 'object',
              properties: {
                domain: {
                  type: 'string',
                  description: 'Filter entities by domain (e.g., light, switch, sensor)',
                },
              },
            },
          },
          {
            name: 'get_entity',
            description: 'Get detailed information about a specific entity',
            inputSchema: {
              type: 'object',
              properties: {
                entity_id: {
                  type: 'string',
                  description: 'The entity ID (e.g., light.living_room)',
                },
              },
              required: ['entity_id'],
            },
          },
          {
            name: 'call_service',
            description: 'Call a service on an entity',
            inputSchema: {
              type: 'object',
              properties: {
                entity_id: {
                  type: 'string',
                  description: 'The entity ID to call the service on',
                },
                service: {
                  type: 'string',
                  description: 'The service to call (e.g., turn_on, turn_off)',
                },
                service_data: {
                  type: 'object',
                  description: 'Additional service data (optional)',
                },
              },
              required: ['entity_id', 'service'],
            },
          },
          {
            name: 'get_entity_history',
            description: 'Get historical data for an entity',
            inputSchema: {
              type: 'object',
              properties: {
                entity_id: {
                  type: 'string',
                  description: 'The entity ID',
                },
                start_time: {
                  type: 'string',
                  description: 'Start time (ISO format, optional)',
                },
                end_time: {
                  type: 'string',
                  description: 'End time (ISO format, optional)',
                },
              },
              required: ['entity_id'],
            },
          },
          {
            name: 'get_recent_events',
            description: 'Get recent Home Assistant events',
            inputSchema: {
              type: 'object',
              properties: {
                event_type: {
                  type: 'string',
                  description: 'Filter by specific event type (optional)',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of events to return (default: 50)',
                },
                start_time: {
                  type: 'string',
                  description: 'Start time (ISO format, optional)',
                },
              },
            },
          },
          {
            name: 'fire_event',
            description: 'Fire a custom event in Home Assistant',
            inputSchema: {
              type: 'object',
              properties: {
                event_type: {
                  type: 'string',
                  description: 'The event type to fire',
                },
                event_data: {
                  type: 'object',
                  description: 'Event data payload (optional)',
                },
              },
              required: ['event_type'],
            },
          },
          {
            name: 'list_services',
            description: 'List all available Home Assistant services',
            inputSchema: {
              type: 'object',
              properties: {
                domain: {
                  type: 'string',
                  description: 'Filter services by specific domain (optional)',
                },
              },
            },
          },
          {
            name: 'get_service_details',
            description: 'Get detailed information about a specific service including call format',
            inputSchema: {
              type: 'object',
              properties: {
                service_name: {
                  type: 'string',
                  description: 'The full service name (e.g., assist_satellite.announce)',
                },
              },
              required: ['service_name'],
            },
          },
          {
            name: 'speak_text',
            description: 'Speak text using Home Assistant TTS to specified media player or all speakers',
            inputSchema: {
              type: 'object',
              properties: {
                text: {
                  type: 'string',
                  description: 'The text to speak',
                },
                entity_id: {
                  type: 'string',
                  description: 'Specific media player entity (optional, defaults to first available)',
                },
                language: {
                  type: 'string',
                  description: 'Language code (optional, e.g., en-US)',
                },
              },
              required: ['text'],
            },
          },
          {
            name: 'announce_text',
            description: 'Announce text to all compatible speakers/devices using HA announcement services',
            inputSchema: {
              type: 'object',
              properties: {
                text: {
                  type: 'string',
                  description: 'The text to announce',
                },
                target: {
                  type: 'string',
                  description: 'Target device/area (optional, defaults to all)',
                },
              },
              required: ['text'],
            },
          },
          {
            name: 'list_tts_services',
            description: 'List all available TTS services and media players',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'conversation_process',
            description: 'Process text through Home Assistant conversation service (supports Ollama/LLM)',
            inputSchema: {
              type: 'object',
              properties: {
                text: {
                  type: 'string',
                  description: 'The text/prompt to process',
                },
                conversation_id: {
                  type: 'string',
                  description: 'Conversation ID (optional, for context)',
                },
                agent_id: {
                  type: 'string',
                  description: 'Specific conversation agent ID (optional)',
                },
              },
              required: ['text'],
            },
          },
          {
            name: 'list_conversation_agents',
            description: 'List all available conversation agents (Ollama models, etc.)',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_automations':
            return await this.haClient.listAutomations();

          case 'get_automation':
            if (!args || typeof args !== 'object' || !('automation_id' in args)) {
              throw new Error('automation_id is required');
            }
            return await this.haClient.getAutomation(args.automation_id as string);

          case 'trigger_automation':
            if (!args || typeof args !== 'object' || !('automation_id' in args)) {
              throw new Error('automation_id is required');
            }
            return await this.haClient.triggerAutomation(args.automation_id as string);

          case 'toggle_automation':
            if (!args || typeof args !== 'object' || !('automation_id' in args) || !('enabled' in args)) {
              throw new Error('automation_id and enabled are required');
            }
            return await this.haClient.toggleAutomation(args.automation_id as string, args.enabled as boolean);

          case 'create_automation':
            if (!args || typeof args !== 'object' || !('automation_config' in args)) {
              throw new Error('automation_config is required');
            }
            return await this.haClient.createAutomation(args.automation_config as any);

          case 'update_automation':
            if (!args || typeof args !== 'object' || !('automation_id' in args) || !('automation_config' in args)) {
              throw new Error('automation_id and automation_config are required');
            }
            return await this.haClient.updateAutomation(args.automation_id as string, args.automation_config as any);

          case 'delete_automation':
            if (!args || typeof args !== 'object' || !('automation_id' in args)) {
              throw new Error('automation_id is required');
            }
            return await this.haClient.deleteAutomation(args.automation_id as string);

          case 'reload_automations':
            return await this.haClient.reloadAutomations();

          case 'list_entities':
            const domain = args && typeof args === 'object' && 'domain' in args ? args.domain as string : undefined;
            return await this.haClient.listEntities(domain);

          case 'get_entity':
            if (!args || typeof args !== 'object' || !('entity_id' in args)) {
              throw new Error('entity_id is required');
            }
            return await this.haClient.getEntity(args.entity_id as string);

          case 'call_service':
            if (!args || typeof args !== 'object' || !('entity_id' in args) || !('service' in args)) {
              throw new Error('entity_id and service are required');
            }
            const serviceData = args && typeof args === 'object' && 'service_data' in args ? args.service_data : undefined;
            return await this.haClient.callService(args.entity_id as string, args.service as string, serviceData);

          case 'get_entity_history':
            if (!args || typeof args !== 'object' || !('entity_id' in args)) {
              throw new Error('entity_id is required');
            }
            const startTime = args && typeof args === 'object' && 'start_time' in args ? args.start_time as string : undefined;
            const endTime = args && typeof args === 'object' && 'end_time' in args ? args.end_time as string : undefined;
            return await this.haClient.getEntityHistory(args.entity_id as string, startTime, endTime);

          case 'get_recent_events':
            const eventType = args && typeof args === 'object' && 'event_type' in args ? args.event_type as string : undefined;
            const limit = args && typeof args === 'object' && 'limit' in args ? args.limit as number : 50;
            const eventStartTime = args && typeof args === 'object' && 'start_time' in args ? args.start_time as string : undefined;
            return await this.haClient.getRecentEvents(eventType, limit, eventStartTime);

          case 'fire_event':
            if (!args || typeof args !== 'object' || !('event_type' in args)) {
              throw new Error('event_type is required');
            }
            const eventData = args && typeof args === 'object' && 'event_data' in args ? args.event_data : undefined;
            return await this.haClient.fireEvent(args.event_type as string, eventData);

          case 'list_services':
            const serviceDomain = args && typeof args === 'object' && 'domain' in args ? args.domain as string : undefined;
            return await this.haClient.listServices(serviceDomain);

          case 'get_service_details':
            if (!args || typeof args !== 'object' || !('service_name' in args)) {
              throw new Error('service_name is required');
            }
            return await this.haClient.getServiceDetails(args.service_name as string);

          case 'speak_text':
            if (!args || typeof args !== 'object' || !('text' in args)) {
              throw new Error('text is required');
            }
            const entityId = args && typeof args === 'object' && 'entity_id' in args ? args.entity_id as string : undefined;
            const language = args && typeof args === 'object' && 'language' in args ? args.language as string : undefined;
            return await this.haClient.speakText(args.text as string, entityId, language);

          case 'announce_text':
            if (!args || typeof args !== 'object' || !('text' in args)) {
              throw new Error('text is required');
            }
            const target = args && typeof args === 'object' && 'target' in args ? args.target as string : undefined;
            return await this.haClient.announceText(args.text as string, target);

          case 'list_tts_services':
            return await this.haClient.listTTSServices();

          case 'conversation_process':
            if (!args || typeof args !== 'object' || !('text' in args)) {
              throw new Error('text is required');
            }
            const conversationId = args && typeof args === 'object' && 'conversation_id' in args ? args.conversation_id as string : undefined;
            const agentId = args && typeof args === 'object' && 'agent_id' in args ? args.agent_id as string : undefined;
            return await this.haClient.conversationProcess(args.text as string, conversationId, agentId);

          case 'list_conversation_agents':
            return await this.haClient.listConversationAgents();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Home Assistant MCP server running on stdio');
  }
}

const server = new HomeAssistantMCPServer();
server.run().catch(console.error);