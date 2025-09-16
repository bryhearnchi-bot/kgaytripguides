import fs from 'fs';

const configPath = '/Users/bryan/.claude.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Update Supabase MCP server configuration
const projectPath = '/Users/bryan/develop/projects/kgay-travel-guides';
if (config.projects && config.projects[projectPath] && config.projects[projectPath].mcpServers) {
  const servers = config.projects[projectPath].mcpServers;

  // Update Supabase server with correct tokens
  servers.supabase = {
    type: "stdio",
    command: "node",
    args: [
      "/Users/bryan/develop/projects/kgay-travel-guides/node_modules/@supabase/mcp-server-supabase/dist/transports/stdio.js"
    ],
    env: {
      "SUPABASE_URL": "https://bxiiodeyqvqqcgzzqzvt.supabase.co",
      "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aWlvZGV5cXZxcWNnenpxenZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk2NzAyOSwiZXhwIjoyMDczNTQzMDI5fQ.q-doRMuntNVc7aigqBsdxQXMwuCWABDRnJnsSQV0oK0",
      "SUPABASE_ACCESS_TOKEN": "sbp_c0b9f0c690627fa03f93454eeec2dd3d08e7b201"
    }
  };

  console.log('✅ Updated Supabase MCP server configuration with correct access token');
}

// Write the updated configuration back
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log('✅ MCP configuration updated successfully!');
console.log('\n⚠️  You need to restart Claude for the changes to take effect');
console.log('   Run: claude restart');