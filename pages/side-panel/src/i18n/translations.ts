export type UILanguage = 'en' | 'zh';

export const LANGUAGE_OPTIONS: { code: UILanguage; nativeName: string }[] = [
  { code: 'en', nativeName: 'EN' },
  { code: 'zh', nativeName: '中文' },
];

export const LLM_LANGUAGE_NAMES: Record<UILanguage, string> = {
  en: 'English',
  zh: 'Mandarin Chinese (中文)',
};

const translations: Record<UILanguage, Record<string, string>> = {
  en: {
    nav_back: '← Back',
    nav_newChat: 'New Chat',
    nav_history: 'History',
    nav_settings: 'Settings',
    mode_act: 'Act',
    mode_guide: 'Guide',
    mode_act_desc: 'Agent clicks for you',
    mode_guide_desc: 'Agent highlights, you click',
    btn_stop: 'Stop',
    btn_send: 'Send',
    btn_replay: 'Replay',
    input_placeholder: 'What can I help you with?',
    bookmarks_header: 'Quick Start',
    bookmarks_saveEdit: 'Save',
    bookmarks_cancelEdit: 'Cancel',
    bookmarks_edit: 'Edit',
    bookmarks_delete: 'Delete',
    history_title: 'Chat History',
    history_empty: 'No chat history available',
    history_bookmark: 'Bookmark',
    history_delete: 'Delete',
    welcome_title: 'Welcome to SilverBrowser: Web Teacher!',
    welcome_instruction: 'To get started, please configure your API keys in the settings page.',
    welcome_openSettings: 'Open Settings',
    welcome_quickStart: 'Quick Start Guide',
    welcome_joinCommunity: 'Join Community',
    toolbar_planToggle: 'Toggle planner messages',
    toolbar_fontDown: 'Smaller text',
    toolbar_fontUp: 'Larger text',
  },
  zh: {
    nav_back: '← 返回',
    nav_newChat: '新对话',
    nav_history: '历史',
    nav_settings: '设置',
    mode_act: '执行',
    mode_guide: '引导',
    mode_act_desc: '助手替你点击',
    mode_guide_desc: '助手标记，你来点击',
    btn_stop: '停止',
    btn_send: '发送',
    btn_replay: '重播',
    input_placeholder: '有什么我可以帮你的？',
    bookmarks_header: '快速开始',
    bookmarks_saveEdit: '保存',
    bookmarks_cancelEdit: '取消',
    bookmarks_edit: '编辑',
    bookmarks_delete: '删除',
    history_title: '聊天记录',
    history_empty: '暂无聊天记录',
    history_bookmark: '收藏',
    history_delete: '删除',
    welcome_title: '欢迎使用 SilverBrowser：网络助手！',
    welcome_instruction: '请先在设置页面配置您的 API 密钥。',
    welcome_openSettings: '打开设置',
    welcome_quickStart: '快速入门指南',
    welcome_joinCommunity: '加入社区',
    toolbar_planToggle: '切换规划消息',
    toolbar_fontDown: '缩小文字',
    toolbar_fontUp: '放大文字',
  },
};

export function getUIText(lang: UILanguage, key: string): string {
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}

export function isUILanguage(value: unknown): value is UILanguage {
  return value === 'en' || value === 'zh';
}
