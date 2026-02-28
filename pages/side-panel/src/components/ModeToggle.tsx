import { t } from '@extension/i18n';
import { FaHandPointer, FaRobot } from 'react-icons/fa';

export type InteractionMode = 'default' | 'guided';

interface ModeToggleProps {
  value: InteractionMode;
  onChange: (mode: InteractionMode) => void;
  disabled?: boolean;
}

interface ModeOption {
  mode: InteractionMode;
  label: string;
  description: string;
  icon: typeof FaRobot;
}

const OPTIONS: ModeOption[] = [
  {
    mode: 'default',
    label: t('chat_modeToggle_act'),
    description: t('chat_modeToggle_act_desc'),
    icon: FaRobot,
  },
  {
    mode: 'guided',
    label: t('chat_modeToggle_guide'),
    description: t('chat_modeToggle_guide_desc'),
    icon: FaHandPointer,
  },
];

export default function ModeToggle({ value, onChange, disabled = false }: ModeToggleProps) {
  return (
    <div
      className={`mb-2 grid grid-cols-2 gap-1 rounded-xl border p-1 ${
        disabled
          ? 'border-zinc-200 bg-zinc-100/60 dark:border-zinc-800 dark:bg-zinc-900/60'
          : 'border-zinc-200 bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-900/80'
      }`}>
      {OPTIONS.map(option => {
        const isActive = value === option.mode;
        const Icon = option.icon;

        return (
          <button
            key={option.mode}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.mode)}
            aria-pressed={isActive}
            aria-label={`${option.label}: ${option.description}`}
            title={option.description}
            className={`flex items-center justify-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition-all ${
              disabled
                ? 'cursor-not-allowed text-zinc-400 dark:text-zinc-500'
                : isActive
                  ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700'
                  : 'text-zinc-600 hover:bg-white/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100'
            }`}>
            <Icon className="size-3.5" />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
