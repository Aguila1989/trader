// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// EXPERT chapter on regulation, compliance and crypto's future: MiCA for
// European traders, FSMA and platform licensing, GDPR for platforms holding
// personal data, CBDCs, and where crypto (and Stellar) is heading. This chapter
// owns no new glossary terms; it reuses concepts taught in earlier chapters.
// Same shape as content/en/chapter22.ts, with the per-chapter `whoFor` one-liner
// typed via a local intersection so the live Chapter interface stays untouched.
import type { Chapter } from "../../../types";

export const chapter37: Chapter & { whoFor: string } = {
  id: "c37",
  number: 37,
  level: "EXPERT",
  whoFor: "For traders and builders eyeing crypto's regulated future",
  title: "Regulation, Compliance and the Future of Crypto",
  description:
    "How MiCA, FSMA licensing, and GDPR shape European crypto, how CBDCs differ from decentralized money and stablecoins, and where the market is heading, including Stellar's role.",
  lessons: [
    {
      id: "c37-l1",
      title: "What is MiCA and what does it mean concretely for European traders?",
      paragraphs: [
        "MiCA, the Markets in Crypto-Assets Regulation, is the European Union's single rulebook for crypto-assets that are not already covered by existing financial law. It replaces the patchwork of national regimes with one harmonised framework across all member states, so an issuer or service provider authorised in one country can passport that authorisation across the entire bloc. This is a deliberate design choice: instead of twenty-seven divergent rulebooks, there is one.",
        "MiCA sorts tokens into three buckets, and the bucket determines the rules. Asset-referenced tokens (ARTs) track a basket of assets or currencies. E-money tokens (EMTs) track a single official currency one-to-one, which is the category most fiat-backed stablecoins fall into, including a euro or dollar stablecoin. The residual bucket covers other crypto-assets such as utility tokens. Stablecoin issuers face the strictest treatment: they must hold fully-backed, segregated, liquid reserves, publish a whitepaper, and honour redemption at par on demand. Large stablecoins can even be capped on daily transaction volume when used purely as a means of payment.",
        "The service side is governed through CASP authorisation. A Crypto-Asset Service Provider is any firm that offers custody, operates a trading platform, exchanges crypto for fiat or other crypto, executes or places orders, or gives advice. To operate legally, a CASP must be authorised by a national competent authority and then meets ongoing obligations: capital requirements, safeguarding of client assets, clear complaint handling, conflict-of-interest disclosure, and market-abuse rules that prohibit insider dealing and manipulation. Consumer protection is a recurring theme, with mandatory risk warnings and a right to withdraw shortly after certain purchases.",
        "The rollout was phased. The stablecoin (ART and EMT) rules applied from mid-2024, and the broader CASP regime from the end of 2024, with transitional grandfathering windows that national regulators could shorten. For a trader, the concrete effect is that the exchanges and custodians you use should increasingly be MiCA-authorised, non-compliant euro stablecoins may be delisted for EU users, and the disclosures you receive become more standardised. None of this is investment or legal advice; it is context so you can read the labels correctly and choose regulated venues.",
      ],
      example:
        "A euro-pegged stablecoin sold to EU users is, under MiCA, an e-money token. Its issuer must keep the backing reserves fully segregated and redeemable at par, publish a whitepaper, and hold an EMI or credit-institution authorisation. If it cannot, EU platforms have to delist it for European customers. That is why some stablecoins quietly disappeared from certain EU exchange pairs in 2024, while a fully-backed, authorised alternative stayed listed.",
    },
    {
      id: "c37-l2",
      title: "What is FSMA and when do you need a licence to run a crypto platform?",
      paragraphs: [
        "The FSMA, the Financial Services and Markets Authority, is Belgium's financial-conduct regulator. Alongside the National Bank of Belgium, it supervises markets, protects consumers, and polices financial promotions. Under MiCA it is one of the national competent authorities that authorises and oversees Crypto-Asset Service Providers based in Belgium, and it already ran a national registration regime for exchange and custodial-wallet providers under anti-money-laundering law before MiCA took over.",
        "Whether you need a licence turns on what your platform actually does, not on what you call it. Running an order-book venue, holding customer keys or balances in custody, converting between crypto and fiat, or executing and routing orders on behalf of users are all regulated CASP activities. The moment a platform touches other people's money or assets, or matches their trades, it is very likely inside the perimeter and needs authorisation, plus anti-money-laundering controls: know-your-customer identity checks, transaction monitoring, and suspicious-activity reporting. Marketing crypto products to the public also triggers conduct rules on fair, clear, non-misleading communication.",
        "By contrast, purely non-custodial or informational tools sit closer to the edge of the perimeter, though the line is genuinely fuzzy and fact-specific. An app that never holds a user's keys, never matches orders, and only helps a person sign their own transactions against a public network is doing something different from an exchange that pools and custodies client funds. The Academy pages of a tool like this, for instance, are pure education and require no login at all, which is clearly outside any licensing trigger.",
        "For Atrium specifically, the architecture matters. Wallets are per-user and AES-256-GCM encrypted at rest, and the signing seam decrypts a key only at the moment of signing, so the design leans non-custodial in spirit. But if such a platform ever went public, took real customer funds, or matched trades between users, the analysis would change and professional legal advice would be essential. This lesson is general education, not legal advice; regulatory classification is a question for a qualified lawyer who can look at the specific facts.",
      ],
      example:
        "Consider two apps. App A holds every customer's private keys on its own servers, pools deposits, and matches buy and sell orders in its own order book. That is custody plus a trading venue, squarely a CASP that needs FSMA authorisation and full AML controls. App B only ever helps a user sign their own Stellar transaction with a key that stays under the user's control and is decrypted just long enough to sign, matching nothing between users. App B is far closer to a non-custodial tool, though the exact classification still depends on the concrete facts and should be checked with a lawyer.",
    },
    {
      id: "c37-l3",
      title: "What is GDPR and how does it apply to crypto platforms that store personal data?",
      paragraphs: [
        "The GDPR, the EU General Data Protection Regulation, governs how organisations collect, use, and store personal data about identifiable people. A crypto platform is squarely in scope the moment it stores an email address, a login, an IP log, or a name, because all of those identify a person. Being on a blockchain does not exempt you: the off-chain account layer, where a platform links a real identity to activity, is ordinary personal data under ordinary rules.",
        "The regulation runs on a few core principles. Every use of personal data needs a lawful basis, such as performing a contract with the user, a legitimate interest, a legal obligation like AML record-keeping, or freely-given consent. Data minimisation says you collect only what you actually need. Purpose limitation says you use it only for the reason you collected it. Storage limitation says you do not keep it forever. On top of these, individuals hold rights: access to their data, rectification of errors, erasure in defined circumstances, portability, and objection. Platforms also carry duties, most sharply the obligation to report a qualifying personal-data breach to the regulator without undue delay, generally within seventy-two hours.",
        "Crypto introduces a genuine tension, because a public ledger is designed to be immutable and append-only, while GDPR grants a right to erasure and a right to rectification. You cannot delete or edit a confirmed on-chain transaction. The accepted engineering answer is to keep personal data off-chain and put only pseudonymous, non-identifying references on-chain. A Stellar public key is a pseudonym, not a name, so it is not by itself directly identifying, but the moment your database links that key to an email it becomes personal data on the account side that you can and must manage under GDPR.",
        "Concretely, this shapes how a platform is built. Store emails, password hashes, and account records in an off-chain database you fully control, so you can honour access, rectification, and erasure requests there. Never write a raw identity onto the ledger. Encrypt sensitive material at rest, minimise what you log, and set retention windows. Atrium's account model fits this shape, with a per-user encrypted wallet and account data held in the platform's own store rather than on-chain. As always, this is general education, not legal advice, and a real compliance programme should be reviewed by a data-protection professional.",
      ],
      example:
        "A user asks a platform to delete their account. The platform can erase their email, password hash, and profile from its own off-chain database and stop processing them, satisfying the erasure request for the identity data it controls. What it cannot do is rewrite the user's past Stellar transactions, which are permanently on the public ledger. This is exactly why a well-designed platform keeps the identifying data off-chain and only ever exposes a pseudonymous public key on-chain, so a deletion request is technically possible in the first place.",
    },
    {
      id: "c37-l4",
      title: "What are CBDCs and how do they relate to crypto?",
      paragraphs: [
        "A CBDC, a Central Bank Digital Currency, is digital money issued directly by a central bank. It is a digital form of sovereign currency, a direct liability of the state, in the same way physical cash is, just in electronic form. Many central banks are researching or piloting them, with the digital euro being the most relevant example for European users, alongside live or advanced projects elsewhere. The stated motivations range from modernising payments and preserving public money in a cashless economy to maintaining monetary sovereignty as private digital money grows.",
        "It is important to see how a CBDC differs from the crypto most traders know. Decentralized crypto-assets like Bitcoin or Stellar's native XLM run on permissionless networks with no central issuer, and their supply and rules are set by protocol and consensus rather than by a state. A CBDC is the opposite: centralised, permissioned, issued and controlled by the central bank, and typically not something whose supply the market discovers. The technology may look superficially similar, and a CBDC might even use a distributed ledger internally, but the trust model is inverted. One removes a central authority; the other digitises it.",
        "CBDCs also differ from stablecoins, even though both aim to be stable in value. A fiat-backed stablecoin such as a regulated USDC-style token is issued by a private company and backed by reserves the issuer holds; its stability depends on that issuer honouring redemption and on the quality of the reserves. A CBDC is the money itself, a claim on the central bank rather than on a private firm, so it carries no issuer credit risk in the way a private stablecoin does. Under MiCA, a private euro stablecoin is a regulated e-money token; a digital euro would instead be public money governed by its own dedicated legal framework.",
        "For a Stellar-based trader the practical picture is speculative but worth understanding. Stellar was built as a payments and asset-issuance network, and in principle a CBDC or a tokenized deposit could be issued as an asset on such a network, coexisting with private stablecoins and decentralized assets. If that happens, you might one day hold a public digital-currency token and a private stablecoin in the same wallet, subject to a trustline and the usual reserve. This is forward-looking context rather than a prediction, and certainly not financial advice.",
      ],
      example:
        "Think of three euros in three forms. A banknote in your pocket is public money, a direct claim on the central bank. A euro-denominated stablecoin is private money, a claim on the company that issued it and on the reserves backing it. A digital euro CBDC would be the banknote's electronic twin, still a direct claim on the central bank but usable digitally. All three can say one euro, yet who owes you that euro, and therefore what risk you carry, is completely different in each case.",
    },
    {
      id: "c37-l5",
      title: "Where is crypto heading?",
      paragraphs: [
        "Two forces dominate the credible forward view: real-world-asset tokenization and institutional adoption. RWA tokenization means representing off-chain assets such as government bonds, money-market funds, real estate, or invoices as transferable tokens on a blockchain. The appeal is programmable settlement, fractional ownership, and near-instant transfer with a clear audit trail, replacing slow, siloed back-office processes. Institutional adoption is the other half: regulated funds, banks, and payment firms moving from experiments to production, encouraged precisely by frameworks like MiCA that give them legal certainty. Regulation and adoption reinforce each other here rather than pulling apart.",
        "Stellar is unusually well positioned for this particular direction, because it was purpose-built for payments and asset issuance rather than as a general-purpose world computer. Issuing an asset on Stellar is a first-class, low-cost operation; trustlines give issuers and holders explicit opt-in control; and path payments settle a conversion across markets atomically, hopping through the SDEX order book and AMM pools to deliver the destination asset in a single transaction. Fees are tiny, on the order of a fraction of a cent, and settlement is measured in seconds under the Stellar Consensus Protocol, an implementation of Federated Byzantine Agreement where nodes trust quorum sets rather than mine. For moving a tokenized dollar or bond, those are exactly the properties that matter.",
        "The newer piece is Soroban, Stellar's smart-contract platform, which adds programmable logic to that payments-and-assets base. Soroban makes possible on-chain protocols for lending, structured yield, and swaps, and real projects already build there: Blend for lending markets, DeFindex for tokenized strategy vaults, and Soroswap as an on-chain exchange and aggregator. Combined with native stablecoins like USDC and the ability to represent RWAs as assets, this points toward Stellar acting as settlement plumbing where regulated tokenized value and DeFi composability meet, rather than as a purely speculative playground.",
        "None of this is guaranteed, and honest analysis stays grounded. Tokenization has been over-promised before, regulatory timelines slip, and adoption can stall. The realistic reading is directional rather than certain: more regulated on-ramps, more tokenized traditional assets, more institutional flow, and networks optimised for payments and issuance, Stellar prominently among them, competing to be the rails. For a trader, the takeaway is to keep learning the mechanics, use regulated and well-understood venues, and treat any single forecast, including this one, as context rather than a promise. This is education, not financial advice.",
      ],
      example:
        "Picture a tokenized short-term treasury fund issued as a Stellar asset. An institution holds it against a USDC balance in the same wallet, each behind its own trustline. When it needs cash, a path payment atomically converts a slice of the tokenized fund into USDC by routing through the SDEX and AMM pools, settling in seconds for a fraction of a cent, while a Soroban contract could automatically sweep any idle USDC into a Blend lending market for yield. That single flow, regulated tokenized asset plus stablecoin plus programmable settlement, is the concrete shape of where much of this is heading.",
    },
  ],
  quiz: [
    {
      id: "c37-q1",
      prompt: "Under MiCA, how is a fiat-backed euro stablecoin sold to EU users generally classified, and what does that trigger?",
      options: [
        {
          text: "As an e-money token (EMT), so the issuer must hold fully-backed, segregated reserves and honour redemption at par.",
          explanation:
            "Correct. A token that references a single official currency one-to-one falls in MiCA's EMT bucket, which is the strictest treatment: full backing, segregated liquid reserves, a whitepaper, and par redemption on demand. Non-compliant euro stablecoins can be delisted for EU users.",
        },
        {
          text: "As a utility token, so it is exempt from any reserve or authorisation requirements.",
          explanation:
            "Wrong. Utility tokens are the residual 'other crypto-assets' bucket. A currency-pegged stablecoin is specifically not a utility token, and it faces MiCA's most demanding stablecoin obligations, not an exemption.",
        },
        {
          text: "As a security under existing MiFID rules, so MiCA does not apply to it at all.",
          explanation:
            "Wrong. MiCA governs crypto-assets that are not already covered by existing financial law; a fiat-referenced stablecoin is handled inside MiCA as an EMT, not carved out as a MiFID security.",
        },
        {
          text: "As an asset-referenced token (ART), because every stablecoin tracks a basket of assets.",
          explanation:
            "Wrong. ARTs reference a basket of assets or currencies. A stablecoin pegged one-to-one to a single official currency is an EMT, not an ART.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c37-q2",
      prompt: "A Belgian platform holds every customer's private keys, pools deposits, and matches buy and sell orders in its own order book. What is the most accurate regulatory read?",
      options: [
        {
          text: "No licence is needed because crypto is unregulated in Belgium.",
          explanation:
            "Wrong. Crypto services are regulated: the FSMA authorises and supervises CASPs under MiCA, and AML rules already applied to custodial and exchange providers before that.",
        },
        {
          text: "It is providing custody and operating a trading venue, so it is very likely a CASP needing FSMA authorisation plus AML controls.",
          explanation:
            "Correct. Holding client keys is custody and matching client orders is running a trading platform. Both are regulated CASP activities, so the platform very likely needs authorisation from the FSMA plus know-your-customer and transaction-monitoring controls.",
        },
        {
          text: "It only needs a licence if it also gives investment advice; custody and matching orders are unregulated.",
          explanation:
            "Wrong. Custody and operating a trading platform are each independently regulated CASP activities. Advice is one more regulated activity, not the only trigger.",
        },
        {
          text: "It is automatically outside the perimeter because everything settles on a public blockchain.",
          explanation:
            "Wrong. What matters is what the platform does, not where settlement happens. Pooling deposits, holding keys, and matching orders put it squarely inside the licensing perimeter regardless of the underlying ledger.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c37-q3",
      prompt: "How should a GDPR-compliant crypto platform reconcile the right to erasure with an immutable public ledger?",
      options: [
        {
          text: "By rewriting or deleting the user's past on-chain transactions when erasure is requested.",
          explanation:
            "Wrong. Confirmed on-chain transactions are immutable and cannot be deleted or rewritten; that is the whole design of a public ledger. The solution has to live off-chain.",
        },
        {
          text: "By ignoring GDPR entirely, since blockchains are exempt from data-protection law.",
          explanation:
            "Wrong. There is no blockchain exemption. The off-chain account layer that links an identity to activity, such as an email tied to a public key, is ordinary personal data under ordinary rules.",
        },
        {
          text: "By keeping identifying data off-chain in a controlled database and putting only pseudonymous references on-chain, so erasure can be honoured off-chain.",
          explanation:
            "Correct. A public key is a pseudonym, not a name. Keeping emails, hashes, and profiles off-chain lets the platform delete or rectify the identity data it controls, while the ledger holds only non-identifying references that were never a raw identity in the first place.",
        },
        {
          text: "By encrypting the whole blockchain so the data can be considered deleted once the key is thrown away.",
          explanation:
            "Wrong. You cannot encrypt a public, shared ledger you do not control, and 'crypto-shredding' a network-wide chain is not how it works. The accepted answer is to keep personal data off-chain from the start.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c37-q4",
      prompt: "What is the fundamental difference between a CBDC and a private fiat-backed stablecoin?",
      options: [
        {
          text: "There is no difference; both are just digital euros or dollars.",
          explanation:
            "Wrong. They may both target a stable value, but who owes you the money differs completely, and that difference is the whole point.",
        },
        {
          text: "A CBDC is a direct claim on the central bank (public money), while a stablecoin is a claim on a private issuer and its reserves.",
          explanation:
            "Correct. A CBDC is sovereign money issued by the central bank, carrying no private-issuer credit risk. A stablecoin is issued by a company and depends on that issuer honouring redemption and holding good reserves; under MiCA it is a regulated e-money token, whereas a digital euro would be public money under its own framework.",
        },
        {
          text: "A CBDC is decentralized and permissionless, while a stablecoin is centrally issued.",
          explanation:
            "Wrong, and reversed. A CBDC is centralised and permissioned, issued and controlled by the central bank. It is decentralized assets like Bitcoin or XLM that are permissionless, not the CBDC.",
        },
        {
          text: "A stablecoin can never be regulated, while a CBDC is always regulated.",
          explanation:
            "Wrong. Fiat-backed stablecoins are regulated under MiCA as e-money tokens. The real distinction is the issuer and the nature of the claim, not whether regulation exists.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c37-q5",
      prompt: "Why is Stellar often cited as well positioned for real-world-asset tokenization and payments?",
      options: [
        {
          text: "Because it was purpose-built for payments and asset issuance, with cheap first-class asset issuance, trustlines, atomic path payments, and fast SCP settlement.",
          explanation:
            "Correct. Stellar issues assets as a first-class, low-cost operation, uses trustlines for explicit opt-in control, settles conversions atomically via path payments across the SDEX and AMM pools, and finalises in seconds under the Stellar Consensus Protocol. Soroban then adds programmable logic. Those are exactly the properties tokenized value needs.",
        },
        {
          text: "Because Stellar mines new blocks faster than any other proof-of-work chain, giving it the highest security.",
          explanation:
            "Wrong. Stellar does not mine at all. It uses the Stellar Consensus Protocol, a Federated Byzantine Agreement where nodes trust quorum sets, not proof-of-work.",
        },
        {
          text: "Because Stellar has no fees and no reserves, so tokenized assets are completely free to hold and move.",
          explanation:
            "Wrong. Fees are tiny, on the order of a fraction of a cent, but not zero, and every account keeps a small XLM minimum reserve, with roughly half an XLM more per trustline. 'Cheap' is accurate; 'free' is not.",
        },
        {
          text: "Because Soroban lets Stellar run any general-purpose application, making payments and issuance irrelevant.",
          explanation:
            "Wrong. Soroban adds smart contracts on top of Stellar's payments-and-issuance base, and real projects like Blend, DeFindex, and Soroswap build there, but it complements the asset rails rather than making them irrelevant. The payments focus is precisely the strength.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
