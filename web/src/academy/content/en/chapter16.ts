import type { Chapter } from "../../types";

export const chapter16: Chapter = {
  id: "c16",
  number: 16,
  level: "ADVANCED",
  title: "How Authentication Works Under the Hood",
  description:
    "A look behind the login screen: what a JWT is, why the token lives in an httpOnly cookie, how account lockout works, and why your session eventually times out.",
  lessons: [
    {
      id: "c16-l1",
      title: "What is a JWT and how does it prove you are logged in?",
      paragraphs: [
        "HTTP is forgetful: each request to the server is independent, so something has to remind the server, on every request, who you are. A JWT (JSON Web Token) is that reminder. When you log in successfully, the server creates a small token that says who you are and when it expires, and signs it with a secret only the server knows.",
        "Think of a JWT like a stamped wristband at a festival. At the gate you show your ID once; in return you get a wristband. After that, the staff at each stage just glance at the wristband — they do not re-check your ID every time. The stamp is hard to forge, so the band itself is proof you were let in.",
        "The signature is the stamp. The server can look at a returned token and verify the signature to know it issued that token and that nobody altered it — without storing the token's contents anywhere. If even one character of the token is changed, the signature no longer matches and the token is rejected.",
      ],
      example:
        "After login your token holds, roughly: \"user = you, issued = 3pm, expires = 3pm tomorrow,\" plus a signature. On your next click the browser sends it back; the server checks the signature, sees it is valid and unexpired, and serves your data — no second password needed.",
    },
    {
      id: "c16-l2",
      title: "What is an httpOnly cookie and why is it safer than storing a token in the browser?",
      paragraphs: [
        "A cookie is a small piece of data the browser stores for a site and sends back automatically on every request to that site. An httpOnly cookie has a special flag that tells the browser: hand this to the server, but never let JavaScript on the page read it.",
        "That flag is the whole point. If a token is kept somewhere JavaScript can read — like localStorage — then a single malicious or buggy script on the page could read the token and send it to an attacker (an attack called XSS). A token in an httpOnly cookie cannot be read by any script, so even a script that sneaks onto the page cannot steal your session.",
        "Cookies that travel automatically raise a different risk: another site could try to make your browser fire off a request using your cookie (called CSRF). The app blocks that by checking where each state-changing request comes from and by marking the cookie \"same-site,\" so the browser will not attach it to requests started by other sites.",
      ],
      example:
        "Two ways to hold the same token. In localStorage: a rogue ad script runs `localStorage.getItem('token')` and emails it away — game over. In an httpOnly cookie: the same script runs and gets nothing back, because the browser refuses to reveal the cookie to JavaScript at all.",
    },
    {
      id: "c16-l3",
      title: "What is account lockout and why does it protect you?",
      paragraphs: [
        "Account lockout limits how many times in a row someone can guess your password. After a set number of failed attempts — five in this app — the account is temporarily locked for a cooldown period (fifteen minutes), during which even the correct password is refused.",
        "This defeats \"brute force\": a program trying thousands of passwords per second until one works. With lockout, an attacker gets only a handful of tries before being forced to wait, which turns a few-minute attack into one that would take years. Each failed attempt is also logged with its time and source address, so suspicious bursts are visible.",
        "There is a careful balance here. Lockout must stop guessers without letting them lock YOU out on purpose, and without revealing whether an email is even registered. So the generic \"invalid email or password\" message is shown for wrong guesses, and the lockout notice only appears to someone who actually has the right password — the real owner.",
      ],
      example:
        "An attacker scripts 1,000 password guesses against your account. After the fifth wrong guess the door closes for fifteen minutes, so in an hour they manage only about twenty tries instead of millions. The attack becomes hopelessly slow, and the log shows a wall of failures from one address.",
    },
    {
      id: "c16-l4",
      title: "What is session expiry and why does your login time out?",
      paragraphs: [
        "Every session has an expiry baked into the token at login. By default this app issues a token that lasts 24 hours; if you tick \"Remember me,\" it lasts 30 days instead. Once that moment passes, the token is no longer accepted and you are asked to log in again.",
        "Expiry limits the damage if a token is ever exposed. A token that lived forever would be a permanent key; a token that expires is a key that stops working on its own, so a copy taken from an abandoned session becomes useless after the window closes. It is the digital version of a hotel keycard that deactivates at checkout.",
        "Logging out does not only wait for expiry — it revokes the session on the server immediately, so the token is rejected from that instant even though its expiry time has not arrived. Resetting your password does the same to every session, which is why a reset is the fastest way to kick out anyone who should not be there.",
      ],
      example:
        "You log in on a shared laptop without \"Remember me\" and forget to log out. The 24-hour token quietly expires overnight, so by morning that browser can no longer reach your account. Had you clicked Log out, it would have been cut off the moment you left — and a password reset would end every session everywhere at once.",
    },
  ],
  quiz: [
    {
      id: "c16-q1",
      prompt: "What is a JWT, in the festival-wristband analogy?",
      options: [
        {
          text: "A signed token you receive after logging in once, that the server re-checks on each request instead of asking for your password again.",
          explanation:
            "Correct. Like a stamped wristband, the signed token proves you were let in, so the server need not re-verify your password every time.",
        },
        {
          text: "Your password, sent again with every request.",
          explanation:
            "No. The whole point is that your password is checked once; the token stands in for it afterwards.",
        },
        {
          text: "A list of every page you have visited.",
          explanation: "No. A JWT carries who you are and when it expires, not a browsing history.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c16-q2",
      prompt: "Why is keeping the session token in an httpOnly cookie safer than in localStorage?",
      options: [
        {
          text: "JavaScript on the page cannot read an httpOnly cookie, so a malicious script (XSS) cannot steal the token.",
          explanation:
            "Correct. The httpOnly flag hides the cookie from all page scripts, removing the most common way a token gets stolen.",
        },
        {
          text: "httpOnly cookies make the app load faster.",
          explanation: "No. It is a security property, not a performance one.",
        },
        {
          text: "localStorage is encrypted and cookies are not.",
          explanation:
            "No. The difference is read access by scripts, not encryption — localStorage is plainly readable by any script on the page.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c16-q3",
      prompt: "How does account lockout protect you?",
      options: [
        {
          text: "It blocks further attempts after several wrong passwords, making fast brute-force guessing impractical.",
          explanation:
            "Correct. A short lockout after a few failures turns millions of possible guesses per hour into a tiny handful.",
        },
        {
          text: "It deletes your account after one wrong password.",
          explanation:
            "No. Lockout is a temporary pause after several failures, not deletion after one.",
        },
        {
          text: "It emails your password to you when you fail.",
          explanation:
            "No. Passwords are never emailed (or even stored in readable form); lockout simply slows guessing.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c16-q4",
      prompt: "Why does your login session eventually time out?",
      options: [
        {
          text: "So an exposed or forgotten token stops working on its own after a set window, limiting the damage.",
          explanation:
            "Correct. Expiry is like a hotel keycard that deactivates at checkout — a leaked token becomes useless once the window closes.",
        },
        {
          text: "Because the server runs out of space to store sessions.",
          explanation:
            "No. Expiry is a deliberate safety limit, not a storage problem — the lifetime is set in the token itself.",
        },
        {
          text: "To force you to change your password every day.",
          explanation:
            "No. Timing out asks you to log in again; it does not require a new password.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
