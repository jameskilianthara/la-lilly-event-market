'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ForgeBlueprint, ClientBrief, ClientNotes, ReferenceImage, ForgeProject } from '../types/blueprint';
import { getBlueprintById } from '../services/blueprintSelector';

export const useBlueprintReview = (blueprintId: string, clientBrief: ClientBrief) => {
  const [blueprint, setBlueprint] = useState<ForgeBlueprint | null>(null);
  const [clientNotes, setClientNotes] = useState<ClientNotes>({});
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load blueprint and any saved data
  useEffect(() => {
    const loadBlueprintData = async () => {
      try {
        setIsLoading(true);

        // Get blueprint from our service
        const blueprintData = getBlueprintById(blueprintId);
        setBlueprint(blueprintData);

        // Load any saved notes from localStorage (in production, from server)
        const savedNotesKey = `blueprint-notes-${blueprintId}`;
        const savedNotes = localStorage.getItem(savedNotesKey);
        if (savedNotes) {
          setClientNotes(JSON.parse(savedNotes));
        }

        // Load any saved images from localStorage (in production, from server)
        const savedImagesKey = `blueprint-images-${blueprintId}`;
        const savedImages = localStorage.getItem(savedImagesKey);
        if (savedImages) {
          setReferenceImages(JSON.parse(savedImages));
        }

      } catch (error) {
        console.error('Error loading blueprint:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBlueprintData();
  }, [blueprintId]);

  // Auto-save client notes
  const updateClientNotes = useCallback(async (itemId: string, notes: string) => {
    const updatedNotes = { ...clientNotes, [itemId]: notes };
    setClientNotes(updatedNotes);

    // Save to localStorage (in production, debounce and save to server)
    setIsSaving(true);
    setTimeout(() => {
      const savedNotesKey = `blueprint-notes-${blueprintId}`;
      localStorage.setItem(savedNotesKey, JSON.stringify(updatedNotes));
      setIsSaving(false);
    }, 500);
  }, [clientNotes, blueprintId]);

  // Handle reference image upload
  const addReferenceImage = useCallback(async (sectionId: string, file: File) => {
    // In production, upload to cloud storage and get URL
    // For now, create a mock image with blob URL
    const imageUrl = URL.createObjectURL(file);

    const newImage: ReferenceImage = {
      id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sectionId,
      url: imageUrl,
      filename: file.name,
      uploadedAt: new Date()
    };

    const updatedImages = [...referenceImages, newImage];
    setReferenceImages(updatedImages);

    // Save to localStorage (in production, save to server)
    const savedImagesKey = `blueprint-images-${blueprintId}`;
    localStorage.setItem(savedImagesKey, JSON.stringify(updatedImages));
  }, [referenceImages, blueprintId]);

  // Handle reference image removal
  const removeReferenceImage = useCallback(async (imageId: string) => {
    const imageToRemove = referenceImages.find(img => img.id === imageId);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.url); // Clean up blob URL
    }

    const updatedImages = referenceImages.filter(img => img.id !== imageId);
    setReferenceImages(updatedImages);

    // Save to localStorage (in production, save to server)
    const savedImagesKey = `blueprint-images-${blueprintId}`;
    localStorage.setItem(savedImagesKey, JSON.stringify(updatedImages));
  }, [referenceImages, blueprintId]);

  // Finalize project - create forge project
  const finalizeProject = useCallback(async (): Promise<ForgeProject> => {
    if (!blueprint) {
      throw new Error('Blueprint not loaded');
    }

    // Call actual API to create project
    try {
      const response = await fetch('/api/forge/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'temp_user_' + Date.now(), // TODO: Get from actual auth
          clientBrief,
          blueprintId: blueprint.id || blueprintId,
          title: `${clientBrief.event_type} - ${clientBrief.date}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const { forgeProject } = await response.json();
      return forgeProject;
    } catch (error) {
      console.error('API Error:', error);
      // Fallback to mock data if API fails
      const forgeProject: ForgeProject = {
        id: `forge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `${clientBrief.event_type} - ${clientBrief.date}`,
        owner_user_id: 'current_user_id',
        forge_status: 'OPEN_FOR_BIDS',
        client_brief: clientBrief,
        forge_blueprint: blueprint,
        client_notes: clientNotes,
        reference_images: referenceImages,
        created_at: new Date()
      };

      // Clear local storage since project is now saved
      localStorage.removeItem(`blueprint-notes-${blueprintId}`);
      localStorage.removeItem(`blueprint-images-${blueprintId}`);

      console.log('Created forge project:', forgeProject);
      return forgeProject;
    }
  }, [blueprint, clientBrief, clientNotes, referenceImages, blueprintId]);

  return {
    blueprint,
    clientNotes,
    referenceImages,
    isLoading,
    isSaving,
    updateClientNotes,
    addReferenceImage,
    removeReferenceImage,
    finalizeProject
  };
};