'use client';

import React from 'react';
import Link from 'next/link';
import { SparklesIcon } from '@heroicons/react/24/solid';

export interface ForgeMessageData {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date | string;
  action?: {
    type: 'navigate';
    label: string;
    href: string;
  };
  metadata?: {
    step?: number;
    blueprintHint?: string;
    blueprintId?: string;
    eventId?: string;
    checklistType?: string;
    isWelcomeBack?: boolean;
  };
}

interface ForgeMessageProps {
  message: ForgeMessageData;
}

export const ForgeMessage: React.FC<ForgeMessageProps> = ({ message }) => {
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg px-4 py-2 text-slate-300 text-xs max-w-md text-center border border-slate-700/50">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-end space-x-2 ${isUser ? 'flex-row-reverse space-x-reverse' : ''} animate-fade-in`}>
      {/* Avatar - Only for assistant */}
      {!isUser && (
        <div className="flex-shrink-0 mb-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
            <SparklesIcon className="h-4 w-4 text-white" />
          </div>
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%]`}>
        <div
          className={`px-4 py-3 shadow-lg transition-all duration-200 ${
            isUser
              ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl rounded-tr-sm'
              : 'bg-slate-800 text-white rounded-2xl rounded-tl-sm border border-slate-700/50'
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

          {/* Blueprint Hint */}
          {message.metadata?.blueprintHint && !isUser && (
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <p className="text-xs text-slate-400 italic flex items-start gap-2">
                <span className="text-orange-400">💡</span>
                <span>{message.metadata.blueprintHint}</span>
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        {message.action && !isUser && (
          <div className="mt-3">
            <Link
              href={message.action.href}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-full transition-all duration-200 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105"
            >
              {message.action.label}
            </Link>
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-xs text-slate-500 mt-1 px-2`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};