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
    {
      id: "c38-l2",
      title: "What is the difference between Free and Premium?",
      paragraphs: [
        "Free already gets you almost everything the app can do. Manual trading is full access, with nothing held back — you can place, cancel, and modify orders, and set a stop loss or a trailing stop to protect a position while you are away. The liquidity scanner is free too, so you can check how easily a token trades before you commit to it, and auto-swap to XLM is available to convert stray tokens back to your base asset automatically. The entire Academy, every chapter and quiz, is free at every level. The one thing Free does not include is AI trading.",
        "Premium unlocks two things. First, AI trading itself: once you subscribe, you can turn the AI on and control it with per-risk-factor settings, so it trades within limits you choose rather than acting as an all-or-nothing switch. Second, Premium lowers your trade fees at every volume tier, on top of whatever AI trading itself might do for your results. Premium is billed monthly at €10, or annually at €96 — a saving of roughly 20% over paying month to month. To actually let the AI trade you will also need your own API key from an AI provider such as Anthropic or OpenAI, which a later chapter covers; the AI provider bills you separately for whatever the AI itself uses, on top of your Atrium subscription.",
        "Every trade on the platform, manual or AI, pays a small percentage fee, and that percentage depends on your volume tier. Your tier is recalculated daily from your platform trading volume over the previous calendar month, so it can move up or down as your activity changes: Bronze is under 5,000 XLM of monthly volume, Silver is 5,000–20,000, Gold is 20,000–50,000, and Platinum is over 50,000. Within each tier, Free pays the highest percentage, Premium manual trading pays less, and Premium AI trading pays the least of all. Every new account starts on Bronze. There is no minimum fee in currency terms, but trades smaller than 1 XLM do not count toward building up your tier, even though they still pay the fee for that tier.",
        "It helps to think of it like a gym membership: the more you use it, the cheaper each visit becomes. A heavy trader is treated like a heavy gym-goer and pays a lower percentage per trade simply for showing up more, and a Premium subscription is the member rate on top of that — a further discount at every single tier.",
        "As a rough rule of thumb, if you trade more than about €500 a month, Premium's lower fees alone will typically save you more than the €10 monthly cost, before you even count what AI trading might add.",
      ],
      example:
        "Say you trade 8,000 XLM worth of volume in a month — that puts you on the Silver tier. As a Free user your trades that month cost 0.23% each. Upgrade to Premium and trade manually at the same volume, and the fee drops to 0.16% per trade; let the AI trade for you at Silver, and it drops further to 0.12%. The tier is reassessed daily from last month's volume, so if next month you trade 25,000 XLM, you move up to Gold and the percentages fall again — regardless of whether you are Free or Premium.",
    },
    {
      id: "c38-l3",
      title: "What does the kill switch do?",
      paragraphs: [
        "The red kill switch in the header instantly pauses all bot activity. Pressing it opens a confirmation dialog that lists every consequence before you commit, and the confirm button stays disabled for two seconds so a stray click or an itchy trigger finger can't set it off by accident.",
        "Several things stop the moment it engages. The AI trading loop stops generating new proposals altogether. Any pending AI trade proposals that were still waiting for your approval are cancelled outright. The stop-loss monitor stops firing — meaning active stop losses will NOT trigger until you reactivate. And the background scanners, both the liquidity scanner and the AI trustline scanner, pause along with everything else.",
        "Just as important is what keeps running. Any open orders you already have on the Stellar network stay active and on the book until you cancel them yourself in Active Orders — the kill switch does not touch the network directly. Your stop-loss settings are not deleted, only paused; they are kept exactly as configured and pick back up the moment you reactivate. Your wallet and funds are completely untouched. And manual trading remains fully available: read-only mode still lets you trade by hand, since the kill switch only ever governs the bot.",
        "⚠ WARNING — the most dangerous nuance here: while the kill switch is on, your stop losses do NOT execute. If the market moves against an open position, nothing will close it automatically. Do not treat the kill switch as a safety net for open positions; it is the opposite for anything that relies on a stop loss.",
        "The kill switch is also durable: once engaged, it stays on even if the server restarts, and it will remain on until you deliberately reactivate it. It does not quietly reset itself.",
        "Reach for it whenever something feels wrong — unexpected trades, unusual market conditions, or simply wanting a moment to think — or when you're stepping away and don't want the bot acting without you, or during an incident of any kind. Treat it as a pause button, not an emergency wipe: it freezes the bot in place rather than undoing anything that has already happened.",
        "Reactivating is just as deliberate as engaging it. A 'Bot is paused' banner stays visible on screen the whole time it's active; tap the banner and confirm, and the AI loop, the stop-loss monitor, and the background scanners all resume together.",
      ],
      example:
        "You notice the AI proposing trades that look off during a volatile hour, so you hit the kill switch, confirm after the two-second delay, and everything pauses: no new AI proposals, pending ones cancelled, stop-loss monitor silent, scanners paused. Your existing open orders on Stellar are still sitting on the book, so you cancel the one you're unsure about manually from Active Orders. You leave the kill switch on overnight — even though the server restarts for a routine update, it comes back up still paused. The next morning you tap the 'Bot is paused' banner, confirm, and the AI loop, stop-loss monitor, and scanners all start back up.",
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
    {
      id: "c38-q4",
      prompt: "Which of these is only available to Premium subscribers?",
      options: [
        {
          text: "AI trading, with per-risk-factor controls.",
          explanation:
            "Correct. AI trading is the one feature gated behind Premium. Manual trading, stop losses and trailing stops, the liquidity scanner, auto-swap to XLM, and the full Academy are all free.",
        },
        {
          text: "Manual trading and stop losses.",
          explanation:
            "No. Manual trading, including stop losses and trailing stops, is fully available on Free — nothing about it is Premium-only.",
        },
        {
          text: "The Academy.",
          explanation:
            "No. The Academy is free for everyone at every level, whether or not you subscribe to Premium.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c38-q5",
      prompt: "What determines which fee tier (Bronze, Silver, Gold, Platinum) you are on?",
      options: [
        {
          text: "How long ago you created your account.",
          explanation:
            "No. Account age has no effect on your tier — a brand-new account and a years-old account are judged the same way, on volume alone.",
        },
        {
          text: "Your platform trading volume over the previous calendar month, recalculated daily.",
          explanation:
            "Correct. Your tier is based purely on how much you traded on the platform last calendar month, and it is recalculated every day, so it can rise or fall as your volume changes.",
        },
        {
          text: "Whether you have made a one-off payment to unlock a higher tier.",
          explanation:
            "No. There is no way to buy a tier directly — tiers come only from actual trading volume, and a Premium subscription changes the percentage you pay within a tier, not which tier you are on.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c38-q6",
      prompt: "You engage the kill switch. Which of these keeps running exactly as before?",
      options: [
        {
          text: "Any open orders you already placed on the Stellar network — they stay active on the book.",
          explanation:
            "Correct. The kill switch pauses the bot, not the network. Orders you already placed keep sitting on the book until you cancel them yourself in Active Orders.",
        },
        {
          text: "Your active stop losses — they keep firing normally.",
          explanation:
            "No. This is the dangerous part: the stop-loss monitor stops firing while the kill switch is on, so active stop losses will NOT trigger until you reactivate.",
        },
        {
          text: "The AI trading loop — it keeps proposing new trades for you to approve.",
          explanation:
            "No. The AI trading loop stops generating new proposals altogether, and any proposals still waiting for approval are cancelled outright.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c38-q7",
      prompt: "You engage the kill switch and the server restarts a few hours later. Is the kill switch still on afterward?",
      options: [
        {
          text: "No — a server restart automatically clears it, so the bot resumes on its own.",
          explanation:
            "No. The kill switch does not quietly reset itself on a restart — that would defeat the point of it.",
        },
        {
          text: "Yes — it survives the restart and stays on until you deliberately reactivate it.",
          explanation:
            "Correct. Once engaged, the kill switch stays on even through a server restart, and only comes off when you tap the 'Bot is paused' banner and confirm.",
        },
        {
          text: "It depends on whether any orders were open at the time of the restart.",
          explanation:
            "No. Open orders have no bearing on the kill switch's own state — it stays engaged across a restart regardless of what else is happening in your account.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
