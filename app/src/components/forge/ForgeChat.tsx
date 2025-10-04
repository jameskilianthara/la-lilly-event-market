'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronRightIcon, SparklesIcon, CogIcon, HomeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-gray-100">
      {/* Navigation Header */}
      <div className="border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-6">
              <Link
                href="/"
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <CogIcon className="h-8 w-8 text-slate-700 animate-spin [animation-duration:3s]" />
                <h1 className="text-2xl font-bold text-slate-800">EventFoundry</h1>
              </Link>

              {/* Navigation */}
              <nav className="hidden md:flex items-center space-x-6">
                <Link
                  href="/"
                  className="flex items-center space-x-1 text-slate-600 hover:text-slate-800 transition-colors text-sm font-medium"
                >
                  <HomeIcon className="h-4 w-4" />
                  <span>Home</span>
                </Link>
                <Link
                  href="/forge"
                  className="flex items-center space-x-1 text-slate-800 font-medium text-sm border-b-2 border-slate-700 pb-1"
                >
                  <DocumentTextIcon className="h-4 w-4" />
                  <span>Plan Event</span>
                </Link>
              </nav>

              <div className="h-6 w-px bg-slate-300"></div>
              <span className="text-slate-600 font-medium">Plan Your Event</span>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <button
                onClick={resetChat}
                className="text-slate-500 hover:text-slate-700 transition-colors text-sm font-medium"
              >
                Start Over
              </button>
              <button
                onClick={() => {
                  // Emergency session clear
                  localStorage.removeItem('forge-session');
                  window.location.reload();
                }}
                className="text-red-500 hover:text-red-700 transition-colors text-sm font-medium"
              >
                Clear Session
              </button>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <Link
                  href="/"
                  className="flex items-center text-slate-600 hover:text-slate-800 transition-colors"
                >
                  <HomeIcon className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg overflow-hidden">
              {/* Progress */}
              <div className="border-b border-slate-200 p-4 bg-slate-50">
                <ForgeProgress currentStep={currentStep} totalSteps={5} isComplete={isComplete} />
              </div>

              {/* Messages Area */}
              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <ForgeMessage key={message.id} message={message} />
                ))}

                {isTyping && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                        <SparklesIcon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="bg-slate-100 rounded-lg px-4 py-2 max-w-md">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              {!isComplete && (
                <div className="border-t border-slate-200 p-4 bg-slate-50">
                  <form onSubmit={handleSubmit} className="space-y-3">

                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={currentStepData.placeholder}
                        disabled={isTyping}
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={!inputValue.trim() || isTyping}
                        className="bg-slate-700 hover:bg-slate-800 disabled:bg-slate-400 px-6 py-3 rounded-lg text-white font-medium transition-all duration-200 flex items-center space-x-2 disabled:cursor-not-allowed"
                      >
                        <span>Send</span>
                        <ChevronRightIcon className="h-4 w-4" />
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
                            className="bg-slate-200 hover:bg-slate-300 border border-slate-300 px-3 py-1 rounded-md text-sm text-slate-700 hover:text-slate-900 transition-colors"
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
                <div className="border-t border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
                        <SparklesIcon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-emerald-700 font-medium">🔥 Your event blueprint is ready!</p>
                      <p className="text-slate-600 text-sm mt-1">
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