import { Actors, type Message } from '@extension/storage';
import { ACTOR_PROFILES } from '../types/message';
import { ACTOR_COLORS, HIGHLIGHT_COLORS } from '../constants/designTokens';
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';

interface MessageListProps {
  messages: Message[];
  collapsePlannerMessages: boolean;
  fontSize: number;
}

const FONT_SIZE_CLASS_MAP = {
  0: 'text-xs',
  1: 'text-sm',
  2: 'text-base',
} as const;

interface MessageRun {
  key: string;
  actor: Message['actor'];
  messages: Message[];
}

function clampFontSize(fontSize: number): 0 | 1 | 2 {
  if (fontSize <= 0) return 0;
  if (fontSize >= 2) return 2;
  return 1;
}

export default memo(function MessageList({ messages, collapsePlannerMessages, fontSize }: MessageListProps) {
  const messageRuns = useMemo<MessageRun[]>(() => {
    const runs: MessageRun[] = [];

    for (const message of messages) {
      const lastRun = runs[runs.length - 1];
      if (lastRun && lastRun.actor === message.actor) {
        lastRun.messages.push(message);
      } else {
        runs.push({
          key: `${message.actor}-${message.timestamp}-${runs.length}`,
          actor: message.actor,
          messages: [message],
        });
      }
    }

    return runs;
  }, [messages]);

  const [plannerRunExpanded, setPlannerRunExpanded] = useState<Record<string, boolean>>({});
  const previousCollapseSettingRef = useRef(collapsePlannerMessages);

  useEffect(() => {
    const preferenceChanged = previousCollapseSettingRef.current !== collapsePlannerMessages;
    previousCollapseSettingRef.current = collapsePlannerMessages;

    setPlannerRunExpanded(prev => {
      const next: Record<string, boolean> = {};

      for (const run of messageRuns) {
        if (run.actor !== Actors.PLANNER) continue;
        next[run.key] = preferenceChanged ? !collapsePlannerMessages : (prev[run.key] ?? !collapsePlannerMessages);
      }

      return next;
    });
  }, [messageRuns, collapsePlannerMessages]);

  const togglePlannerRun = useCallback((runKey: string) => {
    setPlannerRunExpanded(prev => ({
      ...prev,
      [runKey]: !prev[runKey],
    }));
  }, []);

  const messageTextSizeClass = FONT_SIZE_CLASS_MAP[clampFontSize(fontSize)];

  return (
    <div className="max-w-full space-y-1">
      {messageRuns.flatMap(run => {
        const isPlannerRun = run.actor === Actors.PLANNER;
        const isExpanded = plannerRunExpanded[run.key] ?? !collapsePlannerMessages;

        if (isPlannerRun && !isExpanded) {
          const firstMessage = run.messages[0];
          return (
            <MessageBlock
              key={run.key}
              message={firstMessage}
              isSameActor={false}
              hideContent={true}
              messageTextSizeClass={messageTextSizeClass}
              plannerToggle={{ expanded: false, onToggle: () => togglePlannerRun(run.key) }}
            />
          );
        }

        return run.messages.map((message, index) => (
          <MessageBlock
            key={`${run.key}-${message.timestamp}-${index}`}
            message={message}
            isSameActor={index > 0}
            hideContent={false}
            messageTextSizeClass={messageTextSizeClass}
            plannerToggle={
              isPlannerRun && index === 0
                ? {
                    expanded: isExpanded,
                    onToggle: () => togglePlannerRun(run.key),
                  }
                : undefined
            }
          />
        ));
      })}
    </div>
  );
});

interface MessageBlockProps {
  message: Message;
  isSameActor: boolean;
  hideContent: boolean;
  messageTextSizeClass: string;
  plannerToggle?: {
    expanded: boolean;
    onToggle: () => void;
  };
}

const ELEMENT_INDEX_REGEX = /\[(\d+)\]/g;

function renderMessageContent(content: string): ReactNode {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = ELEMENT_INDEX_REGEX.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    const idx = parseInt(match[1], 10);
    const color = HIGHLIGHT_COLORS[idx % HIGHLIGHT_COLORS.length];
    parts.push(
      <span
        key={`idx-${match.index}`}
        className="mx-0.5 inline-flex items-center rounded px-1.5 py-0.5 font-mono text-xs font-semibold text-white"
        style={{ backgroundColor: color }}>
        {idx}
      </span>,
    );
    lastIndex = ELEMENT_INDEX_REGEX.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  ELEMENT_INDEX_REGEX.lastIndex = 0;
  return parts.length > 0 ? parts : content;
}

function MessageBlock({ message, isSameActor, hideContent, messageTextSizeClass, plannerToggle }: MessageBlockProps) {
  if (!message.actor) return <div />;

  const actorKey = message.actor as keyof typeof ACTOR_COLORS;
  const actorColor = ACTOR_COLORS[actorKey];
  const actorProfile = ACTOR_PROFILES[message.actor as keyof typeof ACTOR_PROFILES];
  const isProgress = message.content === 'Showing progress...';

  return (
    <div
      className={`flex max-w-full gap-3 ${
        !isSameActor
          ? 'mt-3 border-t border-zinc-100 pt-3 first:mt-0 first:border-t-0 first:pt-0 dark:border-zinc-800'
          : ''
      }`}>
      <div className="flex w-1 shrink-0 items-stretch">
        {!isSameActor ? (
          <div className="w-full rounded-full" style={{ backgroundColor: actorColor?.bar ?? '#71717A' }} />
        ) : (
          <div className="w-full" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        {!isSameActor &&
          (plannerToggle ? (
            <button
              type="button"
              onClick={plannerToggle.onToggle}
              className="mb-1 flex w-full items-center justify-between rounded-md py-0.5 text-left transition-colors hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60"
              aria-expanded={plannerToggle.expanded}>
              <span className="flex items-center gap-1.5">
                {plannerToggle.expanded ? (
                  <FiChevronDown className="size-3 text-zinc-500 dark:text-zinc-400" />
                ) : (
                  <FiChevronRight className="size-3 text-zinc-500 dark:text-zinc-400" />
                )}
                <span
                  className={`text-xs font-semibold uppercase tracking-wider ${actorColor?.text ?? 'text-zinc-500'}`}>
                  {actorProfile.name}
                </span>
              </span>
              {!isProgress && (
                <span className="text-xs text-zinc-400 dark:text-zinc-500">{formatTimestamp(message.timestamp)}</span>
              )}
            </button>
          ) : (
            <div className="mb-1 flex items-center justify-between">
              <span className={`text-xs font-semibold uppercase tracking-wider ${actorColor?.text ?? 'text-zinc-500'}`}>
                {actorProfile.name}
              </span>
              {!isProgress && (
                <span className="text-xs text-zinc-400 dark:text-zinc-500">{formatTimestamp(message.timestamp)}</span>
              )}
            </div>
          ))}

        {!hideContent &&
          (isProgress ? (
            <div
              className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
              style={{
                backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.15) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite ease-in-out',
              }}
            />
          ) : (
            <div
              className={`whitespace-pre-wrap break-words ${messageTextSizeClass} leading-relaxed text-zinc-700 dark:text-zinc-300`}>
              {renderMessageContent(message.content)}
            </div>
          ))}

        {isSameActor && !isProgress && !hideContent && (
          <div className="mt-0.5 text-right text-xs text-zinc-400 dark:text-zinc-500">
            {formatTimestamp(message.timestamp)}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const isThisYear = date.getFullYear() === now.getFullYear();

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return timeStr;
  }

  if (isYesterday) {
    return `Yesterday, ${timeStr}`;
  }

  if (isThisYear) {
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
  }

  return `${date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}, ${timeStr}`;
}
