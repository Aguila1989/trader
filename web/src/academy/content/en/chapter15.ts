import type { Chapter } from "../../types";

export const chapter15: Chapter = {
  id: "c15",
  number: 15,
  level: "BASIC",
  title: "Logging In and Staying Safe",
  description:
    "Why a trading app needs a login, what makes a password strong, why we check your email, and what to do if you ever forget your password.",
  lessons: [
    {
      id: "c15-l1",
      title: "Why do you need a login for a trading app?",
      paragraphs: [
        "A login is how the app makes sure that you, and only you, can reach your trading data and your wallet controls. Without one, anyone who opened the page could see your history, change your settings, or try to move funds. The login is the front door, and your email and password are the key.",
        "Think of your login like the key to your own locker. The locker holds everything personal: your trades, your risk settings, your saved stop losses. As long as the key stays with you, nobody else can open the locker — even though it sits in the same room as everyone else's.",
        "This matters more for a trading app than for most websites, because the app can take real actions with real money. A strong front door is the first and most important layer of protection: it keeps strangers out before any of the other safety features even come into play.",
      ],
      example:
        "Imagine you leave your computer at a café for two minutes. If the app had no login, the person at the next table could open it and start clicking. With a login, all they see is a sign-in screen asking for an email and password they do not have — your locker stays shut.",
    },
    {
      id: "c15-l2",
      title: "What makes a strong password?",
      paragraphs: [
        "A strong password is long and mixed. This app asks for at least 12 characters, with at least one uppercase letter, one lowercase letter, one number, and one special character (like ! or @). Length is the single biggest factor: every extra character makes a guessing attack far slower.",
        "The enemy of a good password is predictability. Real words, names, birthdays, and simple patterns like \"Password123!\" are the first things an attacker tries. A passphrase — several unrelated words stuck together with a number and a symbol — is both strong and easy to remember.",
        "Never reuse a password you use somewhere else. If another website is breached and you used the same password here, attackers will try it on your trading account too. A password manager can generate and remember a unique strong password so you do not have to.",
      ],
      example:
        "Weak: \"john2024\" — short, a name, and a year; guessed in seconds. Stronger: \"Brave-Otter-Lemon-7!\" — four random words, 20 characters, with a number and a symbol. It is far harder to guess yet easy to picture.",
    },
    {
      id: "c15-l3",
      title: "What is email verification and why is it required?",
      paragraphs: [
        "Email verification is a quick check that the email address you signed up with really belongs to you. After you register, the app sends a one-time link to that address; clicking it proves you can read mail sent there, and only then is your account allowed to log in.",
        "This protects you in two ways. First, it stops someone from creating an account using your email without your knowledge. Second, it makes sure the app has a working address to reach you at — which is exactly the address a password-reset link would be sent to later.",
        "If the app has not been set up to send email, verification is skipped so you can still use it, and a note is recorded that this step was turned off. When email is configured, verification is required, and your account waits in an unverified state until you click the link.",
      ],
      example:
        "You register with \"you@example.com\". The app emails a link to that inbox. Until you open the inbox and click it, trying to log in shows \"Please verify your email first.\" Once you click, your account is confirmed and you can sign in normally.",
    },
    {
      id: "c15-l4",
      title: "What to do if you forget your password",
      paragraphs: [
        "Forgetting a password is normal and the app is built for it. On the login screen there is a \"Forgot your password?\" link. You enter your email, and if an account exists for it, the app sends a reset link to that address. For privacy, the message you see is the same whether or not the email is registered, so it never reveals who has an account.",
        "The reset link is deliberately short-lived — it works for one hour and one time only. As soon as you use it to set a new password, the link stops working, so an old email sitting in your inbox cannot be used again. Your new password must meet the same strength rules as before.",
        "Setting a new password also signs out any other active sessions, so if someone had sneaked in, the reset locks them out. If you ever get a reset email you did not request, you can safely ignore it — nothing changes unless the link is actually used.",
      ],
      example:
        "You cannot remember your password. You click \"Forgot your password?\", enter your email, and within a minute a link arrives. You open it, choose \"Brave-Otter-Lemon-7!\" as the new password, and you are back in — and any device that was still logged in is signed out for safety.",
    },
  ],
  quiz: [
    {
      id: "c15-q1",
      prompt: "Why does a trading app need a login at all?",
      options: [
        {
          text: "So only you can reach your trading data and wallet controls — like a key to your own locker.",
          explanation:
            "Correct. The login is the front door: it keeps everyone but you out of your data and your money controls.",
        },
        {
          text: "So the app loads faster.",
          explanation: "No. A login is about access and safety, not speed.",
        },
        {
          text: "So everyone can share the same trades and settings.",
          explanation:
            "No. The point is the opposite — your data stays private to you, not shared.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c15-q2",
      prompt: "Which of these is the strongest password?",
      options: [
        {
          text: "\"Password123!\"",
          explanation:
            "No. It looks complex but it is one of the first patterns attackers try — a common word plus an obvious number and symbol.",
        },
        {
          text: "\"Brave-Otter-Lemon-7!\"",
          explanation:
            "Correct. It is long (20 characters), mixes character types, and is made of unrelated words, so it is hard to guess yet easy to remember.",
        },
        {
          text: "Your first name and birth year",
          explanation:
            "No. Names and dates are easy to find or guess and make a weak password.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c15-q3",
      prompt: "Why does the app ask you to verify your email after registering?",
      options: [
        {
          text: "To prove the address is really yours and that the app can reach you (e.g. for password resets).",
          explanation:
            "Correct. Verification confirms you control the inbox and gives the app a working address for things like reset links.",
        },
        {
          text: "To send you advertising.",
          explanation: "No. Verification is a security and contact check, not a marketing step.",
        },
        {
          text: "To make your password stronger.",
          explanation:
            "No. Verifying your email has nothing to do with how strong your password is.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c15-q4",
      prompt: "You forgot your password. What is true about the reset link the app sends?",
      options: [
        {
          text: "It works for a limited time and one time only, and using it signs out other sessions.",
          explanation:
            "Correct. The link is short-lived and single-use, and setting a new password logs out any other active session.",
        },
        {
          text: "It is permanent, so you can reuse the same link whenever you forget again.",
          explanation:
            "No. The link expires (about an hour) and stops working once used — that is what keeps it safe.",
        },
        {
          text: "It tells you whether the email is registered or not.",
          explanation:
            "No. For privacy the response is the same either way, so it never reveals who has an account.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
