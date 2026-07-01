import type { Chapter } from "../../types";

export const chapter17: Chapter = {
  id: "c17",
  number: 17,
  level: "BASIC",
  title: "Creating and Protecting Your Wallet",
  description:
    "What a crypto wallet really is, the difference between your public and secret keys, why you must never share the secret one, and how to store it safely offline.",
  lessons: [
    {
      id: "c17-l1",
      title: "What is a crypto wallet?",
      paragraphs: [
        "A crypto wallet is not really a place where your coins are kept — your coins live on the blockchain. A wallet is the pair of keys that lets you prove the coins are yours and lets you move them. Think of it as your identity and your signature on the network rolled into one.",
        "The clearest way to picture it is a mailbox. Your wallet has a public address, like the address printed on the front of a mailbox: anyone can read it, and anyone can drop something in. To open the box and take what is inside, you need the key — and only you should ever hold that key.",
        "So a wallet has two parts that do two different jobs. One part is public and made for sharing, so people can send you funds. The other part is private and made for hiding, because it is the only thing that can spend those funds. The next lessons look at each part in turn.",
      ],
      example:
        "Picture a mailbox on a street. The address (\"12 Oak Lane\") is your public key — you happily print it on letters so people can write to you. The little key in your pocket that opens the box is your secret key. A neighbour can post you a card using the address, but without the key they can never open the box and take what is inside.",
    },
    {
      id: "c17-l2",
      title: "What is a public key and what is a secret key?",
      paragraphs: [
        "Your public key is your wallet's address. It is safe to share with anyone — you give it out so people can send you coins, just as you give out your mailbox address so people can send you letters. Sharing it cannot harm you; the worst anyone can do with it is send you money.",
        "Your secret key (sometimes called a private key) is completely different. It is the one and only thing that can authorise a payment out of your wallet. Whoever holds the secret key controls the funds — full stop. There is no extra password, no manager to call, and no way to reverse a transfer once it is signed.",
        "Because of that, the two keys must be treated in opposite ways. The public key is meant to be seen; the secret key is meant to stay hidden forever. If you ever find yourself unsure which one you are about to share, the safe rule is simple: never share the secret one.",
      ],
      example:
        "On Stellar the two keys even look different so you can tell them apart. A public key starts with the letter G, like \"GABC...\" — that is the one you paste when someone wants to pay you. A secret key starts with the letter S, like \"SABC...\" — that one you keep to yourself and show to no one, ever.",
    },
    {
      id: "c17-l3",
      title: "Why you must never share your secret key — ever",
      paragraphs: [
        "Sharing your secret key is the same as handing someone your wallet with no way to get it back. Anyone who has it can drain every coin in seconds, and because blockchain transfers are final and cannot be reversed, there is no bank to call and no way to claw the money back. The loss is permanent.",
        "Scammers know this is the master key, so most attacks are simply tricks to make you reveal it. A common one is fake \"support\": someone posing as a helpdesk in a chat says they need your secret key or seed phrase to \"fix\" your account or \"unlock\" your funds. Real support never needs your secret key — anyone who asks for it is trying to rob you.",
        "Other traps look just as convincing. A website or pop-up may ask you to \"import\" or \"verify\" your wallet by typing in your seed phrase — that is seed-phrase phishing, and entering it hands the attacker everything. The rule has no exceptions: your secret key and seed phrase are never typed into a chat, a form, an email, or a website you were sent a link to.",
      ],
      example:
        "Someone messages you on a support chat: \"I can see the problem on your account — just paste your secret key so I can restore access.\" The instant you paste it, they sign a transfer and every coin is gone, with no way to undo it. The correct response is to share nothing, leave the chat, and report it: no legitimate service will ever ask for that key.",
    },
    {
      id: "c17-l4",
      title: "What does \"your keys, your crypto\" mean?",
      paragraphs: [
        "\"Your keys, your crypto\" is a saying that captures the whole idea of self-custody: if you hold the secret keys yourself, you truly own and control your coins. Nobody can freeze them, take them, or stop you from moving them, because the network only ever obeys whoever signs with the key.",
        "The flip side is the warning: \"not your keys, not your crypto.\" When you leave coins on an exchange or a service that holds the keys for you — called custodial — you do not really control them. You are trusting that company to honour your withdrawal. If it freezes accounts, goes bankrupt, or is hacked, your access can vanish even though the coins were \"yours.\"",
        "Self-custody hands you the control and the responsibility together. There is no support line to recover a lost key, so the safety of your funds rests on how well you protect that key. That trade-off — total control in exchange for total responsibility — is the heart of holding your own crypto.",
      ],
      example:
        "Two people each \"own\" 100 coins. One keeps them on an exchange that holds the keys; one keeps them in a wallet whose secret key only she has. One morning the exchange halts withdrawals — the first person cannot touch their coins and can only wait and hope. The second person signs a transfer and moves her coins freely, because her keys are hers. That is the difference the saying points at.",
    },
    {
      id: "c17-l5",
      title: "How to safely store your secret key offline",
      paragraphs: [
        "The safest place for a secret key is offline, away from anything connected to the internet. Anything online can in principle be reached by an attacker, so the goal is to keep the key on something that cannot be hacked over a network — most simply, on paper.",
        "Treat the written key like the physical key to your house. You would not tape your house key to the front door or post a photo of it online, and the same caution applies here. Write the key (or seed phrase) on paper, store it somewhere private and safe, and consider a second copy in another secure location in case the first is lost or damaged.",
        "Just as important is knowing where the key must never go. Never keep it in a screenshot, in your photo gallery, in email, in notes that sync to the cloud, or in a chat to yourself — all of those can be hacked, leaked, or synced to a device you no longer control. For larger amounts, a hardware wallet keeps the key on a dedicated offline device and signs without ever exposing the key.",
      ],
      example:
        "A careful approach: write your secret key by hand on a piece of paper, seal it, and lock it in a drawer or safe at home — perhaps with a second copy at a trusted relative's house. A risky approach: snap a photo of the key \"so you don't lose it.\" That photo silently uploads to your cloud backup, and the moment that account is breached, your wallet goes with it.",
    },
    {
      id: "c17-l6",
      title: "Finding your way around & receiving funds",
      paragraphs: [
        "The app is laid out around a left sidebar that lets you jump between its pages: Trading, Receive & Send, Pending Payments, Logs, and the Academy. On a phone the sidebar is tucked away — tap the ☰ (hamburger) icon in the corner to slide it open, pick a page, and it closes again. The Academy sits below a divider, set apart from the trading pages because it is the place you come to learn, not to trade — and it never asks you to log in.",
        "To receive funds, open \"Receive & Send\" from the sidebar. There you will see your wallet's public address — the same G... address from the last lessons — together with a QR code. You can either copy the address and send it to whoever is paying you, or let them point their wallet app at the QR code on your screen.",
        "A QR code is nothing more mysterious than a square barcode: in this case it simply encodes your public address as a pattern of dots. Because it is only the public side of your wallet, it is completely safe to show, share, screenshot, or print. The worst anyone can do with it is send you money. Under the code you will see the label \"Scan to send to this wallet\" — that tells the sender to aim their wallet app's camera at it.",
        "The one rule that never changes carries straight over from the earlier lessons: a QR code only ever holds your public address. Your secret key must never go into a QR code, a screenshot, or anywhere a camera could read it. If an app or a person ever shows you a QR code and says it contains a secret key or seed phrase, treat that as a scam and walk away.",
      ],
      example:
        "A friend wants to send you some XLM. You open \"Receive & Send\" in the sidebar (on your phone, you first tap ☰ to reveal it), and your G... address appears with a QR code beneath the words \"Scan to send to this wallet.\" Your friend opens their own wallet app, points the camera at your screen, and the address fills in automatically — no typing, no mistakes. The funds arrive, and at no point did you reveal anything secret.",
    },
  ],
  quiz: [
    {
      id: "c17-q1",
      prompt:
        "Someone in a support chat asks for your secret key to \"fix\" your account. What do you do?",
      options: [
        {
          text: "Never share it — leave the chat and report them; real support never needs your secret key.",
          explanation:
            "Correct. Anyone asking for your secret key is trying to steal your funds. Legitimate support can never need it, so the only safe move is to share nothing.",
        },
        {
          text: "Share it, but only the first half, to be safe.",
          explanation:
            "No. Your secret key must never be shared, in whole or in part. There is no version of handing it over that is safe.",
        },
        {
          text: "Share it, since support staff are trusted to help you.",
          explanation:
            "No. \"Support\" asking for your secret key is the classic scam. Real support never needs it, and giving it away lets them drain your wallet instantly.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c17-q2",
      prompt: "Which key is safe to give out so people can send you coins?",
      options: [
        {
          text: "Your public key — like a mailbox address, it is meant to be shared.",
          explanation:
            "Correct. The public key (it starts with G on Stellar) is your address. Sharing it only lets people send you funds.",
        },
        {
          text: "Your secret key — they need it to send you money.",
          explanation:
            "No. People never need your secret key to pay you. The secret key only spends funds, so sharing it lets someone take everything.",
        },
        {
          text: "Both keys, so the payment definitely arrives.",
          explanation:
            "No. Only the public key is needed to receive funds. Your secret key must always stay private.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c17-q3",
      prompt: "What does \"your keys, your crypto\" mean?",
      options: [
        {
          text: "If you hold the secret keys yourself, you truly control your coins; if someone else holds them, you are trusting that company.",
          explanation:
            "Correct. Self-custody means control rests with whoever holds the keys. Leave them with a service and your access depends on that service.",
        },
        {
          text: "Your keys make the coins worth more money.",
          explanation:
            "No. Holding your own keys is about control, not value. The price of the coins is unrelated to who holds the keys.",
        },
        {
          text: "You should make a new key for every coin you own.",
          explanation:
            "No. The saying is about who controls the funds, not about creating a key per coin.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c17-q4",
      prompt: "Where is the safest place to store your secret key?",
      options: [
        {
          text: "Offline — written on paper in a safe place, or on a hardware wallet.",
          explanation:
            "Correct. Keeping the key offline puts it out of reach of network attacks. Paper backups and hardware wallets are the standard safe options.",
        },
        {
          text: "In a screenshot in your phone's photo gallery.",
          explanation:
            "No. Photos sync to the cloud and can be hacked or leaked. A screenshot of your key is one of the riskiest places to keep it.",
        },
        {
          text: "In an email to yourself so you can always find it.",
          explanation:
            "No. Email is online and can be breached. A key sitting in an inbox is exposed to anyone who gets into that account.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c17-q5",
      prompt:
        "A website asks you to type your seed phrase to \"verify\" your wallet. What is happening?",
      options: [
        {
          text: "It is a phishing scam — entering the seed phrase hands the attacker full control of your wallet.",
          explanation:
            "Correct. Legitimate apps never ask you to type your seed phrase into a website. Doing so reveals the master secret and lets the attacker take everything.",
        },
        {
          text: "It is a normal safety step that all wallets require.",
          explanation:
            "No. Typing your seed phrase into a website is never a normal step — it is the classic seed-phrase phishing attack.",
        },
        {
          text: "It is fine as long as the website looks professional.",
          explanation:
            "No. A polished look is exactly how scams gain trust. The seed phrase should never be entered into any website, no matter how it appears.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c17-q6",
      prompt:
        "Is it safe to share the QR code of your public address so someone can pay you?",
      options: [
        {
          text: "Yes — a QR code of your public address is safe to show, share, or screenshot; the worst anyone can do with it is send you money.",
          explanation:
            "Correct. The QR code only encodes your public (G...) address, which is meant to be shared. It cannot be used to spend your funds.",
        },
        {
          text: "No — a QR code always contains your secret key, so showing it lets anyone drain your wallet.",
          explanation:
            "No. Your receive QR code holds only the public address. Your secret key must never go into a QR code in the first place.",
        },
        {
          text: "Only if you blur out part of the code first.",
          explanation:
            "No. There is nothing to hide — a public-address QR code is safe to share whole. Blurring it would just stop the payment from working.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c17-q7",
      prompt: "Where do you go in the app to receive funds?",
      options: [
        {
          text: "The \"Receive & Send\" page in the sidebar, where your public address and its QR code are shown.",
          explanation:
            "Correct. \"Receive & Send\" displays your public address and QR code so a sender can copy the address or scan the code.",
        },
        {
          text: "The Academy, after passing the security quiz.",
          explanation:
            "No. The Academy is only for learning and never handles funds. You receive funds from the \"Receive & Send\" page.",
        },
        {
          text: "The Logs page, by reading your transaction history.",
          explanation:
            "No. Logs only shows past activity. To receive funds you open \"Receive & Send\" and share your address or QR code.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
