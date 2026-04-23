#!/usr/bin/env node
/**
 * Standalone Wazuh connection test script
 * Run this on your local network to verify Elasticsearch connectivity
 * 
 * Usage: node test-wazuh-local.mjs
 */

import axios from 'axios';
import https from 'https';

const config = {
  elasticsearchUrl: 'https://192.168.1.14:9200',
  elasticsearchUsername: 'admin',
  elasticsearchPassword: 'SecretPassword',
};

async function testConnection() {
  console.log('🔍 Testing Wazuh Elasticsearch Connection...\n');
  console.log('Configuration:');
  console.log(`  URL: ${config.elasticsearchUrl}`);
  console.log(`  Username: ${config.elasticsearchUsername}`);
  console.log(`  Password: ${'*'.repeat(config.elasticsearchPassword.length)}\n`);

  try {
    // Create HTTPS agent that accepts self-signed certificates
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    // Create axios instance
    const client = axios.create({
      httpsAgent,
      timeout: 10000,
    });

    console.log('📡 Sending request to /_cluster/health...');
    
    const response = await client.get(
      `${config.elasticsearchUrl}/_cluster/health`,
      {
        auth: {
          username: config.elasticsearchUsername,
          password: config.elasticsearchPassword,
        },
      }
    );

    console.log('✅ SUCCESS!\n');
    console.log('Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ FAILED\n');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('Error: Connection refused');
      console.log('Make sure Elasticsearch is running on 192.168.1.14:9200');
    } else if (error.code === 'ENOTFOUND') {
      console.log('Error: Cannot resolve hostname');
      console.log('Make sure 192.168.1.14 is the correct IP address');
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      console.log('Error: Connection timeout');
      console.log('Elasticsearch is not reachable. Check:');
      console.log('  - Is the URL correct?');
      console.log('  - Is port 9200 open?');
      console.log('  - Is there a firewall blocking the connection?');
    } else if (error.response?.status === 401) {
      console.log('Error: Authentication failed');
      console.log('Invalid username or password');
    } else if (error.response?.status === 403) {
      console.log('Error: Access forbidden');
      console.log('User does not have permission');
    } else {
      console.log('Error:', error.message);
    }
    
    console.log('\nFull error details:');
    console.log(error);
  }
}

testConnection();
