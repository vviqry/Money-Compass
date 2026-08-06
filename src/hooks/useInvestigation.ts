import { useState, useCallback } from 'react';
import type { InvestigationData } from '@/types';
import { INVESTIGATION_GATES } from '@/lib/constants';

export interface InvestigationState {
  isActive: boolean;
  currentGate: number;
  answers: Partial<InvestigationData>;
  showHistory: boolean;
  showCoolingTimer: boolean;
  coolingComplete: boolean;
}

const initialState: InvestigationState = {
  isActive: false,
  currentGate: 1,
  answers: {},
  showHistory: false,
  showCoolingTimer: false,
  coolingComplete: false,
};

export function useInvestigation() {
  const [state, setState] = useState<InvestigationState>(initialState);

  const startInvestigation = useCallback(() => {
    setState({ ...initialState, isActive: true });
  }, []);

  const submitGateAnswer = useCallback((gateId: number, answer: unknown) => {
    setState((prev) => {
      const newAnswers = { ...prev.answers };

      switch (gateId) {
        case 1:
          newAnswers.gate1_whatBuying = answer as string;
          break;
        case 2:
          newAnswers.gate2_expectedResult = answer as string;
          break;
        case 3:
          newAnswers.gate3_unfinishedProducts = answer as string;
          break;
        case 4:
          newAnswers.gate4_percentageGenerated = answer as number;
          break;
        case 5:
          newAnswers.gate5_ifNotBuy = answer as string;
          break;
        case 6:
          newAnswers.gate6_completedPrevious = answer as boolean;
          break;
        case 7: {
          const a = answer as { value: boolean; explanation: string };
          newAnswers.gate7_teachesNew = a.value;
          newAnswers.gate7_explanation = a.explanation;
          break;
        }
        case 8:
          newAnswers.gate8_uniqueCapability = answer as string;
          break;
      }

      const nextGate = gateId + 1;
      const isLastGate = gateId >= INVESTIGATION_GATES.length;

      return {
        ...prev,
        answers: newAnswers,
        currentGate: isLastGate ? gateId : nextGate,
        showHistory: isLastGate,
      };
    });
  }, []);

  const proceedToTimer = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showHistory: false,
      showCoolingTimer: true,
    }));
  }, []);

  const completeCooling = useCallback(() => {
    setState((prev) => ({
      ...prev,
      coolingComplete: true,
    }));
  }, []);

  const getInvestigationData = useCallback((): InvestigationData => {
    return {
      gate1_whatBuying: state.answers.gate1_whatBuying || '',
      gate2_expectedResult: state.answers.gate2_expectedResult || '',
      gate3_unfinishedProducts: state.answers.gate3_unfinishedProducts || '',
      gate4_percentageGenerated: state.answers.gate4_percentageGenerated || 0,
      gate5_ifNotBuy: state.answers.gate5_ifNotBuy || '',
      gate6_completedPrevious: state.answers.gate6_completedPrevious || false,
      gate7_teachesNew: state.answers.gate7_teachesNew || false,
      gate7_explanation: state.answers.gate7_explanation || '',
      gate8_uniqueCapability: state.answers.gate8_uniqueCapability || '',
      completedAt: new Date().toISOString(),
      coolingTimerCompleted: true,
    };
  }, [state.answers]);

  const cancelInvestigation = useCallback(() => {
    setState(initialState);
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    startInvestigation,
    submitGateAnswer,
    proceedToTimer,
    completeCooling,
    getInvestigationData,
    cancelInvestigation,
    reset,
    totalGates: INVESTIGATION_GATES.length,
  };
}
