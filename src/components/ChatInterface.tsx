'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, Mic, User, Bot, Loader2 } from 'lucide-react';
import AudioRecorder from './AudioRecorder';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isAudio?: boolean;
  processing?: boolean;
}

interface ChatInterfaceProps {
  onSendMessage: (message: string, isAudio?: boolean) => Promise<string>;
}

export default function ChatInterface({ onSendMessage }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI assistant for student tracking. You can ask me about student information, test scores, payments, or any other questions about your students. You can type your question or use the microphone to record audio.',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (content: string, type: 'user' | 'assistant', isAudio = false) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      isAudio,
      processing: type === 'assistant' && content === ''
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  };

  const updateMessage = (id: string, content: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, content, processing: false } : msg
    ));
  };

  const handleSendText = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsLoading(true);

    // Add user message
    addMessage(userMessage, 'user');

    // Add placeholder assistant message
    const assistantMessageId = addMessage('', 'assistant');

    try {
      const response = await onSendMessage(userMessage, false);
      updateMessage(assistantMessageId, response);
    } catch (error) {
      updateMessage(assistantMessageId, 'Sorry, I encountered an error processing your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleAudioRecording = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setShowAudioRecorder(false);

    try {
      // First transcribe the audio
      const transcription = await transcribeAudio(audioBlob);
      
      if (transcription) {
        // Add user message with transcription
        addMessage(transcription, 'user', true);
        
        // Add placeholder assistant message
        const assistantMessageId = addMessage('', 'assistant');
        
        // Process the transcribed text
        const response = await onSendMessage(transcription, true);
        updateMessage(assistantMessageId, response);
      } else {
        addMessage('Sorry, I couldn\'t transcribe your audio. Please try again.', 'assistant');
      }
    } catch (error) {
      addMessage('Sorry, I encountered an error processing your audio. Please try again.', 'assistant');
    } finally {
      setIsTranscribing(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        return result.transcription;
      } else {
        console.error('Transcription failed:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      return null;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Chat Header */}
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-blue-600" />
          Student Tracking Assistant
        </CardTitle>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'assistant' && (
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
            )}
            
            <div className={`max-w-[70%] ${message.type === 'user' ? 'order-1' : ''}`}>
              <div
                className={`p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.processing ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                )}
                
                {message.isAudio && (
                  <div className="flex items-center gap-1 mt-1 text-xs opacity-75">
                    <Mic className="w-3 h-3" />
                    <span>Voice message</span>
                  </div>
                )}
              </div>
              
              <div className={`text-xs text-gray-500 mt-1 ${
                message.type === 'user' ? 'text-right' : 'text-left'
              }`}>
                {formatTime(message.timestamp)}
              </div>
            </div>

            {message.type === 'user' && (
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-gray-600" />
              </div>
            )}
          </div>
        ))}
        
        {isTranscribing && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-blue-600" />
            </div>
            <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Transcribing audio...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Audio Recorder */}
      {showAudioRecorder && (
        <div className="p-4 border-t bg-gray-50">
          <AudioRecorder
            onRecordingComplete={handleAudioRecording}
            onTranscriptionStart={() => setIsTranscribing(true)}
          />
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => setShowAudioRecorder(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      {!showAudioRecorder && (
        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about students, test scores, payments, or anything else..."
                disabled={isLoading || isTranscribing}
                className="w-full"
              />
            </div>
            
            <Button
              onClick={() => setShowAudioRecorder(true)}
              variant="outline"
              size="icon"
              disabled={isLoading || isTranscribing}
              title="Record audio message"
            >
              <Mic className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={handleSendText}
              disabled={!inputText.trim() || isLoading || isTranscribing}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send, or use the microphone for voice messages
          </div>
        </div>
      )}
    </div>
  );
}
