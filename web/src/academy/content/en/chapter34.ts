// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// EXPERT chapter on smart contracts and Soroban, Stellar's Rust/WASM
// smart-contract platform: what a contract is, how it differs from a classic
// operation, its risks, and DeFi composability via Blend, DeFindex and
// Soroswap. Authored to the exact same shape as content/en/chapter22.ts, with
// the per-chapter `whoFor` one-liner typed via a local intersection so the live
// Chapter interface stays untouched until integration. This chapter owns no new
// glossary terms; it reuses terms taught in earlier chapters.
import type { Chapter } from "../../types";

export const chapter34: Chapter & { whoFor: string } = {
  id: "c34",
  number: 34,
  level: "EXPERT",
  whoFor: "For traders exploring Stellar's programmable, on-chain frontier",
  title: "Smart Contracts and Soroban on Stellar",
  description:
    "What a smart contract is, what Soroban changes for Stellar, how it differs from a plain transaction, its risks, and how it composes into DeFi via Blend, DeFindex and Soroswap.",
  lessons: [
    {
      id: "c34-l1",
      title: "What is a smart contract?",
      paragraphs: [
        "The cleanest mental model for a smart contract is a vending machine. You put a coin in the slot, press the button for the drink you want, and the machine hands it over — automatically, with no cashier, and only if your payment satisfies the price. It cannot be talked into giving you a free drink, and it cannot decide to keep your money and hand over nothing. The rules are baked into the machine, and they execute the same way every single time the conditions are met.",
        "A smart contract is that vending machine written as code and deployed onto a blockchain. Technically it is a program, stored on-chain, whose logic runs deterministically on every validating node. Deterministic means the same inputs always produce the same outputs and the same state changes, no matter which computer runs it — a hard requirement, because thousands of independent validators must reach identical results to agree on the ledger. When you invoke a contract, you are not asking a person to act; you are triggering agreed-upon code that enforces its own conditions and settles the outcome directly on the ledger.",
        "Two properties make this powerful for a trader. First, the code is public and its behaviour is verifiable: anyone can read what a contract will do before they interact with it. Second, once conditions are met, execution is guaranteed and cannot be selectively reversed by a counterparty — there is no clerk who can change their mind. That is the promise behind decentralised finance: financial agreements that run themselves, transparently, without a trusted middleman holding your funds.",
        "The flip side is that a smart contract does exactly what its code says — no more, no less. It has no judgement and no goodwill. If the code has a flaw, the flaw executes just as faithfully as the intended logic. This is why reading, auditing, and understanding a contract matters far more than trusting a brand or a friendly interface.",
      ],
      example:
        "A simple escrow contract encodes: \"If wallet A sends 100 USDC and wallet B delivers the agreed asset before block time T, release the USDC to B; otherwise refund A after T.\" No escrow agent holds the money. The contract locks the funds, watches the condition, and settles automatically — the vending-machine logic, applied to a trade instead of a soft drink.",
    },
    {
      id: "c34-l2",
      title: "What is Soroban and what does it change for Stellar?",
      paragraphs: [
        "For most of its history, Stellar was intentionally not programmable in the general sense. It shipped a fixed menu of built-in operations — payments, offers on the SDEX, trustlines, path payments — that are fast, cheap, and predictable, but you could only combine the operations Stellar already provided. You could not write your own on-chain logic. Soroban is what changes that. It is Stellar's smart-contract platform: a runtime that lets developers deploy arbitrary programs to the network alongside the classic operations you already use in Atrium.",
        "Under the hood, Soroban contracts are written in Rust and compiled to WebAssembly (WASM). WASM is a compact, portable bytecode format that runs inside a tightly sandboxed virtual machine, so a contract cannot reach outside its allowed boundaries and touch the rest of the system. Rust was chosen for its strong safety guarantees and its mature WASM tooling; the combination gives the network a way to execute untrusted third-party code without letting that code destabilise the ledger. Contracts are metered so that every computational step and every byte of storage has a cost, which is what keeps execution bounded and denial-of-service attacks expensive.",
        "What Soroban adds is programmability beyond the classic menu: lending markets, automated vaults, custom AMMs, options, and other logic that simply had no representation in Stellar's built-in operations. Crucially, Soroban was designed to coexist with the existing account model and assets. A Soroban contract can hold and move the same USDC and XLM you already trade, so the fast, cheap classic payment rails and the new programmable layer live on one ledger rather than in two disconnected worlds.",
        "For you as a trader, the practical shift is that Stellar becomes a place where DeFi protocols can be built, not just a fast settlement network. That opens genuinely new capabilities — earning yield, borrowing against collateral, routing swaps through programmable pools. It also enlarges the risk surface, because interacting with a Soroban protocol means trusting third-party code, not just Stellar's battle-tested core operations. The next lessons unpack exactly that difference.",
      ],
      example:
        "A classic Stellar swap uses the built-in path-payment operation to hop across the SDEX and AMM pools that Stellar itself provides — you cannot alter how that routing works. A Soroswap swap, by contrast, calls a Soroban contract: developer-written WASM code that implements its own pool math and fee logic. Same underlying USDC and XLM, but the second one runs on programmable code deployed to the network rather than on a fixed built-in operation.",
    },
    {
      id: "c34-l3",
      title: "How does a smart contract differ from a regular transaction?",
      paragraphs: [
        "A regular Stellar transaction is a bundle of built-in operations chosen from a fixed set: a payment, a manage-offer on the SDEX, a change-trust to add a trustline, a path payment. Each operation has predefined semantics that Stellar's core enforces identically for everyone. You are selecting from a menu the network already understands, and validators know in advance exactly what each operation can and cannot do. This predictability is why classic operations are cheap, fast, and extremely well understood.",
        "Invoking a smart contract is fundamentally different: instead of picking a known operation, you are calling arbitrary logic that a developer wrote and deployed. That logic can maintain its own persistent state on-chain — balances, positions, configuration, price data — and read and mutate that state as part of the call. A classic payment simply moves value between two accounts; a contract invocation can run loops, branch on conditions, update its own storage, and even call into other contracts, all within one atomic transaction that either fully succeeds or fully reverts.",
        "Both worlds share the same non-negotiable property: determinism. Whether you send a plain payment or invoke a complex vault, every validator must reach the identical result, because Stellar's consensus — SCP, the Stellar Consensus Protocol, a Federated Byzantine Agreement built on quorum sets — requires nodes to agree byte-for-byte on the new ledger. Contracts therefore cannot do non-deterministic things like read a random number from the operating system or make a live network request; any external data has to be supplied as an explicit input.",
        "Two Soroban-specific mechanics matter here. First, fees: a classic operation costs a tiny, near-flat network fee (fractions of a cent in XLM), whereas a contract call is metered by the resources it consumes — CPU instructions, memory, and storage — so a heavy invocation costs more than a light one. Second, the footprint: a Soroban transaction must declare in advance exactly which pieces of ledger state (which storage keys) it will read and write. This explicit footprint lets validators fetch and lock only the relevant state and execute contracts in parallel safely, but it also means a call that touches unexpected state will fail rather than silently sprawl.",
      ],
      example:
        "Selling XLM for USDC in the Manual Trading tab typically submits a classic manage-offer or path-payment operation: one known operation, a flat tiny fee, no custom state. Depositing that same USDC into a Blend lending pool invokes a Soroban contract: it updates the pool's stored balances, accrues interest against its own state, must declare the storage entries it will touch as its footprint, and is charged a resource-metered fee. Same asset, two very different execution models.",
    },
    {
      id: "c34-l4",
      title: "What are the risks of smart contracts?",
      paragraphs: [
        "The defining risk of smart contracts follows directly from their greatest strength. Because the code executes deterministically and settlement is final, a bug executes with the same certainty as correct logic. There is no support desk to reverse a mistaken transfer and no chargeback. \"Code is law\" cuts both ways: the contract will honour a fair agreement without a middleman, and it will just as faithfully honour a hidden backdoor or an arithmetic error that drains it.",
        "The threats cluster into a few categories. Bugs are honest mistakes — a mishandled edge case, a rounding error, a flawed price calculation — that an attacker can exploit to withdraw more than they should. Exploits are deliberate attacks that chain small weaknesses into a large loss; because contracts are composable and call one another, a flaw in one protocol can cascade into others that trust it. Rug pulls are malicious by design: the contract contains privileged functions — an owner key that can pause withdrawals, mint unlimited tokens, or drain the pool — so the \"trustless\" facade hides a switch the creator can pull at any time. This is where the AI trustline scanning you may have read about elsewhere in the Academy is relevant: a missing stellar.toml or thin, unverifiable issuer metadata is a red flag for the asset layer, and the same skepticism applies to the contracts an asset's ecosystem relies on.",
        "The real defences are permissions and audits. Read who controls the contract: is ownership renounced or held by a single key? Can any privileged function move your funds, and is that power behind a timelock or a multisignature setup rather than one person's wallet? A professional security audit — an independent review of the code by specialists — reduces but never eliminates risk; unaudited code deserves deep suspicion, and even audited code has failed. Prefer contracts whose source is verified against the deployed WASM, so the code you read is provably the code that runs.",
        "Practically, treat every smart-contract interaction as counterparty risk in a new form. Size positions so a total loss of a given protocol would not be catastrophic, favour established contracts with a long unexploited track record and real value locked over time, and understand that yield which looks far above the market is usually compensation for risk you have not fully identified. None of this is financial advice — it is the same discipline a careful trader already applies, extended to the fact that here your counterparty is autonomous code.",
      ],
      example:
        "A vault contract advertises high yield and thousands of users deposit USDC. Buried in its code is an owner-only \"emergency withdraw\" function with no timelock. One day the deployer calls it and sweeps every deposit to their own wallet in a single, irreversible, perfectly valid transaction. Nothing was hacked — the contract did exactly what its code always allowed. Reading the permissions before depositing would have exposed that single point of failure.",
    },
    {
      id: "c34-l5",
      title: "How does composability on Stellar expand DeFi possibilities?",
      paragraphs: [
        "Composability is the property that on-chain protocols can call each other and stack like building blocks, because they share the same ledger, the same assets, and public interfaces. A contract can hold a position in a second contract, which in turn routes through a third — all within one atomic transaction that either fully completes or fully reverts. This is why DeFi is often described as \"money legos\": each protocol is a piece, and developers assemble pieces into behaviour none of them provides alone. On Soroban, the same USDC and XLM flow freely between contracts, so the pieces genuinely interlock rather than living in isolated silos.",
        "Soroswap is the AMM and DEX layer — the base swap primitive. It implements liquidity pools and, importantly, aggregation and routing across venues, so a trade can be split and hopped to find the best execution. Because it exposes a clean swap interface, other contracts can call Soroswap to convert one asset into another mid-transaction rather than forcing a user to swap manually first. It is the piece that answers \"turn asset X into asset Y right now, on-chain.\"",
        "Blend is the lending and borrowing layer. It runs isolated lending pools where suppliers deposit assets to earn interest and borrowers post collateral to take loans, with interest rates driven algorithmically by pool utilisation. Blend composes with a swap layer in a very concrete way: liquidations. When a borrower's collateral falls below the required ratio, a liquidator must repay the debt and seize the collateral — and it can source or offload the needed assets through a DEX like Soroswap inside the same flow. Lending on its own is useful; lending that can atomically reach a swap venue is robust.",
        "DeFindex is the strategy and vault layer that sits on top. A vault is a contract that accepts your deposit and then executes an automated strategy across the underlying protocols — for example, supplying to a Blend pool for yield and rebalancing through Soroswap — so a user gets a single, simple deposit-and-earn interface while the complexity runs beneath. This is composability made visible: DeFindex builds on Blend, Blend leans on a DEX for liquidations, and the DEX (Soroswap) is itself just another block. The upside is enormous flexibility and capital efficiency; the sober counterpoint is that stacked dependencies stack risk, because a failure in any lower block can propagate up through everything built on it — which is exactly why the audit-and-permissions discipline from the previous lesson matters most where protocols compose. None of this is financial, tax, or legal advice; DeFi yields and their tax treatment vary by jurisdiction.",
      ],
      example:
        "You deposit USDC into a DeFindex vault and receive a vault share token. Under the hood, the vault supplies your USDC to a Blend lending pool to earn interest; if part of the strategy needs a different asset, it routes the conversion through Soroswap — all automatically. Three independent protocols cooperate in one deposit, and you interact with just one simple button. That stack is composability, and its convenience rides on trusting every layer beneath it.",
    },
  ],
  quiz: [
    {
      id: "c34-q1",
      prompt: "The vending-machine analogy captures which essential property of a smart contract?",
      options: [
        {
          text: "It automatically enforces its rules and settles the outcome when the conditions are met, with no middleman able to override it.",
          explanation:
            "Correct. Like a vending machine that dispenses only when paid, a contract runs its agreed logic deterministically on-chain and settles directly on the ledger — no clerk can decide to keep your money or hand out a free drink.",
        },
        {
          text: "A trusted operator reviews each interaction and manually approves or reverses it.",
          explanation:
            "Wrong, and the opposite of the point. The whole idea is that no operator sits in the middle; the code itself enforces the conditions without human approval or reversal.",
        },
        {
          text: "Its behaviour changes depending on which node runs it, so results vary between validators.",
          explanation:
            "Wrong. Contracts must be deterministic — identical inputs produce identical results on every node — precisely so all validators can agree on the ledger. A vending machine gives the same output for the same coins every time.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c34-q2",
      prompt: "What does Soroban add to Stellar, technically?",
      options: [
        {
          text: "It replaces XLM with a new native token and shuts down the classic payment operations.",
          explanation:
            "Wrong. Soroban does not replace XLM or remove classic operations; it was designed to coexist with them, and contracts move the very same XLM and USDC you already trade.",
        },
        {
          text: "A runtime for arbitrary smart contracts written in Rust and compiled to sandboxed WASM, adding programmability beyond Stellar's fixed built-in operations.",
          explanation:
            "Correct. Soroban is Stellar's smart-contract platform: Rust source compiled to metered, sandboxed WebAssembly, letting developers deploy custom on-chain logic alongside the classic operation menu.",
        },
        {
          text: "A faster consensus algorithm that replaces SCP with proof-of-work mining.",
          explanation:
            "Wrong on two counts. Soroban is a contract platform, not a consensus change, and Stellar's consensus remains SCP (a Federated Byzantine Agreement), not proof-of-work.",
        },
        {
          text: "A centralised server run by the Stellar foundation that executes off-chain scripts for users.",
          explanation:
            "Wrong. Soroban contracts execute on-chain on every validating node in a decentralised, deterministic way — not on a single central server running off-chain scripts.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c34-q3",
      prompt: "Which statement best distinguishes invoking a Soroban contract from submitting a classic operation like a payment?",
      options: [
        {
          text: "Classic operations are non-deterministic while contract calls are deterministic.",
          explanation:
            "Wrong. Both are strictly deterministic — SCP requires every validator to reach identical results either way. Determinism is a shared requirement, not a difference.",
        },
        {
          text: "A classic payment can call other contracts and loop over its own storage, while a contract cannot.",
          explanation:
            "Backwards. It is the contract invocation that can branch, loop, mutate its own storage, and call other contracts; a classic payment simply moves value between two accounts.",
        },
        {
          text: "A contract call runs developer-written logic with its own persistent state, is metered by the resources it uses, and must declare the ledger footprint it will read and write.",
          explanation:
            "Correct. Unlike a fixed built-in operation with a near-flat fee, a contract invocation executes arbitrary state-changing logic, is charged by CPU/memory/storage consumed, and must pre-declare its storage footprint so validators can lock and parallelise safely.",
        },
        {
          text: "Contract calls are always free, whereas classic payments always cost more.",
          explanation:
            "Wrong. Classic operations carry a tiny near-flat fee; contract calls are resource-metered and a heavy invocation typically costs more than a simple payment, not less.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c34-q4",
      prompt: "A DeFi vault holds thousands of users' USDC. Its code contains an owner-only function that can withdraw all deposits with no timelock. One day the deployer calls it and drains everything. What kind of risk is this, and what would have flagged it?",
      options: [
        {
          text: "It was a network hack; nothing in the contract itself could have warned users.",
          explanation:
            "Wrong. Nothing was hacked — the contract executed exactly what its code always permitted. The danger was in the contract's own privileged logic, which was inspectable up front.",
        },
        {
          text: "A rug pull via privileged permissions; reading who controls the contract and whether an owner key can move funds would have exposed it.",
          explanation:
            "Correct. This is a rug pull baked into the permissions. Checking the contract's control — a single owner key with an unrestricted, un-timelocked withdraw function — is exactly the audit-and-permissions discipline that flags the single point of failure before you deposit.",
        },
        {
          text: "Loss aversion caused the deployer to sell; it is a trader-psychology problem, not a contract problem.",
          explanation:
            "Wrong. Loss aversion is about a trader's own emotional exits, not a deployer draining a pool. This is a smart-contract permissions risk, unrelated to that concept.",
        },
        {
          text: "It was an unavoidable consequence of determinism that no amount of code review could reveal.",
          explanation:
            "Wrong. Determinism explains why the theft was irreversible once triggered, but the backdoor was plainly present in the code and permissions — reading them beforehand would have revealed it.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c34-q5",
      prompt: "In the Stellar DeFi stack, how do Soroswap, Blend and DeFindex compose?",
      options: [
        {
          text: "They are three isolated apps that cannot interact, since Soroban contracts cannot call one another.",
          explanation:
            "Wrong. Composability is the whole point: Soroban contracts share the same ledger and assets and can call each other atomically within one transaction.",
        },
        {
          text: "DeFindex is the base swap engine, Blend sits on top of it, and Soroswap is a vault manager built on Blend.",
          explanation:
            "Wrong — the roles are scrambled. Soroswap is the AMM/DEX swap primitive, Blend is lending/borrowing, and DeFindex is the strategy-and-vault layer that sits on top of the others.",
        },
        {
          text: "They compose only by each running its own separate blockchain and bridging assets between them.",
          explanation:
            "Wrong. All three are Soroban contracts on the same Stellar ledger, sharing the same USDC and XLM directly — no separate chains or asset bridges are needed for them to interlock.",
        },
        {
          text: "Soroswap provides swaps, Blend provides lending that can reach a DEX for liquidations, and DeFindex builds vault strategies on top of both — stacking like money legos, which also stacks their risk.",
          explanation:
            "Correct. Soroswap is the AMM/routing base primitive, Blend is the lending layer that can source or offload assets through a DEX during liquidations, and DeFindex vaults orchestrate strategies across both. The convenience of the stack rides on trusting every layer beneath it.",
        },
      ],
      correctIndex: 3,
    },
  ],
};
