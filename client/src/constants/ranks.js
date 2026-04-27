export const RANKS = [
  { name: 'Civilian',         icon: '👤', threshold: 0,    description: 'New recruit — just getting started' },
  { name: 'Tipster',          icon: '🗣️', threshold: 10,   description: 'Your first tip in the case files' },
  { name: 'Informant',        icon: '👁️', threshold: 50,   description: 'A trusted source of intelligence' },
  { name: 'Street Detective', icon: '🔍', threshold: 100,  description: 'Starting to connect the dots' },
  { name: 'Private Eye',      icon: '🕵️', threshold: 250,  description: 'A respected independent investigator' },
  { name: 'Inspector',        icon: '🎩', threshold: 500,  description: 'Commanding authority in the field' },
  { name: 'Commissioner',     icon: '⭐', threshold: 1000, description: 'The highest rank. A true legend.' },
];

export function getCurrentRank(totalPoints) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (totalPoints >= r.threshold) rank = r;
  }
  return rank;
}
