import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { APIConfig } from '@/types/config';

export async function POST(request: NextRequest) {
  try {
    const config: APIConfig = await request.json();

    const results = {
      transcription: { success: false, message: '', details: null as any },
      llm: { success: false, message: '', details: null as any },
      embeddings: { success: false, message: '', details: null as any }
    };

    // Test transcription API
    try {
      if (config.transcription.provider === 'openai' && config.transcription.apiKey) {
        const openai = new OpenAI({ apiKey: config.transcription.apiKey });
        
        // Test with a simple API call to check authentication
        await openai.models.list();
        
        results.transcription = {
          success: true,
          message: 'OpenAI Whisper API connection successful',
          details: null
        };
      } else if (config.transcription.provider === 'custom') {
        // For custom APIs, we'll just validate the endpoint format
        if (config.transcription.customEndpoint) {
          try {
            new URL(config.transcription.customEndpoint);
            results.transcription = {
              success: true,
              message: 'Custom transcription endpoint format is valid',
              details: null
            };
          } catch {
            results.transcription = {
              success: false,
              message: 'Invalid custom endpoint URL format',
              details: null
            };
          }
        } else {
          results.transcription = {
            success: false,
            message: 'Custom endpoint is required for custom provider',
            details: null
          };
        }
      } else {
        results.transcription = {
          success: false,
          message: `${config.transcription.provider} provider testing not implemented yet`,
          details: null
        };
      }
    } catch (error: any) {
      results.transcription = {
        success: false,
        message: `Transcription API test failed: ${error.message}`,
        details: error
      };
    }

    // Test LLM API
    try {
      if (config.llm.provider === 'openai' && config.llm.apiKey) {
        const openai = new OpenAI({ apiKey: config.llm.apiKey });

        // Test with a simple completion
        await openai.chat.completions.create({
          model: config.llm.model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 1
        });

        results.llm = {
          success: true,
          message: 'OpenAI LLM API connection successful',
          details: null
        };
      } else if (config.llm.provider === 'google' && config.llm.apiKey) {
        // Test Google Gemini API - try different model names
        const modelName = config.llm.model || 'gemini-1.5-flash';
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${config.llm.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: 'Test'
              }]
            }]
          })
        });

        if (response.ok) {
          results.llm = {
            success: true,
            message: 'Google Gemini API connection successful',
            details: null
          };
        } else {
          const errorData = await response.json();
          results.llm = {
            success: false,
            message: `Google Gemini API test failed: ${errorData.error?.message || 'Unknown error'}`,
            details: errorData
          };
        }
      } else if (config.llm.provider === 'custom') {
        if (config.llm.customEndpoint) {
          try {
            new URL(config.llm.customEndpoint);
            results.llm = {
              success: true,
              message: 'Custom LLM endpoint format is valid',
              details: null
            };
          } catch {
            results.llm = {
              success: false,
              message: 'Invalid custom endpoint URL format',
              details: null
            };
          }
        } else {
          results.llm = {
            success: false,
            message: 'Custom endpoint is required for custom provider',
            details: null
          };
        }
      } else {
        results.llm = {
          success: false,
          message: `${config.llm.provider} provider testing not implemented yet`,
          details: null
        };
      }
    } catch (error: any) {
      results.llm = {
        success: false,
        message: `LLM API test failed: ${error.message}`,
        details: error
      };
    }

    // Test embeddings API
    try {
      if (config.embeddings.provider === 'openai' && config.embeddings.apiKey) {
        const openai = new OpenAI({ apiKey: config.embeddings.apiKey });
        
        // Test with a simple embedding
        await openai.embeddings.create({
          model: config.embeddings.model || 'text-embedding-ada-002',
          input: 'test'
        });
        
        results.embeddings = {
          success: true,
          message: 'OpenAI Embeddings API connection successful',
          details: null
        };
      } else if (config.embeddings.provider === 'custom') {
        if (config.embeddings.customEndpoint) {
          try {
            new URL(config.embeddings.customEndpoint);
            results.embeddings = {
              success: true,
              message: 'Custom embeddings endpoint format is valid',
              details: null
            };
          } catch {
            results.embeddings = {
              success: false,
              message: 'Invalid custom endpoint URL format',
              details: null
            };
          }
        } else {
          results.embeddings = {
            success: false,
            message: 'Custom endpoint is required for custom provider',
            details: null
          };
        }
      } else {
        results.embeddings = {
          success: false,
          message: `${config.embeddings.provider} provider testing not implemented yet`,
          details: null
        };
      }
    } catch (error: any) {
      results.embeddings = {
        success: false,
        message: `Embeddings API test failed: ${error.message}`,
        details: error
      };
    }

    const overallSuccess = results.transcription.success && results.llm.success && results.embeddings.success;

    return NextResponse.json({
      success: overallSuccess,
      message: overallSuccess 
        ? 'All API connections successful' 
        : 'One or more API connections failed',
      results
    });

  } catch (error: any) {
    console.error('API test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to test API connections',
      error: error.message
    }, { status: 500 });
  }
}
