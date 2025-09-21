#!/usr/bin/env node

/**
 * Generate TypeScript types from OpenAPI specification
 *
 * This script fetches the OpenAPI specification from the running server
 * and generates TypeScript type definitions.
 *
 * Usage:
 *   node scripts/generate-api-types.js [server-url]
 *
 * Example:
 *   node scripts/generate-api-types.js http://localhost:3001
 */

import fs from 'fs/promises';
import path from 'path';

const SERVER_URL = process.argv[2] || 'http://localhost:3001';
const OUTPUT_FILE = path.join(process.cwd(), 'shared', 'api-types-generated.ts');

async function fetchOpenApiSpec() {
  try {
    console.log(`🔍 Fetching OpenAPI specification from ${SERVER_URL}/api/docs/swagger.json...`);

    const response = await fetch(`${SERVER_URL}/api/docs/swagger.json`);

    if (!response.ok) {
      throw new Error(`Failed to fetch OpenAPI spec: ${response.status} ${response.statusText}`);
    }

    const spec = await response.json();
    console.log('✅ OpenAPI specification fetched successfully');

    return spec;
  } catch (error) {
    console.error('❌ Error fetching OpenAPI specification:', error.message);
    console.log('\n💡 Make sure the development server is running:');
    console.log('   npm run dev');
    process.exit(1);
  }
}

function generateTypeScriptFromSchema(schema, name) {
  if (!schema || typeof schema !== 'object') {
    return 'any';
  }

  if (schema.$ref) {
    // Extract type name from reference
    const refName = schema.$ref.split('/').pop();
    return refName;
  }

  if (schema.type === 'object') {
    if (schema.properties) {
      const properties = Object.entries(schema.properties)
        .map(([key, prop]) => {
          const optional = !schema.required?.includes(key) ? '?' : '';
          const type = generateTypeScriptFromSchema(prop, key);
          return `  ${key}${optional}: ${type};`;
        })
        .join('\n');

      return `{\n${properties}\n}`;
    }

    if (schema.additionalProperties) {
      const valueType = generateTypeScriptFromSchema(schema.additionalProperties, 'value');
      return `Record<string, ${valueType}>`;
    }

    return 'Record<string, any>';
  }

  if (schema.type === 'array') {
    const itemType = generateTypeScriptFromSchema(schema.items, 'item');
    return `${itemType}[]`;
  }

  if (schema.type === 'string') {
    if (schema.enum) {
      return schema.enum.map(val => `'${val}'`).join(' | ');
    }
    return 'string';
  }

  if (schema.type === 'number' || schema.type === 'integer') {
    return 'number';
  }

  if (schema.type === 'boolean') {
    return 'boolean';
  }

  return 'any';
}

function generateTypesFromSpec(spec) {
  const { components } = spec;

  if (!components?.schemas) {
    throw new Error('No schemas found in OpenAPI specification');
  }

  let output = `/**
 * Generated TypeScript types from OpenAPI specification
 * ${spec.info.title} v${spec.info.version}
 *
 * Generated on: ${new Date().toISOString()}
 *
 * DO NOT EDIT MANUALLY - This file is auto-generated
 * Run \`node scripts/generate-api-types.js\` to regenerate
 */

`;

  // Generate type definitions
  Object.entries(components.schemas).forEach(([name, schema]) => {
    if (schema.type === 'object') {
      output += `export interface ${name} `;
      output += generateTypeScriptFromSchema(schema, name);
      output += '\n\n';
    }
  });

  // Generate utility types
  output += `// Utility types
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiRequestConfig {
  method?: ApiMethod;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export interface ApiError {
  status: number;
  message: string;
  details?: any;
}

// API Client interface
export interface ApiClient {
  baseUrl: string;
  token?: string;
  request<T>(endpoint: string, config?: ApiRequestConfig): Promise<T>;
}

`;

  // Generate operation types from paths
  const { paths } = spec;
  const operations = [];

  Object.entries(paths).forEach(([path, pathItem]) => {
    Object.entries(pathItem).forEach(([method, operation]) => {
      if (operation.operationId) {
        operations.push({
          id: operation.operationId,
          method: method.toUpperCase(),
          path,
          summary: operation.summary
        });
      }
    });
  });

  output += `// API Operations
export const API_OPERATIONS = {
${operations.map(op => `  ${op.id}: {
    method: '${op.method}' as const,
    path: '${op.path}',
    summary: '${op.summary || ''}'
  }`).join(',\n')}
} as const;

export type ApiOperation = keyof typeof API_OPERATIONS;

`;

  return output;
}

async function main() {
  try {
    console.log('🚀 Starting TypeScript types generation...\n');

    const spec = await fetchOpenApiSpec();

    console.log('🔄 Generating TypeScript types...');
    const typesContent = generateTypesFromSpec(spec);

    console.log(`📝 Writing types to ${OUTPUT_FILE}...`);
    await fs.writeFile(OUTPUT_FILE, typesContent, 'utf8');

    console.log('✅ TypeScript types generated successfully!');
    console.log(`📁 Output file: ${OUTPUT_FILE}`);

    // Show some stats
    const lines = typesContent.split('\n').length;
    const interfaces = (typesContent.match(/export interface/g) || []).length;

    console.log('\n📊 Generation summary:');
    console.log(`   • Total lines: ${lines}`);
    console.log(`   • Interfaces generated: ${interfaces}`);
    console.log(`   • Source: ${spec.info.title} v${spec.info.version}`);

  } catch (error) {
    console.error('❌ Error generating types:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}