// PENDING — do not activate until green light.
// Expert chapter on blockchain architecture: consensus and the double-spend
// problem, the Stellar Consensus Protocol as Federated Byzantine Agreement,
// nodes and quorum sets, the full life of a transaction through Horizon and
// ledger close, and the scalability trilemma. This chapter owns no new glossary
// terms; it reuses terms taught in earlier chapters. Authored to the exact same
// shape as content/en/chapter22.ts, with the per-chapter `whoFor` one-liner
// typed via a local intersection so the live Chapter interface stays untouched.
import type { Chapter } from "../../../types";

export const chapter33: Chapter & { whoFor: string } = {
  id: "c33",
  number: 33,
  level: "EXPERT",
  whoFor: "For the technically curious who want to know how Stellar really agrees on truth",
  title: "Blockchain Architecture — How It Really Works",
  description:
    "How a network of strangers agrees on one truth without a central referee: consensus and the double-spend problem, the Stellar Consensus Protocol, nodes and quorum sets, the life of a transaction, and the scalability trilemma.",
  lessons: [
    {
      id: "c33-l1",
      title: "What is consensus and how does a blockchain solve the double-spend problem?",
      paragraphs: [
        "Consensus is the process by which many independent computers, none of which trusts a central authority, agree on a single shared history: which transactions happened, in what order, and what the resulting balances are. Without agreement on order, a blockchain is just a pile of contradictory claims. The hard part is not storing data — it is getting thousands of self-interested strangers to converge on the same answer even when some of them are faulty or malicious.",
        "The classic threat is the double-spend. Digital money is just numbers, and numbers can be copied. If I hold 100 USDC and send all of it to Alice and all of it to Bob in two transactions broadcast at the same moment, both look valid in isolation. A trustworthy ledger must accept exactly one and reject the other so the same balance can never be spent twice. Consensus is precisely the mechanism that picks a canonical order, and once one spend is committed the other becomes invalid.",
        "Different networks solve this with different rules. Proof of Work (Bitcoin) makes writing history expensive: miners burn electricity racing to find a hash below a target, and the longest chain of accumulated work wins, so rewriting a spend means out-computing the entire network. Proof of Stake (modern Ethereum) replaces electricity with money at risk: validators lock up capital, are chosen to propose and attest blocks, and lose their stake if they sign conflicting histories. Both reach agreement eventually, probabilistically, and both let anyone join by spending the required resource.",
        "The Stellar Consensus Protocol (SCP) takes a third path. There is no mining and no staking. Instead of a single global rule that decides who may write, each participant declares which other participants it trusts, and the network converges through those overlapping circles of trust. That makes it fast and cheap, but it means security rests on the trust choices participants make rather than on burned energy or locked capital — a trade-off the later lessons unpack.",
      ],
      example:
        "Picture the double-spend concretely: a wallet with 100 USDC signs two path payments in the same second, one converting to XLM for Alice and one converting to yXLM for Bob, each spending the full 100. Both are individually well-formed. Consensus forces the network to serialise them: whichever transaction lands first in a closed ledger consumes the balance, and the second is rejected at apply time because the funds no longer exist. The ledger, not the sender, decides the order.",
    },
    {
      id: "c33-l2",
      title: "What is the Stellar Consensus Protocol and why is it different?",
      paragraphs: [
        "The Stellar Consensus Protocol is an implementation of Federated Byzantine Agreement (FBA). \"Byzantine\" means it tolerates nodes that are not just crashed but actively lying or misbehaving. \"Federated\" is the twist that sets it apart: there is no fixed, pre-agreed list of who the validators are. Each node freely chooses its own set of nodes to trust, and the global network membership emerges from the union of everyone's individual choices rather than being handed down by a central registry.",
        "The building block is the quorum slice. A quorum slice is a group of nodes that one particular node considers sufficient to convince it of a statement. A node will accept something as true once every node in one of its slices agrees. A quorum is a set of nodes that contains a slice for each of its members — a self-reinforcing group that can reach agreement internally. Crucially, nobody hands you a quorum; it arises from the way slices overlap. As long as honest nodes' slices intersect enough, the whole network is dragged toward a single decision, because there is no way for two disjoint groups to each satisfy their slices and commit conflicting values.",
        "Because there is no puzzle to solve and no stake to lock, SCP does not need a reward token to motivate block production, and it does not burn energy. A ledger closes when a quorum has confirmed the same set of transactions, which on Stellar takes roughly five seconds. That confirmation is final: unlike Proof of Work, where a block can be orphaned if a longer chain appears, an SCP-committed ledger will not be reversed. There is no \"wait for six confirmations\" — once it closes, it is done.",
        "The trade-off is honesty about what secures the network. Proof of Work and Proof of Stake buy security with an external, measurable resource. FBA buys it with trust configuration: the network is safe only if participants pick sensible, overlapping quorum sets and if enough of the important nodes are honest and reachable. Bad trust choices — for example, everyone leaning on the same handful of validators — can create fragility or, in the worst case, a network split. SCP moves the security question from \"how much did you spend?\" to \"whom did you choose to trust, and did those choices overlap?\"",
      ],
      example:
        "Think of a small town deciding whether a rumour is true. You personally will believe it once your doctor and your two most careful friends all say so — that trio is your quorum slice. Your neighbour has a different trio. But your doctor is in your neighbour's slice too, and their careful friend is in yours. Because the trusted circles overlap, the town cannot end up half believing one thing and half believing the opposite; the overlap forces one shared conclusion. SCP is that dynamic, run by servers instead of townsfolk.",
    },
    {
      id: "c33-l3",
      title: "What are nodes, validators, and quorum sets on Stellar?",
      paragraphs: [
        "A node is any computer running the Stellar Core software and participating in the network. Nodes gossip transactions to each other, keep a copy of the ledger, and apply state changes. Not every node votes: a watcher node tracks the ledger and serves data but stays out of consensus, while a validator is a node configured with a signing key that actively casts votes in SCP. Behind the app, Horizon — Stellar's HTTP API server — usually sits in front of a Core node, translating friendly REST and JSON into the low-level protocol the network speaks.",
        "Each validator publishes a quorum set: its explicit statement of which other validators it trusts and how many of them must agree before it accepts a value. A quorum set is not a flat list; it is typically a threshold structure, for example \"agree if any 3 of these 4 groups agree,\" and those groups can themselves be nested thresholds. This lets an operator say something nuanced like \"I trust the network if a majority of the major infrastructure providers plus at least one independent validator concur,\" encoding real-world trust relationships rather than a single global vote.",
        "Quorum slices are then derived from that quorum set: any combination of validators that satisfies the thresholds is a slice, a group sufficient to convince that validator. The network reaches agreement because validators choose their sets so that slices overlap — the overlap, known as quorum intersection, is what guarantees two honest validators cannot commit contradictory ledgers. If quorum sets were configured so that two groups shared no members, the network could fork; healthy Stellar configuration deliberately routes trust through a common core so intersection always holds.",
        "In practice the Stellar Development Foundation and a set of independent organisations run validators, and each publishes a stellar.toml file declaring its identity and validator keys. Operators reference each other through these published identities when building quorum sets, which is why transparent, verifiable node identity matters. A validator that hides its identity or is trusted by no one contributes nothing; the network's resilience comes from many well-known, honest operators whose overlapping trust choices leave no room for a split.",
      ],
      example:
        "Suppose the app's backend submits a transaction and needs to know it settled. Horizon forwards it to a Core node, which is a validator whose quorum set reads \"accept when at least 4 of these 6 named organisations agree, and one of those organisations must be the SDF tier.\" Any 4-of-6 combination that meets the rule is a valid slice. When such a slice confirms the ledger, this validator commits it — and because every other honest validator's set also routes through those same well-known organisations, they all commit the identical ledger.",
    },
    {
      id: "c33-l4",
      title: "How are transactions processed and added to a ledger?",
      paragraphs: [
        "A transaction begins in the client. The app builds a transaction object — a source account, a sequence number, a fee, and one or more operations such as a payment, a path payment, a manage-offer on the SDEX, or a change-trust that adds a trustline. It is then signed with the account's secret key, producing a signature that proves authorisation without revealing the key. Nothing has touched the network yet; this is all local construction and cryptography, and an unsigned or wrongly-sequenced transaction will simply be rejected.",
        "The signed transaction is submitted, in this app via Horizon's transaction endpoint. Horizon does basic validation, then hands it to its Stellar Core node, which broadcasts it across the peer-to-peer network by gossip. Each validator collects the transactions it has heard into a candidate transaction set for the next ledger. Fees and sequence numbers help order and deduplicate; if the network is congested, transactions bid via fees in a surge-pricing auction and the lower bids wait for a later ledger.",
        "Now SCP runs, in two phases. In nomination, validators propose candidate transaction sets and converge on one agreed set of transactions for this ledger. In the ballot protocol, they vote to commit that set, exchanging prepare and commit messages until a quorum confirms the same value. This is where Byzantine tolerance lives: even if some validators lie or fall silent, the overlap in quorum sets prevents two different sets from both being committed. The phase ends when a quorum has externalised one transaction set.",
        "The ledger then closes — roughly every five seconds. Core applies the agreed transactions in their canonical order, updates every affected account and offer and trustline, computes a new ledger hash that chains to the previous ledger, and the result is final and irreversible. Horizon ingests the closed ledger and only then does the app's submit call return success with the result. This is why a submitted trade is not \"done\" the instant you click: it is done when the ledger that contains it closes, and finality on Stellar is immediate at that moment rather than probabilistic over many later blocks.",
      ],
      example:
        "You place a market order to sell XLM for USDC in the Manual Trading tab. The app builds and signs a manage-offer operation and POSTs it to Horizon. Horizon relays it to Core, which gossips it out; validators fold it into the next candidate set, run nomination and the ballot protocol, and a quorum externalises that set. About five seconds later the ledger closes: your offer matches against the order book, the balances update atomically, a new ledger hash is written, and Horizon returns the fill to the app. The five-second wait you feel is one full consensus round.",
    },
    {
      id: "c33-l5",
      title: "What are the limits of a blockchain?",
      paragraphs: [
        "Every blockchain lives inside the scalability trilemma: the observation that it is very hard to maximise decentralisation, security, and scalability all at once, and that pushing hard on one usually costs you another. Decentralisation means many independent participants with no single point of control. Security means resistance to attack and to rewriting history. Scalability means high throughput and low cost per transaction. Real networks pick a balance rather than winning all three.",
        "The tensions are concrete. If you raise throughput by demanding beefier, more expensive validators, fewer people can afford to run one and decentralisation erodes. If you keep validation cheap so anyone can participate, per-node capacity caps your throughput. Proof of Work spends real energy to buy security and pays for it in speed and cost; large Proof of Stake systems concentrate influence in the largest stakeholders. There is no free lunch — every design is a chosen trade-off, not a solved problem.",
        "Stellar's choices place it deliberately toward fast, cheap, and reasonably decentralised, accepting a specific cost. SCP with FBA gives five-second finality and fees of a fraction of a cent, which is excellent scalability for payments and asset transfers. Security does not come from energy or stake but from the honesty and overlap of quorum sets, so Stellar's security is only as strong as its trust topology — a smaller, identity-based validator set is more efficient but leans on those operators behaving well and configuring intersecting quorums. It is a payments-first optimisation, not a general-purpose maximum-decentralisation stance.",
        "Blockchains also have limits that no consensus tweak removes. On-chain code is public and permanent, so bugs are costly and privacy is limited. Throughput is finite, so congestion raises fees. And the ledger only enforces its own rules — it cannot vouch for the real-world quality of an asset, which is why the app scores tokens off-chain using trade aggregations, order-book depth, and adoption rather than trusting mere on-chain presence. Newer layers like Soroban, Stellar's smart-contract platform, extend what the network can do but inherit the same trilemma trade-offs. None of this is investment, tax, or legal advice; it is architecture, and knowing where a chain sits on the trilemma tells you what it is good at and where to stay cautious.",
      ],
      example:
        "Compare two extremes. A single bank database is blazingly fast and cheap but fully centralised — the bank can freeze or reverse anything, so it fails the decentralisation and censorship-resistance test. Bitcoin is highly decentralised and secure but processes only a handful of transactions per second at times of high fees. Stellar sits between them: not as trust-minimised as Proof of Work, but settling a path payment across several markets in about five seconds for a fraction of a cent. Each design bought two corners of the triangle and paid at the third.",
    },
  ],
  quiz: [
    {
      id: "c33-q1",
      prompt: "What problem does blockchain consensus fundamentally exist to solve?",
      options: [
        {
          text: "Encrypting transactions so that no one can read who paid whom.",
          explanation:
            "Incorrect. Encryption and privacy are separate concerns; most public ledgers, including Stellar, are actually transparent. Consensus is about agreeing on order, not hiding data.",
        },
        {
          text: "Getting many untrusting, independent nodes to agree on a single ordered history so the same balance cannot be spent twice.",
          explanation:
            "Correct. Consensus produces one canonical order of transactions across mutually distrustful nodes, which is exactly what defeats the double-spend: only one of two conflicting spends can commit.",
        },
        {
          text: "Making transactions permanently free by removing all network fees.",
          explanation:
            "Incorrect. Fees exist precisely because block space is scarce and to deter spam; consensus does not aim to eliminate them and Stellar still charges a tiny fee per operation.",
        },
        {
          text: "Guaranteeing that the price of an asset only goes up.",
          explanation:
            "Incorrect. Consensus concerns the integrity and ordering of the ledger, not market prices, which no protocol controls.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c33-q2",
      prompt: "How does the Stellar Consensus Protocol reach agreement, compared with Proof of Work and Proof of Stake?",
      options: [
        {
          text: "It has validators solve energy-intensive hash puzzles, and the longest chain of work wins.",
          explanation:
            "Incorrect. That describes Proof of Work. SCP performs no mining and burns no energy.",
        },
        {
          text: "It requires validators to lock up capital that is slashed if they sign conflicting histories.",
          explanation:
            "Incorrect. That describes Proof of Stake. SCP has no staking and no slashable deposit.",
        },
        {
          text: "Each node chooses which others it trusts, and agreement emerges from overlapping quorum slices — no mining, no staking, with fast finality.",
          explanation:
            "Correct. SCP implements Federated Byzantine Agreement: security rests on the overlap of trust choices rather than on spent energy or locked stake, giving roughly five-second, irreversible finality.",
        },
        {
          text: "A central Stellar server signs every ledger and broadcasts it to the network.",
          explanation:
            "Incorrect. There is no central signer. Many independent validators reach agreement through their quorum sets; a single authority would defeat the point of consensus.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c33-q3",
      prompt: "What is a validator's quorum set, and why does overlap between quorum sets matter?",
      options: [
        {
          text: "It is the validator's explicit set of trusted nodes and thresholds; overlapping sets (quorum intersection) prevent two honest validators from committing conflicting ledgers.",
          explanation:
            "Correct. A quorum set encodes whom a validator trusts and how many must agree. Because honest validators route trust through common, well-known operators, their slices intersect, so the network cannot fork into two contradictory histories.",
        },
        {
          text: "It is the amount of XLM a validator must stake before it can vote.",
          explanation:
            "Incorrect. Stellar validators do not stake to vote; a quorum set is about trust relationships, not locked funds.",
        },
        {
          text: "It is a random group of nodes assigned by the network each ledger, so overlap is impossible.",
          explanation:
            "Incorrect. Quorum sets are chosen and published by each operator, not randomly assigned, and deliberate overlap is exactly what keeps the network safe.",
        },
        {
          text: "It is the list of tokens a validator is allowed to trade; overlap lets them share liquidity.",
          explanation:
            "Incorrect. Quorum sets concern consensus trust, not trading or liquidity. This confuses ledger agreement with market mechanics.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c33-q4",
      prompt: "In the life of a transaction on Stellar, what does it mean when the app's submit call finally returns success?",
      options: [
        {
          text: "Horizon received the transaction and is still deciding whether to broadcast it.",
          explanation:
            "Incorrect. Mere receipt by Horizon is not settlement; the transaction still has to be gossiped, agreed by consensus, and applied.",
        },
        {
          text: "A single validator accepted the transaction, though it may still be reversed by a longer chain.",
          explanation:
            "Incorrect. One validator is not enough, and Stellar has no longest-chain reversal like Proof of Work. Finality comes from a quorum externalising the ledger.",
        },
        {
          text: "A quorum externalised the transaction set, the ledger closed (about every five seconds), the operations were applied, and the result is final and irreversible.",
          explanation:
            "Correct. Success means the containing ledger has closed: SCP's nomination and ballot phases converged, Core applied the operations in canonical order, a new ledger hash was chained, and Horizon ingested the result. Finality on Stellar is immediate at ledger close.",
        },
        {
          text: "The transaction was written to the client's local database and will sync to the network overnight.",
          explanation:
            "Incorrect. There is no overnight batch sync; the transaction is broadcast and settled within a single roughly five-second consensus round.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c33-q5",
      prompt: "The scalability trilemma says a blockchain struggles to maximise all three of decentralisation, security, and scalability at once. Where does Stellar sit?",
      options: [
        {
          text: "It maximises all three simultaneously, having fully solved the trilemma.",
          explanation:
            "Incorrect. No production chain escapes the trilemma; claiming to solve it entirely is a red flag. Every design pays somewhere.",
        },
        {
          text: "It optimises for fast, cheap throughput and reasonable decentralisation, accepting that its security depends on honest, well-overlapping quorum sets rather than spent energy or stake.",
          explanation:
            "Correct. Stellar deliberately trades a smaller, identity-based validator set for five-second finality and sub-cent fees; its security is only as strong as its trust topology, which is a payments-first optimisation, not a maximum-decentralisation stance.",
        },
        {
          text: "It maximises decentralisation above all, running like Bitcoin with slow, expensive Proof of Work.",
          explanation:
            "Incorrect. Stellar uses SCP, not Proof of Work, and prioritises speed and low cost over Bitcoin-style trust-minimisation.",
        },
        {
          text: "It abandons security entirely to be as fast as possible.",
          explanation:
            "Incorrect. Stellar retains Byzantine-fault-tolerant security through quorum intersection; it shifts the basis of that security, it does not discard it.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
