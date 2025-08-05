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

    // Get existing students
    const studentsResult = await pgClient.query('SELECT student_id FROM students ORDER BY student_id');
    const studentIds = studentsResult.rows.map(row => row.student_id);

    if (studentIds.length === 0) {
      await pgClient.end();
      return NextResponse.json({
        success: false,
        count: 0,
        message: 'No students found. Please load sample students first.'
      }, { status: 400 });
    }

    // Generate sample payment data for the last 6 months
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed

    const samplePayments = [];
    const paymentMethods = ['cash', 'bank_transfer', 'credit_card', 'check'];
    const statuses = ['paid', 'pending', 'overdue'];

    // Generate payments for each student for the last 6 months
    for (const studentId of studentIds) {
      for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
        let month = currentMonth - monthOffset;
        let year = currentYear;
        
        if (month <= 0) {
          month += 12;
          year -= 1;
        }

        // Random chance of having a payment for this month (80% chance)
        if (Math.random() > 0.2) {
          const amount = 150 + Math.floor(Math.random() * 100); // $150-$250
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
          
          // Payment date - random day in the month
          const paymentDate = new Date(year, month - 1, Math.floor(Math.random() * 28) + 1);
          
          samplePayments.push({
            student_id: studentId,
            amount,
            month,
            year,
            status,
            payment_date: paymentDate,
            payment_method: paymentMethod,
            notes: status === 'overdue' ? 'Payment overdue - follow up required' : 
                   status === 'pending' ? 'Payment pending confirmation' : 
                   'Payment received successfully'
          });
        }
      }
    }

    // Insert payments
    let insertedCount = 0;
    for (const payment of samplePayments) {
      const result = await pgClient.query(
        `INSERT INTO payments (student_id, amount, month, year, status, payment_date, payment_method, notes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING payment_id`,
        [
          payment.student_id,
          payment.amount,
          payment.month,
          payment.year,
          payment.status,
          payment.payment_date,
          payment.payment_method,
          payment.notes
        ]
      );
      if (result.rowCount && result.rowCount > 0) {
        insertedCount++;
      }
    }

    await pgClient.end();

    return NextResponse.json({
      success: true,
      count: insertedCount,
      message: `Successfully loaded ${insertedCount} sample payment records`
    });

  } catch (error: any) {
    console.error('Sample payments loading error:', error);
    return NextResponse.json({
      success: false,
      count: 0,
      message: 'Failed to load sample payments',
      error: error.message
    }, { status: 500 });
  }
}
