/**
 * Admin Routes for Database Sequence Management
 *
 * These endpoints provide tools to diagnose and fix PostgreSQL sequence issues
 * that can cause duplicate key violations.
 */

import type { Express, Response } from "express";
import { requireSuperAdmin, type AuthenticatedRequest } from "../auth";
import {
  fixTableSequence,
  fixAllSequences,
  fixSequenceByTableName,
  generateCompleteSequenceFixSQL,
  getCreateStoredProcedureSQL,
  type SequenceFixResult
} from "../utils/sequence-fix";
import { asyncHandler } from "../middleware/errorHandler";
import { ApiError } from "../utils/ApiError";
import { logger } from "../logging/logger";

export function registerAdminSequenceRoutes(app: Express) {
  // Get stored procedure creation SQL
  app.get("/api/admin/sequences/stored-procedure-sql", requireSuperAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const sql = getCreateStoredProcedureSQL();
    return res.json({
      success: true,
      sql,
      instructions: "Run this SQL in your Supabase dashboard SQL editor to enable automatic sequence fixing"
    });
  }));

  // Generate complete SQL script for manual fixing
  app.get("/api/admin/sequences/fix-sql", requireSuperAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const sql = await generateCompleteSequenceFixSQL();
    return res.json({
      success: true,
      sql,
      instructions: "Run this SQL in your Supabase dashboard SQL editor to fix all sequences"
    });
  }));

  // Fix a specific table's sequence
  app.post("/api/admin/sequences/fix/:tableName", requireSuperAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { tableName } = req.params;

    if (!tableName || tableName.length === 0) {
      throw ApiError.badRequest('Invalid table name');
    }

    logger.info(`Fixing sequence for table: ${tableName}`);
    const result = await fixSequenceByTableName(tableName);

    if (!result.fixed && result.error?.includes('Manual fix required')) {
      // Return the manual SQL commands
      return res.status(200).json({
        success: false,
        requiresManualFix: true,
        result,
        sqlCommand: `SELECT setval('${result.sequenceName}', ${result.newSequenceValue}, false);`,
        instructions: 'Run the SQL command in your Supabase dashboard SQL editor'
      });
    }

    return res.json({
      success: result.fixed,
      result
    });
  }));

  // Fix all table sequences
  app.post("/api/admin/sequences/fix-all", requireSuperAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    logger.info('Starting fix for all table sequences...');
    const results = await fixAllSequences();

    const successCount = results.filter(r => r.fixed).length;
    const failureCount = results.filter(r => !r.fixed).length;

    // Separate manual fixes from errors
    const manualFixes = results.filter(r => !r.fixed && r.error?.includes('Manual fix required'));
    const errors = results.filter(r => !r.fixed && !r.error?.includes('Manual fix required'));

    if (manualFixes.length > 0) {
      // Generate SQL for manual fixes
      const sqlCommands = manualFixes.map(r =>
        `SELECT setval('${r.sequenceName}', ${r.newSequenceValue}, false); -- Fix ${r.tableName}`
      ).join('\n');

      return res.json({
        success: false,
        requiresManualFix: true,
        summary: {
          total: results.length,
          fixed: successCount,
          requiresManualFix: manualFixes.length,
          failed: errors.length
        },
        results,
        sqlCommands,
        instructions: 'Run the SQL commands in your Supabase dashboard SQL editor'
      });
    }

    return res.json({
      success: failureCount === 0,
      summary: {
        total: results.length,
        fixed: successCount,
        failed: failureCount
      },
      results
    });
  }));

  // Check sequence status for all tables
  app.get("/api/admin/sequences/status", requireSuperAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { getSupabaseAdmin } = await import('../supabase-admin');
    const supabaseAdmin = getSupabaseAdmin();

    const tables = [
      'talent', 'trips', 'locations', 'events', 'ships',
      'itinerary', 'profiles', 'talent_categories',
      'resorts', 'venues', 'amenities', 'trip_info_sections'
    ];

    const status = [];

    for (const tableName of tables) {
      try {
        // Get max ID
        const { data: maxIdData, error: maxIdError } = await supabaseAdmin
          .from(tableName)
          .select('id')
          .order('id', { ascending: false })
          .limit(1);

        if (maxIdError) {
          status.push({
            tableName,
            error: maxIdError.message,
            maxId: null,
            needsFix: null
          });
          continue;
        }

        const maxId = maxIdData && maxIdData.length > 0 ? maxIdData[0]?.id ?? 0 : 0;

        status.push({
          tableName,
          maxId,
          sequenceName: `${tableName}_id_seq`,
          nextValue: maxId + 1,
          needsFix: false // We can't check the actual sequence value without RPC
        });
      } catch (error: unknown) {
        status.push({
          tableName,
          error: error instanceof Error ? error.message : 'Unknown error',
          maxId: null,
          needsFix: null
        });
      }
    }

    return res.json({
      success: true,
      status,
      note: 'To check actual sequence values, run SELECT currval(sequence_name) in SQL editor'
    });
  }));
}