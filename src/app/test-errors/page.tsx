// src/app/test-errors/page.tsx
'use client';

import { useToast } from '@/components/ui/Toast';

export default function TestErrors() {
  const { showError, showSuccess } = useToast();

  const triggerError = () => {
    throw new Error('Test error');
  };

  const triggerNetworkError = async () => {
    try {
      await fetch('/api/nonexistent');
    } catch (error) {
      showError('Network request failed');
    }
  };

  return (
    <div className="p-8 space-y-4">
      <h1>Error Testing Page</h1>
      
      <button
        onClick={triggerError}
        className="px-4 py-2 bg-red-600 text-white rounded"
      >
        Trigger Component Error
      </button>
      
      <button
        onClick={triggerNetworkError}
        className="px-4 py-2 bg-yellow-600 text-white rounded"
      >
        Trigger Network Error
      </button>
      
      <button
        onClick={() => showSuccess('Test success message')}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        Show Success Toast
      </button>
    </div>
  );
}















