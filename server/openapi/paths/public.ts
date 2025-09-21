import type { OpenAPIV3_1 } from 'openapi-types';

export const publicPaths: Record<string, OpenAPIV3_1.PathItemObject> = {
  '/api': {
    get: {
      tags: ['System'],
      summary: 'API health check',
      description: 'Basic API health check endpoint',
      operationId: 'apiHealthCheck',
      security: [],
      responses: {
        '200': {
          description: 'API is running',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ok: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'API is running' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/versions': {
    get: {
      tags: ['System'],
      summary: 'Get API versions',
      description: 'Retrieve supported API versions',
      operationId: 'getApiVersions',
      security: [],
      responses: {
        '200': {
          description: 'Supported API versions',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  versions: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['v1']
                  },
                  current: {
                    type: 'string',
                    example: 'v1'
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/csrf-token': {
    get: {
      tags: ['Security'],
      summary: 'Get CSRF token',
      description: 'Retrieve CSRF token for secure form submissions',
      operationId: 'getCsrfToken',
      security: [],
      responses: {
        '200': {
          description: 'CSRF token',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  csrfToken: {
                    type: 'string',
                    description: 'CSRF token for form protection'
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/search': {
    get: {
      tags: ['Search'],
      summary: 'Global search',
      description: 'Search across trips, events, talent, and ports',
      operationId: 'globalSearch',
      security: [],
      parameters: [
        {
          name: 'q',
          in: 'query',
          required: true,
          description: 'Search query',
          schema: {
            type: 'string',
            minLength: 1
          }
        },
        {
          name: 'type',
          in: 'query',
          description: 'Filter by content type',
          schema: {
            type: 'string',
            enum: ['trips', 'events', 'talent', 'ports', 'all']
          }
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Maximum number of results per type',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 50,
            default: 10
          }
        }
      ],
      responses: {
        '200': {
          description: 'Search results',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  query: { type: 'string' },
                  total: { type: 'integer' },
                  results: {
                    type: 'object',
                    properties: {
                      trips: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Trip' }
                      },
                      events: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Event' }
                      },
                      talent: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Talent' }
                      },
                      ports: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Port' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '400': {
          $ref: '#/components/responses/BadRequest'
        }
      }
    }
  },
  '/api/talent': {
    get: {
      tags: ['Talent'],
      summary: 'List talent',
      description: 'Retrieve list of talent/performers',
      operationId: 'listTalent',
      security: [],
      parameters: [
        {
          name: 'featured',
          in: 'query',
          description: 'Filter by featured status',
          schema: {
            type: 'boolean'
          }
        },
        {
          name: 'type',
          in: 'query',
          description: 'Filter by talent type',
          schema: {
            type: 'string',
            enum: ['drag_queen', 'dj', 'performer', 'host', 'comedian', 'singer', 'dancer', 'other']
          }
        },
        {
          $ref: '#/components/parameters/LimitParam'
        },
        {
          name: 'offset',
          in: 'query',
          description: 'Number of items to skip',
          schema: {
            type: 'integer',
            minimum: 0,
            default: 0
          }
        }
      ],
      responses: {
        '200': {
          description: 'List of talent',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Talent'
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/talent/{id}': {
    get: {
      tags: ['Talent'],
      summary: 'Get talent by ID',
      description: 'Retrieve specific talent information',
      operationId: 'getTalentById',
      security: [],
      parameters: [
        {
          $ref: '#/components/parameters/IdParam'
        }
      ],
      responses: {
        '200': {
          description: 'Talent details',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Talent'
              }
            }
          }
        },
        '404': {
          $ref: '#/components/responses/NotFound'
        }
      }
    }
  },
  '/api/ports': {
    get: {
      tags: ['Locations'],
      summary: 'List ports',
      description: 'Retrieve list of cruise ports',
      operationId: 'listPorts',
      security: [],
      parameters: [
        {
          name: 'country',
          in: 'query',
          description: 'Filter by country',
          schema: {
            type: 'string'
          }
        },
        {
          $ref: '#/components/parameters/LimitParam'
        },
        {
          name: 'offset',
          in: 'query',
          description: 'Number of items to skip',
          schema: {
            type: 'integer',
            minimum: 0,
            default: 0
          }
        }
      ],
      responses: {
        '200': {
          description: 'List of ports',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Port'
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/ports/{id}': {
    get: {
      tags: ['Locations'],
      summary: 'Get port by ID',
      description: 'Retrieve specific port information',
      operationId: 'getPortById',
      security: [],
      parameters: [
        {
          $ref: '#/components/parameters/IdParam'
        }
      ],
      responses: {
        '200': {
          description: 'Port details',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Port'
              }
            }
          }
        },
        '404': {
          $ref: '#/components/responses/NotFound'
        }
      }
    }
  },
  '/api/metrics': {
    get: {
      tags: ['Monitoring'],
      summary: 'Get performance metrics',
      description: 'Retrieve system performance metrics',
      operationId: 'getMetrics',
      security: [],
      responses: {
        '200': {
          description: 'Performance metrics',
          content: {
            'text/plain': {
              schema: {
                type: 'string',
                description: 'Prometheus-style metrics'
              }
            }
          }
        }
      }
    }
  },
  '/api/analytics/track': {
    post: {
      tags: ['Analytics'],
      summary: 'Track analytics event',
      description: 'Send analytics event for tracking user behavior',
      operationId: 'trackAnalyticsEvent',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['event'],
              properties: {
                event: {
                  type: 'string',
                  description: 'Event name',
                  example: 'page_view'
                },
                properties: {
                  type: 'object',
                  description: 'Event properties',
                  additionalProperties: true,
                  example: {
                    page: '/trips/mediterranean-magic-2024',
                    source: 'navigation'
                  }
                },
                userId: {
                  type: 'string',
                  description: 'User ID (if authenticated)'
                },
                sessionId: {
                  type: 'string',
                  description: 'Session ID'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Event tracked successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  }
                }
              }
            }
          }
        },
        '400': {
          $ref: '#/components/responses/BadRequest'
        }
      }
    }
  },
  '/healthz': {
    get: {
      tags: ['System'],
      summary: 'Health check',
      description: 'System health check endpoint',
      operationId: 'healthCheck',
      security: [],
      responses: {
        '200': {
          description: 'System is healthy',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    example: 'ok'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            }
          }
        }
      }
    },
    head: {
      tags: ['System'],
      summary: 'Health check (HEAD)',
      description: 'System health check endpoint (HEAD method)',
      operationId: 'healthCheckHead',
      security: [],
      responses: {
        '200': {
          description: 'System is healthy'
        }
      }
    }
  }
};