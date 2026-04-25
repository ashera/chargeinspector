export const RANKS = [
  { name: 'Civilian',         icon: '👤', threshold: 0    },
  { name: 'Tipster',          icon: '🗣️', threshold: 10   },
  { name: 'Informant',        icon: '👁️', threshold: 50   },
  { name: 'Street Detective', icon: '🔍', threshold: 100  },
  { name: 'Private Eye',      icon: '🕵️', threshold: 250  },
  { name: 'Inspector',        icon: '🎩', threshold: 500  },
  { name: 'Commissioner',     icon: '⭐', threshold: 1000 },
];

export function getCurrentRank(totalPoints) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (totalPoints >= r.threshold) rank = r;
  }
  return rank;
}
