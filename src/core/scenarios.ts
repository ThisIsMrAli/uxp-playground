export type PreviewScenario = 'sample' | 'empty-sequence' | 'no-active-sequence';

export const PREMIERE_SCENARIOS: { id: PreviewScenario; label: string; description: string }[] = [
  { id: 'sample', label: 'Sample sequence', description: 'Sequence 01 has sample tracks and two review markers. The project bin contains sample footage.' },
  { id: 'empty-sequence', label: 'Empty sequence', description: 'Sequence 01 is open with tracks but has no clips, markers, or duration.' },
  { id: 'no-active-sequence', label: 'No active sequence', description: 'A project is open and has saved sequences, but no sequence is active.' }
];
