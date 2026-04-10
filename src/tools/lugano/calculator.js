import { luganoDefinition } from './definition.js';

export function calculateLugano(formState) {
  const { stage, suffixes, lymphomaType } = formState;
  const stageInfo = luganoDefinition.stages.find((s) => s.id === stage);
  const activeSuffixes = (suffixes || []).filter(Boolean);

  const level = !stage ? 0 : stage === 'I' ? 1 : stage === 'II' ? 2 : stage === 'III' ? 3 : 5;
  const riskGroup = !stage ? '' : (stage === 'I' || stage === 'II') ? 'Limited stage' : 'Advanced stage';

  let fullLabel = stageInfo ? `Stage ${stage}` : '--';
  if (activeSuffixes.length > 0) fullLabel += activeSuffixes.join('');

  const typeLabel = lymphomaType === 'hodgkin' ? 'Hodgkin lymphoma' : lymphomaType === 'nhl' ? 'Non-Hodgkin lymphoma' : '';

  return {
    stage: stage || '--',
    stageLabel: stageInfo?.label || '--',
    stageDescription: stageInfo?.description || '',
    stageProvided: !!stage,
    fullLabel,
    suffixesText: activeSuffixes.length > 0 ? activeSuffixes.join(', ') : '',
    suffixesProvided: activeSuffixes.length > 0,
    typeLabel,
    typeProvided: !!lymphomaType,
    riskGroup,
    riskGroupProvided: !!riskGroup,
    level,
  };
}
