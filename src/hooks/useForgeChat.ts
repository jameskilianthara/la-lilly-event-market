'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ForgeMessageData } from '../components/forge/ForgeMessage';
import { selectForgeBlueprint } from '../services/blueprintSelector';
import { useForgeSession } from './useForgeSession';
import { useAuth } from '../contexts/AuthContext';
import { createEvent } from '../lib/database';
import type { ClientBrief } from '../types/blueprint';
import { mapEventTypeToChecklist } from '../lib/checklistMapper';
import { parseEventDate } from '../lib/dateParser';

export const useForgeChat = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ForgeMessageData[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [clientBrief, setClientBrief] = useState<ClientBrief>({});
  const [isComplete, setIsComplete] = useState(false);
  const [blueprintId, setBlueprintId] = useState<string | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [postAuthWelcome, setPostAuthWelcome] = useState(false);

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

  // Extract event creation logic to reusable function
  const triggerEventCreation = useCallback(async () => {
    if (isCreatingEvent) return;

    setIsCreatingEvent(true);

    try {
      // Check authentication
      if (!isAuthenticated || !user) {
        // Save state before redirecting to auth
        localStorage.setItem('forgeChat_pendingAuth', JSON.stringify({
          timestamp: Date.now(),
          step: currentStep,
          briefSnapshot: clientBrief
        }));

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
      const selectedBlueprint = await selectForgeBlueprint(clientBrief);
      setBlueprintId(selectedBlueprint.id);

      // Parse date to SQL-compatible format
      const parsedDate = parseEventDate(clientBrief.date);
      console.log('Date parsing:', {
        original: clientBrief.date,
        parsed: parsedDate
      });

      // Create event title
      const eventTitle = `${clientBrief.event_type || 'Event'} - ${clientBrief.city || 'TBD'} - ${clientBrief.date || 'Date TBD'}`;

      // Prepare event data for database
      const eventData = {
        owner_user_id: user.userId,
        title: eventTitle,
        event_type: clientBrief.event_type || 'General Event',
        date: parsedDate, // Use parsed SQL-compatible date
        city: clientBrief.city || null,
        guest_count: parseInt(clientBrief.guest_count || '0') || null,
        client_brief: {
          event_type: clientBrief.event_type,
          date: clientBrief.date, // Keep original human-readable format in brief
          date_parsed: parsedDate, // Also store parsed version
          city: clientBrief.city,
          guest_count: clientBrief.guest_count,
          venue_status: clientBrief.venue_status,
          conversation: messages.slice(-10), // Last 10 messages for context
          reference_images: []
        },
        forge_blueprint: selectedBlueprint,
        forge_status: 'BLUEPRINT_READY' as const,
      };

      console.log('Creating event in database:', eventData);

      // Create event in database
      const result = await createEvent(eventData);

      if (result.error) {
        console.error('Error creating event:', result.error);
        console.error('Error details:', {
          message: result.error.message,
          code: (result.error as any).code,
          details: (result.error as any).details,
          hint: (result.error as any).hint
        });

        // Check if it's a date-related error
        const isDateError = result.error.message?.includes('invalid input syntax for type date') ||
                           result.error.message?.includes('date');

        const errorContent = isDateError
          ? `I had trouble with the date format you provided ("${clientBrief.date}"). Please make sure to provide the event date in a format like "December 2025" or "June 15, 2025". Let's try creating your event again with the correct date format.`
          : `I encountered an issue creating your event: ${result.error.message || 'Database error'}. Please try again or contact support at kerala@eventfoundry.com`;

        const errorMessage: ForgeMessageData = {
          id: `error-${Date.now()}`,
          type: 'assistant',
          content: errorContent,
          timestamp: new Date()
        };
        addMessage(errorMessage);
        setIsCreatingEvent(false);
        return;
      }

      if (!result.data) {
        console.error('Event creation returned no data');
        const errorMessage: ForgeMessageData = {
          id: `error-${Date.now()}`,
          type: 'assistant',
          content: `Event creation completed but returned no data. Please try again or contact support.`,
          timestamp: new Date()
        };
        addMessage(errorMessage);
        setIsCreatingEvent(false);
        return;
      }

      const createdEvent = result.data;
      console.log('Event created successfully:', createdEvent);

      // Map event type to appropriate checklist
      const checklistType = mapEventTypeToChecklist(clientBrief.event_type || '');
      console.log('Mapped event type to checklist:', checklistType);

      const completionMessage: ForgeMessageData = {
        id: `completion-${Date.now()}`,
        type: 'assistant',
        content: `Perfect! Now let's customize your ${clientBrief.event_type || 'event'} requirements. I'll guide you through selecting exactly what you need for an extraordinary experience.`,
        timestamp: new Date(),
        action: {
          type: 'navigate',
          label: 'Customize Your Event Checklist →',
          href: `/checklist?type=${checklistType}&eventId=${createdEvent?.id}`
        },
        metadata: {
          blueprintId: selectedBlueprint.id,
          eventId: createdEvent?.id,
          checklistType: checklistType,
          blueprintHint: "Select your requirements and we'll create your custom blueprint."
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
  }, [isCreatingEvent, isAuthenticated, user, clientBrief, messages, addMessage]);

  // Detect post-authentication return and show welcome message
  useEffect(() => {
    // Check if user just authenticated and has pending ForgeChat session
    const pendingAuth = localStorage.getItem('forgeChat_pendingAuth');

    if (pendingAuth && user && isAuthenticated && currentStep === 5 && !isComplete) {
      const pendingData = JSON.parse(pendingAuth);

      // Show welcome message
      const welcomeBackMessage: ForgeMessageData = {
        id: `welcome-back-${Date.now()}`,
        type: 'assistant',
        content: `🎉 Welcome to EventFoundry, ${user.name || 'friend'}!\n\nThank you for joining us! I've saved all your event details:\n\n• **Event Type:** ${clientBrief.event_type}\n• **Date:** ${clientBrief.date}\n• **Location:** ${clientBrief.city}\n• **Guest Count:** ${clientBrief.guest_count}\n• **Venue:** ${clientBrief.venue_status}\n\nPerfect! Let me now create your personalized event checklist...`,
        timestamp: new Date(),
        metadata: {
          isWelcomeBack: true
        }
      };

      addMessage(welcomeBackMessage);
      setPostAuthWelcome(true);

      // Clean up pending auth flag
      localStorage.removeItem('forgeChat_pendingAuth');

      // Trigger event creation after short delay
      setTimeout(() => {
        triggerEventCreation();
      }, 2000);
    }
  }, [user, isAuthenticated, currentStep, isComplete, clientBrief, addMessage, triggerEventCreation]);

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
      // Complete the chat and trigger event creation
      setTimeout(() => {
        triggerEventCreation();
      }, 1500);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, clientBrief, addMessage, triggerEventCreation]);

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
    postAuthWelcome,
    addMessage,
    handleAnswer,
    resetChat
  };
};