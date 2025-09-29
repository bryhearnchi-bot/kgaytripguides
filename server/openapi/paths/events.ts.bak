import type { OpenAPIV3_1 } from 'openapi-types';

export const eventPaths: Record<string, OpenAPIV3_1.PathItemObject> = {
  '/api/events': {
    get: {
      tags: ['Events'],
      summary: 'List events with filtering',
      description: 'Retrieve events with optional filtering by trip, type, and date range',
      operationId: 'listEvents',
      security: [],
      parameters: [
        {
          name: 'tripId',
          in: 'query',
          description: 'Filter by trip ID',
          schema: {
            type: 'integer'
          }
        },
        {
          name: 'type',
          in: 'query',
          description: 'Filter by event type',
          schema: {
            type: 'string',
            enum: ['party', 'show', 'activity', 'dining', 'meeting', 'other']
          }
        },
        {
          name: 'startDate',
          in: 'query',
          description: 'Filter events from this date',
          schema: {
            type: 'string',
            format: 'date'
          }
        },
        {
          name: 'endDate',
          in: 'query',
          description: 'Filter events until this date',
          schema: {
            type: 'string',
            format: 'date'
          }
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Maximum number of events to return',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 1000,
            default: 100
          }
        },
        {
          name: 'offset',
          in: 'query',
          description: 'Number of events to skip',
          schema: {
            type: 'integer',
            minimum: 0,
            default: 0
          }
        }
      ],
      responses: {
        '200': {
          description: 'List of events',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Event'
                }
              }
            }
          }
        },
        '500': {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },
  '/api/events/stats': {
    get: {
      tags: ['Events'],
      summary: 'Get event statistics',
      description: 'Retrieve statistics about events including total count and breakdown by type',
      operationId: 'getEventStats',
      security: [],
      responses: {
        '200': {
          description: 'Event statistics',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  total: {
                    type: 'integer',
                    description: 'Total number of events',
                    example: 150
                  },
                  byType: {
                    type: 'object',
                    description: 'Event count by type',
                    additionalProperties: {
                      type: 'integer'
                    },
                    example: {
                      party: 45,
                      show: 30,
                      activity: 25,
                      dining: 20,
                      meeting: 15,
                      other: 15
                    }
                  }
                }
              }
            }
          }
        },
        '500': {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },
  '/api/events/bulk': {
    post: {
      tags: ['Events'],
      summary: 'Bulk create/update events',
      description: 'Create or update multiple events in a single request',
      operationId: 'bulkCreateUpdateEvents',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['tripId', 'events'],
              properties: {
                tripId: {
                  type: 'integer',
                  description: 'ID of the cruise to associate events with'
                },
                events: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                        description: 'Event ID (for updates, omit for new events)'
                      },
                      title: { type: 'string' },
                      description: { type: 'string' },
                      date: { type: 'string', format: 'date' },
                      time: { type: 'string', format: 'time' },
                      endTime: { type: 'string', format: 'time' },
                      location: { type: 'string' },
                      type: {
                        type: 'string',
                        enum: ['party', 'show', 'activity', 'dining', 'meeting', 'other']
                      },
                      category: { type: 'string' },
                      capacity: { type: 'integer' },
                      isPrivate: { type: 'boolean' },
                      requiresReservation: { type: 'boolean' },
                      cost: { type: 'number', format: 'decimal' },
                      heroImage: { type: 'string' },
                      tags: {
                        type: 'array',
                        items: { type: 'string' }
                      },
                      metadata: { type: 'object' }
                    },
                    required: ['title', 'date', 'time', 'type']
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Events processed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  events: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Event'
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
  '/api/events/{id}': {
    put: {
      tags: ['Events'],
      summary: 'Update event',
      description: 'Update an existing event',
      operationId: 'updateEvent',
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
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                date: { type: 'string', format: 'date' },
                time: { type: 'string', format: 'time' },
                endTime: { type: 'string', format: 'time' },
                location: { type: 'string' },
                type: {
                  type: 'string',
                  enum: ['party', 'show', 'activity', 'dining', 'meeting', 'other']
                },
                category: { type: 'string' },
                capacity: { type: 'integer' },
                isPrivate: { type: 'boolean' },
                requiresReservation: { type: 'boolean' },
                cost: { type: 'number', format: 'decimal' },
                heroImage: { type: 'string' },
                tags: {
                  type: 'array',
                  items: { type: 'string' }
                },
                metadata: { type: 'object' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Event updated successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Event'
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
      tags: ['Events'],
      summary: 'Delete event',
      description: 'Delete an event',
      operationId: 'deleteEvent',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          $ref: '#/components/parameters/IdParam'
        }
      ],
      responses: {
        '200': {
          description: 'Event deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Event deleted'
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
  },
  '/api/trips/{tripId}/events': {
    get: {
      tags: ['Events'],
      summary: 'Get events for a cruise',
      description: 'Retrieve all events for a specific cruise',
      operationId: 'getCruiseEvents',
      security: [],
      parameters: [
        {
          name: 'tripId',
          in: 'path',
          required: true,
          description: 'Cruise ID',
          schema: {
            type: 'integer'
          }
        }
      ],
      responses: {
        '200': {
          description: 'List of cruise events',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Event'
                }
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['Events'],
      summary: 'Create event for cruise',
      description: 'Create a new event for a specific cruise',
      operationId: 'createCruiseEvent',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'tripId',
          in: 'path',
          required: true,
          description: 'Cruise ID',
          schema: {
            type: 'integer'
          }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'date', 'time', 'type'],
              properties: {
                title: {
                  type: 'string',
                  description: 'Event title',
                  example: 'Pride Night Dance Party'
                },
                description: {
                  type: 'string',
                  description: 'Event description'
                },
                date: {
                  type: 'string',
                  format: 'date',
                  description: 'Event date'
                },
                time: {
                  type: 'string',
                  format: 'time',
                  description: 'Event start time'
                },
                endTime: {
                  type: 'string',
                  format: 'time',
                  description: 'Event end time'
                },
                location: {
                  type: 'string',
                  description: 'Event location'
                },
                type: {
                  type: 'string',
                  enum: ['party', 'show', 'activity', 'dining', 'meeting', 'other'],
                  description: 'Event type'
                },
                category: {
                  type: 'string',
                  description: 'Event category'
                },
                capacity: {
                  type: 'integer',
                  description: 'Maximum event capacity'
                },
                isPrivate: {
                  type: 'boolean',
                  description: 'Whether the event is private',
                  default: false
                },
                requiresReservation: {
                  type: 'boolean',
                  description: 'Whether the event requires reservation',
                  default: false
                },
                cost: {
                  type: 'number',
                  format: 'decimal',
                  description: 'Event cost in USD'
                },
                heroImage: {
                  type: 'string',
                  description: 'URL to the event hero image'
                },
                tags: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Event tags for categorization'
                },
                metadata: {
                  type: 'object',
                  description: 'Additional event metadata'
                }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Event created successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Event'
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
  '/api/trips/{tripId}/events/date/{date}': {
    get: {
      tags: ['Events'],
      summary: 'Get events by date',
      description: 'Retrieve events for a specific cruise on a specific date',
      operationId: 'getCruiseEventsByDate',
      security: [],
      parameters: [
        {
          name: 'tripId',
          in: 'path',
          required: true,
          description: 'Cruise ID',
          schema: {
            type: 'integer'
          }
        },
        {
          name: 'date',
          in: 'path',
          required: true,
          description: 'Event date (YYYY-MM-DD format)',
          schema: {
            type: 'string',
            format: 'date'
          }
        }
      ],
      responses: {
        '200': {
          description: 'List of events for the specified date',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Event'
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/trips/{tripId}/events/type/{type}': {
    get: {
      tags: ['Events'],
      summary: 'Get events by type',
      description: 'Retrieve events for a specific cruise filtered by event type',
      operationId: 'getCruiseEventsByType',
      security: [],
      parameters: [
        {
          name: 'tripId',
          in: 'path',
          required: true,
          description: 'Cruise ID',
          schema: {
            type: 'integer'
          }
        },
        {
          name: 'type',
          in: 'path',
          required: true,
          description: 'Event type',
          schema: {
            type: 'string',
            enum: ['party', 'show', 'activity', 'dining', 'meeting', 'other']
          }
        }
      ],
      responses: {
        '200': {
          description: 'List of events for the specified type',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Event'
                }
              }
            }
          }
        }
      }
    }
  }
};