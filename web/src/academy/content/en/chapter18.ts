import type { Chapter } from "../../types";

export const chapter18: Chapter = {
  id: "c18",
  number: 18,
  level: "ADVANCED",
  title: "Importing a Wallet and Understanding Keypairs",
  description:
    "How a Stellar keypair is generated, what really happens when you import a wallet, how this app encrypts your secret key at rest, how testnet funding works, and the risks of replacing your wallet.",
  lessons: [
    {
      id: "c18-l1",
      title: "What is a Stellar keypair and how is it generated?",
      paragraphs: [
        "A Stellar keypair is the public key and secret key that belong together, generated as a matched pair. Stellar uses a signature scheme called ed25519, a modern form of public-key cryptography that is fast, compact, and widely trusted. The pair is mathematically linked: the public key can always be derived from the secret key, but never the other way around.",
        "It starts with a seed — a 32-byte random value. The quality of that randomness is everything: if the seed is truly unpredictable, the resulting key cannot be guessed even by an attacker with enormous computing power. The seed is run through ed25519 to produce the secret key, and the secret key is run through the same maths to produce the matching public key.",
        "Stellar then encodes the two halves so they are easy to tell apart. The public key is encoded to start with the letter G (it is your account address), and the secret key is encoded to start with the letter S. Same underlying maths, two human-readable forms — one safe to share, one to guard.",
      ],
      example:
        "Generating a keypair is like rolling a fair 256-sided die 32 times to get a secret seed nobody could predict, then feeding it through a one-way machine that prints two labels: a G... address you can hand out, and an S... secret only you keep. Because the machine only runs one way, no one can read the labels backwards to recover your seed.",
    },
    {
      id: "c18-l2",
      title: "What happens when you import an existing wallet?",
      paragraphs: [
        "Importing a wallet means telling the app about an account you already have, rather than creating a new one. You provide your existing secret key (the S... value). From that, the app derives the matching public key — the G... address — using the same ed25519 maths, so it learns your address without you ever typing it.",
        "With the address in hand, the app looks the account up on Horizon, Stellar's gateway to the network, to confirm it exists and to read its current balances. That is why, right after importing, you see your real XLM and token balances appear: the app is reading them straight from the public ledger, not inventing them.",
        "Crucially, importing does not move or copy any coins. It is the same account it always was, living at the same address on the same network; you have simply made it usable from inside this app. Nothing is transferred, and the account behaves identically whether you reach it from here or from any other Stellar wallet.",
      ],
      example:
        "You paste an S... secret key into the import screen. The app derives the G... address, queries Horizon, and shows \"Balance: 250 XLM, 40 USDC.\" Those funds did not arrive because of the import — they were always at that address. Importing just connected this app to the account you already controlled.",
    },
    {
      id: "c18-l3",
      title: "What is AES-256-GCM encryption and how does this app protect your secret key at rest?",
      paragraphs: [
        "AES-256-GCM is a form of symmetric authenticated encryption. \"Symmetric\" means the same key both locks and unlocks the data; \"256\" refers to the key size, far beyond what any computer can brute-force; and \"GCM\" adds an authentication tag that detects any tampering, so altered ciphertext is rejected rather than silently decrypted to garbage.",
        "This app uses it to protect your secret key at rest — that is, while it sits in the database. Your secret is encrypted with a server-side key derived per user, and only the resulting ciphertext is stored. The plain secret key is never written to disk and is never sent back to your browser, so a stolen database dump yields only unreadable ciphertext.",
        "The plain secret only ever exists briefly in server memory, at the exact moment a transaction needs signing, and is discarded straight after. This is why signing happens on the server and the key never reaches the front end: the browser is treated as untrusted, and the unencrypted secret is kept as short-lived and as contained as possible.",
      ],
      example:
        "Suppose an attacker steals a copy of the database. For your wallet they find a blob like \"9f3a...c1\" — the AES-256-GCM ciphertext — and nothing else. Without the server-side per-user key it cannot be decrypted, and the GCM tag means they cannot even tamper with it usefully. The secret key itself was never stored in readable form for them to find.",
    },
    {
      id: "c18-l4",
      title: "What is Friendbot and how does testnet funding work?",
      paragraphs: [
        "Stellar runs a separate practice network called testnet, where the coins have no real value and exist only so developers and learners can experiment safely. To make that easy, testnet has a faucet called Friendbot: ask it about a new address and it creates the account and funds it with free test XLM.",
        "That funding step matters because, on Stellar, an address is not a real account until it holds a minimum balance — the base reserve. Friendbot covers this for you on testnet, turning a freshly generated keypair into a live, usable account in one click, with test XLM to play with.",
        "Mainnet — the real network — has no Friendbot, and that is the whole point. On mainnet you must fund a new account yourself with real XLM to meet the base reserve before it becomes active. Test coins can never cross over to mainnet, so practising on testnet costs nothing and risks nothing, while a real account always starts with real money you provide.",
      ],
      example:
        "On testnet you generate a fresh G... address and click \"Fund with Friendbot.\" Seconds later the account exists with 10,000 test XLM — perfect for practice. Try the same on mainnet and there is no Friendbot button: the account stays inactive until you send it real XLM from another wallet to cover the base reserve.",
    },
    {
      id: "c18-l5",
      title: "What are the risks of replacing your wallet in the app?",
      paragraphs: [
        "The app keeps only one active wallet at a time, so importing a new one replaces the old one rather than holding both. Because this is a sensitive action, it requires your password — a deliberate guard so a momentary lapse or an attacker at your unlocked screen cannot silently swap the wallet the bot trades with.",
        "Replacing the wallet also affects work already in progress. Open orders and active stop losses are tied to the wallet that created them; when you switch wallets, those are cancelled, because they no longer match the account now in control. Plan the switch for a moment when leaving positions unmanaged is acceptable.",
        "The deepest risk is on your side, not the app's. If you replace a wallet and have not safely kept the old secret key, you lose your way back into that account and the funds it holds — the app cannot recover a secret it never stores in readable form. Before replacing, make sure the old secret key is backed up offline exactly as the earlier chapter described.",
      ],
      example:
        "You import wallet B to replace wallet A. The app asks for your password, then cancels A's two open stop losses and switches over. Later you want to move A's leftover funds — but you never wrote down A's secret key, and the app only ever stored it encrypted and has now replaced it. Those funds are stranded, not because of a bug, but because the one key that could reach them is gone.",
    },
  ],
  quiz: [
    {
      id: "c18-q1",
      prompt: "How is a Stellar keypair related, and which key starts with which letter?",
      options: [
        {
          text: "It is an ed25519 pair derived from a random seed; the public key starts with G and the secret key with S, and the public can be derived from the secret but not the reverse.",
          explanation:
            "Correct. ed25519 links the pair one way: the public key (G...) comes from the secret key (S...), which comes from a random seed — and the maths cannot be run backwards.",
        },
        {
          text: "They are two unrelated random values, one starting with G and one with S.",
          explanation:
            "No. The keys are mathematically linked, not independent — the public key is derived from the secret key.",
        },
        {
          text: "The secret key starts with G and the public key with S.",
          explanation:
            "No. It is the other way around: G is the public address, S is the secret key.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c18-q2",
      prompt: "When you import a wallet by entering your secret key, what happens to your coins?",
      options: [
        {
          text: "Nothing moves — the app derives your public key, reads the account on Horizon, and shows balances that were always there.",
          explanation:
            "Correct. Importing only connects the app to an account you already control. It derives the G... address and reads existing balances; no coins are transferred.",
        },
        {
          text: "Your coins are moved into a new account created by the app.",
          explanation:
            "No. Importing does not move or create funds. It is the same account at the same address, now usable here.",
        },
        {
          text: "The app copies your coins so they exist in two places at once.",
          explanation:
            "No. Coins are not copied. There is one account on the ledger; importing just lets this app read and use it.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c18-q3",
      prompt: "How does this app protect your secret key at rest with AES-256-GCM?",
      options: [
        {
          text: "It stores only the encrypted ciphertext, decrypts the secret only in memory at signing time, and never returns it to the browser.",
          explanation:
            "Correct. The secret is encrypted with a per-user server-side key; only ciphertext is stored, the plain key lives briefly in memory for signing, and the browser never sees it.",
        },
        {
          text: "It stores your secret key in plain text but behind a login.",
          explanation:
            "No. The secret is never stored in plain text. A login alone would not protect a stolen database dump — encryption does.",
        },
        {
          text: "It sends the secret key to your browser, which encrypts it locally.",
          explanation:
            "No. The secret never reaches the browser. Signing happens server-side precisely so the plain key stays off the untrusted front end.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c18-q4",
      prompt: "What is true about Friendbot and funding accounts?",
      options: [
        {
          text: "Friendbot is a testnet-only faucet that creates and funds an account with free test XLM; on mainnet you must fund with real XLM to meet the base reserve.",
          explanation:
            "Correct. Friendbot exists only on testnet for safe practice. Mainnet has no faucet, so a real account must be funded with real XLM to cover the base reserve.",
        },
        {
          text: "Friendbot funds your mainnet account with real XLM for free.",
          explanation:
            "No. Friendbot is testnet-only and its coins have no real value. Nothing funds a mainnet account for free.",
        },
        {
          text: "Test XLM from Friendbot can be moved to mainnet and spent.",
          explanation:
            "No. Testnet and mainnet are separate networks; test XLM cannot cross over and has no real-world value.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
