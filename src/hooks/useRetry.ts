// src/hooks/useRetry.ts
import { useState, useCallback } from 'react';

interface UseRetryOptions {
  maxAttempts?: number;
  delay?: number;
}

export function useRetry(options: UseRetryOptions = {}) {
  const { maxAttempts = 3, delay = 1000 } = options;
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(false);

  const retry = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    setLoading(true);
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await operation();
        setAttempts(0); // Reset on success
        setLoading(false);
        return result;
      } catch (error) {
        setAttempts(attempt + 1);
        
        if (attempt === maxAttempts - 1) {
          setLoading(false);
          throw error; // Re-throw on final attempt
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
      }
    }
    
    setLoading(false);
    throw new Error('Max retry attempts reached');
  }, [maxAttempts, delay]);

  return { retry, attempts, loading, canRetry: attempts < maxAttempts };
}


