import type { Badge } from '../types';

export const ALL_BADGES: Badge[] = [
  {
    id: 'FIRST_STEPS',
    name: 'First Steps',
    description: 'Successfully worked through your first math problem!',
    icon: '👟',
  },
  {
    id: 'RATIO_ROCKSTAR',
    name: 'Ratio Rockstar',
    description: 'Mastered the art of ratios and proportions.',
    icon: '🎸',
  },
  {
    id: 'EQUATION_EXPERT',
    name: 'Equation Expert',
    description: 'Solved multiple expressions and equations challenges.',
    icon: '🧠',
  },
  {
    id: 'FUNCTION_FANATIC',
    name: 'Function Fanatic',
    description: 'Demonstrated a strong understanding of functions.',
    icon: '📈',
  },
  {
    id: 'PROBLEM_SOLVER',
    name: 'Problem Solver',
    description: 'Completed 5 problems with the assistant.',
    icon: '🧩',
  },
  {
    id: 'CURIOUS_MIND',
    name: 'Curious Mind',
    description: 'Asked a great follow-up question that shows deep thinking.',
    icon: '💡',
  },
];

const badgeMap = new Map(ALL_BADGES.map(badge => [badge.id, badge]));

export const getBadgeById = (id: string): Badge | undefined => {
  return badgeMap.get(id);
};
