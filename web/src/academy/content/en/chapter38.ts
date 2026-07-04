// Chapter 38: Getting started with Atrium. A BASIC orientation chapter for
// brand-new users, mirroring the app's own interactive onboarding tutorial for
// anyone who skipped it (or wants a written refresher). Structured with a
// single lesson for now; later features are expected to append more lessons
// to the `lessons` array below (and, if needed, more questions to `quiz`).
import type { Chapter } from "../../types";

export const chapter38: Chapter & { whoFor: string } = {
  id: "c38",
  number: 38,
  level: "BASIC",
  whoFor: "Anyone opening Atrium for the first time",
  title: "Getting Started with Atrium",
  description:
    "A quick tour of the app: the sidebar, your portfolio, trading modes, Manual vs Bot trading, and where to find help again later.",
  lessons: [
    {
      id: "c38-l1",
      title: "How to get started with this app",
      paragraphs: [
        "The left sidebar is your main way of moving around the app — Trading, Receive & Send, Pending Payments, Logs, and the Academy all live there. On a desktop or tablet screen it sits fixed along the left edge, and you can collapse it down to icons-only by clicking the small arrow near the top if you want more room for the page itself. On a phone, the sidebar is hidden by default and becomes a slide-in menu: tap the ☰ button to open it, tap a link (or the backdrop) to close it again.",
        "At the top of the app, the portfolio section in the header always shows your total wallet value, so you can check how you are doing no matter which page you are on. Tap or click any token listed there and it opens that token's own detail page, where you can see its price, your holding, and set things like stop-losses.",
        "The Trading page has two tabs, and it is worth knowing exactly what each one controls. The Bot tab holds the Read-only / Paper / Live trading-access control. This setting only gates the AI, not you: Read-only means the AI can merely observe and only you can trade manually; Paper lets the AI simulate trades with no real money moving; Live allows the AI to submit real, on-chain orders. Live is the only mode with real consequences for the bot, so read the on-screen warning carefully before you ever switch to it — there is no undo on a live order.",
        "The Manual tab is where you place your own trades by hand. Manual orders are never held up for approval, no matter which trading-access mode is active — when you submit a manual trade, it executes immediately (or, while the access mode is Paper, it fills as a paper trade). The Bot tab is also where AI trading itself lives: turning the AI on and letting it trade requires a Premium subscription, and you will also need to supply your own API key for the AI provider you want to use.",
        "The Academy — where you are reading this right now — is completely free for everyone, at every level, and you do not even need to be logged in to use it. Come back any time to brush up on a concept.",
        "Finally, if you ever want to see the app's interactive walkthrough again, you do not have to hunt for it: open Settings, go to Account, and choose Restart Tutorial to run it from the beginning.",
      ],
      example:
        "Picture your first five minutes in the app: you glance at the header and see your total wallet value; you tap ☰ on your phone to check the sidebar and see the Academy link; you open the Trading page's Bot tab and notice the access mode is set to Read-only, so you switch to the Manual tab and place a small manual trade yourself, which executes right away; later, wanting a refresher, you open Settings → Account → Restart Tutorial and watch the walkthrough again from the start.",
    },
  ],
  quiz: [
    {
      id: "c38-q1",
      prompt: "Where does the Read-only / Paper / Live trading-access control live, and what does it actually control?",
      options: [
        {
          text: "On the Trading page's Bot tab, and it only gates the AI — your own manual trades are always allowed.",
          explanation:
            "Correct. The trading-access control sits on the Bot tab. Read-only stops the AI from trading, Paper lets it simulate, and Live lets it submit real orders — but manual trading is never blocked by this setting.",
        },
        {
          text: "In the sidebar, and it locks you out of the whole app until you choose a mode.",
          explanation:
            "No. The control is on the Bot tab of the Trading page, and it never locks you out of manual trading or any other part of the app.",
        },
        {
          text: "On the Manual tab, and it decides whether your own trades need approval.",
          explanation:
            "Not quite. The control lives on the Bot tab, and it governs the AI, not your manual trades. Manual trades execute immediately regardless of this setting.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c38-q2",
      prompt: "You place a trade on the Manual tab. Does it need to be approved before it executes?",
      options: [
        {
          text: "Yes, every manual trade waits for a separate approval step, just like AI trades can.",
          explanation:
            "No. Manual trades are never queued for approval — that only ever applies to AI-generated proposals when auto-trade is off.",
        },
        {
          text: "No — your own manual trades execute immediately (or as a paper fill in Paper mode), with no approval step.",
          explanation:
            "Correct. Manual trading is entirely yours: whatever you submit on the Manual tab goes straight through, immediately.",
        },
        {
          text: "It depends on whether you have a Premium subscription.",
          explanation:
            "No. A Premium subscription is what is needed to let the AI trade — it has no bearing on your own manual trades, which always execute right away.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c38-q3",
      prompt: "You already went through the app's interactive tutorial once but want to see it again. Where do you go?",
      options: [
        {
          text: "Settings → Account → Restart Tutorial.",
          explanation:
            "Correct. The tutorial can be restarted at any time from the Account section inside Settings.",
        },
        {
          text: "The Academy, under a dedicated 'Tutorial' chapter.",
          explanation:
            "Not quite. The Academy is a separate, free learning centre — the interactive walkthrough itself restarts from Settings → Account, not from an Academy chapter.",
        },
        {
          text: "There is no way to see it again once it has been dismissed.",
          explanation:
            "No. You can always replay it from Settings → Account → Restart Tutorial.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
