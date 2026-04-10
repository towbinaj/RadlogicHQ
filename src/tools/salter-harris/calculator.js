import { salterHarrisDefinition } from './definition.js';

export function calculateSalterHarris(formState) {
  const { type, location } = formState;
  const info = salterHarrisDefinition.types.find((t) => t.id === type);
  const level = !type ? 0 : type === 'I' || type === 'II' ? 2 : type === 'III' ? 3 : 5;

  return {
    type: type || '--',
    typeLabel: info?.label || '--',
    anatomy: info?.anatomy || '',
    prognosis: info?.prognosis || '',
    management: info?.management || '',
    typeProvided: !!type,
    locationLabel: location || '',
    locationProvided: !!location,
    level,
  };
}
