import { db } from '../storage';
import { eventTalent, events, talent } from '../../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export type EventTalent = InferSelectModel<typeof eventTalent>;
export type NewEventTalent = InferInsertModel<typeof eventTalent>;

export interface EventTalentWithDetails extends EventTalent {
  eventTitle?: string;
  talentName?: string;
}

export class EventTalentStorage {
  /**
   * Get all talent for an event
   */
  async getTalentByEvent(eventId: number): Promise<EventTalentWithDetails[]> {
    try {
      const result = await db
        .select({
          id: eventTalent.id,
          event_id: eventTalent.event_id,
          talent_id: eventTalent.talent_id,
          role: eventTalent.role,
          performance_order: eventTalent.performance_order,
          created_at: eventTalent.created_at,
          talentName: talent.name
        })
        .from(eventTalent)
        .innerJoin(talent, eq(eventTalent.talent_id, talent.id))
        .where(eq(eventTalent.event_id, eventId))
        .orderBy(eventTalent.performance_order);

      return result as EventTalentWithDetails[];
    } catch (error) {
      console.error('Error fetching talent by event:', error);
      throw new Error('Failed to fetch talent by event');
    }
  }

  /**
   * Get all events for a talent
   */
  async getEventsByTalent(talentId: number): Promise<EventTalentWithDetails[]> {
    try {
      const result = await db
        .select({
          id: eventTalent.id,
          event_id: eventTalent.event_id,
          talent_id: eventTalent.talent_id,
          role: eventTalent.role,
          performance_order: eventTalent.performance_order,
          created_at: eventTalent.created_at,
          eventTitle: events.title
        })
        .from(eventTalent)
        .innerJoin(events, eq(eventTalent.event_id, events.id))
        .where(eq(eventTalent.talent_id, talentId));

      return result as EventTalentWithDetails[];
    } catch (error) {
      console.error('Error fetching events by talent:', error);
      throw new Error('Failed to fetch events by talent');
    }
  }

  /**
   * Add talent to an event
   */
  async addTalentToEvent(data: NewEventTalent): Promise<EventTalent> {
    try {
      // Check if relationship already exists
      const existing = await db
        .select()
        .from(eventTalent)
        .where(
          and(
            eq(eventTalent.event_id, data.event_id),
            eq(eventTalent.talent_id, data.talent_id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new Error('Talent is already assigned to this event');
      }

      const result = await db.insert(eventTalent)
        .values({
          ...data,
          role: data.role || 'performer'
        })
        .returning();

      return result[0];
    } catch (error: any) {
      if (error.message === 'Talent is already assigned to this event') {
        throw error;
      }
      console.error('Error adding talent to event:', error);
      throw new Error('Failed to add talent to event');
    }
  }

  /**
   * Remove talent from an event
   */
  async removeTalentFromEvent(eventId: number, talentId: number): Promise<boolean> {
    try {
      const result = await db.delete(eventTalent)
        .where(
          and(
            eq(eventTalent.event_id, eventId),
            eq(eventTalent.talent_id, talentId)
          )
        )
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error('Error removing talent from event:', error);
      throw new Error('Failed to remove talent from event');
    }
  }

  /**
   * Update talent role or order for an event
   */
  async updateEventTalent(
    eventId: number,
    talentId: number,
    data: { role?: string; performance_order?: number }
  ): Promise<EventTalent> {
    try {
      const result = await db.update(eventTalent)
        .set(data)
        .where(
          and(
            eq(eventTalent.event_id, eventId),
            eq(eventTalent.talent_id, talentId)
          )
        )
        .returning();

      if (!result[0]) {
        throw new Error('Event-talent relationship not found');
      }

      return result[0];
    } catch (error) {
      console.error('Error updating event-talent:', error);
      throw new Error('Failed to update event-talent relationship');
    }
  }

  /**
   * Bulk assign talent to an event
   */
  async bulkAssignTalent(
    eventId: number,
    talentIds: number[],
    role: string = 'performer'
  ): Promise<EventTalent[]> {
    try {
      // Remove existing assignments first
      await db.delete(eventTalent)
        .where(eq(eventTalent.event_id, eventId));

      // Add new assignments with order
      const values = talentIds.map((talentId, index) => ({
        event_id: eventId,
        talent_id: talentId,
        role,
        performance_order: index + 1
      }));

      const result = await db.insert(eventTalent)
        .values(values)
        .returning();

      return result;
    } catch (error) {
      console.error('Error bulk assigning talent:', error);
      throw new Error('Failed to bulk assign talent');
    }
  }

  /**
   * Get statistics for event-talent relationships
   */
  async getStatistics(): Promise<{
    totalRelationships: number;
    eventsWithTalent: number;
    talentWithEvents: number;
    averageTalentPerEvent: number;
  }> {
    try {
      // Get all relationships
      const allRelationships = await db.select().from(eventTalent);

      const eventSet = new Set<number>();
      const talentSet = new Set<number>();
      const eventCounts: Record<number, number> = {};

      allRelationships.forEach(rel => {
        eventSet.add(rel.event_id);
        talentSet.add(rel.talent_id);
        eventCounts[rel.event_id] = (eventCounts[rel.event_id] || 0) + 1;
      });

      const avgTalent = Object.values(eventCounts).length > 0
        ? Object.values(eventCounts).reduce((a, b) => a + b, 0) / Object.values(eventCounts).length
        : 0;

      return {
        totalRelationships: allRelationships.length,
        eventsWithTalent: eventSet.size,
        talentWithEvents: talentSet.size,
        averageTalentPerEvent: avgTalent
      };
    } catch (error) {
      console.error('Error getting event-talent statistics:', error);
      throw new Error('Failed to get event-talent statistics');
    }
  }

  /**
   * Reorder talent for an event
   */
  async reorderTalent(eventId: number, orderedTalentIds: number[]): Promise<void> {
    try {
      // Update performance order for each talent
      for (let i = 0; i < orderedTalentIds.length; i++) {
        await db.update(eventTalent)
          .set({ performance_order: i + 1 })
          .where(
            and(
              eq(eventTalent.event_id, eventId),
              eq(eventTalent.talent_id, orderedTalentIds[i])
            )
          );
      }
    } catch (error) {
      console.error('Error reordering talent:', error);
      throw new Error('Failed to reorder talent');
    }
  }
}

// Export singleton instance
export const eventTalentStorage = new EventTalentStorage();