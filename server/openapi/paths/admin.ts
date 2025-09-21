import type { OpenAPIV3_1 } from 'openapi-types';

export const adminPaths: Record<string, OpenAPIV3_1.PathItemObject> = {
  '/api/admin/cruises': {
    get: {
      tags: ['Admin'],
      summary: 'Get admin cruise list',
      description: 'Retrieve paginated list of cruises with admin filtering options',
      operationId: 'getAdminCruises',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          $ref: '#/components/parameters/PageParam'
        },
        {
          $ref: '#/components/parameters/LimitParam'
        },
        {
          $ref: '#/components/parameters/SearchParam'
        },
        {
          name: 'status',
          in: 'query',
          description: 'Filter by cruise status',
          schema: {
            type: 'string',
            enum: ['draft', 'published', 'archived']
          }
        }
      ],
      responses: {
        '200': {
          description: 'Paginated list of cruises',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  cruises: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Trip'
                    }
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer' },
                      page: { type: 'integer' },
                      limit: { type: 'integer' },
                      totalPages: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        },
        '401': {
          $ref: '#/components/responses/Unauthorized'
        },
        '403': {
          $ref: '#/components/responses/Forbidden'
        }
      }
    }
  },
  '/api/admin/cruises/{id}/status': {
    patch: {
      tags: ['Admin'],
      summary: 'Update cruise status',
      description: 'Update the publication status of a cruise',
      operationId: 'updateCruiseStatus',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          $ref: '#/components/parameters/IdParam'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: {
                  type: 'string',
                  enum: ['draft', 'published', 'archived'],
                  description: 'New cruise status'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Cruise status updated successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Trip'
              }
            }
          }
        },
        '400': {
          $ref: '#/components/responses/BadRequest'
        },
        '401': {
          $ref: '#/components/responses/Unauthorized'
        },
        '403': {
          $ref: '#/components/responses/Forbidden'
        },
        '404': {
          $ref: '#/components/responses/NotFound'
        }
      }
    }
  },
  '/api/admin/cruises/stats': {
    get: {
      tags: ['Admin'],
      summary: 'Get cruise statistics',
      description: 'Retrieve comprehensive statistics about cruises for admin dashboard',
      operationId: 'getCruiseStats',
      security: [{ BearerAuth: [] }],
      responses: {
        '200': {
          description: 'Cruise statistics',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  total: {
                    type: 'integer',
                    description: 'Total number of cruises'
                  },
                  published: {
                    type: 'integer',
                    description: 'Number of published cruises'
                  },
                  draft: {
                    type: 'integer',
                    description: 'Number of draft cruises'
                  },
                  archived: {
                    type: 'integer',
                    description: 'Number of archived cruises'
                  },
                  upcoming: {
                    type: 'integer',
                    description: 'Number of upcoming published cruises'
                  },
                  ongoing: {
                    type: 'integer',
                    description: 'Number of currently ongoing cruises'
                  },
                  past: {
                    type: 'integer',
                    description: 'Number of past cruises'
                  },
                  totalCapacity: {
                    type: 'integer',
                    description: 'Total passenger capacity across all cruises'
                  },
                  totalBookings: {
                    type: 'integer',
                    description: 'Total bookings across all cruises'
                  },
                  avgOccupancy: {
                    type: 'number',
                    format: 'float',
                    description: 'Average occupancy percentage'
                  }
                }
              }
            }
          }
        },
        '401': {
          $ref: '#/components/responses/Unauthorized'
        },
        '403': {
          $ref: '#/components/responses/Forbidden'
        }
      }
    }
  },
  '/api/admin/dashboard/stats': {
    post: {
      tags: ['Admin'],
      summary: 'Get dashboard statistics',
      description: 'Retrieve customized statistics for admin dashboard with date range and metric selection',
      operationId: 'getDashboardStats',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['metrics'],
              properties: {
                dateRange: {
                  type: 'object',
                  properties: {
                    start: {
                      type: 'string',
                      format: 'date',
                      description: 'Start date for statistics'
                    },
                    end: {
                      type: 'string',
                      format: 'date',
                      description: 'End date for statistics'
                    }
                  }
                },
                metrics: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['trips', 'events', 'talent', 'ports']
                  },
                  description: 'Metrics to include in the response'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Dashboard statistics',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  trips: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer' },
                      upcoming: { type: 'integer' },
                      active: { type: 'integer' },
                      past: { type: 'integer' }
                    }
                  },
                  events: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer' }
                    }
                  },
                  talent: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer' },
                      featured: { type: 'integer' }
                    }
                  },
                  ports: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        },
        '400': {
          $ref: '#/components/responses/BadRequest'
        },
        '401': {
          $ref: '#/components/responses/Unauthorized'
        },
        '403': {
          $ref: '#/components/responses/Forbidden'
        }
      }
    }
  },
  '/api/admin/system/health': {
    get: {
      tags: ['Admin'],
      summary: 'System health check',
      description: 'Get system health status and performance metrics',
      operationId: 'getSystemHealth',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'detailed',
          in: 'query',
          description: 'Include detailed health information',
          schema: {
            type: 'boolean',
            default: false
          }
        }
      ],
      responses: {
        '200': {
          description: 'System health status',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['healthy', 'warning', 'critical'],
                    description: 'Overall system health status'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Health check timestamp'
                  },
                  database: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      responseTime: { type: 'number' }
                    }
                  },
                  memory: {
                    type: 'object',
                    properties: {
                      used: { type: 'number' },
                      total: { type: 'number' },
                      percentage: { type: 'number' }
                    }
                  },
                  uptime: {
                    type: 'number',
                    description: 'System uptime in seconds'
                  }
                }
              }
            }
          }
        },
        '401': {
          $ref: '#/components/responses/Unauthorized'
        },
        '403': {
          $ref: '#/components/responses/Forbidden'
        }
      }
    }
  },
  '/api/admin/users': {
    get: {
      tags: ['Admin'],
      summary: 'List admin users',
      description: 'Retrieve list of admin users with filtering and pagination',
      operationId: 'listAdminUsers',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          $ref: '#/components/parameters/PageParam'
        },
        {
          $ref: '#/components/parameters/LimitParam'
        },
        {
          $ref: '#/components/parameters/SearchParam'
        },
        {
          name: 'role',
          in: 'query',
          description: 'Filter by user role',
          schema: {
            type: 'string',
            enum: ['viewer', 'content_manager', 'admin']
          }
        },
        {
          name: 'status',
          in: 'query',
          description: 'Filter by account status',
          schema: {
            type: 'string',
            enum: ['active', 'suspended', 'pending_verification']
          }
        }
      ],
      responses: {
        '200': {
          description: 'List of admin users',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PaginationResponse'
              }
            }
          }
        },
        '401': {
          $ref: '#/components/responses/Unauthorized'
        },
        '403': {
          $ref: '#/components/responses/Forbidden'
        }
      }
    },
    post: {
      tags: ['Admin'],
      summary: 'Create admin user',
      description: 'Create a new admin user account',
      operationId: 'createAdminUser',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'fullName', 'role'],
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'User email address'
                },
                fullName: {
                  type: 'string',
                  description: 'User full name'
                },
                username: {
                  type: 'string',
                  description: 'User username'
                },
                role: {
                  type: 'string',
                  enum: ['viewer', 'content_manager', 'admin'],
                  description: 'User role'
                },
                phoneNumber: {
                  type: 'string',
                  description: 'User phone number'
                },
                bio: {
                  type: 'string',
                  description: 'User biography'
                }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Admin user created successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/User'
              }
            }
          }
        },
        '400': {
          $ref: '#/components/responses/BadRequest'
        },
        '401': {
          $ref: '#/components/responses/Unauthorized'
        },
        '403': {
          $ref: '#/components/responses/Forbidden'
        }
      }
    }
  },
  '/api/admin/users/{id}': {
    put: {
      tags: ['Admin'],
      summary: 'Update admin user',
      description: 'Update an existing admin user',
      operationId: 'updateAdminUser',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'User ID',
          schema: {
            type: 'string'
          }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                fullName: { type: 'string' },
                username: { type: 'string' },
                role: {
                  type: 'string',
                  enum: ['viewer', 'content_manager', 'admin']
                },
                accountStatus: {
                  type: 'string',
                  enum: ['active', 'suspended', 'pending_verification']
                },
                phoneNumber: { type: 'string' },
                bio: { type: 'string' },
                isActive: { type: 'boolean' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Admin user updated successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/User'
              }
            }
          }
        },
        '400': {
          $ref: '#/components/responses/BadRequest'
        },
        '401': {
          $ref: '#/components/responses/Unauthorized'
        },
        '403': {
          $ref: '#/components/responses/Forbidden'
        },
        '404': {
          $ref: '#/components/responses/NotFound'
        }
      }
    },
    delete: {
      tags: ['Admin'],
      summary: 'Delete admin user',
      description: 'Delete an admin user account',
      operationId: 'deleteAdminUser',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'User ID',
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Admin user deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'User deleted successfully'
                  }
                }
              }
            }
          }
        },
        '401': {
          $ref: '#/components/responses/Unauthorized'
        },
        '403': {
          $ref: '#/components/responses/Forbidden'
        },
        '404': {
          $ref: '#/components/responses/NotFound'
        }
      }
    }
  }
};