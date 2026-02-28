export const HIGHLIGHT_COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
] as const;

export const ACTOR_COLORS = {
  user: { bar: '#71717A', text: 'text-zinc-500' },
  system: { bar: '#A1A1AA', text: 'text-zinc-400' },
  planner: { bar: '#D97706', text: 'text-amber-600' },
  navigator: { bar: '#10B981', text: 'text-emerald-500' },
  validator: { bar: '#F43F5E', text: 'text-rose-500' },
  manager: { bar: '#7C3AED', text: 'text-violet-600' },
  evaluator: { bar: '#78716C', text: 'text-stone-500' },
} as const;

export function highlightColorForIndex(index: number): string {
  return HIGHLIGHT_COLORS[index % HIGHLIGHT_COLORS.length];
}
