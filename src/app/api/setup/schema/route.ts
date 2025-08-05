import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { QdrantClient } from '@qdrant/js-client-rest';
import { DatabaseConfig } from '@/types/config';

export async function POST(request: NextRequest) {
  try {
    const config: DatabaseConfig = await request.json();

    // Setup PostgreSQL schema
    const pgClient = new Client({
      connectionString: config.neon.connectionString,
    });

    await pgClient.connect();

    const createTables = `
      -- Students table
      CREATE TABLE IF NOT EXISTS students (
        student_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        class VARCHAR(100),
        contact_info JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Payments table
      CREATE TABLE IF NOT EXISTS payments (
        payment_id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(student_id) ON DELETE CASCADE,
        amount DECIMAL(10,2),
        month INTEGER,
        year INTEGER,
        status VARCHAR(50) DEFAULT 'pending',
        payment_date TIMESTAMP,
        payment_method VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Tests table
      CREATE TABLE IF NOT EXISTS tests (
        test_id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(student_id) ON DELETE CASCADE,
        subject VARCHAR(100),
        score INTEGER,
        total_marks INTEGER,
        percentage DECIMAL(5,2) GENERATED ALWAYS AS (
          CASE WHEN total_marks > 0 THEN (score::DECIMAL / total_marks) * 100 ELSE 0 END
        ) STORED,
        date DATE,
        test_type VARCHAR(50) DEFAULT 'quiz',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Conversations table
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255),
        query TEXT,
        response TEXT,
        audio_file_path VARCHAR(500),
        query_type VARCHAR(20) DEFAULT 'text',
        processing_time INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- App configuration table
      CREATE TABLE IF NOT EXISTS app_config (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255),
        config_key VARCHAR(100),
        config_value TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
      CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);
      CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
      CREATE INDEX IF NOT EXISTS idx_payments_month_year ON payments(month, year);
      CREATE INDEX IF NOT EXISTS idx_tests_student_id ON tests(student_id);
      CREATE INDEX IF NOT EXISTS idx_tests_subject ON tests(subject);
      CREATE INDEX IF NOT EXISTS idx_tests_date ON tests(date);
      CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
      CREATE INDEX IF NOT EXISTS idx_app_config_user_key ON app_config(user_id, config_key);
    `;

    await pgClient.query(createTables);
    await pgClient.end();

    // Setup Qdrant collection
    const qdrantClient = new QdrantClient({
      url: config.qdrant.url,
      apiKey: config.qdrant.apiKey,
    });

    const collectionName = config.qdrant.collectionName || 'student_notes';

    try {
      // Check if collection exists
      await qdrantClient.getCollection(collectionName);
    } catch (error) {
      // Collection doesn't exist, create it
      await qdrantClient.createCollection(collectionName, {
        vectors: {
          size: 1536, // OpenAI embedding size
          distance: 'Cosine',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Database schema setup completed successfully',
      details: {
        tables_created: ['students', 'payments', 'tests', 'conversations', 'app_config'],
        indexes_created: ['name', 'class', 'student_id', 'status', 'subject', 'date', 'user_id'],
        qdrant_collection: collectionName
      }
    });

  } catch (error: any) {
    console.error('Schema setup error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to setup database schema',
      error: error.message
    }, { status: 500 });
  }
}
