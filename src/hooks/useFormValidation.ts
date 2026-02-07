// src/hooks/useFormValidation.ts
import { useState, useCallback } from 'react';
import { z } from 'zod';

interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>;
  onSuccess?: (data: T) => void;
  onError?: (errors: Record<string, string>) => void;
}

export function useFormValidation<T extends Record<string, any>>({
  schema,
  onSuccess,
  onError,
}: UseFormValidationOptions<T>) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback((data: Partial<T>) => {
    setIsValidating(true);
    setErrors({});

    try {
      const validatedData = schema.parse(data);
      setErrors({});
      onSuccess?.(validatedData);
      setIsValidating(false);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          const path = err.path[0];
          if (typeof path === 'string') {
            fieldErrors[path] = err.message;
          }
        });
        setErrors(fieldErrors);
        onError?.(fieldErrors);
        setIsValidating(false);
        return { success: false, errors: fieldErrors };
      }

      const generalError = { general: 'Validation failed' };
      setErrors(generalError);
      onError?.(generalError);
      setIsValidating(false);
      return { success: false, errors: generalError };
    }
  }, [schema, onSuccess, onError]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  return {
    validate,
    errors,
    isValidating,
    clearErrors,
    clearFieldError,
    hasErrors: Object.keys(errors).length > 0,
  };
}

// Hook for async form submission with validation
export function useFormSubmission<T extends Record<string, any>>({
  schema,
  onSubmit,
  onValidationError,
  onSubmitError,
}: {
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<void> | void;
  onValidationError?: (errors: Record<string, string>) => void;
  onSubmitError?: (error: Error) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validation = useFormValidation({
    schema,
    onError: onValidationError,
  });

  const submit = useCallback(async (data: Partial<T>) => {
    setSubmitError(null);

    // Validate first
    const validationResult = validation.validate(data);
    if (!validationResult.success || !validationResult.data) {
      return { success: false, errors: validationResult.errors };
    }

    setIsSubmitting(true);

    try {
      await onSubmit(validationResult.data);
      setIsSubmitting(false);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setSubmitError(errorMessage);
      onSubmitError?.(error instanceof Error ? error : new Error(errorMessage));
      setIsSubmitting(false);
      return { success: false, error: errorMessage };
    }
  }, [validation, onSubmit, onSubmitError]);

  return {
    ...validation,
    submit,
    isSubmitting,
    submitError,
    canSubmit: !validation.hasErrors && !isSubmitting,
  };
}









