import axios, { AxiosInstance } from 'axios';

export interface AutomationEntity {
  entity_id: string;
  state: string;
  attributes: {
    id?: string;
    friendly_name?: string;
    last_triggered?: string;
    mode?: string;
    current?: number;
    max?: number;
  };
  last_changed: string;
  last_updated: string;
}

export interface AutomationConfig {
  id?: string;
  alias?: string;
  description?: string;
  trigger: any[];
  condition?: any[];
  action: any[];
  mode?: string;
  max?: number;
  max_exceeded?: string;
}

export class HomeAssistantClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = process.env.HA_URL || 'http://172.16.10.101:8123';
    this.token = process.env.HA_TOKEN || '';

    if (!this.token) {
      throw new Error('HA_TOKEN environment variable is required');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  async listAutomations() {
    try {
      const response = await this.client.get('/api/states');
      const automations = response.data.filter((entity: any) => 
        entity.entity_id.startsWith('automation.')
      );

      return {
        content: [
          {
            type: 'text',
            text: `Found ${automations.length} automations:\n\n` +
              automations.map((auto: AutomationEntity) => 
                `• ${auto.entity_id}: ${auto.attributes.friendly_name || 'No name'} (${auto.state})`
              ).join('\n'),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list automations: ${error}`);
    }
  }

  async getAutomation(automationId: string) {
    try {
      // Get entity state
      const stateResponse = await this.client.get(`/api/states/${automationId}`);
      const entity = stateResponse.data;

      // Try to get config if available
      let config = null;
      try {
        const configId = entity.attributes.id;
        if (configId) {
          const configResponse = await this.client.get(`/api/config/automation/config/${configId}`);
          config = configResponse.data;
        }
      } catch (configError) {
        // Config API might not be available
      }

      return {
        content: [
          {
            type: 'text',
            text: `Automation: ${automationId}\n` +
              `Name: ${entity.attributes.friendly_name || 'No name'}\n` +
              `State: ${entity.state}\n` +
              `Last triggered: ${entity.attributes.last_triggered || 'Never'}\n` +
              `Mode: ${entity.attributes.mode || 'single'}\n` +
              (config ? `\nConfiguration:\n${JSON.stringify(config, null, 2)}` : '\nConfiguration not available via API'),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get automation ${automationId}: ${error}`);
    }
  }

  async triggerAutomation(automationId: string) {
    try {
      await this.client.post('/api/services/automation/trigger', {
        entity_id: automationId,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Successfully triggered automation: ${automationId}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to trigger automation ${automationId}: ${error}`);
    }
  }

  async toggleAutomation(automationId: string, enabled: boolean) {
    try {
      const service = enabled ? 'turn_on' : 'turn_off';
      await this.client.post(`/api/services/automation/${service}`, {
        entity_id: automationId,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Successfully ${enabled ? 'enabled' : 'disabled'} automation: ${automationId}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to ${enabled ? 'enable' : 'disable'} automation ${automationId}: ${error}`);
    }
  }

  async createAutomation(config: AutomationConfig) {
    try {
      const response = await this.client.post('/api/config/automation/config', config);

      return {
        content: [
          {
            type: 'text',
            text: `Successfully created automation: ${config.alias || config.id}\n` +
              `Response: ${JSON.stringify(response.data, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to create automation: ${error}`);
    }
  }

  async updateAutomation(automationId: string, config: AutomationConfig) {
    try {
      // Extract ID from entity_id if needed
      const configId = automationId.replace('automation.', '');
      
      const response = await this.client.put(`/api/config/automation/config/${configId}`, config);

      return {
        content: [
          {
            type: 'text',
            text: `Successfully updated automation: ${automationId}\n` +
              `Response: ${JSON.stringify(response.data, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to update automation ${automationId}: ${error}`);
    }
  }

  async deleteAutomation(automationId: string) {
    try {
      // Extract ID from entity_id if needed
      const configId = automationId.replace('automation.', '');
      
      await this.client.delete(`/api/config/automation/config/${configId}`);

      return {
        content: [
          {
            type: 'text',
            text: `Successfully deleted automation: ${automationId}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to delete automation ${automationId}: ${error}`);
    }
  }

  async reloadAutomations() {
    try {
      await this.client.post('/api/services/automation/reload');

      return {
        content: [
          {
            type: 'text',
            text: 'Successfully reloaded all automations',
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to reload automations: ${error}`);
    }
  }

  async listEntities(domain?: string) {
    try {
      const response = await this.client.get('/api/states');
      let entities = response.data;

      if (domain) {
        entities = entities.filter((entity: any) => 
          entity.entity_id.startsWith(`${domain}.`)
        );
      }

      const entityList = entities.map((entity: any) => ({
        entity_id: entity.entity_id,
        name: entity.attributes.friendly_name || entity.entity_id.split('.')[1],
        state: entity.state,
        domain: entity.entity_id.split('.')[0],
        last_changed: entity.last_changed,
        last_updated: entity.last_updated,
      }));

      return {
        content: [
          {
            type: 'text',
            text: `Found ${entityList.length} entities${domain ? ` in domain '${domain}'` : ''}:\n\n` +
              entityList.slice(0, 50).map((entity: any) => 
                `• ${entity.entity_id}: ${entity.name} (${entity.state})`
              ).join('\n') +
              (entityList.length > 50 ? `\n\n... and ${entityList.length - 50} more entities` : ''),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list entities: ${error}`);
    }
  }

  async getEntity(entityId: string) {
    try {
      const response = await this.client.get(`/api/states/${entityId}`);
      const entity = response.data;

      return {
        content: [
          {
            type: 'text',
            text: `Entity: ${entityId}\n` +
              `Name: ${entity.attributes.friendly_name || 'No name'}\n` +
              `State: ${entity.state}\n` +
              `Domain: ${entity.entity_id.split('.')[0]}\n` +
              `Last changed: ${entity.last_changed}\n` +
              `Last updated: ${entity.last_updated}\n\n` +
              `Attributes:\n${JSON.stringify(entity.attributes, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get entity ${entityId}: ${error}`);
    }
  }

  async callService(entityId: string, service: string, serviceData?: any) {
    try {
      const domain = entityId.split('.')[0];
      
      const requestBody = {
        entity_id: entityId,
        ...serviceData,
      };

      await this.client.post(`/api/services/${domain}/${service}`, requestBody);

      return {
        content: [
          {
            type: 'text',
            text: `Successfully called ${domain}.${service} on ${entityId}` +
              (serviceData ? `\nWith data: ${JSON.stringify(serviceData, null, 2)}` : ''),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to call service ${service} on ${entityId}: ${error}`);
    }
  }

  async getEntityHistory(entityId: string, startTime?: string, endTime?: string) {
    try {
      // Default to last 24 hours if no times specified
      const end = endTime ? new Date(endTime) : new Date();
      const start = startTime ? new Date(startTime) : new Date(end.getTime() - 24 * 60 * 60 * 1000);

      const startTimestamp = start.toISOString();
      const endTimestamp = end.toISOString();

      const response = await this.client.get(
        `/api/history/period/${startTimestamp}?filter_entity_id=${entityId}&end_time=${endTimestamp}`
      );

      const history = response.data[0] || [];

      return {
        content: [
          {
            type: 'text',
            text: `History for ${entityId}\n` +
              `Period: ${startTimestamp} to ${endTimestamp}\n` +
              `Found ${history.length} state changes:\n\n` +
              history.slice(0, 20).map((state: any) => 
                `${state.last_changed}: ${state.state} (${state.attributes?.friendly_name || 'No name'})`
              ).join('\n') +
              (history.length > 20 ? `\n\n... and ${history.length - 20} more entries` : ''),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get history for ${entityId}: ${error}`);
    }
  }

  async getRecentEvents(eventType?: string, limit: number = 50, startTime?: string) {
    try {
      // Default to last hour if no start time specified
      const start = startTime ? new Date(startTime) : new Date(Date.now() - 60 * 60 * 1000);
      const startTimestamp = start.toISOString();
      
      // Use logbook API for events - more comprehensive than pure event API
      let url = `/api/logbook/${startTimestamp}`;
      const response = await this.client.get(url);
      let events = response.data;

      // Filter by event type if specified
      if (eventType) {
        events = events.filter((event: any) => 
          event.domain === eventType || 
          event.entity_id?.startsWith(`${eventType}.`) ||
          event.message?.toLowerCase().includes(eventType.toLowerCase())
        );
      }

      // Limit results
      events = events.slice(0, limit);

      return {
        content: [
          {
            type: 'text',
            text: `Found ${events.length} recent events${eventType ? ` related to '${eventType}'` : ''}:\n\n` +
              events.map((event: any) => 
                `${event.when}: ${event.name || event.entity_id || 'Unknown'} - ${event.message || event.state || 'No message'}`
              ).join('\n') +
              (events.length === limit ? `\n\n(Limited to ${limit} most recent events)` : ''),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get recent events: ${error}`);
    }
  }

  async fireEvent(eventType: string, eventData?: any) {
    try {
      const response = await this.client.post(`/api/events/${eventType}`, eventData || {});

      return {
        content: [
          {
            type: 'text',
            text: `Successfully fired event: ${eventType}` +
              (eventData ? `\nWith data: ${JSON.stringify(eventData, null, 2)}` : '') +
              `\nResponse: ${JSON.stringify(response.data, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to fire event ${eventType}: ${error}`);
    }
  }

  async listServices(domain?: string) {
    try {
      const response = await this.client.get('/api/services');
      const services = response.data;

      // Debug the actual response structure
      const debugInfo = `Services API response type: ${typeof services}, isArray: ${Array.isArray(services)}, length: ${Array.isArray(services) ? services.length : 'N/A'}\nFirst few items: ${JSON.stringify(Array.isArray(services) ? services.slice(0, 3) : services, null, 2)}`;

      // Handle both array and object formats
      let serviceList: any[] = [];
      let domains: string[] = [];

      if (Array.isArray(services)) {
        // Handle array format - each item should be a domain object
        services.forEach((domainInfo: any) => {
          if (domainInfo && domainInfo.domain && domainInfo.services) {
            const serviceDomain = domainInfo.domain;
            domains.push(serviceDomain);
            
            // Process services in this domain
            Object.keys(domainInfo.services).forEach(serviceName => {
              const serviceDetails = domainInfo.services[serviceName] || {};
              serviceList.push({
                domain: serviceDomain,
                service: serviceName,
                name: serviceDetails.name || serviceName,
                description: serviceDetails.description || 'No description available',
                fields: serviceDetails.fields || {},
                full_service_name: `${serviceDomain}.${serviceName}`,
              });
            });
          }
        });
      } else if (services && typeof services === 'object') {
        // Handle object format - keys are domains
        domains = Object.keys(services);
        
        domains.forEach(serviceDomain => {
          const domainServices = services[serviceDomain];
          
          if (domainServices && typeof domainServices === 'object') {
            const serviceNames = Object.keys(domainServices);
            
            serviceNames.forEach(serviceName => {
              const serviceDetails = domainServices[serviceName] || {};
              serviceList.push({
                domain: serviceDomain,
                service: serviceName,
                name: serviceDetails.name || serviceName,
                description: serviceDetails.description || 'No description available',
                fields: serviceDetails.fields || {},
                full_service_name: `${serviceDomain}.${serviceName}`,
              });
            });
          }
        });
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `Error: Services API returned unexpected format.\n\nDebug info:\n${debugInfo}`,
            },
          ],
        };
      }

      // Filter by domain if specified
      if (domain) {
        serviceList = serviceList.filter(service => service.domain === domain);
      }

      // Sort by domain then service name
      serviceList.sort((a, b) => {
        if (a.domain !== b.domain) {
          return a.domain.localeCompare(b.domain);
        }
        return a.service.localeCompare(b.service);
      });

      // Create output with better formatting
      const output = serviceList.map(service => {
        let serviceInfo = `• ${service.full_service_name}`;
        if (service.name && service.name !== service.service) {
          serviceInfo += ` (${service.name})`;
        }
        serviceInfo += `\n  ${service.description}`;
        
        const fieldKeys = Object.keys(service.fields);
        if (fieldKeys.length > 0) {
          serviceInfo += `\n  Fields: ${fieldKeys.join(', ')}`;
        }
        
        return serviceInfo;
      }).join('\n\n');

      const summary = `Found ${serviceList.length} services across ${domains.length} domains${domain ? ` (filtered to '${domain}')` : ''}`;
      
      // If filtering for assist_satellite specifically, highlight if found
      if (domain === 'assist_satellite') {
        const assistServices = serviceList.filter(s => s.domain === 'assist_satellite');
        if (assistServices.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No assist_satellite services found.\n\nAll available domains:\n${domains.sort().join(', ')}\n\nLook for similar domains like 'assist', 'voice', 'conversation', etc.`,
              },
            ],
          };
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `${summary}\n\n${output}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to list services: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  async getServiceDetails(serviceName: string) {
    try {
      const [domain, service] = serviceName.split('.');
      if (!domain || !service) {
        throw new Error('Service name must be in format "domain.service"');
      }

      const response = await this.client.get('/api/services');
      const services = response.data;

      if (!services[domain] || !services[domain][service]) {
        return {
          content: [
            {
              type: 'text',
              text: `Service ${serviceName} not found.\n\nAvailable services in domain '${domain}':\n${services[domain] ? Object.keys(services[domain]).map(s => `${domain}.${s}`).join('\n') : 'Domain not found'}`,
            },
          ],
        };
      }

      const serviceDetails = services[domain][service];
      
      // Format service details
      let output = `Service: ${serviceName}\n`;
      output += `Name: ${serviceDetails.name || serviceName}\n`;
      output += `Description: ${serviceDetails.description || 'No description available'}\n\n`;
      
      // Show fields/parameters
      if (serviceDetails.fields && Object.keys(serviceDetails.fields).length > 0) {
        output += 'Parameters:\n';
        Object.entries(serviceDetails.fields).forEach(([fieldName, fieldDetails]: [string, any]) => {
          output += `  • ${fieldName}`;
          if (fieldDetails.description) {
            output += `: ${fieldDetails.description}`;
          }
          if (fieldDetails.required) {
            output += ' (required)';
          }
          if (fieldDetails.default !== undefined) {
            output += ` [default: ${fieldDetails.default}]`;
          }
          output += '\n';
        });
      } else {
        output += 'No parameters required.\n';
      }

      // Show example call using call_service tool
      output += '\nExample call using call_service tool:\n';
      output += `entity_id: "your_entity_id"\n`;
      output += `service: "${service}"\n`;
      if (serviceDetails.fields && Object.keys(serviceDetails.fields).length > 0) {
        output += 'service_data: {\n';
        Object.keys(serviceDetails.fields).forEach(fieldName => {
          output += `  "${fieldName}": "your_value",\n`;
        });
        output += '}\n';
      }

      // Show raw service definition
      output += '\nRaw service definition:\n';
      output += JSON.stringify(serviceDetails, null, 2);

      return {
        content: [
          {
            type: 'text',
            text: output,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to get service details for ${serviceName}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  async speakText(text: string, entityId?: string, language?: string) {
    try {
      // First, try to find available TTS services and media players
      let targetEntity = entityId;
      
      if (!targetEntity) {
        // Auto-discover a media player if none specified
        const entitiesResponse = await this.client.get('/api/states');
        const mediaPlayers = entitiesResponse.data.filter((entity: any) => 
          entity.entity_id.startsWith('media_player.') && 
          entity.state !== 'unavailable'
        );
        
        if (mediaPlayers.length > 0) {
          targetEntity = mediaPlayers[0].entity_id;
        } else {
          throw new Error('No available media players found for TTS');
        }
      }

      // Try different TTS services in order of preference
      const ttsServices = [
        'tts.google_translate_say',
        'tts.cloud_say', 
        'tts.speak',
        'tts.google_say'
      ];

      let success = false;
      let lastError = '';

      for (const service of ttsServices) {
        try {
          const [domain, serviceName] = service.split('.');
          
          const requestBody: any = {
            entity_id: targetEntity,
            message: text,
          };

          if (language) {
            requestBody.language = language;
          }

          await this.client.post(`/api/services/${domain}/${serviceName}`, requestBody);
          
          success = true;
          return {
            content: [
              {
                type: 'text',
                text: `Successfully spoke text using ${service} on ${targetEntity}:\n"${text}"`,
              },
            ],
          };
          
        } catch (serviceError) {
          lastError = serviceError instanceof Error ? serviceError.message : String(serviceError);
          continue; // Try next service
        }
      }

      if (!success) {
        throw new Error(`All TTS services failed. Last error: ${lastError}`);
      }

      // This should never be reached, but TypeScript needs it
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Unexpected code path reached',
          },
        ],
      };

    } catch (error) {
      throw new Error(`Failed to speak text: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async announceText(text: string, target?: string) {
    try {
      // Try assist_satellite.announce first (newer HA versions)
      try {
        const requestBody: any = {
          message: text,
        };

        if (target) {
          requestBody.target = target;
        }

        await this.client.post('/api/services/assist_satellite/announce', requestBody);
        
        return {
          content: [
            {
              type: 'text',
              text: `Successfully announced to ${target || 'all devices'} using assist_satellite.announce:\n"${text}"`,
            },
          ],
        };
        
      } catch (assistError) {
        // Fall back to TTS on all media players
        const entitiesResponse = await this.client.get('/api/states');
        const mediaPlayers = entitiesResponse.data.filter((entity: any) => 
          entity.entity_id.startsWith('media_player.') && 
          entity.state !== 'unavailable'
        );

        if (mediaPlayers.length === 0) {
          throw new Error('No available media players found for announcement');
        }

        // Use TTS on all available media players
        const results = [];
        for (const player of mediaPlayers) {
          try {
            await this.client.post('/api/services/tts/google_translate_say', {
              entity_id: player.entity_id,
              message: text,
            });
            results.push(player.entity_id);
          } catch (playerError) {
            // Continue with other players
          }
        }

        if (results.length > 0) {
          return {
            content: [
              {
                type: 'text',
                text: `Announced to ${results.length} media players using TTS fallback:\n"${text}"\n\nDevices: ${results.join(', ')}`,
              },
            ],
          };
        } else {
          throw new Error('Failed to announce on any media players');
        }
      }

    } catch (error) {
      throw new Error(`Failed to announce text: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async listTTSServices() {
    try {
      // Get all services
      const servicesResponse = await this.client.get('/api/services');
      const services = servicesResponse.data;

      // Get all entities  
      const entitiesResponse = await this.client.get('/api/states');
      const entities = entitiesResponse.data;

      // Find TTS-related services
      const ttsServices: Array<{name: string, description: string, fields: string[]}> = [];
      const ttsServiceNames = ['tts', 'assist_satellite'];
      
      for (const serviceDomain of ttsServiceNames) {
        if (services[serviceDomain]) {
          Object.keys(services[serviceDomain]).forEach(serviceName => {
            const serviceDetails = services[serviceDomain][serviceName];
            ttsServices.push({
              name: `${serviceDomain}.${serviceName}`,
              description: serviceDetails.description || 'No description',
              fields: Object.keys(serviceDetails.fields || {}),
            });
          });
        }
      }

      // Find media players for TTS output
      const mediaPlayers = entities
        .filter((entity: any) => entity.entity_id.startsWith('media_player.'))
        .map((entity: any) => ({
          entity_id: entity.entity_id,
          name: entity.attributes.friendly_name || entity.entity_id,
          state: entity.state,
          available: entity.state !== 'unavailable',
        }));

      // Find assist satellites
      const assistSatellites = entities
        .filter((entity: any) => entity.entity_id.startsWith('assist_satellite.'))
        .map((entity: any) => ({
          entity_id: entity.entity_id,
          name: entity.attributes.friendly_name || entity.entity_id,
          state: entity.state,
          available: entity.state !== 'unavailable',
        }));

      let output = `TTS Services Available:\n\n`;
      
      if (ttsServices.length > 0) {
        output += `TTS Services (${ttsServices.length}):\n`;
        ttsServices.forEach(service => {
          output += `• ${service.name}: ${service.description}\n`;
          if (service.fields.length > 0) {
            output += `  Fields: ${service.fields.join(', ')}\n`;
          }
        });
        output += '\n';
      }

      if (mediaPlayers.length > 0) {
        const available = mediaPlayers.filter((mp: any) => mp.available);
        output += `Media Players (${available.length} available / ${mediaPlayers.length} total):\n`;
        mediaPlayers.forEach((mp: any) => {
          output += `• ${mp.entity_id}: ${mp.name} (${mp.state})\n`;
        });
        output += '\n';
      }

      if (assistSatellites.length > 0) {
        const available = assistSatellites.filter((as: any) => as.available);
        output += `Assist Satellites (${available.length} available / ${assistSatellites.length} total):\n`;
        assistSatellites.forEach((as: any) => {
          output += `• ${as.entity_id}: ${as.name} (${as.state})\n`;
        });
      }

      if (ttsServices.length === 0 && mediaPlayers.length === 0) {
        output += 'No TTS services or media players found. TTS may not be configured.';
      }

      return {
        content: [
          {
            type: 'text',
            text: output,
          },
        ],
      };

    } catch (error) {
      throw new Error(`Failed to list TTS services: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async conversationProcess(text: string, conversationId?: string, agentId?: string) {
    try {
      const requestBody: any = {
        text: text,
      };

      if (conversationId) {
        requestBody.conversation_id = conversationId;
      }

      if (agentId) {
        requestBody.agent_id = agentId;
      }

      const response = await this.client.post('/api/services/conversation/process', requestBody);

      return {
        content: [
          {
            type: 'text',
            text: `Conversation processed successfully.\n\nInput: "${text}"\n\nResponse: ${JSON.stringify(response.data, null, 2)}`,
          },
        ],
      };

    } catch (error) {
      throw new Error(`Failed to process conversation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async listConversationAgents() {
    try {
      // Try to get conversation agent info through services API
      const servicesResponse = await this.client.get('/api/services');
      const services = servicesResponse.data;

      // Look for conversation services
      const conversationServices: Array<{name: string, description: string, fields: string[]}> = [];
      
      if (services.conversation) {
        Object.keys(services.conversation).forEach(serviceName => {
          const serviceDetails = services.conversation[serviceName];
          conversationServices.push({
            name: `conversation.${serviceName}`,
            description: serviceDetails.description || 'No description',
            fields: Object.keys(serviceDetails.fields || {}),
          });
        });
      }

      // Also check for any conversation-related entities
      const entitiesResponse = await this.client.get('/api/states');
      const entities = entitiesResponse.data;

      const conversationEntities = entities
        .filter((entity: any) => 
          entity.entity_id.startsWith('conversation.') || 
          entity.domain === 'conversation' ||
          entity.entity_id.includes('ollama') ||
          entity.entity_id.includes('openai') ||
          entity.entity_id.includes('assistant')
        )
        .map((entity: any) => ({
          entity_id: entity.entity_id,
          name: entity.attributes.friendly_name || entity.entity_id,
          state: entity.state,
          available: entity.state !== 'unavailable',
        }));

      let output = `Conversation Agents and Services:\n\n`;
      
      if (conversationServices.length > 0) {
        output += `Conversation Services (${conversationServices.length}):\n`;
        conversationServices.forEach(service => {
          output += `• ${service.name}: ${service.description}\n`;
          if (service.fields.length > 0) {
            output += `  Fields: ${service.fields.join(', ')}\n`;
          }
        });
        output += '\n';
      }

      if (conversationEntities.length > 0) {
        output += `Conversation Entities (${conversationEntities.length}):\n`;
        conversationEntities.forEach((entity: any) => {
          output += `• ${entity.entity_id}: ${entity.name} (${entity.state})\n`;
        });
        output += '\n';
      }

      if (conversationServices.length === 0 && conversationEntities.length === 0) {
        output += 'No conversation services or agents found.\n\n';
        output += 'To use Ollama with Home Assistant:\n';
        output += '1. Install the Ollama integration from HACS\n';
        output += '2. Configure it in configuration.yaml\n';
        output += '3. Add conversation service configuration\n';
        output += '4. Use conversation.process service to interact with models\n';
      }

      // Try to get more info about available conversation agents via config
      try {
        const configResponse = await this.client.get('/api/config');
        const config = configResponse.data;
        
        if (config.conversation) {
          output += '\nConversation Configuration Found:\n';
          output += JSON.stringify(config.conversation, null, 2);
        }
      } catch (configError) {
        // Config API might not be available or accessible
        output += '\n(Unable to access conversation configuration)';
      }

      return {
        content: [
          {
            type: 'text',
            text: output,
          },
        ],
      };

    } catch (error) {
      throw new Error(`Failed to list conversation agents: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}