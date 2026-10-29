import { useCaseStore } from '../../store/caseStore';
import { runClaude } from './claude';
import { runGemini } from './gemini';
import type { Phase, PhaseRequest, PhaseResult } from './types';

export { LlmError } from './types';
export type { AiProvider, Phase, PhaseRequest, PhaseResult, SourceRef } from './types';

/**
 * Unico punto da cui l'applicazione interroga un modello. Il fornitore e' quello
 * scelto nella finestra del modello; con Claude il modello dipende dalla fase,
 * con Gemini e' uno solo.
 */
export const runPhase = async (phase: Phase, request: PhaseRequest): Promise<PhaseResult> => {
    const { aiProvider, aiModel } = useCaseStore.getState();
    return aiProvider === 'claude' ? runClaude(phase, request) : runGemini(aiModel, request);
};
