'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ForgeMessageData } from '../components/forge/ForgeMessage';
import { selectForgeBlueprint } from '../services/blueprintSelector';
import { useForgeSession } from './useForgeSession';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
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
    console.log('[Forge Chat] triggerEventCreation called:', {
      isCreatingEvent,
      isAuthenticated,
      user: user?.email,
      clientBrief
    });

    if (isCreatingEvent) {
      console.log('[Forge Chat] Already creating event, skipping...');
      return;
    }

    setIsCreatingEvent(true);

    try {
      // Check authentication
      if (!isAuthenticated || !user) {
        console.log('[Forge Chat] Not authenticated, showing auth message...');
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
      console.log('[Forge Chat] Date parsing:', {
        original: clientBrief.date,
        parsed: parsedDate
      });

      // Create event title
      const eventTitle = `${clientBrief.event_type || 'Event'} - ${clientBrief.city || 'TBD'} - ${clientBrief.date || 'Date TBD'}`;

      // Prepare client brief with all details
      const enrichedClientBrief = {
        event_type: clientBrief.event_type,
        date: clientBrief.date, // Keep original human-readable format
        date_parsed: parsedDate, // Also store parsed version
        city: clientBrief.city,
        guest_count: clientBrief.guest_count,
        venue_status: clientBrief.venue_status,
        conversation: messages.slice(-10), // Last 10 messages for context
        reference_images: []
      };

      console.log('[Forge Chat] ========================================');
      console.log('[Forge Chat] CREATING EVENT - Full State Dump');
      console.log('[Forge Chat] ========================================');
      console.log('[Forge Chat] clientBrief state:', JSON.stringify(clientBrief, null, 2));
      console.log('[Forge Chat] enrichedClientBrief:', JSON.stringify(enrichedClientBrief, null, 2));
      console.log('[Forge Chat] eventTitle:', eventTitle);
      console.log('[Forge Chat] ========================================');

      // Get Supabase auth token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('[Forge Chat] No active session:', sessionError);
        const errorMessage: ForgeMessageData = {
          id: `error-${Date.now()}`,
          type: 'assistant',
          content: 'Authentication error. Please log in again.',
          timestamp: new Date()
        };
        addMessage(errorMessage);
        setIsCreatingEvent(false);
        return;
      }

      // Create event via API (with authentication)
      const response = await fetch('/api/forge/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          clientBrief: enrichedClientBrief,
          blueprintId: selectedBlueprint.id,
          title: eventTitle,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create event' }));
        console.error('[Forge Chat] Create error:', errorData);

        // Check for vendor restriction error
        if (response.status === 403 || errorData.error?.includes('Only clients')) {
          const errorMessage: ForgeMessageData = {
            id: `error-${Date.now()}`,
            type: 'assistant',
            content: `⚠️ **Vendor accounts cannot create events.** \n\nYou're logged in as a vendor (${user.email}). Only client accounts can create and post events. Vendors can view events and submit bids.\n\nIf you need to create an event, please log out and create a client account instead.`,
            timestamp: new Date()
          };
          addMessage(errorMessage);
          setIsCreatingEvent(false);
          return;
        }

        const errorMessage: ForgeMessageData = {
          id: `error-${Date.now()}`,
          type: 'assistant',
          content: `I encountered an issue creating your event: ${errorData.error || 'Unknown error'}. Please try again or contact support.`,
          timestamp: new Date()
        };
        addMessage(errorMessage);
        setIsCreatingEvent(false);
        return;
      }

      const { forgeProject: createdEvent } = await response.json();
      console.log('[Forge Chat] Event created successfully:', createdEvent);

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

    if (pendingAuth && user && isAuthenticated && !postAuthWelcome && !isCreatingEvent) {
      const pendingData = JSON.parse(pendingAuth);

      console.log('[Forge Chat] Post-auth resumption detected:', {
        pendingData,
        currentStep,
        isComplete,
        clientBrief
      });

      // Restore the saved state if current state is empty
      if (!clientBrief.event_type && pendingData.briefSnapshot) {
        console.log('[Forge Chat] Restoring client brief from pending auth');
        setClientBrief(pendingData.briefSnapshot);
        setCurrentStep(pendingData.step || 5);
      }

      // Show welcome message
      const briefToUse = clientBrief.event_type ? clientBrief : pendingData.briefSnapshot;
      const welcomeBackMessage: ForgeMessageData = {
        id: `welcome-back-${Date.now()}`,
        type: 'assistant',
        content: `🎉 Welcome to EventFoundry, ${(user.userType === 'client' ? user.name : undefined) || 'friend'}!\n\nThank you for joining us! I've saved all your event details:\n\n• **Event Type:** ${briefToUse.event_type}\n• **Date:** ${briefToUse.date}\n• **Location:** ${briefToUse.city}\n• **Guest Count:** ${briefToUse.guest_count}\n• **Venue:** ${briefToUse.venue_status}\n\nPerfect! Let me now create your personalized event checklist...`,
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
        console.log('[Forge Chat] Triggering event creation after post-auth welcome');
        triggerEventCreation();
      }, 2000);
    }
  }, [user, isAuthenticated, postAuthWelcome, isCreatingEvent, currentStep, isComplete, clientBrief, addMessage, triggerEventCreation]);

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

      // Venue status - contextual response
      (answer: string) => {
        const answerLower = answer.toLowerCase();
        const needsHelp = answerLower.includes('no') || answerLower.includes('need') || answerLower.includes('help');

        if (needsHelp) {
          return `Got it! I'll make sure to include venue recommendations in your blueprint. I now have everything I need to create your custom event plan. Let me select the perfect template for your event...`;
        } else {
          return `Excellent! Having your venue secured is a great start. I now have everything I need to create your custom blueprint. Let me select the perfect template for your event...`;
        }
      }
    ];

    return responses[step - 1](userAnswer);
  };

  const handleAnswer = useCallback(async (answer: string) => {
    const stepField = getStepField(currentStep);

    // Update client brief
    const updatedBrief = { ...clientBrief, [stepField]: answer };
    setClientBrief(updatedBrief);

    console.log('[Forge Chat] handleAnswer:', {
      currentStep,
      stepField,
      answer,
      updatedBrief,
      isComplete
    });

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
      console.log('[Forge Chat] Step 5 completed! Triggering event creation in 1.5s...');
      // Complete the chat and trigger event creation
      setTimeout(() => {
        console.log('[Forge Chat] Now calling triggerEventCreation()');
        triggerEventCreation();
      }, 1500);
    } else {
      console.log('[Forge Chat] Moving to next step:', currentStep + 1);
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, clientBrief, addMessage, triggerEventCreation, isComplete]);

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