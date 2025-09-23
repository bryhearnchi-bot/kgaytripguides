import type { OpenAPIV3_1 } from 'openapi-types';

export const tripPaths: Record<string, OpenAPIV3_1.PathItemObject> = {
  '/api/trips': {
    get: {
      tags: ['Trips'],
      summary: 'List all trips',
      description: 'Retrieve a list of all available trips',
      operationId: 'listTrips',
      security: [],
      responses: {
        '200': {
          description: 'List of trips',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Trip'
                }
              }
            }
          }
        },
        '500': {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    },
    post: {
      tags: ['Trips'],
      summary: 'Create a new trip',
      description: 'Create a new trip (requires content editor permissions)',
      operationId: 'createTrip',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'slug', 'startDate', 'endDate'],
              properties: {
                name: {
                  type: 'string',
                  description: 'Trip name',
                  example: 'Mediterranean Magic 2024'
                },
                slug: {
                  type: 'string',
                  description: 'URL-friendly trip identifier',
                  example: 'mediterranean-magic-2024'
                },
                subtitle: {
                  type: 'string',
                  description: 'Trip subtitle'
                },
                description: {
                  type: 'string',
                  description: 'Trip description'
                },
                startDate: {
                  type: 'string',
                  format: 'date',
                  description: 'Trip start date'
                },
                endDate: {
                  type: 'string',
                  format: 'date',
                  description: 'Trip end date'
                },
                status: {
                  type: 'string',
                  enum: ['draft', 'published', 'archived'],
                  default: 'draft'
                },
                price: {
                  type: 'number',
                  format: 'decimal',
                  description: 'Starting price in USD'
                },
                duration: {
                  type: 'integer',
                  description: 'Trip duration in days'
                },
                shipName: {
                  type: 'string',
                  description: 'Name of the cruise ship'
                },
                featuredImage: {
                  type: 'string',
                  description: 'URL to the featured image'
                },
                maxCapacity: {
                  type: 'integer',
                  description: 'Maximum passenger capacity'
                },
                currentBookings: {
                  type: 'integer',
                  description: 'Current number of bookings'
                },
                metadata: {
                  type: 'object',
                  description: 'Additional trip metadata'
                }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Trip created successfully',
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
        }
      }
    }
  },
  '/api/trips/upcoming': {
    get: {
      tags: ['Trips'],
      summary: 'Get upcoming trips',
      description: 'Retrieve all upcoming trips',
      operationId: 'getUpcomingTrips',
      security: [],
      responses: {
        '200': {
          description: 'List of upcoming trips',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Trip'
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/trips/past': {
    get: {
      tags: ['Trips'],
      summary: 'Get past trips',
      description: 'Retrieve all past trips',
      operationId: 'getPastTrips',
      security: [],
      responses: {
        '200': {
          description: 'List of past trips',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Trip'
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/trips/id/{id}': {
    get: {
      tags: ['Trips'],
      summary: 'Get trip by ID',
      description: 'Retrieve a specific trip by its ID',
      operationId: 'getTripById',
      security: [],
      parameters: [
        {
          $ref: '#/components/parameters/IdParam'
        }
      ],
      responses: {
        '200': {
          description: 'Trip details',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Trip'
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
  '/api/trips/{slug}': {
    get: {
      tags: ['Trips'],
      summary: 'Get trip by slug',
      description: 'Retrieve a specific trip by its slug',
      operationId: 'getTripBySlug',
      security: [],
      parameters: [
        {
          $ref: '#/components/parameters/SlugParam'
        }
      ],
      responses: {
        '200': {
          description: 'Trip details',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Trip'
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
  '/api/trips/{slug}/complete': {
    get: {
      tags: ['Trips'],
      summary: 'Get complete trip information',
      description: 'Retrieve complete trip information including all sections, itinerary, and events',
      operationId: 'getCompleteTripInfo',
      security: [],
      parameters: [
        {
          $ref: '#/components/parameters/SlugParam'
        }
      ],
      responses: {
        '200': {
          description: 'Complete trip information',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  trip: {
                    $ref: '#/components/schemas/Trip'
                  },
                  itinerary: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        tripId: { type: 'integer' },
                        locationId: { type: 'integer' },
                        dayNumber: { type: 'integer' },
                        date: { type: 'string', format: 'date' },
                        arrivalTime: { type: 'string', format: 'time' },
                        departureTime: { type: 'string', format: 'time' },
                        description: { type: 'string' },
                        isSeaDay: { type: 'boolean' }
                      }
                    }
                  },
                  events: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Event'
                    }
                  },
                  infoSections: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        tripId: { type: 'string' },
                        title: { type: 'string' },
                        content: { type: 'string' },
                        order: { type: 'integer' },
                        isVisible: { type: 'boolean' }
                      }
                    }
                  }
                }
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
  '/api/trips/{id}': {
    put: {
      tags: ['Trips'],
      summary: 'Update trip',
      description: 'Update an existing trip (requires content editor permissions)',
      operationId: 'updateTrip',
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
                name: { type: 'string' },
                slug: { type: 'string' },
                subtitle: { type: 'string' },
                description: { type: 'string' },
                startDate: { type: 'string', format: 'date' },
                endDate: { type: 'string', format: 'date' },
                status: {
                  type: 'string',
                  enum: ['draft', 'published', 'archived']
                },
                price: { type: 'number', format: 'decimal' },
                duration: { type: 'integer' },
                shipName: { type: 'string' },
                featuredImage: { type: 'string' },
                maxCapacity: { type: 'integer' },
                currentBookings: { type: 'integer' },
                metadata: { type: 'object' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Trip updated successfully',
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
    },
    delete: {
      tags: ['Trips'],
      summary: 'Delete trip',
      description: 'Delete a trip (requires super admin permissions)',
      operationId: 'deleteTrip',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          $ref: '#/components/parameters/IdParam'
        }
      ],
      responses: {
        '200': {
          description: 'Trip deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Trip deleted'
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
  '/api/trips/{id}/duplicate': {
    post: {
      tags: ['Trips'],
      summary: 'Duplicate trip',
      description: 'Create a copy of an existing trip with new name and slug',
      operationId: 'duplicateTrip',
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
              required: ['newName', 'newSlug'],
              properties: {
                newName: {
                  type: 'string',
                  description: 'Name for the duplicated trip',
                  example: 'Mediterranean Magic 2025'
                },
                newSlug: {
                  type: 'string',
                  description: 'Slug for the duplicated trip',
                  example: 'mediterranean-magic-2025'
                }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Trip duplicated successfully',
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
  '/api/trips/{tripId}/itinerary': {
    get: {
      tags: ['Itinerary'],
      summary: 'Get trip itinerary',
      description: 'Retrieve the itinerary for a specific trip',
      operationId: 'getTripItinerary',
      security: [],
      parameters: [
        {
          name: 'tripId',
          in: 'path',
          required: true,
          description: 'Trip ID',
          schema: {
            type: 'integer'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Trip itinerary',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    tripId: { type: 'integer' },
                    locationId: { type: 'integer' },
                    dayNumber: { type: 'integer' },
                    date: { type: 'string', format: 'date' },
                    arrivalTime: { type: 'string', format: 'time' },
                    departureTime: { type: 'string', format: 'time' },
                    description: { type: 'string' },
                    isSeaDay: { type: 'boolean' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};