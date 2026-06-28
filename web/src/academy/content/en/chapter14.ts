import type { Chapter } from "../../types";

export const chapter14: Chapter = {
  id: "c14",
  number: 14,
  level: "BASIC",
  title: "Your Account and Your Data",
  description:
    "What a user account is, how your trading data is kept separate from everyone else's, and what happens to it if you ever delete your account.",
  lessons: [
    {
      id: "c14-l1",
      title: "What is a user account and why does it matter?",
      paragraphs: [
        "An account is your own private space inside the app. It is how the dashboard knows which trades, settings, stop losses and history belong to you and to nobody else. Once you sign in to your account, everything you see and everything the bot does is tied to you alone.",
        "Think of your account like a personal locker. Only you have the key. Everything you put inside — your trading history, your risk settings, your saved stop losses — stays in your locker, and no other user can open it or peek at what is there.",
        "This matters because trading is personal. Your decisions, your numbers, and your mistakes are nobody else's business. An account keeps your information private and makes sure the bot acts on your settings, not on someone else's.",
      ],
      example:
        "Imagine two people use this app. One sets a careful risk limit and only trades small amounts. The other lets the AI trade more aggressively. Because each person has their own account — their own locker — the careful trader's limit is never mixed up with the aggressive trader's. Each account keeps its own settings, its own history, and its own wallet completely separate.",
    },
    {
      id: "c14-l2",
      title: "How your trading data is kept separate from other users",
      paragraphs: [
        "Behind the scenes, every piece of information the app stores — a trade, a log line, a stop loss, a setting — is stamped with the id of the account it belongs to. When you open the dashboard, the app only ever reads back the rows stamped with your id.",
        "This is what stops lockers from leaking into each other. Even though everyone's data lives in the same database, your trades can never show up on another user's screen, because the app filters everything by your account first.",
        "It also means your daily limits, your realized profit and loss, and your scan results are worked out only from your own activity. Another person trading on the same server does not move your numbers by a single cent.",
      ],
      example:
        "Suppose the database holds 10,000 trades from many users. When you open your history, the app asks only for the trades stamped with your account id, so you might see just 40 of them — yours. The other 9,960 stay invisible to you, exactly as your trades stay invisible to everyone else.",
    },
    {
      id: "c14-l3",
      title: "What happens to your data if you delete your account?",
      paragraphs: [
        "Deleting your account removes your locker and everything the app keeps inside it. Your stored trades, settings, stop losses, alerts and logs are erased from the app's records, so they can no longer be read by anyone.",
        "One thing deletion cannot undo is the blockchain itself. As you saw in the first chapter, a trade that has already settled on Stellar is permanent and public. Deleting your account removes the app's copy of your history, but it cannot rewrite the public ledger of trades that already happened on-chain.",
        "Your wallet is also separate from your account. Your funds live on the Stellar network under your own keys, not inside this app, so removing your account does not touch your coins. (Signing in and deleting an account arrive in a later step; this lesson explains what that will, and will not, do to your data.)",
      ],
      example:
        "Say you delete your account after a month of trading. The app forgets your settings, your stop losses and your saved history — they are gone from the dashboard. But if you look up your old trades on a public Stellar explorer, they are still there, because the blockchain keeps its own permanent record that no app can erase.",
    },
  ],
  quiz: [
    {
      id: "c14-q1",
      prompt: "Why does the app give each person their own account?",
      options: [
        {
          text: "So everyone can share one common set of settings and history.",
          explanation:
            "No. The point of separate accounts is the opposite: each person's settings and history are private to them, not shared.",
        },
        {
          text: "So each person's trades, settings and history stay private and separate, like a personal locker only they can open.",
          explanation:
            "Correct. An account is your private locker: your data belongs to you and no other user can see or change it.",
        },
        {
          text: "So the app can show your trades to other users for comparison.",
          explanation:
            "No. Your trades are private to your account and are never shown to other users.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c14-q2",
      prompt:
        "Many users' data lives in the same database. How does the app stop you from seeing another user's trades?",
      options: [
        {
          text: "It stamps every row with an account id and only ever reads back the rows stamped with yours.",
          explanation:
            "Correct. Every trade, log and setting carries the owner's account id, and the app filters by your id, so you only ever see your own data.",
        },
        {
          text: "It simply trusts each user not to look at the others' data.",
          explanation:
            "No. Separation does not rely on trust. The app technically filters every read by your account id.",
        },
        {
          text: "It keeps only one user's data at a time and deletes everyone else's.",
          explanation:
            "No. All users' data can be stored at once; the app keeps it separate by account id rather than deleting anyone's.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c14-q3",
      prompt: "You delete your account after trading for a while. What happens?",
      options: [
        {
          text: "The app erases your stored settings, stop losses and history, but trades already settled on Stellar stay on the public blockchain, and your wallet funds are untouched.",
          explanation:
            "Correct. Deletion clears your data from the app, but the blockchain record of past on-chain trades is permanent, and your coins live in your wallet, not in the app.",
        },
        {
          text: "Every trade you ever made is also wiped from the blockchain.",
          explanation:
            "No. The blockchain is permanent and public; no app can erase a trade that has already settled on-chain.",
        },
        {
          text: "Your coins are deleted along with your account.",
          explanation:
            "No. Your funds live on the Stellar network under your own keys, so deleting your account does not touch your coins.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
