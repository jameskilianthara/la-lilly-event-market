'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronRightIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useForgeChat } from '../../hooks/useForgeChat';
import { ForgeMessage } from './ForgeMessage';
import { ForgeProgress } from './ForgeProgress';
import { BlueprintPreview } from './BlueprintPreview';

interface ClientBrief {
  event_type?: string;
  date?: string;
  city?: string;
  guest_count?: string;
  venue_status?: string;
}

interface ForgeChatProps {
  onBlueprintReady?: (blueprintId: string, clientBrief: ClientBrief) => void;
}

export const ForgeChat: React.FC<ForgeChatProps> = () => {
  const {
    messages,
    currentStep,
    clientBrief,
    isComplete,
    blueprintId,
    addMessage,
    handleAnswer,
    resetChat
  } = useForgeChat();

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current && !isComplete) {
      inputRef.current.focus();
    }
  }, [isComplete]);

  // Remove automatic navigation - user must click the Review Blueprint button

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    // Add user message immediately
    addMessage({
      id: Date.now().toString(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    });

    // Show typing indicator
    setIsTyping(true);

    // Simulate AI processing delay
    setTimeout(async () => {
      await handleAnswer(userMessage);
      setIsTyping(false);
    }, 800 + Math.random() * 1200); // Random delay 0.8-2s for realism
  };

  const getPlaceholderAndExamples = (step: number) => {
    const stepData = [
      {
        placeholder: "e.g., Wedding, Corporate conference, Birthday celebration...",
        examples: ["Wedding", "Corporate Event", "Birthday Party", "Product Launch"]
      },
      {
        placeholder: "e.g., June 15, 2025 or Summer 2025...",
        examples: ["June 15, 2025", "December 2024", "Spring 2025"]
      },
      {
        placeholder: "e.g., Mumbai, Delhi, Bangalore...",
        examples: ["Mumbai", "Delhi", "Bangalore", "Chennai"]
      },
      {
        placeholder: "e.g., 150 guests, Around 200 people...",
        examples: ["50", "150", "200", "500+"]
      },
      {
        placeholder: "e.g., Yes we have booked, No we need help finding one...",
        examples: ["Yes, already booked", "No, need help finding one", "Considering options"]
      }
    ];

    return step > 0 && step <= 5 ? stepData[step - 1] : { placeholder: "Tell me more...", examples: [] };
  };

  const currentStepData = getPlaceholderAndExamples(currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      {/* Utility Actions Bar */}
      <div className="border-b border-slate-700/50 bg-slate-900/95 backdrop-blur-sm shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <SparklesIcon className="h-5 w-5 text-orange-500" />
              <span className="text-slate-200 font-medium text-sm">Plan Your Event</span>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <button
                onClick={resetChat}
                className="text-slate-400 hover:text-slate-200 transition-colors text-sm font-medium"
              >
                Start Over
              </button>
              <button
                onClick={() => {
                  // Emergency session clear
                  localStorage.removeItem('forge-session');
                  window.location.reload();
                }}
                className="text-red-400 hover:text-red-300 transition-colors text-sm font-medium"
              >
                Clear Session
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 shadow-2xl overflow-hidden">
              {/* Progress */}
              <div className="border-b border-slate-700/50 p-4 bg-slate-900/50">
                <ForgeProgress currentStep={currentStep} totalSteps={5} isComplete={isComplete} />
              </div>

              {/* Messages Area */}
              <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-900/30 to-slate-900/50">
                {messages.map((message) => (
                  <ForgeMessage key={message.id} message={message} />
                ))}

                {isTyping && (
                  <div className="flex items-end space-x-2 animate-fade-in">
                    <div className="flex-shrink-0 mb-1">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                        <SparklesIcon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-tl-sm px-5 py-3 shadow-lg">
                      <div className="flex space-x-1.5">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              {!isComplete && (
                <div className="border-t border-slate-700/50 p-4 bg-slate-800/95 backdrop-blur-sm">
                  <form onSubmit={handleSubmit} className="space-y-3">

                    <div className="flex space-x-3">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={currentStepData.placeholder}
                        disabled={isTyping}
                        className="flex-1 bg-slate-700 border border-slate-600 rounded-full px-5 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:bg-slate-700/50 transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!inputValue.trim() || isTyping}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-slate-600 disabled:to-slate-700 w-12 h-12 rounded-full text-white font-semibold transition-all duration-200 flex items-center justify-center disabled:cursor-not-allowed shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 disabled:shadow-none disabled:scale-100"
                      >
                        <ChevronRightIcon className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Quick Examples */}
                    {currentStepData.examples.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {currentStepData.examples.map((example, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setInputValue(example)}
                            className="bg-slate-700 hover:bg-slate-600 border border-slate-600 px-3 py-1.5 rounded-full text-sm text-slate-200 hover:text-white transition-all font-medium shadow-sm hover:shadow-md"
                          >
                            {example}
                          </button>
                        ))}
                      </div>
                    )}
                  </form>
                </div>
              )}

              {/* Blueprint Ready Message */}
              {isComplete && (
                <div className="border-t border-emerald-500/30 bg-gradient-to-r from-emerald-900/40 to-green-900/40 p-4 backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                        <SparklesIcon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-emerald-300 font-semibold flex items-center gap-2">
                        <span>🔥</span>
                        <span>Your event blueprint is ready!</span>
                      </p>
                      <p className="text-slate-300 text-sm mt-1">
                        Click &quot;Review Blueprint&quot; to see your custom checklist and proceed to find industry professionals.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Blueprint Preview Sidebar */}
          <div className="lg:col-span-1">
            <BlueprintPreview
              clientBrief={clientBrief}
              blueprintId={blueprintId}
              isComplete={isComplete}
            />
          </div>
        </div>
      </div>
    </div>
  );
};