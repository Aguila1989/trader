// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// Crypto and Taxes: a plain-language BASIC chapter on whether you must declare
// crypto, what counts as a taxable event, how to keep records with this app's
// Logs tab, and what MiCA means for you as an everyday user. Authored to the
// exact same shape as content/en/chapter22.ts, with the per-chapter `whoFor`
// one-liner typed via a local intersection so the live Chapter interface stays
// untouched until integration. New BASIC glossary terms introduced here
// (taxable event, MiCA, capital gains) live in glossary.pending.ts, NOT in the
// live glossary, and are spelled verbatim in the prose so the first occurrence
// auto-links to a tooltip. Educational only — not tax, legal, or financial advice.
import type { Chapter } from "../../../types";

export const chapter25: Chapter & { whoFor: string } = {
  id: "c25",
  number: 25,
  level: "BASIC",
  whoFor: "For traders who want to stay on the right side of the taxman",
  title: "Crypto and Taxes",
  description:
    "Whether you must declare crypto, what counts as a taxable event, how to keep clean records with this app, and what MiCA means for you as a user.",
  lessons: [
    {
      id: "c25-l1",
      title: "Do you have to declare crypto to the tax authorities?",
      paragraphs: [
        "In most countries the honest answer is yes. Tax authorities increasingly treat crypto like any other asset, so profits, income, and certain swaps can all need to be reported on your tax return. The exact rules differ a lot from one country to the next, and they change often, so this chapter is general education and not tax advice.",
        "What counts, when it counts, and how much you owe all depend on where you live. Some places tax every profit, some only tax gains above a threshold, and a few barely tax personal crypto at all. Because the details vary so much, the only safe habit is to check your own country's rules or ask a qualified accountant before you assume anything.",
        "The good news is that declaring crypto is usually straightforward once you keep decent records. The traders who get into trouble are rarely the ones who reported carefully; they are the ones who assumed nobody was watching and kept no history at all.",
      ],
      example:
        "Think of crypto the way you would think of a side income from renting out a spare room. You might feel it is small and private, but the tax office generally still wants to know about it. Ignoring it does not make it disappear; it just turns a simple form into a problem later. When in doubt, a short chat with an accountant costs far less than an unexpected tax bill.",
    },
    {
      id: "c25-l2",
      title: "What is a taxable event in crypto?",
      paragraphs: [
        "A taxable event is any moment the tax authorities may treat as taxable. In crypto the common ones are selling a token for regular money, swapping one token for another, and receiving crypto as payment for work or services. Each of these can create something to report, even the swap where no ordinary cash ever touches your bank account.",
        "Simply holding a token is usually not a taxable event. If you buy XLM or USDC and just keep it in your wallet, most tax systems leave you alone until you actually sell, swap, or spend it. The tax often applies to your capital gains — the profit between what you paid and what you got when you finally disposed of the asset.",
        "This is why a swap can surprise people. Trading one token for another feels like moving things around inside your own wallet, but many tax authorities see it as selling the first asset and buying the second, so a gain on the first token may count right there. Rules vary by country, so treat this as a reason to keep records, not as a final ruling for your situation.",
      ],
      example:
        "Imagine you bought a rare stamp for 50 USDC and later swapped it directly for a coin worth 90 USDC. You never received cash, yet you clearly parted with something worth more than you paid. Many tax systems see a crypto swap the same way: the 40 USDC of gain is real even though no money hit your account, and that moment is the taxable event.",
    },
    {
      id: "c25-l3",
      title: "How to keep track of your transactions for taxes",
      paragraphs: [
        "Good record-keeping is the whole game. For every trade you generally want the date, which tokens were involved, the amounts, the price at the time, and any network fee you paid. With that information your accountant, or your tax software, can work out your gains without guesswork. Trying to reconstruct it months later from memory is painful and error-prone.",
        "This app makes that easier than most. The Logs tab has a Trade History sub-tab that records your activity, and its CSV export button lets you download that history as a spreadsheet file you can hand to an accountant or import into tax tools. Exporting a clean CSV once a year, or even once a quarter, is one of the simplest habits you can build.",
        "Because tokens on Stellar can move across the SDEX order book and AMM liquidity pools, and because path payments hop across markets automatically, your trail can involve several small steps. Keeping the exported records lets you show exactly what happened without having to explain the plumbing.",
      ],
      example:
        "Picture a shoebox where you drop every receipt the moment you get it. At tax time you tip it out and everything is already there, dated and complete. The Logs tab is your shoebox: instead of scribbling trades on scraps of paper, you press CSV export and get a tidy, dated file of every transaction ready to hand over.",
    },
    {
      id: "c25-l4",
      title: "What is MiCA and what does it mean for you as a user?",
      paragraphs: [
        "MiCA stands for Markets in Crypto-Assets, the European Union's rulebook for crypto services and stablecoins. It is a law that sets common standards across EU countries so that crypto companies, especially those issuing stablecoins like USDC or running exchanges, have to follow clearer rules rather than operating in a grey zone.",
        "For you as an everyday user, MiCA mostly shows up as more consumer protection and more transparency. Companies covered by it face clearer requirements around how they operate, what they must disclose, and how they safeguard your funds. The aim is that the services you use are a little safer and a little less of a wild west, not that your personal trading gets more complicated.",
        "MiCA is about how crypto businesses are regulated, which is not quite the same thing as how your personal gains are taxed; those tax rules still come from your own country. This lesson keeps things light on purpose, and none of it is legal advice. If you want the deeper detail on regulation, the Expert-level Regulation chapter goes much further.",
      ],
      example:
        "Think of MiCA like the safety and labelling rules for food in a supermarket. You do not read the regulations yourself, but because they exist, the products on the shelf must meet basic standards and tell you what is inside. In the same way, MiCA works in the background so the crypto services you use have to meet common rules, giving you a bit more confidence in what you are buying.",
    },
  ],
  quiz: [
    {
      id: "c25-q1",
      prompt: "In most countries, do you generally need to declare your crypto activity to the tax authorities?",
      options: [
        {
          text: "No, crypto is completely private and no country ever asks about it.",
          explanation:
            "Not true. Most tax authorities now treat crypto like other assets and expect profits or income to be reported. Assuming nobody is watching is exactly how people get into trouble.",
        },
        {
          text: "Yes, in most countries, though the exact rules vary — so it is wise to check local rules or ask an accountant.",
          explanation:
            "Correct. Declaring crypto is usually required, but the specifics differ by country and change often, so checking your own rules or asking a qualified accountant is the safe habit.",
        },
        {
          text: "Only if you make more than a million in profit.",
          explanation:
            "No. Some countries do have thresholds, but they vary widely and are usually far lower than that. There is no single global cut-off, which is why you check your local rules.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c25-q2",
      prompt: "Which of these is most likely to count as a taxable event?",
      options: [
        {
          text: "Swapping one token for another, such as trading XLM for USDC.",
          explanation:
            "Correct. Many tax authorities treat a swap as selling the first asset and buying the second, so a gain on the first token can be taxed right at that moment, even though no ordinary cash was involved.",
        },
        {
          text: "Simply holding a token in your wallet without selling or swapping it.",
          explanation:
            "Usually not. Just holding is generally left alone until you actually sell, swap, or spend the asset. The tax typically applies when you dispose of it, not while you hold.",
        },
        {
          text: "Opening the app to look at a price graph.",
          explanation:
            "No. Looking at prices or charts moves no assets and creates nothing to report. A taxable event needs an actual disposal, payment, or income.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c25-q3",
      prompt: "What is the easiest way to get your transaction history out of this app for your tax records?",
      options: [
        {
          text: "Try to remember every trade at the end of the year.",
          explanation:
            "Reconstructing trades from memory is painful and error-prone. Dates, amounts, and prices are hard to recall accurately, which is exactly the mistake good record-keeping avoids.",
        },
        {
          text: "Take a screenshot of the price graph.",
          explanation:
            "A screenshot of a chart shows a price, not your actual trades. It has none of the dates, amounts, or fees an accountant needs to work out your gains.",
        },
        {
          text: "Use the Logs tab's Trade History sub-tab and its CSV export to download a dated file of your transactions.",
          explanation:
            "Correct. The Logs tab records your activity, and the CSV export gives you a tidy, dated spreadsheet you can hand to an accountant or import into tax tools — like tipping out a shoebox of receipts that is already sorted.",
        },
      ],
      correctIndex: 2,
    },
  ],
};
