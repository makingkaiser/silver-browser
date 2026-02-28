# SilverBrowser: Web Teacher

An AI-powered browser assistant that teaches elderly and non-technical users how to use the web — step by step, in plain language.

SilverBrowser is a Chrome extension forked from [Nanobrowser](https://github.com/nanobrowser/nanobrowser). Where Nanobrowser automates web tasks, SilverBrowser shifts the focus to **guided learning**: the AI highlights what to click and explains each step in simple, jargon-free language so the user builds real confidence with the browser.

## What makes this different

**Built for people who find the web confusing.** Every design decision — from the language the AI uses, to the interaction modes, to the adjustable text size — assumes the user has never heard the words "tab", "URL", or "dropdown".

- **Guide mode** — The AI highlights a button or link on the page and asks the user to click it, with a short plain-language instruction like *"Click the blue button that says Sign In."* The user does the clicking; the AI does the thinking.
- **Act mode** — The AI does everything automatically, same as standard Nanobrowser. Useful when the user just wants something done.
- **Plain-language instructions** — Agent prompts explicitly ban jargon. Instructions describe items by their visible label, color, or position on screen.
- **Adjustable font size** — Six size levels, changeable from the toolbar with + / − buttons.
- **Voice input** — Speak your request instead of typing. Uses a Gemini speech-to-text model.
- **Favorite prompts** — Save common tasks (e.g. "Check my Gmail") as bookmarks for one-tap replay.
- **Multi-language UI** — English and Chinese, switchable from the toolbar.

## Quick start

1. **Build the extension** (or download a release zip):

   ```bash
   pnpm install
   pnpm build
   ```

2. **Load into Chrome**:
   - Open `chrome://extensions/`
   - Enable **Developer mode** (top right)
   - Click **Load unpacked** and select the `dist/` folder

3. **Configure models**:
   - Click the SilverBrowser icon in your toolbar to open the side panel
   - Click the gear icon (top right) to open Settings
   - Add your LLM API keys and choose models for the Navigator and Planner agents

4. **Try it out**:
   - Type a request like *"Help me search for a recipe for banana bread"*
   - Choose **Guide** mode to have the AI walk you through each click, or **Act** mode to let the AI do it for you

## How it works

SilverBrowser uses a multi-agent system running locally in your browser:

| Agent | Role |
|---|---|
| **Planner** | Breaks the task into steps and decides what to do next |
| **Navigator** | Reads the page, interacts with elements, or guides the user to click |
| **Validator** | Checks whether the task was actually completed |

In **Guide mode**, the Navigator converts every click action into a `guide_user_click` — it highlights the target element on the page and displays a plain-language instruction in the side panel. The user clicks the highlighted item to proceed.

In **Act mode**, the Navigator clicks elements directly, same as upstream Nanobrowser.

## Supported LLM providers

OpenAI, Anthropic, Gemini, Ollama, Groq, Cerebras, Llama, Azure OpenAI, OpenRouter, and any OpenAI-compatible API.

## Browser support

- **Chrome** and **Edge** — fully supported
- Firefox, Safari, and other browsers are not supported

## Development

**Prerequisites**: Node.js v22.12.0+, pnpm v9.15.1+

```bash
pnpm install    # install dependencies
pnpm dev        # start dev mode with hot reload
pnpm build      # production build
pnpm type-check # TypeScript checks
pnpm lint       # ESLint with auto-fix
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## Project structure

```
chrome-extension/       Chrome extension manifest + background service worker
  src/background/
    agent/              Multi-agent system (Navigator, Planner, Validator)
    browser/            Browser automation and DOM manipulation
pages/
  side-panel/           Main chat interface (React + Tailwind)
  options/              Settings page
  content/              Content script injected into web pages
packages/               Shared libraries (storage, UI components, i18n, etc.)
```

## Acknowledgments

Forked from [Nanobrowser](https://github.com/nanobrowser/nanobrowser), which builds on [Browser Use](https://github.com/browser-use/browser-use), [Puppeteer](https://github.com/EmergenceAI/Agent-E), [Chrome Extension Boilerplate](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite), and [LangChain](https://github.com/langchain-ai/langchainjs).

## License

Apache License 2.0 — see [LICENSE](LICENSE).
