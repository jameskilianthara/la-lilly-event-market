'use client';

import { useState, useCallback, useEffect } from 'react';
import { ForgeMessageData } from '../components/forge/ForgeMessage';
import { selectForgeBlueprint } from '../services/blueprintSelector';
import { useForgeSession } from './useForgeSession';
import { ClientBrief } from '@/types/blueprint';

export const useForgeChat = () => {
  const [messages, setMessages] = useState<ForgeMessageData[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [clientBrief, setClientBrief] = useState<ClientBrief>({});
  const [isComplete, setIsComplete] = useState(false);
  const [blueprintId, setBlueprintId] = useState<string | null>(null);

  const { saveSession, loadSession, clearSession } = useForgeSession();

  // Load session on mount
  useEffect(() => {
    const savedSession = loadSession();
    if (savedSession) {
      setMessages(savedSession.messages || []);
      setCurrentStep(savedSession.currentStep || 0);
      setClientBrief(savedSession.clientBrief || {});
      setIsComplete(savedSession.isComplete || false);
      setBlueprintId(savedSession.blueprintId || null);
    } else {
      // Initialize with welcome message and first question together
      const welcomeMessage: ForgeMessageData = {
        id: 'welcome',
        type: 'assistant',
        content: "Welcome to EventFoundry! 🔥 I'm here to help you plan an extraordinary event. Let's start by understanding your vision.",
        timestamp: new Date(),
        metadata: {
          step: 0,
          blueprintHint: "Your answers will help me create the perfect blueprint for your event."
        }
      };

      const firstQuestion: ForgeMessageData = {
        id: 'question-1-initial',
        type: 'assistant',
        content: 'What type of event are you planning?',
        timestamp: new Date(),
        metadata: {
          step: 1
        }
      };

      setMessages([welcomeMessage, firstQuestion]);
      setCurrentStep(1);
    }
  }, [loadSession]);

  // Save session whenever state changes
  useEffect(() => {
    if (messages.length > 0) {
      saveSession({
        messages,
        currentStep,
        clientBrief,
        isComplete,
        blueprintId
      });
    }
  }, [messages, currentStep, clientBrief, isComplete, blueprintId, saveSession]);

  const addMessage = useCallback((message: ForgeMessageData) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const getStepField = (step: number): keyof ClientBrief => {
    const stepFields: (keyof ClientBrief)[] = ['event_type', 'date', 'city', 'guest_count', 'venue_status'];
    return stepFields[step - 1];
  };

  const generateAssistantResponse = (step: number, userAnswer: string): string => {
    const responses = [
      // Event type
      (answer: string) => `Perfect! A ${answer.toLowerCase()} - that's going to be an amazing event to plan. Now, when are you planning to host this special occasion?`,

      // Date
      (answer: string) => `Excellent timing! ${answer} gives us a great foundation to work with. Which city will host this memorable experience?`,

      // City
      (answer: string) => `${answer} is a fantastic choice for your event! The local professionals there are exceptional. How many guests are you expecting to attend?`,

      // Guest count
      (answer: string) => `${answer} guests - that helps me understand the scale perfectly. One final question: do you already have a venue secured, or do you need help finding the perfect space?`,

      // Venue status
      (answer: string) => `Wonderful! ${answer}. I now have everything I need to create your custom blueprint. Let me select the perfect template for your event...`
    ];

    return responses[step - 1](userAnswer);
  };

  const handleAnswer = useCallback(async (answer: string) => {
    const stepField = getStepField(currentStep);

    // Update client brief
    const updatedBrief = { ...clientBrief, [stepField]: answer };
    setClientBrief(updatedBrief);

    // Add assistant response
    const assistantResponse: ForgeMessageData = {
      id: `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'assistant',
      content: generateAssistantResponse(currentStep, answer),
      timestamp: new Date(),
      metadata: {
        step: currentStep
      }
    };

    setTimeout(() => {
      addMessage(assistantResponse);
    }, 500);

    // Move to next step or complete
    if (currentStep >= 5) {
      // Complete the chat and select blueprint
      setTimeout(async () => {
        const selectedBlueprint = await selectForgeBlueprint(updatedBrief);
        setBlueprintId(selectedBlueprint.id);

        // Save client brief to localStorage for checklist page
        localStorage.setItem('lalilly-event-memory', JSON.stringify({
          event_type: updatedBrief.event_type,
          date: updatedBrief.date,
          location: updatedBrief.city,
          guest_count: updatedBrief.guest_count,
          venue_status: updatedBrief.venue_status,
          conversation: messages,
          reference_images: []
        }));

        const completionMessage: ForgeMessageData = {
          id: `completion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'assistant',
          content: `Perfect! I've gathered all your core event details.\n\nNow let's customize your event requirements with our interactive checklist. Click below to review and select exactly what you need:`,
          timestamp: new Date(),
          action: {
            type: 'navigate',
            label: 'Open Event Checklist →',
            href: `/checklist?type=${updatedBrief.event_type || 'wedding'}`
          },
          metadata: {
            blueprintId: selectedBlueprint.id,
            blueprintHint: "Your custom checklist is ready for you to explore and customize."
          }
        };

        addMessage(completionMessage);
        setIsComplete(true);
      }, 1500);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, clientBrief, addMessage]);

  const resetChat = useCallback(() => {
    clearSession();
    setMessages([]);
    setCurrentStep(0);
    setClientBrief({});
    setIsComplete(false);
    setBlueprintId(null);

    // Re-initialize with welcome message and first question together
    setTimeout(() => {
      const welcomeMessage: ForgeMessageData = {
        id: 'welcome-reset',
        type: 'assistant',
        content: "Welcome back to EventFoundry! 🔥 Ready to plan another extraordinary event? Let's start fresh.",
        timestamp: new Date(),
        metadata: {
          step: 0,
          blueprintHint: "Your answers will help me create the perfect blueprint for your event."
        }
      };

      const firstQuestion: ForgeMessageData = {
        id: 'question-reset-initial',
        type: 'assistant',
        content: 'What type of event are you planning?',
        timestamp: new Date(),
        metadata: {
          step: 1
        }
      };

      setMessages([welcomeMessage, firstQuestion]);
      setCurrentStep(1);
    }, 100);
  }, [clearSession]);

  return {
    messages,
    currentStep,
    clientBrief,
    isComplete,
    blueprintId,
    addMessage,
    handleAnswer,
    resetChat
  };
};