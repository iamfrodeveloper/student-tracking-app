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

    // Sample conversation/note data
    const sampleQueries = [
      'How is Alice performing in Mathematics?',
      'What are Bob\'s strengths and weaknesses?',
      'Can you provide a summary of Carol\'s recent test scores?',
      'What subjects does David need help with?',
      'How has Emma\'s attendance been this month?',
      'What are Frank\'s payment status updates?',
      'Can you track Grace\'s progress in Science?',
      'What behavioral notes do we have for Henry?',
      'How is Ivy preparing for final exams?',
      'What extracurricular activities is Jack involved in?'
    ];

    const sampleResponses = [
      'Based on recent test scores, the student is performing well in Mathematics with an average of 85%. Recommend continued practice with advanced problems.',
      'The student shows strong analytical skills but needs improvement in written communication. Consider additional writing exercises.',
      'Recent test performance shows consistent improvement across all subjects. The student is well-prepared for upcoming assessments.',
      'The student would benefit from additional support in Science and Mathematics. Recommend tutoring sessions.',
      'Attendance has been excellent this month with perfect punctuality. The student is engaged and participative.',
      'All payments are up to date. The family has been consistent with monthly fee submissions.',
      'The student has shown remarkable progress in Science, improving from 70% to 88% over the past quarter.',
      'The student is well-behaved and cooperative. Shows leadership qualities in group activities.',
      'The student is well-prepared for finals with strong performance across all subjects. Recommend maintaining current study schedule.',
      'The student is actively involved in debate club and science fair preparations. Balancing academics and activities well.'
    ];

    const sampleNotes = [];
    const currentDate = new Date();

    // Generate conversation notes for each student
    for (let i = 0; i < studentIds.length; i++) {
      const studentId = studentIds[i];
      
      // Generate 2-4 conversation notes per student
      const numNotes = 2 + Math.floor(Math.random() * 3);
      
      for (let j = 0; j < numNotes; j++) {
        const queryIndex = (i + j) % sampleQueries.length;
        const query = sampleQueries[queryIndex];
        const response = sampleResponses[queryIndex];
        
        // Random date within the last 30 days
        const daysAgo = Math.floor(Math.random() * 30);
        const noteDate = new Date(currentDate);
        noteDate.setDate(noteDate.getDate() - daysAgo);
        
        // Random processing time between 500ms and 3000ms
        const processingTime = 500 + Math.floor(Math.random() * 2500);
        
        sampleNotes.push({
          user_id: 'teacher_demo',
          query,
          response,
          audio_file_path: null,
          query_type: 'text',
          processing_time: processingTime,
          created_at: noteDate
        });
      }
    }

    // Insert conversation notes
    let insertedCount = 0;
    for (const note of sampleNotes) {
      const result = await pgClient.query(
        `INSERT INTO conversations (user_id, query, response, audio_file_path, query_type, processing_time, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          note.user_id,
          note.query,
          note.response,
          note.audio_file_path,
          note.query_type,
          note.processing_time,
          note.created_at
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
      message: `Successfully loaded ${insertedCount} sample conversation notes`
    });

  } catch (error: any) {
    console.error('Sample notes loading error:', error);
    return NextResponse.json({
      success: false,
      count: 0,
      message: 'Failed to load sample notes',
      error: error.message
    }, { status: 500 });
  }
}
