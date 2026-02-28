/* eslint-disable @typescript-eslint/no-unused-vars */
import { BasePrompt } from './base';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { AgentContext } from '@src/background/agent/types';
import { plannerSystemPromptTemplate } from './templates/planner';
import { buildLanguageInstruction } from './languageInstruction';

export class PlannerPrompt extends BasePrompt {
  private readonly systemMessage: SystemMessage;

  constructor(uiLanguage = 'en') {
    super();
    let prompt = plannerSystemPromptTemplate;
    const langInstruction = buildLanguageInstruction(uiLanguage);
    if (langInstruction) {
      prompt += `\n\n${langInstruction}`;
    }
    this.systemMessage = new SystemMessage(prompt);
  }

  getSystemMessage(): SystemMessage {
    return this.systemMessage;
  }

  async getUserMessage(context: AgentContext): Promise<HumanMessage> {
    return new HumanMessage('');
  }
}
