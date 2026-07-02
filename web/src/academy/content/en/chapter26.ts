// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// BASIC chapter on reading crypto news critically: why crypto news is different,
// the common manipulation tactics, how to verify a claim, and which sources you
// can trust. Authored to the exact same shape as content/en/chapter01.ts, with
// the per-chapter `whoFor` one-liner typed via a local intersection so the live
// Chapter interface stays untouched until integration. New BASIC glossary terms
// introduced here (pump-and-dump, shilling, fake partnership) live in
// glossary.pending.ts, NOT in the live glossary, and are spelled verbatim in the
// prose so the first occurrence auto-links to a tooltip.
import type { Chapter } from "../../types";

export const chapter26: Chapter & { whoFor: string } = {
  id: "c26",
  number: 26,
  level: "BASIC",
  whoFor: "For anyone who reads crypto headlines and wonders what is real",
  title: "How to Read Crypto News Critically",
  description:
    "Why crypto news is different, the common manipulation tactics like pump-and-dumps and fake partnerships, how to verify a claim yourself, and which sources you can actually trust.",
  lessons: [
    {
      id: "c26-l1",
      title: "Why is news in crypto different from regular news?",
      paragraphs: [
        "In traditional news, a story usually passes through editors and reporters who are supposed to check facts before publishing. Crypto news is different because anyone with an account can post anything, instantly, to a huge audience. There is often no editor, no fact-check, and no one held responsible if the claim turns out to be false.",
        "On top of that, there is real money riding on the mood. When a token's price goes up, the people who already hold it get richer, so they have a strong reason to make everyone else excited. Many of the loudest voices online own the very thing they are talking about, and they rarely tell you that. Their goal may be to move a price, not to inform you.",
        "This does not mean every post is a lie. It means you should treat a crypto claim as an unverified tip from a stranger, not as a confirmed fact. The rest of this chapter shows you the common tricks and how to check things for yourself.",
      ],
      example:
        "Think of the difference between a newspaper article and a flyer taped to a lamppost. The newspaper has a name behind it and can be held to account; the flyer could have been printed by anyone, including someone who profits if you believe it. Most crypto news lives on the lamppost, so read it that way.",
    },
    {
      id: "c26-l2",
      title: "What are the most common misleading tactics?",
      paragraphs: [
        "The most damaging trick is the pump-and-dump. A group hypes a small, cheap token everywhere at once so its price shoots up. New buyers rush in on the excitement, and the original promoters quietly sell their coins into that demand. The price then collapses, leaving the latecomers holding tokens worth a fraction of what they paid.",
        "A close cousin is shilling. This is when someone promotes a token loudly while hiding that they own it and profit if others buy. The post looks like a friendly, unbiased tip, but the poster has a financial stake they never mention. If a stranger is unusually eager for you to buy something, ask what they get out of it.",
        "The third tactic is the fake partnership. This is a made-up or exaggerated claim that a token is tied to a famous company, used to borrow that company's trust. A screenshot or a vague We are working with a major bank can send a price soaring before anyone checks. Very often the big company has never heard of the token at all.",
      ],
      example:
        "Picture a pop-up stall in a busy square. A few actors in the crowd loudly announce that a plain bracelet is a rare collector's item and start bidding it up. Onlookers, not wanting to miss out, pay high prices. Then the actors and the seller pack up and vanish, and the bracelet is just a bracelet. That staged excitement is exactly how a pump-and-dump, shilling, and a fake partnership work together online.",
    },
    {
      id: "c26-l3",
      title: "How do you verify a claim about a token?",
      paragraphs: [
        "Start with the primary source. If a post says a token launched a new feature or signed a deal, look for the announcement on the project's own official website or verified account, not just the screenshot someone reshared. A claim that only exists as a forwarded image, with no original you can trace, is a warning sign.",
        "For a Stellar token, you can check the issuer's own metadata. Every serious issuer publishes a stellar.toml file, a small text file that lists who they are and how to reach them. Its absence is a red flag. Atrium's weekly, observe-only trustline suggestions already read this file and score tokens using on-chain data such as trade activity, order-book depth, and how many accounts hold a trustline, which is a measure of real adoption. You can review those scores yourself instead of trusting a hype post.",
        "Finally, if a claim names a partner, go and check with the partner. A real partnership will usually be confirmed on both sides. On-chain data is public, so you can also verify that a wallet or a transaction someone brags about actually exists. If the story only holds up in one place and nobody independent confirms it, treat it as unproven.",
      ],
      example:
        "Suppose a message says A famous exchange just added CoinX. Before you act, you open that exchange's own official site and search for CoinX. If it is not listed there, the claim fails a basic check, no matter how many people are repeating it. One minute of looking at the primary source beats an hour of scrolling through excited comments.",
    },
    {
      id: "c26-l4",
      title: "Which sources are reliable?",
      paragraphs: [
        "The most reliable source is the primary one: the project's official website, its verified accounts, and its stellar.toml file. After that come block explorers, public tools that let anyone look up real transactions and balances on the network. Because block explorers read straight from the blockchain, they show what actually happened, not what someone claims happened.",
        "Established news outlets that employ real journalists and correct their mistakes are more trustworthy than an anonymous account, though even good outlets can get crypto stories wrong, so cross-check anything that would make you move money. Be especially wary of accounts that are anonymous, brand new, or that only ever post reasons to buy. Loud confidence is not evidence.",
        "None of this is financial advice, and rules vary by country, so treat these as habits for thinking clearly rather than instructions on what to buy. The chapter on trading psychology explains why fear and excitement make us skip these checks exactly when we need them most.",
      ],
      example:
        "Treat a crypto claim the way a careful shopper treats an online review. A single glowing five-star review from a brand-new account tells you almost nothing. A pattern of detailed reviews across several independent, established sites, backed by a receipt you can verify, tells you a lot. Weight your trust toward the sources that can be checked and away from the loudest anonymous voice.",
    },
  ],
  quiz: [
    {
      id: "c26-q1",
      prompt: "Why should you treat a crypto claim posted online more cautiously than a story in an established newspaper?",
      options: [
        {
          text: "Because anyone can publish instantly with no editor or fact-check, and posters often profit if you believe them.",
          explanation:
            "Correct. Crypto posts usually skip the editing and accountability of traditional news, and many loud voices own the token they promote, so their goal may be to move a price rather than inform you.",
        },
        {
          text: "Because crypto news is always written by professional journalists who verify every fact.",
          explanation:
            "The opposite is true. Most crypto claims come from unaccountable accounts with no fact-checking, which is exactly why extra caution is needed.",
        },
        {
          text: "Because newspapers are never wrong and crypto sites always are.",
          explanation:
            "No. Both can be wrong. The real difference is accountability and incentives: a crypto poster often profits directly if you act on their claim.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c26-q2",
      prompt: "A tiny, cheap token is suddenly hyped everywhere, its price spikes, and then it crashes right after new buyers pile in. What is this pattern called?",
      options: [
        {
          text: "A stellar.toml file.",
          explanation:
            "No. A stellar.toml is issuer metadata that helps you verify who is behind a token; it is a checking tool, not a scam pattern.",
        },
        {
          text: "A block explorer.",
          explanation:
            "No. A block explorer is a public tool for looking up real transactions on the blockchain, not a manipulation scheme.",
        },
        {
          text: "A pump-and-dump.",
          explanation:
            "Correct. Promoters hype the token to push the price up, then sell into the new buyers and let it collapse, leaving latecomers with near-worthless tokens.",
        },
        {
          text: "A trustline.",
          explanation:
            "No. A trustline is the opt-in you add before holding a non-native token; it has nothing to do with the hype-and-crash pattern.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c26-q3",
      prompt: "A post claims a Stellar token just partnered with a famous bank. What is the best way to verify it?",
      options: [
        {
          text: "Buy quickly before the price rises further, since a big partnership is great news.",
          explanation:
            "No. Acting before checking is exactly the reflex a fake partnership relies on. Excitement is not evidence.",
        },
        {
          text: "Check the primary sources: the project's official announcement, the issuer's stellar.toml, on-chain data, and whether the named partner confirms it too.",
          explanation:
            "Correct. Real partnerships are usually confirmed by both sides, and on-chain data plus the issuer's stellar.toml let you verify the claim yourself instead of trusting a screenshot.",
        },
        {
          text: "Count how many people are reposting the claim and trust it if the number is high.",
          explanation:
            "No. Many people repeating an unverified claim does not make it true; it can simply mean the hype worked. Trace it back to a primary source instead.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
