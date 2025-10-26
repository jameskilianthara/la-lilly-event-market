'use client';

import { useCallback } from 'react';
import { ClientBrief } from '../types/blueprint';
import { ForgeMessageData } from '../components/forge/ForgeMessage';

interface ForgeSession {
  messages: ForgeMessageData[];
  currentStep: number;
  clientBrief: ClientBrief;
  isComplete: boolean;
  blueprintId: string | null;
  timestamp: number;
}

const FORGE_SESSION_KEY = 'eventfoundry_session';
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const useForgeSession = () => {
  const saveSession = useCallback((sessionData: Omit<ForgeSession, 'timestamp'>) => {
    try {
      const session: ForgeSession = {
        ...sessionData,
        timestamp: Date.now()
      };
      localStorage.setItem(FORGE_SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.warn('Failed to save forge session:', error);
    }
  }, []);

  const loadSession = useCallback((): Omit<ForgeSession, 'timestamp'> | null => {
    try {
      const saved = localStorage.getItem(FORGE_SESSION_KEY);
      if (!saved) return null;

      const session: ForgeSession = JSON.parse(saved);

      // Check if session has expired
      if (Date.now() - session.timestamp > SESSION_EXPIRY) {
        localStorage.removeItem(FORGE_SESSION_KEY);
        return null;
      }

      return {
        messages: session.messages,
        currentStep: session.currentStep,
        clientBrief: session.clientBrief,
        isComplete: session.isComplete,
        blueprintId: session.blueprintId
      };
    } catch (error) {
      console.warn('Failed to load forge session:', error);
      return null;
    }
  }, []);

  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem(FORGE_SESSION_KEY);
    } catch (error) {
      console.warn('Failed to clear forge session:', error);
    }
  }, []);

  const hasActiveSession = useCallback((): boolean => {
    const session = loadSession();
    return session !== null && session.messages.length > 1;
  }, [loadSession]);

  return {
    saveSession,
    loadSession,
    clearSession,
    hasActiveSession
  };
};