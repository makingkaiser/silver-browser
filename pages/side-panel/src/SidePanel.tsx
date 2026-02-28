/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from 'react';
import { FiEye, FiEyeOff, FiMinus, FiPlus, FiSettings } from 'react-icons/fi';
import { PiPlusBold } from 'react-icons/pi';
import { GrHistory } from 'react-icons/gr';
import {
  type Message,
  type GeneralSettingsConfig,
  Actors,
  chatHistoryStore,
  agentModelStore,
  generalSettingsStore,
} from '@extension/storage';
import favoritesStorage, { type FavoritePrompt } from '@extension/storage/lib/prompt/favorites';
import { t } from '@extension/i18n';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import ModeToggle, { type InteractionMode } from './components/ModeToggle';
import ChatHistoryList from './components/ChatHistoryList';
import BookmarkList from './components/BookmarkList';
import { EventType, type AgentEvent, ExecutionState } from './types/event';
import './SidePanel.css';

const MIN_MESSAGE_FONT_SIZE = 0;
const MAX_MESSAGE_FONT_SIZE = 2;

function clampMessageFontSize(size: number): number {
  return Math.min(MAX_MESSAGE_FONT_SIZE, Math.max(MIN_MESSAGE_FONT_SIZE, Math.round(size)));
}

declare global {
  interface Window {
    chrome: typeof chrome;
  }
}

const SidePanel = () => {
  const progressMessage = 'Showing progress...';
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputEnabled, setInputEnabled] = useState(true);
  const [showStopButton, setShowStopButton] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [chatSessions, setChatSessions] = useState<Array<{ id: string; title: string; createdAt: number }>>([]);
  const [isFollowUpMode, setIsFollowUpMode] = useState(false);
  const [isHistoricalSession, setIsHistoricalSession] = useState(false);
  const [favoritePrompts, setFavoritePrompts] = useState<FavoritePrompt[]>([]);
  const [hasConfiguredModels, setHasConfiguredModels] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingSpeech, setIsProcessingSpeech] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayEnabled, setReplayEnabled] = useState(false);
  const [collapsePlannerMessages, setCollapsePlannerMessages] = useState(true);
  const [messageFontSize, setMessageFontSize] = useState(1);
  const [isTaskRunning, setIsTaskRunning] = useState(false);
  const [isGuideWaiting, setIsGuideWaiting] = useState(false);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('default');
  const sessionIdRef = useRef<string | null>(null);
  const isReplayingRef = useRef<boolean>(false);
  const portRef = useRef<chrome.runtime.Port | null>(null);
  const heartbeatIntervalRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const setInputTextRef = useRef<((text: string) => void) | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  const checkModelConfiguration = useCallback(async () => {
    try {
      const configuredAgents = await agentModelStore.getConfiguredAgents();
      const hasAtLeastOneModel = configuredAgents.length > 0;
      setHasConfiguredModels(hasAtLeastOneModel);
    } catch (error) {
      console.error('Error checking model configuration:', error);
      setHasConfiguredModels(false);
    }
  }, []);

  const loadGeneralSettings = useCallback(async () => {
    try {
      const settings = await generalSettingsStore.getSettings();
      setReplayEnabled(settings.replayHistoricalTasks);
      setCollapsePlannerMessages(settings.collapsePlannerMessages);
      setMessageFontSize(clampMessageFontSize(settings.messageFontSize));
    } catch (error) {
      console.error('Error loading general settings:', error);
      setReplayEnabled(false);
      setCollapsePlannerMessages(true);
      setMessageFontSize(1);
    }
  }, []);

  const updateGeneralSettings = useCallback(
    async (updates: Partial<GeneralSettingsConfig>) => {
      try {
        await generalSettingsStore.updateSettings(updates);
      } catch (error) {
        console.error('Failed to update general settings:', error);
        await loadGeneralSettings();
      }
    },
    [loadGeneralSettings],
  );

  const handleTogglePlannerMessages = useCallback(() => {
    const nextValue = !collapsePlannerMessages;
    setCollapsePlannerMessages(nextValue);
    void updateGeneralSettings({ collapsePlannerMessages: nextValue });
  }, [collapsePlannerMessages, updateGeneralSettings]);

  const handleAdjustMessageFontSize = useCallback(
    (delta: -1 | 1) => {
      setMessageFontSize(prevSize => {
        const nextSize = clampMessageFontSize(prevSize + delta);
        if (nextSize !== prevSize) {
          void updateGeneralSettings({ messageFontSize: nextSize });
        }
        return nextSize;
      });
    },
    [updateGeneralSettings],
  );

  useEffect(() => {
    checkModelConfiguration();
    loadGeneralSettings();
  }, [checkModelConfiguration, loadGeneralSettings]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkModelConfiguration();
        loadGeneralSettings();
      }
    };

    const handleFocus = () => {
      checkModelConfiguration();
      loadGeneralSettings();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkModelConfiguration, loadGeneralSettings]);

  useEffect(() => {
    sessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  useEffect(() => {
    isReplayingRef.current = isReplaying;
  }, [isReplaying]);

  const appendMessage = useCallback((newMessage: Message, sessionId?: string | null) => {
    const isProgressMessage = newMessage.content === progressMessage;

    setMessages(prev => {
      const filteredMessages = prev.filter((msg, idx) => !(msg.content === progressMessage && idx === prev.length - 1));
      return [...filteredMessages, newMessage];
    });

    const effectiveSessionId = sessionId !== undefined ? sessionId : sessionIdRef.current;

    console.log('sessionId', effectiveSessionId);

    if (effectiveSessionId && !isProgressMessage) {
      chatHistoryStore
        .addMessage(effectiveSessionId, newMessage)
        .catch(err => console.error('Failed to save message to history:', err));
    }
  }, []);

  const handleTaskState = useCallback(
    (event: AgentEvent) => {
      const { actor, state, timestamp, data } = event;
      const content = data?.details;
      let skip = true;
      let displayProgress = false;

      switch (actor) {
        case Actors.SYSTEM:
          switch (state) {
            case ExecutionState.TASK_START:
              setIsHistoricalSession(false);
              setIsTaskRunning(true);
              setIsGuideWaiting(false);
              break;
            case ExecutionState.TASK_OK:
              setIsFollowUpMode(true);
              setInputEnabled(true);
              setShowStopButton(false);
              setIsReplaying(false);
              setIsTaskRunning(false);
              setIsGuideWaiting(false);
              break;
            case ExecutionState.TASK_FAIL:
              setIsFollowUpMode(true);
              setInputEnabled(true);
              setShowStopButton(false);
              setIsReplaying(false);
              setIsTaskRunning(false);
              setIsGuideWaiting(false);
              skip = false;
              break;
            case ExecutionState.TASK_CANCEL:
              setIsFollowUpMode(false);
              setInputEnabled(true);
              setShowStopButton(false);
              setIsReplaying(false);
              setIsTaskRunning(false);
              setIsGuideWaiting(false);
              skip = false;
              break;
            case ExecutionState.TASK_PAUSE:
              break;
            case ExecutionState.TASK_RESUME:
              break;
            default:
              console.error('Invalid task state', state);
              return;
          }
          break;
        case Actors.USER:
          break;
        case Actors.PLANNER:
          switch (state) {
            case ExecutionState.STEP_START:
              displayProgress = true;
              if (!data?.uiHint || data.uiHint !== 'guide_wait') {
                setInputEnabled(false);
              }
              break;
            case ExecutionState.STEP_OK:
              skip = false;
              break;
            case ExecutionState.STEP_FAIL:
              skip = false;
              break;
            case ExecutionState.STEP_CANCEL:
              break;
            default:
              console.error('Invalid step state', state);
              return;
          }
          break;
        case Actors.NAVIGATOR:
          switch (state) {
            case ExecutionState.STEP_START:
              displayProgress = true;
              break;
            case ExecutionState.STEP_OK:
              displayProgress = false;
              break;
            case ExecutionState.STEP_FAIL:
              skip = false;
              displayProgress = false;
              break;
            case ExecutionState.STEP_CANCEL:
              displayProgress = false;
              break;
            case ExecutionState.ACT_START:
              if (content !== 'cache_content') {
                skip = false;
              }
              if (data?.uiHint === 'guide_wait') {
                setIsGuideWaiting(true);
                setInputEnabled(true);
              } else if (isTaskRunning) {
                setIsGuideWaiting(false);
                setInputEnabled(false);
              }
              break;
            case ExecutionState.ACT_OK:
              if (isTaskRunning) {
                setIsGuideWaiting(false);
                setInputEnabled(false);
              }
              skip = !isReplayingRef.current;
              break;
            case ExecutionState.ACT_FAIL:
              if (isTaskRunning) {
                setIsGuideWaiting(false);
                setInputEnabled(false);
              }
              skip = false;
              break;
            default:
              console.error('Invalid action', state);
              return;
          }
          break;
        case Actors.VALIDATOR:
          switch (state) {
            case ExecutionState.STEP_START:
              displayProgress = true;
              break;
            case ExecutionState.STEP_OK:
              skip = false;
              break;
            case ExecutionState.STEP_FAIL:
              skip = false;
              break;
            default:
              console.error('Invalid validation', state);
              return;
          }
          break;
        default:
          console.error('Unknown actor', actor);
          return;
      }

      if (!skip) {
        appendMessage({
          actor,
          content: content || '',
          timestamp: timestamp,
        });
      }

      if (displayProgress) {
        appendMessage({
          actor,
          content: progressMessage,
          timestamp: timestamp,
        });
      }
    },
    [appendMessage, isTaskRunning],
  );

  const stopConnection = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (portRef.current) {
      portRef.current.disconnect();
      portRef.current = null;
    }
  }, []);

  const setupConnection = useCallback(() => {
    if (portRef.current) {
      return;
    }

    try {
      portRef.current = chrome.runtime.connect({ name: 'side-panel-connection' });

      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      portRef.current.onMessage.addListener((message: any) => {
        if (message && message.type === EventType.EXECUTION) {
          handleTaskState(message);
        } else if (message && message.type === 'error') {
          appendMessage({
            actor: Actors.SYSTEM,
            content: message.error || t('errors_unknown'),
            timestamp: Date.now(),
          });
          setInputEnabled(true);
          setShowStopButton(false);
        } else if (message && message.type === 'speech_to_text_result') {
          if (message.text && setInputTextRef.current) {
            setInputTextRef.current(message.text);
          }
          setIsProcessingSpeech(false);
        } else if (message && message.type === 'speech_to_text_error') {
          appendMessage({
            actor: Actors.SYSTEM,
            content: message.error || t('chat_stt_recognitionFailed'),
            timestamp: Date.now(),
          });
          setIsProcessingSpeech(false);
        } else if (message && message.type === 'heartbeat_ack') {
          console.log('Heartbeat acknowledged');
        }
      });

      portRef.current.onDisconnect.addListener(() => {
        const error = chrome.runtime.lastError;
        console.log('Connection disconnected', error ? `Error: ${error.message}` : '');
        portRef.current = null;
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
        setInputEnabled(true);
        setShowStopButton(false);
        setIsTaskRunning(false);
        setIsGuideWaiting(false);
      });

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      heartbeatIntervalRef.current = window.setInterval(() => {
        if (portRef.current?.name === 'side-panel-connection') {
          try {
            portRef.current.postMessage({ type: 'heartbeat' });
          } catch (error) {
            console.error('Heartbeat failed:', error);
            stopConnection();
          }
        } else {
          stopConnection();
        }
      }, 25000);
    } catch (error) {
      console.error('Failed to establish connection:', error);
      appendMessage({
        actor: Actors.SYSTEM,
        content: t('errors_conn_serviceWorker'),
        timestamp: Date.now(),
      });
      portRef.current = null;
    }
  }, [handleTaskState, appendMessage, stopConnection]);

  const sendMessage = useCallback(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    (message: any) => {
      if (portRef.current?.name !== 'side-panel-connection') {
        throw new Error('No valid connection available');
      }
      try {
        portRef.current.postMessage(message);
      } catch (error) {
        console.error('Failed to send message:', error);
        stopConnection();
        throw error;
      }
    },
    [stopConnection],
  );

  const handleInteractionModeChange = useCallback(
    (mode: InteractionMode) => {
      setInteractionMode(mode);

      if (!isTaskRunning) {
        return;
      }

      try {
        if (!portRef.current) {
          setupConnection();
        }

        sendMessage({
          type: 'set_interaction_mode',
          mode,
          taskId: sessionIdRef.current,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('set_interaction_mode error', errorMessage);
      }
    },
    [isTaskRunning, sendMessage, setupConnection],
  );

  const handleReplay = async (historySessionId: string): Promise<void> => {
    try {
      if (!replayEnabled) {
        appendMessage({
          actor: Actors.SYSTEM,
          content: t('chat_replay_disabled'),
          timestamp: Date.now(),
        });
        return;
      }

      const historyData = await chatHistoryStore.loadAgentStepHistory(historySessionId);
      if (!historyData) {
        appendMessage({
          actor: Actors.SYSTEM,
          content: t('chat_replay_noHistory', historySessionId.substring(0, 20)),
          timestamp: Date.now(),
        });
        return;
      }

      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tabId = tabs[0]?.id;
      if (!tabId) {
        throw new Error('No active tab found');
      }

      if (isHistoricalSession) {
        setMessages([]);
      }

      const newSession = await chatHistoryStore.createSession(`Replay of ${historySessionId.substring(0, 20)}...`);
      console.log('newSession for replay', newSession);

      const newTaskId = newSession.id;
      setCurrentSessionId(newTaskId);
      sessionIdRef.current = newTaskId;

      setInputEnabled(false);
      setShowStopButton(true);
      setIsFollowUpMode(false);
      setIsHistoricalSession(false);

      const userMessage = {
        actor: Actors.USER,
        content: `/replay ${historySessionId}`,
        timestamp: Date.now(),
      };

      appendMessage(userMessage, sessionIdRef.current);

      if (!portRef.current) {
        setupConnection();
      }

      portRef.current?.postMessage({
        type: 'replay',
        taskId: newTaskId,
        tabId: tabId,
        historySessionId: historySessionId,
        task: historyData.task,
      });

      appendMessage({
        actor: Actors.SYSTEM,
        content: t('chat_replay_starting', historyData.task),
        timestamp: Date.now(),
      });
      setIsReplaying(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      appendMessage({
        actor: Actors.SYSTEM,
        content: t('chat_replay_failed', errorMessage),
        timestamp: Date.now(),
      });
    }
  };

  const handleCommand = async (command: string): Promise<boolean> => {
    try {
      if (!portRef.current) {
        setupConnection();
      }

      if (command === '/state') {
        portRef.current?.postMessage({ type: 'state' });
        return true;
      }

      if (command === '/nohighlight') {
        portRef.current?.postMessage({ type: 'nohighlight' });
        return true;
      }

      if (command.startsWith('/replay ')) {
        const parts = command.split(' ').filter(part => part.trim() !== '');
        if (parts.length !== 2) {
          appendMessage({
            actor: Actors.SYSTEM,
            content: t('chat_replay_invalidArgs'),
            timestamp: Date.now(),
          });
          return true;
        }

        const historySessionId = parts[1];
        await handleReplay(historySessionId);
        return true;
      }

      appendMessage({
        actor: Actors.SYSTEM,
        content: t('errors_cmd_unknown', command),
        timestamp: Date.now(),
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Command error', errorMessage);
      appendMessage({
        actor: Actors.SYSTEM,
        content: errorMessage,
        timestamp: Date.now(),
      });
      return true;
    }
  };

  const handleSendMessage = async (text: string, displayText?: string) => {
    console.log('handleSendMessage', text);

    const trimmedText = text.trim();
    if (!trimmedText) return;

    if (trimmedText.startsWith('/')) {
      const wasHandled = await handleCommand(trimmedText);
      if (wasHandled) return;
    }

    if (isHistoricalSession) {
      console.log('Cannot send messages in historical sessions');
      return;
    }

    if (isTaskRunning && isGuideWaiting) {
      try {
        const userMessage = {
          actor: Actors.USER,
          content: displayText || text,
          timestamp: Date.now(),
        };
        appendMessage(userMessage, sessionIdRef.current);

        if (!portRef.current) {
          setupConnection();
        }

        await sendMessage({
          type: 'guide_user_note',
          note: text,
          taskId: sessionIdRef.current,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        appendMessage({
          actor: Actors.SYSTEM,
          content: errorMessage,
          timestamp: Date.now(),
        });
      }
      return;
    }

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tabId = tabs[0]?.id;
      if (!tabId) {
        throw new Error('No active tab found');
      }

      setInputEnabled(false);
      setShowStopButton(true);
      setIsGuideWaiting(false);

      if (!isFollowUpMode) {
        const titleText = displayText || text;
        const newSession = await chatHistoryStore.createSession(
          titleText.substring(0, 50) + (titleText.length > 50 ? '...' : ''),
        );
        console.log('newSession', newSession);

        const sessionId = newSession.id;
        setCurrentSessionId(sessionId);
        sessionIdRef.current = sessionId;
      }

      const userMessage = {
        actor: Actors.USER,
        content: displayText || text,
        timestamp: Date.now(),
      };

      appendMessage(userMessage, sessionIdRef.current);

      if (!portRef.current) {
        setupConnection();
      }

      if (isFollowUpMode) {
        await sendMessage({
          type: 'follow_up_task',
          task: text,
          taskId: sessionIdRef.current,
          tabId,
          interactionMode,
        });
        console.log('follow_up_task sent', text, tabId, sessionIdRef.current);
      } else {
        await sendMessage({
          type: 'new_task',
          task: text,
          taskId: sessionIdRef.current,
          tabId,
          interactionMode,
        });
        console.log('new_task sent', text, tabId, sessionIdRef.current);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Task error', errorMessage);
      appendMessage({
        actor: Actors.SYSTEM,
        content: errorMessage,
        timestamp: Date.now(),
      });
      setInputEnabled(true);
      setShowStopButton(false);
      stopConnection();
    }
  };

  const handleStopTask = async () => {
    try {
      portRef.current?.postMessage({ type: 'cancel_task' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('cancel_task error', errorMessage);
      appendMessage({
        actor: Actors.SYSTEM,
        content: errorMessage,
        timestamp: Date.now(),
      });
    }
    setInputEnabled(true);
    setShowStopButton(false);
    setIsTaskRunning(false);
    setIsGuideWaiting(false);
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    sessionIdRef.current = null;
    setInputEnabled(true);
    setShowStopButton(false);
    setIsFollowUpMode(false);
    setIsHistoricalSession(false);
    setIsTaskRunning(false);
    setIsGuideWaiting(false);
    stopConnection();
  };

  const loadChatSessions = useCallback(async () => {
    try {
      const sessions = await chatHistoryStore.getSessionsMetadata();
      setChatSessions(sessions.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    }
  }, []);

  const handleLoadHistory = async () => {
    await loadChatSessions();
    setShowHistory(true);
  };

  const handleBackToChat = (reset = false) => {
    setShowHistory(false);
    if (reset) {
      setCurrentSessionId(null);
      setMessages([]);
      setIsFollowUpMode(false);
      setIsHistoricalSession(false);
    }
  };

  const handleSessionSelect = async (sessionId: string) => {
    try {
      const fullSession = await chatHistoryStore.getSession(sessionId);
      if (fullSession && fullSession.messages.length > 0) {
        setCurrentSessionId(fullSession.id);
        setMessages(fullSession.messages);
        setIsFollowUpMode(false);
        setIsHistoricalSession(true);
        console.log('history session selected', sessionId);
      }
      setShowHistory(false);
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const handleSessionDelete = async (sessionId: string) => {
    try {
      await chatHistoryStore.deleteSession(sessionId);
      await loadChatSessions();
      if (sessionId === currentSessionId) {
        setMessages([]);
        setCurrentSessionId(null);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleSessionBookmark = async (sessionId: string) => {
    try {
      const fullSession = await chatHistoryStore.getSession(sessionId);

      if (fullSession && fullSession.messages.length > 0) {
        const sessionTitle = fullSession.title;
        const title = sessionTitle.split(' ').slice(0, 8).join(' ');
        const taskContent = fullSession.messages[0]?.content || '';

        await favoritesStorage.addPrompt(title, taskContent);

        const prompts = await favoritesStorage.getAllPrompts();
        setFavoritePrompts(prompts);

        handleBackToChat(true);
      }
    } catch (error) {
      console.error('Failed to pin session to favorites:', error);
    }
  };

  const handleBookmarkSelect = (content: string) => {
    if (setInputTextRef.current) {
      setInputTextRef.current(content);
    }
  };

  const handleBookmarkUpdateTitle = async (id: number, title: string) => {
    try {
      await favoritesStorage.updatePromptTitle(id, title);
      const prompts = await favoritesStorage.getAllPrompts();
      setFavoritePrompts(prompts);
    } catch (error) {
      console.error('Failed to update favorite prompt title:', error);
    }
  };

  const handleBookmarkDelete = async (id: number) => {
    try {
      await favoritesStorage.removePrompt(id);
      const prompts = await favoritesStorage.getAllPrompts();
      setFavoritePrompts(prompts);
    } catch (error) {
      console.error('Failed to delete favorite prompt:', error);
    }
  };

  const handleBookmarkReorder = async (draggedId: number, targetId: number) => {
    try {
      await favoritesStorage.reorderPrompts(draggedId, targetId);
      const updatedPromptsFromStorage = await favoritesStorage.getAllPrompts();
      setFavoritePrompts(updatedPromptsFromStorage);
    } catch (error) {
      console.error('Failed to reorder favorite prompts:', error);
    }
  };

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const prompts = await favoritesStorage.getAllPrompts();
        setFavoritePrompts(prompts);
      } catch (error) {
        console.error('Failed to load favorite prompts:', error);
      }
    };

    loadFavorites();
  }, []);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      stopConnection();
    };
  }, [stopConnection]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleMicClick = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setIsRecording(false);
      return;
    }

    try {
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });

      if (permissionStatus.state === 'denied') {
        appendMessage({
          actor: Actors.SYSTEM,
          content: t('chat_stt_microphone_permissionDenied'),
          timestamp: Date.now(),
        });
        return;
      }

      if (permissionStatus.state !== 'granted') {
        const permissionUrl = chrome.runtime.getURL('permission/index.html');

        chrome.windows.create(
          {
            url: permissionUrl,
            type: 'popup',
            width: 500,
            height: 600,
          },
          createdWindow => {
            if (createdWindow?.id) {
              chrome.windows.onRemoved.addListener(function onWindowClose(windowId) {
                if (windowId === createdWindow.id) {
                  chrome.windows.onRemoved.removeListener(onWindowClose);
                  setTimeout(async () => {
                    try {
                      const newPermissionStatus = await navigator.permissions.query({
                        name: 'microphone' as PermissionName,
                      });
                      if (newPermissionStatus.state === 'granted') {
                        handleMicClick();
                      }
                    } catch (error) {
                      console.error('Failed to check permission status:', error);
                    }
                  }, 500);
                }
              });
            }
          },
        );
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());

        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Audio = reader.result as string;

            if (!portRef.current) {
              setupConnection();
            }

            try {
              setIsProcessingSpeech(true);
              portRef.current?.postMessage({
                type: 'speech_to_text',
                audio: base64Audio,
              });
            } catch (error) {
              console.error('Failed to send audio for speech-to-text:', error);
              appendMessage({
                actor: Actors.SYSTEM,
                content: t('chat_stt_processingFailed'),
                timestamp: Date.now(),
              });
              setIsRecording(false);
              setIsProcessingSpeech(false);
            }
          };
          reader.readAsDataURL(audioBlob);
        }
      };

      const maxDuration = 2 * 60 * 1000;
      recordingTimerRef.current = window.setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setIsProcessingSpeech(true);
        recordingTimerRef.current = null;
      }, maxDuration);

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);

      let errorMessage = t('chat_stt_microphone_accessFailed');
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage += t('chat_stt_microphone_grantPermission');
        } else if (error.name === 'NotFoundError') {
          errorMessage += t('chat_stt_microphone_notFound');
        } else {
          errorMessage += error.message;
        }
      }

      appendMessage({
        actor: Actors.SYSTEM,
        content: errorMessage,
        timestamp: Date.now(),
      });
      setIsRecording(false);
    }
  };

  const chatInputProps = {
    onSendMessage: handleSendMessage,
    onStopTask: handleStopTask,
    onMicClick: handleMicClick,
    isRecording,
    isProcessingSpeech,
    disabled: !inputEnabled || isHistoricalSession,
    showStopButton,
    setContent: (setter: (text: string) => void) => {
      setInputTextRef.current = setter;
    },
    historicalSessionId: isHistoricalSession && replayEnabled ? currentSessionId : null,
    onReplay: handleReplay,
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-200 px-3 py-2.5 dark:border-zinc-800">
        <div className="flex items-center">
          {showHistory ? (
            <button
              type="button"
              onClick={() => handleBackToChat(false)}
              className="cursor-pointer text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              aria-label={t('nav_back_a11y')}>
              {t('nav_back')}
            </button>
          ) : (
            <img src="/icon-128.png" alt="Extension Logo" className="size-6" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {!showHistory && (
            <>
              <button
                type="button"
                onClick={handleNewChat}
                className="cursor-pointer rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-emerald-500 dark:hover:bg-zinc-800"
                aria-label={t('nav_newChat_a11y')}
                tabIndex={0}>
                <PiPlusBold size={18} />
              </button>
              <button
                type="button"
                onClick={handleLoadHistory}
                className="cursor-pointer rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-emerald-500 dark:hover:bg-zinc-800"
                aria-label={t('nav_loadHistory_a11y')}
                tabIndex={0}>
                <GrHistory size={18} />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => chrome.runtime.openOptionsPage()}
            className="cursor-pointer rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-emerald-500 dark:hover:bg-zinc-800"
            aria-label={t('nav_settings_a11y')}
            tabIndex={0}>
            <FiSettings size={18} />
          </button>
        </div>
      </header>

      {showHistory ? (
        <div className="flex-1 overflow-hidden">
          <ChatHistoryList
            sessions={chatSessions}
            onSessionSelect={handleSessionSelect}
            onSessionDelete={handleSessionDelete}
            onSessionBookmark={handleSessionBookmark}
            visible={true}
          />
        </div>
      ) : (
        <>
          {hasConfiguredModels === null && (
            <div className="flex flex-1 items-start p-6">
              <div>
                <div
                  className="mb-3 h-5 w-32 rounded-lg bg-zinc-100 dark:bg-zinc-800"
                  style={{
                    backgroundImage:
                      'linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.1) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite ease-in-out',
                  }}
                />
                <div className="h-3 w-48 rounded-lg bg-zinc-100 opacity-60 dark:bg-zinc-800" />
              </div>
            </div>
          )}

          {hasConfiguredModels === false && (
            <div className="flex flex-1 items-start p-6">
              <div className="max-w-sm">
                <img src="/icon-128.png" alt="Nanobrowser Logo" className="mb-6 size-10" />
                <h3 className="mb-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {t('welcome_title')}
                </h3>
                <p className="mb-6 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {t('welcome_instruction')}
                </p>
                <button
                  onClick={() => chrome.runtime.openOptionsPage()}
                  className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-emerald-600 active:scale-[0.98]">
                  {t('welcome_openSettings')}
                </button>
                <div className="mt-6 flex gap-3 text-xs text-zinc-400">
                  <a
                    href="https://github.com/nanobrowser/nanobrowser?tab=readme-ov-file#-quick-start"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-emerald-500">
                    {t('welcome_quickStart')}
                  </a>
                  <span>·</span>
                  <a
                    href="https://discord.gg/NN3ABHggMK"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-emerald-500">
                    {t('welcome_joinCommunity')}
                  </a>
                </div>
              </div>
            </div>
          )}

          {hasConfiguredModels === true && (
            <>
              {messages.length === 0 && (
                <>
                  <div className="mb-2 border-t border-zinc-200 p-2 dark:border-zinc-800">
                    <ModeToggle value={interactionMode} onChange={handleInteractionModeChange} />
                    <ChatInput {...chatInputProps} />
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <BookmarkList
                      bookmarks={favoritePrompts}
                      onBookmarkSelect={handleBookmarkSelect}
                      onBookmarkUpdateTitle={handleBookmarkUpdateTitle}
                      onBookmarkDelete={handleBookmarkDelete}
                      onBookmarkReorder={handleBookmarkReorder}
                    />
                  </div>
                </>
              )}
              {messages.length > 0 && (
                <div className="scrollbar-gutter-stable flex-1 overflow-x-hidden overflow-y-scroll scroll-smooth p-3">
                  <div className="sticky top-0 z-10 -mx-3 mb-3 border-b border-zinc-200/80 bg-zinc-50/95 px-3 py-2 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/95">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleTogglePlannerMessages}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                          collapsePlannerMessages
                            ? 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60'
                        }`}
                        aria-pressed={!collapsePlannerMessages}
                        aria-label={t('chat_toolbar_planToggle_a11y')}>
                        {collapsePlannerMessages ? <FiEyeOff className="size-3.5" /> : <FiEye className="size-3.5" />}
                        <span>{t('chat_toolbar_plan')}</span>
                      </button>

                      <div className="ml-auto inline-flex items-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                        <button
                          type="button"
                          onClick={() => handleAdjustMessageFontSize(-1)}
                          disabled={messageFontSize <= MIN_MESSAGE_FONT_SIZE}
                          className={`inline-flex size-7 items-center justify-center transition-colors ${
                            messageFontSize <= MIN_MESSAGE_FONT_SIZE
                              ? 'cursor-not-allowed text-zinc-400 dark:text-zinc-600'
                              : 'text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700'
                          }`}
                          aria-label={t('chat_toolbar_fontDecrease_a11y')}>
                          <FiMinus className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustMessageFontSize(1)}
                          disabled={messageFontSize >= MAX_MESSAGE_FONT_SIZE}
                          className={`inline-flex size-7 items-center justify-center border-l border-zinc-200 transition-colors dark:border-zinc-700 ${
                            messageFontSize >= MAX_MESSAGE_FONT_SIZE
                              ? 'cursor-not-allowed text-zinc-400 dark:text-zinc-600'
                              : 'text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700'
                          }`}
                          aria-label={t('chat_toolbar_fontIncrease_a11y')}>
                          <FiPlus className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <MessageList
                    messages={messages}
                    collapsePlannerMessages={collapsePlannerMessages}
                    fontSize={messageFontSize}
                  />
                  <div ref={messagesEndRef} />
                </div>
              )}
              {messages.length > 0 && (
                <div className="border-t border-zinc-200 p-2 dark:border-zinc-800">
                  <ModeToggle value={interactionMode} onChange={handleInteractionModeChange} />
                  <ChatInput {...chatInputProps} />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default SidePanel;
