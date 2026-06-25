import type { Chapter } from "../../types";

export const chapter01: Chapter = {
  id: "c1",
  number: 1,
  level: "BASIC",
  title: "What is Crypto Trading?",
  description:
    "Start from zero: coins, blockchains, the Stellar network, wallets, and how tokens differ from coins.",
  lessons: [
    {
      id: "c1-l1",
      title: "What is a cryptocurrency?",
      paragraphs: [
        "A cryptocurrency is digital money that lives on a shared computer network instead of inside one bank. No single company owns it. The network is run by many computers around the world that all agree on who holds what, so the record cannot be quietly changed by one party.",
        "Because it is digital, you can send it directly to another person anywhere, often in seconds, without asking a bank for permission. The trade-off is that you are responsible for your own funds. There is no help desk to reverse a mistake, so care matters.",
        "Prices move because people buy and sell, just like shares or foreign currency. This dashboard lets you watch those prices and place buy and sell orders yourself in the Manual Trading tab, or let an AI suggest trades in the Bot Trading tab.",
      ],
      example:
        "Imagine you hold 100 XLM, the cryptocurrency of the Stellar network. If each XLM is worth about 0.11 USDC, your 100 XLM is worth roughly 11 USDC. If the price rises to 0.13 USDC, the same 100 XLM is now worth 13 USDC, even though the number of XLM you hold has not changed.",
    },
    {
      id: "c1-l2",
      title: "What is a blockchain and why does it matter?",
      paragraphs: [
        "A blockchain is the shared record book that a cryptocurrency runs on. Transactions are grouped into blocks, and each new block is linked to the one before it, forming a chain. Many computers keep a full copy, so they can check each other and agree on the truth.",
        "This matters because it removes the need to trust one company with the record. Once a transaction is confirmed and added to the chain, it is extremely hard to alter or erase. The history is permanent and public, so anyone can verify that the numbers add up.",
        "For a trader, this means a finished trade is final. When the bot or you place an order and it fills on the Stellar Decentralized Exchange, that result is written to the blockchain and cannot be undone. That permanence is exactly why double-checking before you confirm is so important.",
      ],
      example:
        "Say you send 50 XLM to a friend. The network bundles your transfer with others into a block, the computers confirm it within a few seconds, and the block is added to the chain. From then on, the record shows 50 XLM left your account, and no one, not even you, can rewrite that entry.",
    },
    {
      id: "c1-l3",
      title: "What is the Stellar network and XLM?",
      paragraphs: [
        "Stellar is the specific blockchain this bot trades on. It was built to move money quickly and cheaply, which makes it well suited to lots of small trades. Stellar even has a built-in exchange, the Stellar Decentralized Exchange, or SDEX, where buyers and sellers meet directly.",
        "XLM, also called Lumens, is Stellar's own native asset. It plays two roles. It is something you can trade, and it is also the fuel that pays the tiny network fee on every transaction. Those fees are a fraction of a US cent, so trading often is not expensive.",
        "Every Stellar account must also keep a small minimum amount of XLM in reserve that you cannot spend. This keeps the network healthy. The wallet overview in this dashboard shows your holdings priced in both XLM and USDC so you can see your value at a glance.",
      ],
      example:
        "You place a sell order on the SDEX swapping 20 XLM for USDC. The network charges a fee of about 0.00001 XLM, far less than a cent. If you held exactly 21 XLM, you could not sell all of it, because a minimum reserve of roughly 1 XLM must stay in the account to keep it active.",
    },
    {
      id: "c1-l4",
      title: "What is a wallet and how do you keep it safe?",
      paragraphs: [
        "A wallet is your account on the network. It has two keys. The public key starts with the letter G and is like your account number, safe to share so people can send you funds. The secret key starts with the letter S and is like the password plus signature that authorises every move.",
        "The golden rule is simple. Whoever holds the secret key controls the funds. There is no bank to call if it leaks. Anyone who copies your S key can drain your wallet instantly, and the blockchain will treat their transactions as completely valid because they were signed correctly.",
        "So never paste your secret key into a website you do not trust, never share it in chat or email, and keep a private backup offline. Treat the G key as public and the S key as a guarded secret. This dashboard signs trades for you, but the safety of that key is always your responsibility.",
      ],
      example:
        "Your public key might look like GA5ZSEJ followed by more letters, and you can safely post it so a friend sends you 10 XLM. Your secret key looks like SDX4K followed by more characters. If someone screenshots that S key, they can sign a transaction moving all your XLM and USDC away, and nobody can reverse it.",
    },
    {
      id: "c1-l5",
      title: "What is a token and how is it different from a coin?",
      paragraphs: [
        "People often say coin and token as if they mean the same thing, but there is a useful difference. A coin is the native asset of its own blockchain. XLM is a coin because it is built into Stellar itself and pays the network fees.",
        "A token is an asset that someone issues on top of an existing blockchain. It rides on Stellar's rails rather than having its own. USDC, issued by a company called Circle, is a token that aims to stay worth one US dollar. It uses Stellar to move, but it is not Stellar's native coin.",
        "On Stellar, before you can hold or trade any non-native token like USDC, you must first add a trustline to its issuer. A trustline is your account saying it agrees to hold that specific token. The native coin XLM never needs a trustline, because it is part of the network itself.",
      ],
      example:
        "To trade XLM for USDC on this dashboard, you first open a trustline to Circle, the issuer of USDC. Without it, the order book will not let you receive USDC. Once the trustline is set, you can swap, for instance, 100 XLM into about 11 USDC, holding the USDC token while still using XLM coin for the fee.",
    },
  ],
  quiz: [
    {
      id: "c1-q1",
      prompt:
        "On the Stellar network, what is the difference between XLM and USDC?",
      options: [
        {
          text: "XLM is Stellar's native coin, while USDC is a token issued on top of Stellar by Circle.",
          explanation:
            "Correct. A coin is native to its blockchain and XLM is built into Stellar, whereas USDC is a token issued by Circle that rides on Stellar's rails.",
        },
        {
          text: "They are both native coins of two separate blockchains.",
          explanation:
            "Not quite. Only XLM is native to Stellar. USDC is a token issued on top of Stellar, not a separate blockchain's coin.",
        },
        {
          text: "USDC is the native coin and XLM is a token issued by Circle.",
          explanation:
            "This reverses the truth. XLM is the native coin that pays network fees, and USDC is the token issued by Circle.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c1-q2",
      prompt:
        "Someone sends you a message asking for your secret key, which starts with S, to help fix your account. What should you do?",
      options: [
        {
          text: "Share it, since support staff need it to help you.",
          explanation:
            "No. There is no support desk that needs your secret key, and sharing it lets anyone drain your wallet.",
        },
        {
          text: "Share only the first few characters to prove you own the account.",
          explanation:
            "Still unsafe. Even partial leaks are risky, and a real service never needs any part of your secret key.",
        },
        {
          text: "Refuse and keep it private, because whoever holds the S key controls the funds.",
          explanation:
            "Correct. The secret key authorises every transaction. Anyone who gets it can move your funds, and the blockchain cannot reverse it.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c1-q3",
      prompt: "What best describes a blockchain?",
      options: [
        {
          text: "A private database that one company can edit whenever it likes.",
          explanation:
            "Incorrect. The whole point of a blockchain is that no single party controls or quietly edits the record.",
        },
        {
          text: "A shared record of transactions kept by many computers, where confirmed entries are permanent.",
          explanation:
            "Correct. Many computers hold copies and agree on the truth, and once a block is added it is extremely hard to change, which is why filled trades are final.",
        },
        {
          text: "A type of cryptocurrency you can buy and sell.",
          explanation:
            "Not quite. A cryptocurrency runs on a blockchain, but the blockchain itself is the shared record book, not the money.",
        },
        {
          text: "A bank account that automatically reverses mistaken payments.",
          explanation:
            "No. There is no central authority to reverse payments. Confirmed blockchain transactions are permanent.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c1-q4",
      prompt:
        "Why does every Stellar account need to keep a small amount of XLM, and what is XLM used for?",
      options: [
        {
          text: "XLM is only useful as a backup token and is never spent.",
          explanation:
            "Incorrect. XLM is actively traded and also pays the network fee on every transaction, not just a backup.",
        },
        {
          text: "XLM pays the tiny network fees and a minimum reserve must stay in the account to keep it active.",
          explanation:
            "Correct. XLM is Stellar's native coin used for fees of a fraction of a cent, and a small reserve must remain so the account stays open.",
        },
        {
          text: "The reserve is a fee paid to Circle for issuing USDC.",
          explanation:
            "No. Circle issues USDC, but the XLM reserve is a network rule for keeping the account active, not a payment to Circle.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
