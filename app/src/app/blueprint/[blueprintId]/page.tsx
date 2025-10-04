'use client';

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { BlueprintReview } from '../../../components/blueprint/BlueprintReview';

export default function BlueprintReviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const blueprintId = params.blueprintId as string;

  // Get client brief from URL params (passed from chat)
  const clientBrief = {
    event_type: searchParams.get('event_type') || '',
    date: searchParams.get('date') || '',
    city: searchParams.get('city') || '',
    guest_count: searchParams.get('guest_count') || '',
    venue_status: searchParams.get('venue_status') || ''
  };

  return (
    <div className="min-h-screen">
      <BlueprintReview
        blueprintId={blueprintId}
        clientBrief={clientBrief}
      />
    </div>
  );
}