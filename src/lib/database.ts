// Database connection and operations

import { Client } from 'pg';
import { QdrantClient } from '@qdrant/js-client-rest';
import { DatabaseConfig } from '@/types/config';
import { Student, Payment, Test, Conversation, VectorPoint } from '@/types/database';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private pgClient: Client | null = null;
  private qdrantClient: QdrantClient | null = null;
  private config: DatabaseConfig | null = null;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  // Initialize database connections
  async initialize(config: DatabaseConfig): Promise<void> {
    this.config = config;
    
    // Initialize PostgreSQL connection
    this.pgClient = new Client({
      connectionString: config.neon.connectionString,
    });
    
    await this.pgClient.connect();

    // Initialize Qdrant connection
    this.qdrantClient = new QdrantClient({
      url: config.qdrant.url,
      apiKey: config.qdrant.apiKey,
    });

    // Ensure collection exists
    await this.ensureQdrantCollection();
  }

  // Test database connections
  async testConnections(): Promise<{ pg: boolean; qdrant: boolean; errors: string[] }> {
    const errors: string[] = [];
    let pgSuccess = false;
    let qdrantSuccess = false;

    // Test PostgreSQL
    try {
      if (this.pgClient) {
        await this.pgClient.query('SELECT 1');
        pgSuccess = true;
      }
    } catch (error) {
      errors.push(`PostgreSQL connection failed: ${error}`);
    }

    // Test Qdrant
    try {
      if (this.qdrantClient) {
        await this.qdrantClient.getCollections();
        qdrantSuccess = true;
      }
    } catch (error) {
      errors.push(`Qdrant connection failed: ${error}`);
    }

    return { pg: pgSuccess, qdrant: qdrantSuccess, errors };
  }

  // Ensure database schema exists
  async ensureSchema(): Promise<void> {
    if (!this.pgClient) throw new Error('PostgreSQL client not initialized');

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
      CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
      CREATE INDEX IF NOT EXISTS idx_tests_student_id ON tests(student_id);
      CREATE INDEX IF NOT EXISTS idx_tests_subject ON tests(subject);
      CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
    `;

    await this.pgClient.query(createTables);
  }

  // Ensure Qdrant collection exists
  private async ensureQdrantCollection(): Promise<void> {
    if (!this.qdrantClient || !this.config) return;

    const collectionName = this.config.qdrant.collectionName || 'student_notes';

    try {
      await this.qdrantClient.getCollection(collectionName);
    } catch (error) {
      // Collection doesn't exist, create it
      await this.qdrantClient.createCollection(collectionName, {
        vectors: {
          size: 1536, // OpenAI embedding size
          distance: 'Cosine',
        },
      });
    }
  }

  // Student operations
  async createStudent(student: Omit<Student, 'student_id' | 'created_at' | 'updated_at'>): Promise<Student> {
    if (!this.pgClient) throw new Error('Database not initialized');

    const query = `
      INSERT INTO students (name, class, contact_info)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await this.pgClient.query(query, [
      student.name,
      student.class,
      JSON.stringify(student.contact_info)
    ]);

    return result.rows[0];
  }

  async getStudents(limit = 50, offset = 0): Promise<Student[]> {
    if (!this.pgClient) throw new Error('Database not initialized');

    const query = `
      SELECT * FROM students
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await this.pgClient.query(query, [limit, offset]);
    return result.rows;
  }

  async getStudentById(studentId: number): Promise<Student | null> {
    if (!this.pgClient) throw new Error('Database not initialized');

    const query = 'SELECT * FROM students WHERE student_id = $1';
    const result = await this.pgClient.query(query, [studentId]);
    
    return result.rows[0] || null;
  }

  // Payment operations
  async createPayment(payment: Omit<Payment, 'payment_id' | 'created_at'>): Promise<Payment> {
    if (!this.pgClient) throw new Error('Database not initialized');

    const query = `
      INSERT INTO payments (student_id, amount, month, year, status, payment_date, payment_method, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await this.pgClient.query(query, [
      payment.student_id,
      payment.amount,
      payment.month,
      payment.year,
      payment.status,
      payment.payment_date,
      payment.payment_method,
      payment.notes
    ]);

    return result.rows[0];
  }

  // Test operations
  async createTest(test: Omit<Test, 'test_id' | 'percentage' | 'created_at'>): Promise<Test> {
    if (!this.pgClient) throw new Error('Database not initialized');

    const query = `
      INSERT INTO tests (student_id, subject, score, total_marks, date, test_type, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await this.pgClient.query(query, [
      test.student_id,
      test.subject,
      test.score,
      test.total_marks,
      test.date,
      test.test_type,
      test.notes
    ]);

    return result.rows[0];
  }

  // Vector operations
  async addVectorPoint(point: VectorPoint): Promise<void> {
    if (!this.qdrantClient || !this.config) throw new Error('Qdrant not initialized');

    const collectionName = this.config.qdrant.collectionName || 'student_notes';

    await this.qdrantClient.upsert(collectionName, {
      wait: true,
      points: [point],
    });
  }

  async searchVectors(vector: number[], limit = 5): Promise<any[]> {
    if (!this.qdrantClient || !this.config) throw new Error('Qdrant not initialized');

    const collectionName = this.config.qdrant.collectionName || 'student_notes';

    const result = await this.qdrantClient.search(collectionName, {
      vector,
      limit,
      with_payload: true,
    });

    return result;
  }

  // Get student statistics for AI context
  async getStudentStats(): Promise<any> {
    if (!this.pgClient) throw new Error('Database not initialized');

    try {
      const statsQuery = `
        SELECT
          (SELECT COUNT(*) FROM students) as total_students,
          (SELECT COUNT(*) FROM payments) as total_payments,
          (SELECT COUNT(*) FROM tests) as total_tests,
          (SELECT COUNT(*) FROM conversations) as total_conversations
      `;

      const result = await this.pgClient.query(statsQuery);
      return {
        totalStudents: parseInt(result.rows[0].total_students),
        totalPayments: parseInt(result.rows[0].total_payments),
        totalTests: parseInt(result.rows[0].total_tests),
        totalConversations: parseInt(result.rows[0].total_conversations)
      };
    } catch (error) {
      console.error('Error getting student stats:', error);
      return null;
    }
  }

  // Get student by name for AI context
  async getStudentByName(name: string): Promise<any> {
    if (!this.pgClient) throw new Error('Database not initialized');

    try {
      // Search for student by name (case insensitive)
      const studentQuery = `
        SELECT s.*,
               COALESCE(
                 json_agg(
                   json_build_object(
                     'subject', t.subject,
                     'score', t.score,
                     'total_marks', t.total_marks,
                     'percentage', t.percentage,
                     'date', t.date,
                     'test_type', t.test_type
                   )
                 ) FILTER (WHERE t.test_id IS NOT NULL), '[]'
               ) as recent_tests,
               COALESCE(
                 json_agg(
                   json_build_object(
                     'amount', p.amount,
                     'month', p.month,
                     'year', p.year,
                     'status', p.status,
                     'payment_date', p.payment_date
                   )
                 ) FILTER (WHERE p.payment_id IS NOT NULL), '[]'
               ) as payment_status
        FROM students s
        LEFT JOIN tests t ON s.student_id = t.student_id AND t.date >= CURRENT_DATE - INTERVAL '30 days'
        LEFT JOIN payments p ON s.student_id = p.student_id AND p.created_at >= CURRENT_DATE - INTERVAL '90 days'
        WHERE LOWER(s.name) LIKE LOWER($1)
        GROUP BY s.student_id, s.name, s.class, s.contact_info, s.created_at, s.updated_at
        LIMIT 1
      `;

      const result = await this.pgClient.query(studentQuery, [`%${name}%`]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting student by name:', error);
      return null;
    }
  }

  // Close connections
  async close(): Promise<void> {
    if (this.pgClient) {
      await this.pgClient.end();
      this.pgClient = null;
    }
    // Qdrant client doesn't need explicit closing
    this.qdrantClient = null;
  }
}

export const databaseManager = DatabaseManager.getInstance();
