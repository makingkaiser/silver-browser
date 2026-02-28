import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { getUIText, type UILanguage } from '../i18n/translations';

type SizeRole = 'body' | 'button' | 'label' | 'heading' | 'input';

interface SidePanelContextValue {
  fontSize: number;
  language: UILanguage;
  ut: (key: string) => string;
  ts: (role?: SizeRole) => string;
}

const SIZE_CLASSES: Record<SizeRole, readonly string[]> = {
  body: ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'],
  button: ['text-xs', 'text-sm', 'text-sm', 'text-base', 'text-lg', 'text-xl'],
  label: ['text-[10px]', 'text-xs', 'text-xs', 'text-sm', 'text-sm', 'text-base'],
  heading: ['text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'],
  input: ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'],
};

function clampFontSize(n: number): number {
  return Math.max(0, Math.min(SIZE_CLASSES.body.length - 1, Math.round(n)));
}

const defaultValue: SidePanelContextValue = {
  fontSize: 3,
  language: 'en',
  ut: (key: string) => getUIText('en', key),
  ts: (role: SizeRole = 'body') => SIZE_CLASSES[role][3],
};

const SidePanelContext = createContext<SidePanelContextValue>(defaultValue);

export function useSidePanel() {
  return useContext(SidePanelContext);
}

interface SidePanelProviderProps {
  fontSize: number;
  language: UILanguage;
  children: ReactNode;
}

export function SidePanelProvider({ fontSize, language, children }: SidePanelProviderProps) {
  const value = useMemo<SidePanelContextValue>(() => {
    const clamped = clampFontSize(fontSize);
    return {
      fontSize: clamped,
      language,
      ut: (key: string) => getUIText(language, key),
      ts: (role: SizeRole = 'body') => SIZE_CLASSES[role][clamped],
    };
  }, [fontSize, language]);

  return <SidePanelContext.Provider value={value}>{children}</SidePanelContext.Provider>;
}
