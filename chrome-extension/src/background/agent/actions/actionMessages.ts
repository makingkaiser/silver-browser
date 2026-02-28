import { t } from '@extension/i18n';

type MessageFn = (...args: string[]) => string;

interface ActionMessageSet {
  navigating: string;
  guideUserClick_start: MessageFn;
  guideUserClick_instruction: MessageFn;
  guideUserClick_target: string;
  guideUserClick_ok: MessageFn;
  guideUserClick_retry_wrongTarget: string;
  guideUserClick_retry_timeout: string;
  click_start: MessageFn;
  click_ok: MessageFn;
  inputText_start: MessageFn;
  inputText_ok: MessageFn;
  goToUrl_start: MessageFn;
  goToUrl_ok: MessageFn;
  searchGoogle_start: MessageFn;
  searchGoogle_ok: MessageFn;
  goBack_start: string;
  goBack_ok: string;
  done_name: string;
}

const zhMessages: ActionMessageSet = {
  navigating: '正在浏览...',
  guideUserClick_start: (index: string) => `请点击元素 [${index}]`,
  guideUserClick_instruction: (index: string, text: string) => `请点击标记为 [${index}] 的「${text}」`,
  guideUserClick_target: '标记的项目',
  guideUserClick_ok: (index: string, text: string) => `已点击 [${index}]「${text}」`,
  guideUserClick_retry_wrongTarget: '点击位置不对，请再试一次',
  guideUserClick_retry_timeout: '等待超时，请重试',
  click_start: (index: string) => `正在点击元素 [${index}]`,
  click_ok: (index: string, text: string) => `已点击 [${index}]「${text}」`,
  inputText_start: (index: string) => `正在输入文字到 [${index}]`,
  inputText_ok: (text: string, index: string) => `已输入「${text}」到 [${index}]`,
  goToUrl_start: (url: string) => `正在前往 ${url}`,
  goToUrl_ok: (url: string) => `已前往 ${url}`,
  searchGoogle_start: (query: string) => `正在搜索「${query}」`,
  searchGoogle_ok: (query: string) => `已搜索「${query}」`,
  goBack_start: '正在返回上一页',
  goBack_ok: '已返回上一页',
  done_name: '完成',
};

const enMessages: ActionMessageSet = {
  navigating: 'Navigating...',
  guideUserClick_start: (index: string) => t('act_guideUserClick_start', [index]),
  guideUserClick_instruction: (index: string, text: string) => t('act_guideUserClick_instruction', [index, text]),
  guideUserClick_target: t('act_guideUserClick_target'),
  guideUserClick_ok: (index: string, text: string) => t('act_guideUserClick_ok', [index, text]),
  guideUserClick_retry_wrongTarget: t('act_guideUserClick_retry', [t('act_guideUserClick_wrongTarget')]),
  guideUserClick_retry_timeout: t('act_guideUserClick_retry', [t('act_guideUserClick_timeout')]),
  click_start: (index: string) => t('act_click_start', [index]),
  click_ok: (index: string, text: string) => t('act_click_ok', [index, text]),
  inputText_start: (index: string) => t('act_inputText_start', [index]),
  inputText_ok: (text: string, index: string) => t('act_inputText_ok', [text, index]),
  goToUrl_start: (url: string) => t('act_goToUrl_start', [url]),
  goToUrl_ok: (url: string) => t('act_goToUrl_ok', [url]),
  searchGoogle_start: (query: string) => t('act_searchGoogle_start', [query]),
  searchGoogle_ok: (query: string) => t('act_searchGoogle_ok', [query]),
  goBack_start: t('act_goBack_start'),
  goBack_ok: t('act_goBack_ok'),
  done_name: 'done',
};

const messagesByLang: Record<string, ActionMessageSet> = { zh: zhMessages };

export function getActionMessages(lang: string): ActionMessageSet {
  return messagesByLang[lang] ?? enMessages;
}
