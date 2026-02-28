import type { Message } from '@extension/storage';
import { ACTOR_PROFILES } from '../types/message';
import { ACTOR_COLORS, HIGHLIGHT_COLORS } from '../constants/designTokens';
import { memo } from 'react';

interface MessageListProps {
  messages: Message[];
}

export default memo(function MessageList({ messages }: MessageListProps) {
  return (
    <div className="max-w-full space-y-1">
      {messages.map((message, index) => (
        <MessageBlock
          key={`${message.actor}-${message.timestamp}-${index}`}
          message={message}
          isSameActor={index > 0 ? messages[index - 1].actor === message.actor : false}
        />
      ))}
    </div>
  );
});

interface MessageBlockProps {
  message: Message;
  isSameActor: boolean;
}

const ELEMENT_INDEX_REGEX = /\[(\d+)\]/g;

function renderMessageContent(content: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
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

function MessageBlock({ message, isSameActor }: MessageBlockProps) {
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
        {!isSameActor && (
          <div className="mb-1 flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${actorColor?.text ?? 'text-zinc-500'}`}>
              {actorProfile.name}
            </span>
            {!isProgress && (
              <span className="text-xs text-zinc-400 dark:text-zinc-500">{formatTimestamp(message.timestamp)}</span>
            )}
          </div>
        )}

        {isProgress ? (
          <div
            className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
            style={{
              backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.15) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite ease-in-out',
            }}
          />
        ) : (
          <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {renderMessageContent(message.content)}
          </div>
        )}

        {isSameActor && !isProgress && (
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
