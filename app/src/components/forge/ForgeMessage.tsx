'use client';

import React from 'react';
import Link from 'next/link';
import { UserIcon, SparklesIcon } from '@heroicons/react/24/outline';

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
      <div className="flex justify-center">
        <div className="bg-slate-100 border border-slate-200 rounded-lg px-4 py-2 text-slate-600 text-sm max-w-md text-center">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center">
            <UserIcon className="h-4 w-4 text-slate-600" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
            <SparklesIcon className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className={`max-w-md ${isUser ? 'ml-auto' : ''}`}>
        <div
          className={`rounded-lg px-4 py-2 ${
            isUser
              ? 'bg-slate-700 text-white'
              : 'bg-slate-100 text-slate-800 border border-slate-200'
          }`}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>

          {/* Blueprint Hint */}
          {message.metadata?.blueprintHint && !isUser && (
            <div className="mt-2 pt-2 border-t border-slate-300">
              <p className="text-xs text-slate-500 italic">
                💡 {message.metadata.blueprintHint}
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        {message.action && !isUser && (
          <div className="mt-3">
            <Link
              href={message.action.href}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md"
            >
              {message.action.label}
            </Link>
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-xs text-slate-400 mt-1 ${isUser ? 'text-right' : ''}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};