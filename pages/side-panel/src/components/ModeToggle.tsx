import { FaHandPointer, FaRobot } from 'react-icons/fa';
import { useSidePanel } from '../context/SidePanelContext';

export type InteractionMode = 'default' | 'guided';

interface ModeToggleProps {
  value: InteractionMode;
  onChange: (mode: InteractionMode) => void;
  disabled?: boolean;
}

export default function ModeToggle({ value, onChange, disabled = false }: ModeToggleProps) {
  const { ut, ts } = useSidePanel();

  const options: { mode: InteractionMode; labelKey: string; descKey: string; icon: typeof FaRobot }[] = [
    { mode: 'default', labelKey: 'mode_act', descKey: 'mode_act_desc', icon: FaRobot },
    { mode: 'guided', labelKey: 'mode_guide', descKey: 'mode_guide_desc', icon: FaHandPointer },
  ];

  return (
    <div
      className={`mb-2 grid grid-cols-2 gap-1 rounded-xl border p-1 ${
        disabled
          ? 'border-zinc-200 bg-zinc-100/60 dark:border-zinc-800 dark:bg-zinc-900/60'
          : 'border-zinc-200 bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-900/80'
      }`}>
      {options.map(option => {
        const isActive = value === option.mode;
        const Icon = option.icon;
        const label = ut(option.labelKey);
        const description = ut(option.descKey);

        return (
          <button
            key={option.mode}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.mode)}
            aria-pressed={isActive}
            aria-label={`${label}: ${description}`}
            title={description}
            className={`flex items-center justify-center gap-2 rounded-lg px-2 py-1.5 font-medium transition-all ${ts('button')} ${
              disabled
                ? 'cursor-not-allowed text-zinc-400 dark:text-zinc-500'
                : isActive
                  ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700'
                  : 'text-zinc-600 hover:bg-white/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100'
            }`}>
            <Icon className="size-3.5" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
