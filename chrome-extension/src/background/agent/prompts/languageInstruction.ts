const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  zh: 'Mandarin Chinese (中文)',
};

export function buildLanguageInstruction(uiLanguage: string): string {
  const langName = LANGUAGE_NAMES[uiLanguage];
  if (!langName || uiLanguage === 'en') return '';

  return (
    `# OUTPUT LANGUAGE — MANDATORY\n` +
    `The user's preferred language is **${langName}**.\n` +
    `You MUST write ALL user-facing text in ${langName}. This rule applies to EVERY field the user will see:\n` +
    `- "intent" field in every action (e.g. click_element, go_to_url, input_text, guide_user_click, etc.)\n` +
    `- "instruction" field in guide_user_click\n` +
    `- "text" field in done action\n` +
    `- "final_answer" field in planner output\n` +
    `- "next_goal" and "evaluation_previous_goal" in current_state\n` +
    `- Any other descriptive text the user will read\n\n` +
    `The "intent" field must NEVER be left empty — always provide a short ${langName} description of the action.\n` +
    `JSON keys, URLs, element indices, and code identifiers remain in English.\n` +
    `IMPORTANT: Do NOT fall back to English for any user-facing text. Every single user-visible string must be in ${langName}.`
  );
}
