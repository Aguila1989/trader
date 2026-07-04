// Chapter 39: Setting up AI trading. A BASIC walkthrough for Premium users who
// are turning on AI trading for the first time and need to obtain and store an
// API key from an AI provider. Six lessons: one on the concept of bring-your-
// own-key, four provider-specific key-creation walkthroughs, and one closing
// lesson on understanding ongoing AI costs.
import type { Chapter } from "../../types";

export const chapter39: Chapter & { whoFor: string } = {
  id: "c39",
  number: 39,
  level: "BASIC",
  whoFor: "Premium users setting up AI trading for the first time",
  title: "Setting Up AI Trading",
  description:
    "What an AI API key is, how to get one from Anthropic, OpenAI, Google, or DeepSeek, and how to understand what the AI actually costs you.",
  lessons: [
    {
      id: "c39-l1",
      title: "What is an AI API key and why do you need one?",
      paragraphs: [
        "When the AI trades for you, it is not running inside Atrium itself — every time it needs to think, Atrium sends it a question over the internet to a large-language-model provider (a company like Anthropic, OpenAI, Google, or DeepSeek), and that provider sends back an answer. That round trip is what actually produces every AI trade proposal you see.",
        "Atrium does not resell AI access or mark up what those providers charge. Instead, Premium users bring their own API key: an account you create directly with the provider of your choice, billed directly by that provider. This means you are always in control of which provider and which model your AI trading uses, and you can see and adjust your own spending limits directly in that provider's dashboard, rather than trusting a middleman's markup.",
        "An API key is best thought of as a personal password to a paid service — anyone who has it can spend money on your account with that provider, so it needs to be handled the same way you would handle a banking password. It is not the same as your Atrium login, and it is not the same as your wallet's secret key; it only ever talks to the AI provider, never to the Stellar network.",
        "Atrium stores your API key encrypted, using the same AES-256-GCM encryption already used to protect your wallet's secret key. The key is decrypted only in memory, for a fraction of a second, at the exact moment the AI needs to make a request — it is never written back to disk in plain form, never shown on screen again after you first paste it in, and never written to any log file.",
      ],
      example:
        "Think of Atrium as a dispatcher and the AI provider as the actual thinker: when the AI scans the market, Atrium's server picks up your encrypted key, decrypts it in memory just long enough to make one request to, say, Anthropic, gets back a trade suggestion, and immediately discards the decrypted copy. You never see the key again after the day you first typed it in, and nothing about it ever appears in Atrium's logs.",
    },
    {
      id: "c39-l2",
      title: "How to get a Claude API key (Anthropic)",
      paragraphs: [
        "Anthropic is the company behind the Claude family of models, including Claude Sonnet and Claude Opus, both of which Atrium can use for AI trading. To get a key, go to console.anthropic.com in your browser and sign in, or create a new account if you do not already have one.",
        "Once you are signed in, find the API Keys section in the console, click Create Key, give it a name if asked (something like \"Atrium trading\" makes it easy to recognize later), and copy the key it generates. This is the only time the full key is ever shown to you — Anthropic will not display it again, so copy it immediately before navigating away.",
        "AI API costs are charged directly by Anthropic to your account. They are completely separate from your Atrium subscription. Typical cost for AI trading is roughly €0.001–€0.05 per trade proposal, depending on the model you choose and how much market data goes into each scan. It is worth checking in on your usage from time to time in Anthropic's own console, where you can see exactly what you have spent and set spending limits.",
        "Back in Atrium, paste the key into Settings → Account → AI API Key, choose Anthropic as the provider, click Test Connection to confirm it works, and then Save.",
        "Treat this key like any other password: never share it with anyone, and never paste it anywhere except that one settings field in Atrium.",
      ],
      example:
        "You sign in to console.anthropic.com, click API Keys → Create Key, name it \"Atrium trading\", and copy the string it shows you (it starts with sk-ant-...). In Atrium, you open Settings → Account → AI API Key, select Anthropic from the provider dropdown, paste the key, click Test Connection and see a green success message, then click Save — AI trading is now ready to use Claude.",
    },
    {
      id: "c39-l3",
      title: "How to get a GPT API key (OpenAI)",
      paragraphs: [
        "OpenAI is the company behind the GPT family of models, including GPT-4 and GPT-4o, which Atrium can also use for AI trading. To get a key, go to platform.openai.com in your browser and sign in, or create an account if you do not already have one.",
        "Inside the platform, find the API Keys section, click Create new secret key, give it a recognizable name such as \"Atrium trading\", and copy the key immediately — just like Anthropic, OpenAI shows you the full key only once, at the moment of creation.",
        "AI API costs here are billed directly by OpenAI to your account, and are entirely separate from your Atrium subscription. Typical cost for AI trading is roughly €0.001–€0.05 per trade proposal, depending on the model and the size of each scan. OpenAI's dashboard shows a running usage total, so check in there periodically to keep an eye on what you are spending.",
        "Back in Atrium, paste the key into Settings → Account → AI API Key, choose OpenAI as the provider, click Test Connection to confirm it works, and then Save.",
        "As always: never share this key with anyone, and never paste it anywhere except that one settings field in Atrium.",
      ],
      example:
        "You sign in to platform.openai.com, open API Keys, click Create new secret key, name it \"Atrium trading\", and copy the string it shows you (it starts with sk-...). In Atrium, you open Settings → Account → AI API Key, select OpenAI from the provider dropdown, paste the key, click Test Connection and see a green success message, then click Save — AI trading is now ready to use GPT.",
    },
    {
      id: "c39-l4",
      title: "How to get a Gemini API key (Google)",
      paragraphs: [
        "Google offers the Gemini family of models, including Gemini Pro and Gemini Ultra, as another option for AI trading in Atrium. To get a key, go to aistudio.google.com in your browser and sign in with your Google account.",
        "Inside Google AI Studio, look for the Get API Key button, follow the prompts to create a new key (you may be asked to link it to a Google Cloud project), and copy the key once it is generated.",
        "AI API costs here are billed directly by Google to your account, entirely separate from your Atrium subscription. Typical cost for AI trading is roughly €0.001–€0.05 per trade proposal, depending on the model and scan size. Google Cloud's billing console shows your usage, so it is worth checking there periodically and setting a budget alert if you want an early warning.",
        "Back in Atrium, paste the key into Settings → Account → AI API Key, choose Google as the provider, click Test Connection to confirm it works, and then Save.",
        "As always: never share this key with anyone, and never paste it anywhere except that one settings field in Atrium.",
      ],
      example:
        "You sign in to aistudio.google.com, click Get API Key, follow the prompts to create one, and copy the string it shows you. In Atrium, you open Settings → Account → AI API Key, select Google from the provider dropdown, paste the key, click Test Connection and see a green success message, then click Save — AI trading is now ready to use Gemini.",
    },
    {
      id: "c39-l5",
      title: "How to get a DeepSeek API key",
      paragraphs: [
        "DeepSeek is another AI provider Atrium supports, often the cheapest of the four to run. To get a key, go to platform.deepseek.com in your browser and sign in, or create an account if you do not already have one.",
        "Inside the platform, find the API Keys section, click Create Key, give it a recognizable name such as \"Atrium trading\", and copy the key immediately — like the other providers, DeepSeek shows you the full key only once.",
        "AI API costs here are billed directly by DeepSeek to your account, entirely separate from your Atrium subscription. Typical cost for AI trading is roughly €0.001–€0.05 per trade proposal, and DeepSeek is typically the cheapest of the supported providers per request. Its dashboard shows your running usage, so check in there periodically to keep track of spending.",
        "Back in Atrium, paste the key into Settings → Account → AI API Key, choose DeepSeek as the provider, click Test Connection to confirm it works, and then Save.",
        "As always: never share this key with anyone, and never paste it anywhere except that one settings field in Atrium.",
      ],
      example:
        "You sign in to platform.deepseek.com, open API Keys, click Create Key, name it \"Atrium trading\", and copy the string it shows you. In Atrium, you open Settings → Account → AI API Key, select DeepSeek from the provider dropdown, paste the key, click Test Connection and see a green success message, then click Save — AI trading is now ready to use DeepSeek, typically at the lowest per-request cost of the four.",
    },
    {
      id: "c39-l6",
      title: "Understanding your AI API costs",
      paragraphs: [
        "Every time the AI evaluates the market and produces a trade proposal, that single \"thought\" costs a small amount — typically somewhere around €0.001 to €0.05, depending on which provider and model you picked and how much market data was included in that particular scan. It is a tiny amount per proposal, but it adds up with frequency.",
        "That is the key thing to understand about scaling: costs are driven mainly by how often the AI scans the market, not by how much you trade. A shorter auto-scan interval means more scans per day, which means more individual charges from your AI provider, even on days where the AI ends up proposing nothing worth acting on. If you want to keep AI costs predictable, the scan interval is the lever that matters most.",
        "It helps to think of your costs as three completely separate buckets. Your Atrium subscription (Premium, billed monthly or annually) pays for the platform itself. Trade fees are paid in XLM to the platform on every trade you make, manual or AI, at a percentage set by your fee tier. AI usage is paid directly to whichever AI provider you chose, for every scan and proposal it generates. None of these three ever overlap or get bundled together — each is billed by a different party, for a different thing.",
        "Every provider's dashboard lets you set spending limits or budget alerts, and it is worth doing this once when you set up your key: Anthropic's console, OpenAI's platform, Google Cloud's billing console, and DeepSeek's dashboard all offer some form of monthly cap or usage notification, so you can find out early if costs are climbing faster than expected.",
        "If a key ever runs out of credit or hits a spending limit you set, the AI provider will start rejecting requests. In Atrium, that simply means AI trade proposals stop appearing, with a clear error shown where the proposal would have been — it does not affect your account, your wallet, or your ability to trade. Manual trading keeps working exactly as before, since it never depends on an AI provider at all; you would just need to top up credit or raise the limit with your provider to get AI proposals flowing again.",
      ],
      example:
        "Say you run Claude Sonnet with a 15-minute auto-scan interval — that is 96 scans a day, each costing a few thousandths of a euro, landing well under a euro a day in AI costs even on an active day. Separately, your Premium subscription bills €10 that month regardless of how much you traded, and each executed trade pays its own small XLM fee based on your volume tier. One day your Anthropic key hits the €20 monthly cap you set in its console: AI proposals stop with an error message in Atrium, but you can still open the Manual tab and trade by hand without any interruption, and raising the cap (or waiting for next month) brings AI proposals back immediately.",
    },
  ],
  quiz: [
    {
      id: "c39-q1",
      prompt: "Who actually bills you for the AI's usage when it scans the market or produces a trade proposal?",
      options: [
        {
          text: "The AI provider you chose (Anthropic, OpenAI, Google, or DeepSeek), directly and separately from your Atrium subscription.",
          explanation:
            "Correct. Atrium does not resell AI access or add a markup — you bring your own API key, and the provider behind it bills your account directly for whatever the AI uses.",
        },
        {
          text: "Atrium, bundled into your monthly Premium subscription.",
          explanation:
            "No. Your Premium subscription pays only for the platform itself. AI usage is a separate cost, billed directly by whichever AI provider's key you supplied.",
        },
        {
          text: "Nobody — AI usage is free once you have a Premium subscription.",
          explanation:
            "No. Every AI request costs a small amount, charged by the provider to the account behind your API key — it is real money, just usually a very small amount per proposal.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c39-q2",
      prompt: "Where should you paste your AI provider's API key in Atrium?",
      options: [
        {
          text: "Settings → Account → AI API Key, and nowhere else.",
          explanation:
            "Correct. That one settings field is the only place your key should ever be pasted in Atrium — treat it like a password and never paste it anywhere else.",
        },
        {
          text: "Directly into a chat message to the AI, so it can identify itself to its provider.",
          explanation:
            "No. The AI never asks you for your key in conversation. It belongs only in Settings → Account → AI API Key.",
        },
        {
          text: "In the Trading page's Bot tab, next to the Read-only / Paper / Live control.",
          explanation:
            "No. The trading-access control and the API key live in different places — the key belongs in Settings → Account → AI API Key.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c39-q3",
      prompt: "What actually happens to your API key after you save it in Atrium?",
      options: [
        {
          text: "It is stored encrypted (the same AES-256-GCM encryption used for wallet keys) and decrypted only in memory, for an instant, each time the AI makes a request — it is never shown again and never logged.",
          explanation:
            "Correct. The key is protected the same way your wallet's secret key is: encrypted at rest, decrypted briefly in memory only at the moment of use, never displayed again, and never written to any log.",
        },
        {
          text: "It is stored in plain text so support staff can read it back to you if you forget it.",
          explanation:
            "No. The key is encrypted at rest and is never shown again after you first paste it in — there is no way to retrieve or display it later, by you or by anyone else.",
        },
        {
          text: "It is forwarded to Atrium's own servers permanently and reused for every user's AI requests.",
          explanation:
            "No. Your key is yours alone — it is only ever decrypted momentarily to make a request on your behalf, and it is never shared with or reused for other users.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c39-q4",
      prompt: "Which of these is NOT something that affects how much you spend on AI API costs?",
      options: [
        {
          text: "How long ago you created your Atrium account.",
          explanation:
            "Correct — this is the one that does not matter. Account age has no bearing on AI costs at all.",
        },
        {
          text: "How often the AI auto-scans the market.",
          explanation:
            "This does matter — a shorter scan interval means more scans per day, and each scan is a separate billed request to your AI provider.",
        },
        {
          text: "Which provider and model you chose.",
          explanation:
            "This does matter — different providers and models charge different amounts per request, which is part of why Atrium lets you bring your own key and choose freely.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
