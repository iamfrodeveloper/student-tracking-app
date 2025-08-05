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

    // Sample test data
    const subjects = ['Mathematics', 'English', 'Science', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology'];
    const testTypes = ['quiz', 'midterm', 'final', 'assignment', 'project'];
    
    const sampleTests = [];
    const currentDate = new Date();

    // Generate test scores for each student
    for (const studentId of studentIds) {
      // Generate 8-12 test scores per student
      const numTests = 8 + Math.floor(Math.random() * 5);
      
      for (let i = 0; i < numTests; i++) {
        const subject = subjects[Math.floor(Math.random() * subjects.length)];
        const testType = testTypes[Math.floor(Math.random() * testTypes.length)];
        
        // Generate realistic scores based on test type
        let totalMarks, score;
        if (testType === 'quiz') {
          totalMarks = 10 + Math.floor(Math.random() * 15); // 10-25 marks
        } else if (testType === 'assignment' || testType === 'project') {
          totalMarks = 20 + Math.floor(Math.random() * 30); // 20-50 marks
        } else {
          totalMarks = 50 + Math.floor(Math.random() * 50); // 50-100 marks
        }
        
        // Generate score with some realistic distribution (most students score 60-90%)
        const basePercentage = 60 + Math.random() * 30; // 60-90%
        score = Math.floor((basePercentage / 100) * totalMarks);
        
        // Random test date within the last 3 months
        const daysAgo = Math.floor(Math.random() * 90);
        const testDate = new Date(currentDate);
        testDate.setDate(testDate.getDate() - daysAgo);
        
        const notes = score / totalMarks >= 0.8 ? 'Excellent performance' :
                     score / totalMarks >= 0.7 ? 'Good work' :
                     score / totalMarks >= 0.6 ? 'Satisfactory' :
                     'Needs improvement';
        
        sampleTests.push({
          student_id: studentId,
          subject,
          score,
          total_marks: totalMarks,
          date: testDate.toISOString().split('T')[0], // YYYY-MM-DD format
          test_type: testType,
          notes
        });
      }
    }

    // Insert test scores
    let insertedCount = 0;
    for (const test of sampleTests) {
      const result = await pgClient.query(
        `INSERT INTO tests (student_id, subject, score, total_marks, date, test_type, notes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING test_id`,
        [
          test.student_id,
          test.subject,
          test.score,
          test.total_marks,
          test.date,
          test.test_type,
          test.notes
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
      message: `Successfully loaded ${insertedCount} sample test scores`
    });

  } catch (error: any) {
    console.error('Sample tests loading error:', error);
    return NextResponse.json({
      success: false,
      count: 0,
      message: 'Failed to load sample test scores',
      error: error.message
    }, { status: 500 });
  }
}
