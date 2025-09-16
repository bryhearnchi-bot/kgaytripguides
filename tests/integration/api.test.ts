/**
 * API Integration Tests
 * Tests for the full API flow with the new database structure
 * These will fail initially until migration is complete
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/app'; // Express app
import { db } from '../../server/storage';

describe('API Integration Tests', () => {
  let server: any;

  beforeAll(async () => {
    // Start test server
    server = app.listen(0); // Random port
  });

  afterAll(async () => {
    // Close server and database
    server.close();
    await db.destroy();
  });

  beforeEach(async () => {
    // Clean test data
    await db.raw('DELETE FROM events WHERE title LIKE $1', ['TEST_%']);
    await db.raw('DELETE FROM itinerary WHERE location LIKE $1', ['TEST_%']);
    await db.raw('DELETE FROM ports WHERE name LIKE $1', ['TEST_%']);
    await db.raw('DELETE FROM parties WHERE name LIKE $1', ['TEST_%']);
  });

  describe('Port API Endpoints', () => {
    describe('GET /api/ports', () => {
      it('should return all ports', async () => {
        const response = await request(server)
          .get('/api/ports')
          .expect(200);

        expect(response.body).toHaveProperty('ports');
        expect(Array.isArray(response.body.ports)).toBe(true);
      });

      it('should filter ports by region', async () => {
        const response = await request(server)
          .get('/api/ports?region=Mediterranean')
          .expect(200);

        expect(response.body.ports.every((p: any) => p.region === 'Mediterranean')).toBe(true);
      });

      it('should filter ports by type', async () => {
        const response = await request(server)
          .get('/api/ports?port_type=sea_day')
          .expect(200);

        expect(response.body.ports.every((p: any) => p.port_type === 'sea_day')).toBe(true);
      });

      it('should paginate results', async () => {
        const response = await request(server)
          .get('/api/ports?page=1&limit=5')
          .expect(200);

        expect(response.body.ports.length).toBeLessThanOrEqual(5);
        expect(response.body).toHaveProperty('total');
        expect(response.body).toHaveProperty('page');
        expect(response.body).toHaveProperty('totalPages');
      });
    });

    describe('GET /api/ports/:id', () => {
      it('should return a single port', async () => {
        // Create a test port first
        const createRes = await request(server)
          .post('/api/ports')
          .send({
            name: 'TEST_Athens',
            country: 'Greece',
            region: 'Mediterranean',
            port_type: 'port'
          })
          .expect(201);

        const portId = createRes.body.port.id;

        const response = await request(server)
          .get(`/api/ports/${portId}`)
          .expect(200);

        expect(response.body.port).toHaveProperty('id', portId);
        expect(response.body.port).toHaveProperty('name', 'TEST_Athens');
      });

      it('should return 404 for non-existent port', async () => {
        await request(server)
          .get('/api/ports/99999')
          .expect(404);
      });
    });

    describe('POST /api/ports', () => {
      it('should create a new port', async () => {
        const newPort = {
          name: 'TEST_Santorini',
          country: 'Greece',
          region: 'Mediterranean',
          port_type: 'port',
          coordinates: { lat: 36.3932, lng: 25.4615 },
          description: 'Beautiful island'
        };

        const response = await request(server)
          .post('/api/ports')
          .send(newPort)
          .expect(201);

        expect(response.body.port).toHaveProperty('id');
        expect(response.body.port).toHaveProperty('name', 'TEST_Santorini');
        expect(response.body.port.coordinates).toEqual(newPort.coordinates);
      });

      it('should validate required fields', async () => {
        const response = await request(server)
          .post('/api/ports')
          .send({ name: '' }) // Missing required fields
          .expect(400);

        expect(response.body).toHaveProperty('errors');
        expect(response.body.errors).toContain('Country is required');
      });

      it('should prevent duplicate port names', async () => {
        const port = {
          name: 'TEST_Unique',
          country: 'Test',
          region: 'Test',
          port_type: 'port'
        };

        await request(server)
          .post('/api/ports')
          .send(port)
          .expect(201);

        await request(server)
          .post('/api/ports')
          .send(port)
          .expect(409); // Conflict
      });
    });

    describe('PUT /api/ports/:id', () => {
      it('should update an existing port', async () => {
        // Create port first
        const createRes = await request(server)
          .post('/api/ports')
          .send({
            name: 'TEST_ToUpdate',
            country: 'Greece',
            region: 'Mediterranean',
            port_type: 'port'
          })
          .expect(201);

        const portId = createRes.body.port.id;

        const response = await request(server)
          .put(`/api/ports/${portId}`)
          .send({
            description: 'Updated description',
            coordinates: { lat: 37.9838, lng: 23.7275 }
          })
          .expect(200);

        expect(response.body.port.description).toBe('Updated description');
        expect(response.body.port.coordinates).toEqual({ lat: 37.9838, lng: 23.7275 });
      });
    });

    describe('DELETE /api/ports/:id', () => {
      it('should delete a port', async () => {
        // Create port first
        const createRes = await request(server)
          .post('/api/ports')
          .send({
            name: 'TEST_ToDelete',
            country: 'Test',
            region: 'Test',
            port_type: 'port'
          })
          .expect(201);

        const portId = createRes.body.port.id;

        await request(server)
          .delete(`/api/ports/${portId}`)
          .expect(204);

        // Verify it's deleted
        await request(server)
          .get(`/api/ports/${portId}`)
          .expect(404);
      });

      it('should prevent deletion if port is referenced', async () => {
        // This would test referential integrity
        // Port that has itinerary items referencing it cannot be deleted
        const response = await request(server)
          .delete('/api/ports/1') // Assuming port 1 has references
          .expect(409);

        expect(response.body.error).toContain('Cannot delete port with existing itinerary items');
      });
    });
  });

  describe('Party API Endpoints', () => {
    describe('GET /api/parties', () => {
      it('should return all party templates', async () => {
        const response = await request(server)
          .get('/api/parties')
          .expect(200);

        expect(response.body).toHaveProperty('parties');
        expect(Array.isArray(response.body.parties)).toBe(true);
      });

      it('should return party usage statistics', async () => {
        const response = await request(server)
          .get('/api/parties?include_stats=true')
          .expect(200);

        if (response.body.parties.length > 0) {
          expect(response.body.parties[0]).toHaveProperty('usage_count');
          expect(response.body.parties[0]).toHaveProperty('last_used');
        }
      });
    });

    describe('POST /api/parties', () => {
      it('should create a new party template', async () => {
        const newParty = {
          name: 'TEST_White Party',
          theme: 'All White Attire',
          venue_type: 'pool',
          capacity: 500,
          duration_hours: 4,
          requirements: ['DJ', 'Sound System', 'Bar']
        };

        const response = await request(server)
          .post('/api/parties')
          .send(newParty)
          .expect(201);

        expect(response.body.party).toHaveProperty('id');
        expect(response.body.party).toHaveProperty('name', 'TEST_White Party');
        expect(response.body.party.requirements).toEqual(newParty.requirements);
      });
    });

    describe('POST /api/parties/:id/duplicate', () => {
      it('should duplicate a party template', async () => {
        // Create original
        const createRes = await request(server)
          .post('/api/parties')
          .send({
            name: 'TEST_Original',
            theme: 'Original Theme',
            venue_type: 'deck',
            capacity: 200
          })
          .expect(201);

        const originalId = createRes.body.party.id;

        // Duplicate it
        const response = await request(server)
          .post(`/api/parties/${originalId}/duplicate`)
          .send({ name: 'TEST_Copy' })
          .expect(201);

        expect(response.body.party.name).toBe('TEST_Copy');
        expect(response.body.party.theme).toBe('Original Theme');
        expect(response.body.party.id).not.toBe(originalId);
      });
    });
  });

  describe('Trip-Port Integration', () => {
    it('should return ports for a trip itinerary', async () => {
      const response = await request(server)
        .get('/api/trips/1/ports')
        .expect(200);

      expect(response.body).toHaveProperty('ports');
      expect(Array.isArray(response.body.ports)).toBe(true);

      // Ports should be in itinerary order
      if (response.body.ports.length > 1) {
        const orders = response.body.ports.map((p: any) => p.order);
        expect(orders).toEqual([...orders].sort((a, b) => a - b));
      }
    });

    it('should update itinerary with new port', async () => {
      // Create a new port
      const portRes = await request(server)
        .post('/api/ports')
        .send({
          name: 'TEST_NewPort',
          country: 'Test',
          region: 'Test',
          port_type: 'port'
        })
        .expect(201);

      const portId = portRes.body.port.id;

      // Add to itinerary
      const response = await request(server)
        .post('/api/trips/1/itinerary')
        .send({
          port_id: portId,
          day: 3,
          arrival_time: '08:00',
          departure_time: '17:00',
          order: 3
        })
        .expect(201);

      expect(response.body.itinerary).toHaveProperty('port_id', portId);
    });
  });

  describe('Event-Party Integration', () => {
    it('should create event from party template', async () => {
      // Create party template
      const partyRes = await request(server)
        .post('/api/parties')
        .send({
          name: 'TEST_Template',
          theme: 'Test Theme',
          venue_type: 'pool',
          capacity: 300
        })
        .expect(201);

      const partyId = partyRes.body.party.id;

      // Create event from template
      const response = await request(server)
        .post('/api/events')
        .send({
          trip_id: 1,
          party_id: partyId,
          date: '2024-10-15',
          time: '21:00',
          custom_title: 'Special White Party'
        })
        .expect(201);

      expect(response.body.event).toHaveProperty('party_id', partyId);
      expect(response.body.event).toHaveProperty('title', 'Special White Party');
    });

    it('should get all events using a specific party template', async () => {
      // Assuming party ID 1 exists and has events
      const response = await request(server)
        .get('/api/parties/1/events')
        .expect(200);

      expect(response.body).toHaveProperty('events');
      expect(response.body.events.every((e: any) => e.party_id === 1)).toBe(true);
    });
  });

  describe('Talent Assignment', () => {
    it('should assign talent to event', async () => {
      const response = await request(server)
        .post('/api/events/1/talent')
        .send({
          talent_id: 1,
          role: 'headliner',
          performance_order: 1
        })
        .expect(201);

      expect(response.body.assignment).toHaveProperty('event_id', 1);
      expect(response.body.assignment).toHaveProperty('talent_id', 1);
      expect(response.body.assignment).toHaveProperty('role', 'headliner');
    });

    it('should get all talent for an event', async () => {
      const response = await request(server)
        .get('/api/events/1/talent')
        .expect(200);

      expect(response.body).toHaveProperty('talent');
      expect(Array.isArray(response.body.talent)).toBe(true);

      // Should be ordered by performance_order
      if (response.body.talent.length > 1) {
        const orders = response.body.talent.map((t: any) => t.performance_order);
        expect(orders).toEqual([...orders].sort((a, b) => a - b));
      }
    });

    it('should update performance order', async () => {
      const newOrder = [
        { talent_id: 3, order: 1 },
        { talent_id: 1, order: 2 },
        { talent_id: 2, order: 3 }
      ];

      const response = await request(server)
        .put('/api/events/1/talent/order')
        .send({ order: newOrder })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should prevent duplicate talent assignment', async () => {
      // First assignment
      await request(server)
        .post('/api/events/1/talent')
        .send({
          talent_id: 1,
          role: 'headliner'
        })
        .expect(201);

      // Duplicate should fail
      await request(server)
        .post('/api/events/1/talent')
        .send({
          talent_id: 1,
          role: 'support'
        })
        .expect(409);
    });
  });

  describe('Data Validation', () => {
    it('should validate port coordinates', async () => {
      const response = await request(server)
        .post('/api/ports')
        .send({
          name: 'TEST_Invalid',
          country: 'Test',
          region: 'Test',
          port_type: 'port',
          coordinates: { lat: 200, lng: 500 } // Invalid coordinates
        })
        .expect(400);

      expect(response.body.errors).toContain('Invalid latitude');
      expect(response.body.errors).toContain('Invalid longitude');
    });

    it('should validate party venue types', async () => {
      const response = await request(server)
        .post('/api/parties')
        .send({
          name: 'TEST_Invalid',
          venue_type: 'invalid_type' // Not in enum
        })
        .expect(400);

      expect(response.body.errors).toContain('Invalid venue type');
    });

    it('should validate event dates', async () => {
      const response = await request(server)
        .post('/api/events')
        .send({
          trip_id: 1,
          party_id: 1,
          date: 'invalid-date'
        })
        .expect(400);

      expect(response.body.errors).toContain('Invalid date format');
    });
  });

  describe('Transaction Integrity', () => {
    it('should rollback on error during complex operation', async () => {
      // Try to create a trip with invalid data that will fail partway through
      const response = await request(server)
        .post('/api/trips/create-with-details')
        .send({
          trip: {
            name: 'TEST_Trip',
            startDate: '2024-10-15',
            endDate: '2024-10-22'
          },
          itinerary: [
            { port_id: 1, day: 1 },
            { port_id: 99999, day: 2 } // Invalid port ID
          ]
        })
        .expect(400);

      // Verify trip was not created due to rollback
      const trips = await db.raw('SELECT * FROM trips WHERE name = $1', ['TEST_Trip']);
      expect(trips.rows.length).toBe(0);
    });
  });
});