import { useState, useCallback } from 'react';
import { AppError } from '@/lib/errorTypes';
import { useErrorHandler } from './useErrorHandler';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  dateAfter?: string | Date;
  dateBefore?: string | Date;
  dateRange?: {
    start: string | Date;
    end: string | Date;
    parentTask?: string;
  };
}

interface ValidationRules {
  [field: string]: ValidationRule;
}

interface FormValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  stopOnFirstError?: boolean;
}

export const useFormValidation = <T extends Record<string, any>>(
  initialData: T,
  rules: ValidationRules,
  options: FormValidationOptions = {}
) => {
  const { validateOnChange = false, validateOnBlur = true, stopOnFirstError = false } = options;
  const [data, setData] = useState<T>(initialData);
  const [fieldErrors, setFieldErrors] = useState<Record<string, AppError>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { handleValidationError, handleTaskDateValidation } = useErrorHandler({ showToast: false });

  const validateField = useCallback((field: string, value: any): AppError | null => {
    const rule = rules[field];
    if (!rule) return null;

    // Required validation
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return handleValidationError(
        field,
        value,
        'required',
        `Le champ "${field}" est obligatoire.`
      );
    }

    // Skip other validations if value is empty and not required
    if (!value && !rule.required) return null;

    // String length validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return handleValidationError(
          field,
          value,
          'minLength',
          `Le champ "${field}" doit contenir au moins ${rule.minLength} caractères.`
        );
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        return handleValidationError(
          field,
          value,
          'maxLength',
          `Le champ "${field}" ne peut pas dépasser ${rule.maxLength} caractères.`
        );
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        return handleValidationError(
          field,
          value,
          'pattern',
          `Le format du champ "${field}" n'est pas valide.`
        );
      }
    }

    // Date validations
    if (value && (rule.dateAfter || rule.dateBefore || rule.dateRange)) {
      const dateValue = new Date(value);

      if (rule.dateAfter) {
        const afterDate = new Date(rule.dateAfter);
        if (dateValue <= afterDate) {
          return handleValidationError(
            field,
            value,
            'dateAfter',
            `La date "${field}" doit être postérieure au ${afterDate.toLocaleDateString()}.`
          );
        }
      }

      if (rule.dateBefore) {
        const beforeDate = new Date(rule.dateBefore);
        if (dateValue >= beforeDate) {
          return handleValidationError(
            field,
            value,
            'dateBefore',
            `La date "${field}" doit être antérieure au ${beforeDate.toLocaleDateString()}.`
          );
        }
      }

      if (rule.dateRange) {
        const { start, end, parentTask } = rule.dateRange;
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (dateValue < startDate || dateValue > endDate) {
          return handleTaskDateValidation(
            value,
            value,
            start.toString(),
            end.toString(),
            parentTask
          );
        }
      }
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        return handleValidationError(field, value, 'custom', customError);
      }
    }

    return null;
  }, [rules, handleValidationError, handleTaskDateValidation]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, AppError> = {};
    let isValid = true;

    for (const field in rules) {
      const error = validateField(field, data[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
        if (stopOnFirstError) break;
      }
    }

    setFieldErrors(newErrors);
    return isValid;
  }, [data, rules, validateField, stopOnFirstError]);

  const validateDateRange = useCallback((
    startField: string,
    endField: string,
    parentStartDate?: string,
    parentEndDate?: string,
    parentTaskTitle?: string
  ): AppError | null => {
    const startValue = data[startField];
    const endValue = data[endField];

    if (!startValue || !endValue) return null;

    return handleTaskDateValidation(
      startValue,
      endValue,
      parentStartDate,
      parentEndDate,
      parentTaskTitle
    );
  }, [data, handleTaskDateValidation]);

  const updateField = useCallback((field: string, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    
    if (validateOnChange) {
      const error = validateField(field, value);
      setFieldErrors(prev => ({
        ...prev,
        [field]: error || undefined
      }));
    } else if (fieldErrors[field]) {
      // Clear error if field was previously invalid
      const error = validateField(field, value);
      if (!error) {
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    }
  }, [validateOnChange, validateField, fieldErrors]);

  const handleBlur = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    if (validateOnBlur) {
      const error = validateField(field, data[field]);
      setFieldErrors(prev => ({
        ...prev,
        [field]: error || undefined
      }));
    }
  }, [validateOnBlur, validateField, data]);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const resetForm = useCallback(() => {
    setData(initialData);
    setFieldErrors({});
    setTouched({});
  }, [initialData]);

  const getFieldError = useCallback((field: string): AppError | undefined => {
    return fieldErrors[field];
  }, [fieldErrors]);

  const hasFieldError = useCallback((field: string): boolean => {
    return !!fieldErrors[field];
  }, [fieldErrors]);

  const isFieldTouched = useCallback((field: string): boolean => {
    return !!touched[field];
  }, [touched]);

  return {
    // Data
    data,
    setData,
    
    // Field operations
    updateField,
    handleBlur,
    
    // Validation
    validateField,
    validateForm,
    validateDateRange,
    
    // Errors
    fieldErrors,
    getFieldError,
    hasFieldError,
    clearFieldError,
    clearAllErrors,
    
    // State
    touched,
    isFieldTouched,
    
    // Utils
    resetForm,
    isValid: Object.keys(fieldErrors).length === 0,
    hasErrors: Object.keys(fieldErrors).length > 0
  };
};
