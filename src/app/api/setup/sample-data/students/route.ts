import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { configManager } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    // Try to get config from request body first, then from configManager
    const requestBody = await request.json().catch(() => ({}));
    const config = configManager.getConfig();

    const connectionString = requestBody.connectionString ||
                           config?.database?.neon?.connectionString;

    if (!connectionString) {
      return NextResponse.json({
        success: false,
        message: 'Database configuration not found. Please provide connectionString in request body or complete setup first.'
      }, { status: 400 });
    }

    const pgClient = new Client({
      connectionString: connectionString,
    });

    await pgClient.connect();

    // Sample student data
    const sampleStudents = [
      {
        name: 'Alice Johnson',
        class: 'Grade 10A',
        contact_info: {
          phone: '+1-555-0101',
          email: 'alice.johnson@email.com',
          parent_name: 'Robert Johnson',
          address: '123 Oak Street, Springfield'
        }
      },
      {
        name: 'Bob Smith',
        class: 'Grade 10A',
        contact_info: {
          phone: '+1-555-0102',
          email: 'bob.smith@email.com',
          parent_name: 'Mary Smith',
          address: '456 Pine Avenue, Springfield'
        }
      },
      {
        name: 'Carol Davis',
        class: 'Grade 10B',
        contact_info: {
          phone: '+1-555-0103',
          email: 'carol.davis@email.com',
          parent_name: 'James Davis',
          address: '789 Maple Drive, Springfield'
        }
      },
      {
        name: 'David Wilson',
        class: 'Grade 10B',
        contact_info: {
          phone: '+1-555-0104',
          email: 'david.wilson@email.com',
          parent_name: 'Linda Wilson',
          address: '321 Elm Street, Springfield'
        }
      },
      {
        name: 'Emma Brown',
        class: 'Grade 11A',
        contact_info: {
          phone: '+1-555-0105',
          email: 'emma.brown@email.com',
          parent_name: 'Michael Brown',
          address: '654 Cedar Lane, Springfield'
        }
      },
      {
        name: 'Frank Miller',
        class: 'Grade 11A',
        contact_info: {
          phone: '+1-555-0106',
          email: 'frank.miller@email.com',
          parent_name: 'Susan Miller',
          address: '987 Birch Road, Springfield'
        }
      },
      {
        name: 'Grace Taylor',
        class: 'Grade 11B',
        contact_info: {
          phone: '+1-555-0107',
          email: 'grace.taylor@email.com',
          parent_name: 'David Taylor',
          address: '147 Spruce Street, Springfield'
        }
      },
      {
        name: 'Henry Anderson',
        class: 'Grade 11B',
        contact_info: {
          phone: '+1-555-0108',
          email: 'henry.anderson@email.com',
          parent_name: 'Jennifer Anderson',
          address: '258 Willow Avenue, Springfield'
        }
      },
      {
        name: 'Ivy Thomas',
        class: 'Grade 12A',
        contact_info: {
          phone: '+1-555-0109',
          email: 'ivy.thomas@email.com',
          parent_name: 'Christopher Thomas',
          address: '369 Poplar Drive, Springfield'
        }
      },
      {
        name: 'Jack Garcia',
        class: 'Grade 12A',
        contact_info: {
          phone: '+1-555-0110',
          email: 'jack.garcia@email.com',
          parent_name: 'Maria Garcia',
          address: '741 Ash Street, Springfield'
        }
      }
    ];

    // Insert students
    let insertedCount = 0;
    for (const student of sampleStudents) {
      const result = await pgClient.query(
        'INSERT INTO students (name, class, contact_info) VALUES ($1, $2, $3) RETURNING student_id',
        [student.name, student.class, JSON.stringify(student.contact_info)]
      );
      if (result.rowCount && result.rowCount > 0) {
        insertedCount++;
      }
    }

    await pgClient.end();

    return NextResponse.json({
      success: true,
      count: insertedCount,
      message: `Successfully loaded ${insertedCount} sample students`
    });

  } catch (error: any) {
    console.error('Sample students loading error:', error);
    return NextResponse.json({
      success: false,
      count: 0,
      message: 'Failed to load sample students',
      error: error.message
    }, { status: 500 });
  }
}
