import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { QdrantClient } from '@qdrant/js-client-rest';
import { DatabaseConfig } from '@/types/config';

export async function POST(request: NextRequest) {
  try {
    const config: DatabaseConfig = await request.json();

    const results = {
      neon: { success: false, message: '', details: null as any },
      qdrant: { success: false, message: '', details: null as any }
    };

    // Test Neon PostgreSQL connection
    try {
      const pgClient = new Client({
        connectionString: config.neon.connectionString,
      });

      await pgClient.connect();
      await pgClient.query('SELECT 1');
      await pgClient.end();

      results.neon = {
        success: true,
        message: 'PostgreSQL connection successful',
        details: null
      };
    } catch (error: any) {
      results.neon = {
        success: false,
        message: `PostgreSQL connection failed: ${error.message}`,
        details: error
      };
    }

    // Test Qdrant connection
    try {
      const qdrantClient = new QdrantClient({
        url: config.qdrant.url,
        apiKey: config.qdrant.apiKey,
      });

      await qdrantClient.getCollections();

      results.qdrant = {
        success: true,
        message: 'Qdrant connection successful',
        details: null
      };
    } catch (error: any) {
      results.qdrant = {
        success: false,
        message: `Qdrant connection failed: ${error.message}`,
        details: error
      };
    }

    const overallSuccess = results.neon.success && results.qdrant.success;

    return NextResponse.json({
      success: overallSuccess,
      message: overallSuccess 
        ? 'All database connections successful' 
        : 'One or more database connections failed',
      results
    });

  } catch (error: any) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to test database connections',
      error: error.message
    }, { status: 500 });
  }
}
