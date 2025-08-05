import { NextRequest, NextResponse } from 'next/server';
import { configManager } from '@/lib/config';
import { databaseManager } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { message, isAudio = false } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Message is required'
      }, { status: 400 });
    }

    // Get configuration
    const config = configManager.getConfig();
    if (!config) {
      return NextResponse.json({
        success: false,
        error: 'Application not configured. Please complete setup first.'
      }, { status: 400 });
    }

    // Initialize database connection
    let databaseAvailable = false;
    try {
      await databaseManager.initialize(config.database);
      databaseAvailable = true;
    } catch (dbError) {
      console.error('Database initialization error:', dbError);
      // Continue without database for now
    }

    // Get relevant student data for context
    let studentContext = '';
    if (databaseAvailable) {
      try {
        studentContext = await getStudentContext(message);
      } catch (error) {
        console.error('Error getting student context:', error);
      }
    }

    let response = '';

    // Handle different LLM providers
    if (config.api.llm.provider === 'google') {
      response = await processWithGemini(message, config.api.llm.apiKey, config.api.llm.model, studentContext, databaseAvailable);
    } else if (config.api.llm.provider === 'openai') {
      response = await processWithOpenAI(message, config.api.llm.apiKey, config.api.llm.model, studentContext, databaseAvailable);
    } else {
      response = 'I apologize, but the configured LLM provider is not yet supported. Please configure Google Gemini or OpenAI in the settings.';
    }

    // Save conversation to database (if available)
    try {
      // This will be implemented when we have the conversation table ready
      // await saveConversation(message, response, isAudio);
    } catch (error) {
      console.error('Failed to save conversation:', error);
      // Don't fail the request if we can't save to database
    }

    return NextResponse.json({
      success: true,
      response: response
    });

  } catch (error: any) {
    console.error('Chat processing error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process message'
    }, { status: 500 });
  }
}

async function getStudentContext(message: string): Promise<string> {
  try {
    // Extract potential student names from the message
    const studentNameMatch = message.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g);

    let context = '';

    // Get general statistics
    const stats = await databaseManager.getStudentStats();
    if (stats) {
      context += `Database Statistics:
- Total Students: ${stats.totalStudents}
- Total Payments: ${stats.totalPayments}
- Total Test Scores: ${stats.totalTests}
- Recent Conversations: ${stats.totalConversations}

`;
    }

    // If specific student names are mentioned, get their data
    if (studentNameMatch) {
      for (const name of studentNameMatch) {
        const studentData = await databaseManager.getStudentByName(name);
        if (studentData) {
          context += `Student Data for ${name}:
- Class: ${studentData.class}
- Contact: ${JSON.stringify(studentData.contact_info)}
- Recent Test Scores: ${JSON.stringify(studentData.recent_tests || [])}
- Payment Status: ${JSON.stringify(studentData.payment_status || {})}

`;
        }
      }
    }

    return context;
  } catch (error) {
    console.error('Error getting student context:', error);
    return '';
  }
}

async function processWithGemini(message: string, apiKey: string, model = 'gemini-pro', studentContext = '', databaseAvailable = false): Promise<string> {
  try {
    const systemPrompt = `You are an AI assistant for a Student Tracking Application used by educators and administrators. You must follow these STRICT GUIDELINES:

CORE RULES:
1. ONLY provide information that exists in the actual database - NEVER make up student names, scores, or any data
2. Base ALL responses on real student data, payment records, test scores, and conversation history
3. NEVER assume information that isn't explicitly stored in the database
4. Always verify data exists before responding
5. Use exact values from the database (names, scores, dates, amounts)
6. Acknowledge uncertainty when data is incomplete or ambiguous

WHAT YOU CAN HELP WITH:
- Query student information from the database (academic performance, payment status, attendance)
- Analyze student performance trends based on actual data
- Provide insights about payments, test scores, and academic progress
- Assist with administrative tasks related to student management
- Explain how to use the application features

WHAT YOU CANNOT DO:
- Make up or fabricate any student data
- Provide medical advice or health recommendations
- Make psychological diagnoses or assessments
- Share personal contact information inappropriately
- Make predictions without data foundation
- Provide information about students not relevant to the query

RESPONSE PATTERNS:
- When data exists: "Based on the database records, [Student Name] has [specific data with dates]..."
- When data is incomplete: "I can see [available data] but don't have information about [missing data]..."
- When no data exists: "I don't have any records for [query] in the database..."
- When outside scope: "I can help with student database information, but [request] is outside my scope..."

PRIVACY & PROFESSIONALISM:
- Maintain student privacy and confidentiality
- Use professional, educational language
- Respect FERPA guidelines for student information
- Only share information relevant to the query

If you don't have access to actual student data, explain what you would normally help with and suggest adding student data first. Always be helpful while staying within these strict boundaries.

DATABASE STATUS: ${databaseAvailable ? 'Connected - Use the data below to answer questions' : 'Not Available - Explain limitations and suggest setup'}

${studentContext ? `CURRENT DATABASE CONTEXT:
${studentContext}

Use ONLY this data to answer questions. If the user asks about students or data not shown above, respond that you don't have that information in the database.` : 'No specific student data available for this query.'}`;

    const fullPrompt = databaseAvailable && studentContext ?
      `${systemPrompt}\n\nUser Question: ${message}\n\nBased on the database context above, provide a helpful response using ONLY the actual data shown. Do not make up any information.` :
      `${systemPrompt}\n\nUser Question: ${message}\n\nSince no specific database context is available, explain what you could help with if student data was available and suggest next steps.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('No response generated from Gemini');
    }

  } catch (error: any) {
    console.error('Gemini processing error:', error);
    throw new Error(`Failed to process with Gemini: ${error.message}`);
  }
}

async function processWithOpenAI(message: string, apiKey: string, model = 'gpt-4', studentContext = '', databaseAvailable = false): Promise<string> {
  try {
    // This would be implemented if OpenAI is configured
    // For now, return a placeholder
    return 'OpenAI integration is available but not implemented in this demo. Please use Google Gemini for AI-powered responses.';
  } catch (error: any) {
    console.error('OpenAI processing error:', error);
    throw new Error(`Failed to process with OpenAI: ${error.message}`);
  }
}
