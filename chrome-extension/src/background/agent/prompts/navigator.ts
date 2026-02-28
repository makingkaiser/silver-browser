/* eslint-disable @typescript-eslint/no-unused-vars */
import { BasePrompt } from './base';
import { type HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { AgentContext } from '@src/background/agent/types';
import { createLogger } from '@src/background/log';
import { navigatorSystemPromptTemplate } from './templates/navigator';
import { buildLanguageInstruction } from './languageInstruction';

const logger = createLogger('agent/prompts/navigator');

export class NavigatorPrompt extends BasePrompt {
  private systemMessage: SystemMessage;

  constructor(
    private readonly maxActionsPerStep = 10,
    uiLanguage = 'en',
  ) {
    super();

    let formattedPrompt = navigatorSystemPromptTemplate
      .replace('{{max_actions}}', this.maxActionsPerStep.toString())
      .trim();

    const langInstruction = buildLanguageInstruction(uiLanguage);
    if (langInstruction) {
      formattedPrompt += `\n\n${langInstruction}`;
    }

    this.systemMessage = new SystemMessage(formattedPrompt);
  }

  getSystemMessage(): SystemMessage {
    return this.systemMessage;
  }

  async getUserMessage(context: AgentContext): Promise<HumanMessage> {
    return await this.buildBrowserStateUserMessage(context);
  }
}
