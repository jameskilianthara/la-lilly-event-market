'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ForgeMessageData } from '../components/forge/ForgeMessage';
import { selectForgeBlueprint } from '../services/blueprintSelector';
import { useForgeSession } from './useForgeSession';
import { useAuth } from '../contexts/AuthContext';
import { createEvent } from '../lib/database';
import type { ClientBrief } from '../types/blueprint';

export const useForgeChat = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ForgeMessageData[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [clientBrief, setClientBrief] = useState<ClientBrief>({});
  const [isComplete, setIsComplete] = useState(false);
  const [blueprintId, setBlueprintId] = useState<string | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

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
        setIsCreatingEvent(true);

        try {
          // Check authentication
          if (!isAuthenticated || !user) {
            const authMessage: ForgeMessageData = {
              id: `auth-required-${Date.now()}`,
              type: 'assistant',
              content: `To create your event, please sign in or create an account. Your event details will be saved for you.`,
              timestamp: new Date(),
              action: {
                type: 'navigate',
                label: 'Sign In / Register →',
                href: '/login'
              }
            };
            addMessage(authMessage);
            setIsCreatingEvent(false);
            return;
          }

          // Select blueprint
          const selectedBlueprint = await selectForgeBlueprint(updatedBrief);
          setBlueprintId(selectedBlueprint.id);

          // Create event title
          const eventTitle = `${updatedBrief.event_type || 'Event'} - ${updatedBrief.city || 'TBD'} - ${updatedBrief.date || 'Date TBD'}`;

          // Prepare event data for database
          const eventData = {
            owner_user_id: user.userId,
            title: eventTitle,
            event_type: updatedBrief.event_type || 'General Event',
            date: updatedBrief.date || null,
            city: updatedBrief.city || null,
            guest_count: parseInt(updatedBrief.guest_count || '0') || null,
            client_brief: {
              event_type: updatedBrief.event_type,
              date: updatedBrief.date,
              city: updatedBrief.city,
              guest_count: updatedBrief.guest_count,
              venue_status: updatedBrief.venue_status,
              conversation: messages.slice(-10), // Last 10 messages for context
              reference_images: []
            },
            forge_blueprint: selectedBlueprint.blueprint || {},
            forge_status: 'BLUEPRINT_READY' as const,
          };

          console.log('Creating event in database:', eventData);

          // Create event in database
          const result = await createEvent(eventData);

          if (result.error) {
            console.error('Error creating event:', result.error);
            const errorMessage: ForgeMessageData = {
              id: `error-${Date.now()}`,
              type: 'assistant',
              content: `I encountered an issue creating your event. Please try again or contact support at kerala@eventfoundry.com`,
              timestamp: new Date()
            };
            addMessage(errorMessage);
            setIsCreatingEvent(false);
            return;
          }

          const createdEvent = result.data;
          console.log('Event created successfully:', createdEvent);

          const completionMessage: ForgeMessageData = {
            id: `completion-${Date.now()}`,
            type: 'assistant',
            content: `Perfect! I've created your event blueprint. Click below to review and customize your requirements:`,
            timestamp: new Date(),
            action: {
              type: 'navigate',
              label: 'Review Event Blueprint →',
              href: `/blueprint/${createdEvent?.id}`
            },
            metadata: {
              blueprintId: selectedBlueprint.id,
              eventId: createdEvent?.id,
              blueprintHint: "Your custom blueprint is ready for review."
            }
          };

          addMessage(completionMessage);
          setIsComplete(true);
          setIsCreatingEvent(false);

        } catch (error) {
          console.error('Unexpected error creating event:', error);
          const errorMessage: ForgeMessageData = {
            id: `error-${Date.now()}`,
            type: 'assistant',
            content: `An unexpected error occurred. Please try again or contact support.`,
            timestamp: new Date()
          };
          addMessage(errorMessage);
          setIsCreatingEvent(false);
        }
      }, 1500);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, clientBrief, messages, user, isAuthenticated, addMessage]);

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
    isCreatingEvent,
    addMessage,
    handleAnswer,
    resetChat
  };
};