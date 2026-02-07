const PHASE_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  LOBBY: 'Lobby',
  TEAM_SETUP: 'Team Setup',
  GAME_INTRO: 'Starting',
  ROUND_INTRO: 'Round Intro',
  EATING_PHASE: 'Eating',
  GAME_PHASE: 'Playing',
  ROUND_RESULTS: 'Results',
  GAME_END: 'Completed',
};

export function getPhaseLabel(phase: string): string {
  return PHASE_LABELS[phase] || phase;
}

export function getPhaseColorClass(phase: string): string {
  if (phase === 'DRAFT') return 'text-gray-400';
  if (phase === 'GAME_END') return 'text-green-400';
  return 'text-primary';
}

export function formatEventDate(date: Date | null): string | null {
  if (!date) return null;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export { PHASE_LABELS };
