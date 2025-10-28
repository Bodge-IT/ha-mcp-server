#!/usr/bin/env node

// Quick test script for the new TTS functionality
// This simulates what Claude Desktop would do

import { HomeAssistantClient } from './dist/ha-client.js';

async function testTTS() {
  console.log('🔊 Testing Home Assistant TTS functionality...\n');
  
  try {
    // Create HA client (will read HA_URL and HA_TOKEN from environment)
    const client = new HomeAssistantClient();
    
    console.log('1. Testing list_tts_services...');
    const services = await client.listTTSServices();
    console.log(services.content[0].text);
    console.log('\n' + '='.repeat(50) + '\n');
    
    console.log('2. Testing speak_text...');
    const speakResult = await client.speakText(
      'Hello! This is a test of Claude Desktop TTS integration. If you can hear this, the system is working!',
      'media_player.locho'  // Your specific media player
    );
    console.log(speakResult.content[0].text);
    console.log('\n' + '='.repeat(50) + '\n');
    
    console.log('3. Testing announce_text...');
    const announceResult = await client.announceText(
      'Attention! Claude Desktop TTS testing is now complete. Demo preparation in progress!'
    );
    console.log(announceResult.content[0].text);
    
    console.log('\n✅ All TTS tests completed successfully!');
    console.log('🚀 Ready for Claude Desktop integration!');
    
  } catch (error) {
    console.error('❌ TTS Test failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('- Check HA_URL and HA_TOKEN environment variables');
    console.log('- Verify Home Assistant is accessible');
    console.log('- Ensure TTS is configured in Home Assistant');
    console.log('- Check that media players are available');
  }
}

// Run the test
testTTS();