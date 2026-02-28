/* eslint-disable react/prop-types */
import { FaTrash } from 'react-icons/fa';
import { BsBookmark } from 'react-icons/bs';
import { useSidePanel } from '../context/SidePanelContext';

interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
}

interface ChatHistoryListProps {
  sessions: ChatSession[];
  onSessionSelect: (sessionId: string) => void;
  onSessionDelete: (sessionId: string) => void;
  onSessionBookmark: (sessionId: string) => void;
  visible: boolean;
}

const ChatHistoryList: React.FC<ChatHistoryListProps> = ({
  sessions,
  onSessionSelect,
  onSessionDelete,
  onSessionBookmark,
  visible,
}) => {
  const { ut, ts } = useSidePanel();

  if (!visible) return null;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <h2 className={`mb-4 font-semibold text-zinc-800 dark:text-zinc-200 ${ts('heading')}`}>{ut('history_title')}</h2>
      {sessions.length === 0 ? (
        <div
          className={`rounded-xl border border-zinc-200 p-4 text-center text-zinc-500 dark:border-zinc-800 dark:text-zinc-400 ${ts('body')}`}>
          {ut('history_empty')}
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map(session => (
            <div
              key={session.id}
              className="group relative rounded-xl border border-zinc-200 p-3 transition-all hover:ring-1 hover:ring-emerald-500/30 dark:border-zinc-800">
              <button onClick={() => onSessionSelect(session.id)} className="w-full text-left" type="button">
                <h3 className={`font-medium text-zinc-900 dark:text-zinc-100 ${ts('body')}`}>{session.title}</h3>
                <p className={`mt-1 text-zinc-500 dark:text-zinc-400 ${ts('label')}`}>
                  {formatDate(session.createdAt)}
                </p>
              </button>

              {onSessionBookmark && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onSessionBookmark(session.id);
                  }}
                  className="absolute right-2 top-2 rounded-lg p-1 text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-emerald-500 group-hover:opacity-100 dark:hover:bg-zinc-800"
                  aria-label={ut('history_bookmark')}
                  type="button">
                  <BsBookmark size={14} />
                </button>
              )}

              <button
                onClick={e => {
                  e.stopPropagation();
                  onSessionDelete(session.id);
                }}
                className="absolute bottom-2 right-2 rounded-lg p-1 text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-zinc-800"
                aria-label={ut('history_delete')}
                type="button">
                <FaTrash size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatHistoryList;
