/**
 * Advanced custom hook for multi-step form management
 * Using discriminated unions and state machines
 */

import { useReducer, useCallback, useMemo } from 'react';
import type { FormStep, FormState, SubsidyFormData } from '../types/form.types';

// Action types with discriminated unions
type FormAction =
  | { type: 'NEXT_STEP'; payload: Partial<SubsidyFormData> }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'GO_TO_STEP'; step: FormStep }
  | { type: 'UPDATE_DATA'; payload: Partial<SubsidyFormData> }
  | { type: 'SUBMIT'; payload: SubsidyFormData }
  | { type: 'COMPLETE'; submissionId: string }
  | { type: 'RESET' };

// Initial state
const initialState: FormState = {
  step: 'companyInfo',
  data: {}
};

// State machine transitions
const STEP_TRANSITIONS: Record<FormStep, { next?: FormStep; prev?: FormStep }> = {
  companyInfo: { next: 'address' },
  address: { next: 'employee', prev: 'companyInfo' },
  employee: { next: 'contact', prev: 'address' },
  contact: { next: 'confirmation', prev: 'employee' },
  confirmation: { next: 'completion', prev: 'contact' },
  completion: {}
};

// Reducer with exhaustive type checking
const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'NEXT_STEP': {
      const currentStep = state.step;
      const nextStep = STEP_TRANSITIONS[currentStep].next;
      
      if (!nextStep) return state;
      
      const updatedData = { ...state.data, ...action.payload };
      
      switch (nextStep) {
        case 'address':
          return { step: 'address', data: updatedData };
        case 'employee':
          return { step: 'employee', data: updatedData };
        case 'contact':
          return { step: 'contact', data: updatedData };
        case 'confirmation':
          return { step: 'confirmation', data: updatedData as SubsidyFormData };
        case 'completion':
          return { step: 'completion', submissionId: crypto.randomUUID() };
        default:
          return state;
      }
    }
    
    case 'PREVIOUS_STEP': {
      const currentStep = state.step;
      const prevStep = STEP_TRANSITIONS[currentStep].prev;
      
      if (!prevStep) return state;
      
      const currentData = state.step === 'confirmation' ? state.data : state.data;
      
      switch (prevStep) {
        case 'companyInfo':
          return { step: 'companyInfo', data: currentData };
        case 'address':
          return { step: 'address', data: currentData };
        case 'employee':
          return { step: 'employee', data: currentData };
        case 'contact':
          return { step: 'contact', data: currentData };
        default:
          return state;
      }
    }
    
    case 'GO_TO_STEP': {
      if (action.step === 'completion') {
        return { step: 'completion', submissionId: crypto.randomUUID() };
      }
      
      const currentData = state.step === 'confirmation' ? state.data : state.data;
      
      switch (action.step) {
        case 'companyInfo':
          return { step: 'companyInfo', data: currentData };
        case 'address':
          return { step: 'address', data: currentData };
        case 'employee':
          return { step: 'employee', data: currentData };
        case 'contact':
          return { step: 'contact', data: currentData };
        case 'confirmation':
          return { step: 'confirmation', data: currentData as SubsidyFormData };
        default:
          return state;
      }
    }
    
    case 'UPDATE_DATA': {
      if (state.step === 'completion') return state;
      
      return {
        ...state,
        data: { ...state.data, ...action.payload }
      } as FormState;
    }
    
    case 'SUBMIT': {
      return { step: 'confirmation', data: action.payload };
    }
    
    case 'COMPLETE': {
      return { step: 'completion', submissionId: action.submissionId };
    }
    
    case 'RESET': {
      return initialState;
    }
    
    default: {
      const exhaustiveCheck: never = action;
      return exhaustiveCheck;
    }
  }
};

// Hook return type with proper typing
interface UseMultiStepFormReturn {
  currentStep: FormStep;
  formData: Partial<SubsidyFormData> | SubsidyFormData;
  isFirstStep: boolean;
  isLastStep: boolean;
  isCompleted: boolean;
  stepNumber: number;
  totalSteps: number;
  progress: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  
  // Actions
  nextStep: (data?: Partial<SubsidyFormData>) => void;
  previousStep: () => void;
  goToStep: (step: FormStep) => void;
  updateData: (data: Partial<SubsidyFormData>) => void;
  submit: (data: SubsidyFormData) => void;
  complete: (submissionId: string) => void;
  reset: () => void;
  
  // Utilities
  getStepData: <K extends keyof SubsidyFormData>(key: K) => SubsidyFormData[K] | undefined;
  validateCurrentStep: () => boolean;
}

/**
 * Custom hook for multi-step form management
 */
export const useMultiStepForm = (): UseMultiStepFormReturn => {
  const [state, dispatch] = useReducer(formReducer, initialState);
  
  // Memoized calculations
  const stepOrder = useMemo(() => {
    return ['companyInfo', 'address', 'employee', 'contact', 'confirmation', 'completion'] as FormStep[];
  }, []);
  
  const stepNumber = useMemo(() => {
    return stepOrder.indexOf(state.step) + 1;
  }, [state.step, stepOrder]);
  
  const totalSteps = stepOrder.length - 1; // Exclude completion
  
  const progress = useMemo(() => {
    if (state.step === 'completion') return 100;
    return Math.round((stepNumber / totalSteps) * 100);
  }, [stepNumber, totalSteps, state.step]);
  
  // State checks
  const isFirstStep = state.step === 'companyInfo';
  const isLastStep = state.step === 'confirmation';
  const isCompleted = state.step === 'completion';
  
  const canGoNext = !isCompleted && state.step !== 'confirmation';
  const canGoPrevious = !isFirstStep && !isCompleted;
  
  // Actions
  const nextStep = useCallback((data?: Partial<SubsidyFormData>) => {
    dispatch({ type: 'NEXT_STEP', payload: data || {} });
  }, []);
  
  const previousStep = useCallback(() => {
    dispatch({ type: 'PREVIOUS_STEP' });
  }, []);
  
  const goToStep = useCallback((step: FormStep) => {
    dispatch({ type: 'GO_TO_STEP', step });
  }, []);
  
  const updateData = useCallback((data: Partial<SubsidyFormData>) => {
    dispatch({ type: 'UPDATE_DATA', payload: data });
  }, []);
  
  const submit = useCallback((data: SubsidyFormData) => {
    dispatch({ type: 'SUBMIT', payload: data });
  }, []);
  
  const complete = useCallback((submissionId: string) => {
    dispatch({ type: 'COMPLETE', submissionId });
  }, []);
  
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);
  
  // Utilities
  const getStepData = useCallback(<K extends keyof SubsidyFormData>(key: K) => {
    if (state.step === 'completion') return undefined;
    
    const data = state.step === 'confirmation' ? state.data : state.data;
    return data[key] as SubsidyFormData[K] | undefined;
  }, [state]);
  
  const validateCurrentStep = useCallback((): boolean => {
    // Implementation would use the validation schemas
    // This is a placeholder
    return true;
  }, []);
  
  // Get form data with proper typing
  const formData = useMemo(() => {
    if (state.step === 'completion') return {};
    return state.step === 'confirmation' ? state.data : state.data;
  }, [state]);
  
  return {
    currentStep: state.step === 'completion' ? 'completion' : state.step,
    formData,
    isFirstStep,
    isLastStep,
    isCompleted,
    stepNumber,
    totalSteps,
    progress,
    canGoNext,
    canGoPrevious,
    
    // Actions
    nextStep,
    previousStep,
    goToStep,
    updateData,
    submit,
    complete,
    reset,
    
    // Utilities
    getStepData,
    validateCurrentStep
  };
};