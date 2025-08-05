import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { envConfig } from '@/lib/env-config';
import { logger } from '@/lib/logger';
import { ErrorHandler } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ||
                   `transcribe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  logger.setRequestId(requestId)

  try {

    // Get audio file from form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({
        success: false,
        error: 'No audio file provided'
      }, { status: 400 });
    }

    let transcription = '';

    // Handle different transcription providers
    if (envConfig.api.transcription.provider === 'openai') {
      if (!envConfig.api.transcription.apiKey) {
        return NextResponse.json({
          success: false,
          error: 'OpenAI API key not configured'
        }, { status: 400 });
      }

      const openai = new OpenAI({ apiKey: envConfig.api.transcription.apiKey });

      const response = await openai.audio.transcriptions.create({
        file: audioFile,
        model: envConfig.api.transcription.model || 'whisper-1',
        language: 'en',
        response_format: 'text'
      });

      transcription = response;

    } else if (envConfig.api.transcription.provider === 'custom') {
      // Handle custom transcription API
      if (!envConfig.api.transcription.customEndpoint) {
        return NextResponse.json({
          success: false,
          error: 'Custom transcription endpoint not configured'
        }, { status: 400 });
      }

      // For now, return a placeholder for custom APIs
      transcription = 'Custom transcription not implemented yet. Please use OpenAI Whisper.';

    } else {
      return NextResponse.json({
        success: false,
        error: `Transcription provider ${envConfig.api.transcription.provider} not supported yet`
      }, { status: 400 });
    }

    logger.info('Audio transcription completed', {
      fileSize: audioFile.size,
      fileType: audioFile.type,
      transcriptionLength: transcription.length,
      requestId
    })

    logger.clearRequestId()
    return NextResponse.json({
      success: true,
      transcription: transcription.trim(),
      requestId
    });

  } catch (error: any) {
    logger.clearRequestId()
    return ErrorHandler.handle(error as Error, requestId)
  }
}
