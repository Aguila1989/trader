// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// ADVANCED chapter on liquidity pools and yield: how AMM pools work and pay, the
// hidden risk of impermanent loss, yield farming, Stellar's 0.30% pool fee and
// who receives it, and when providing liquidity beats a plain one-off trade.
// This chapter owns no new glossary terms; it reuses terms taught earlier.
import type { Chapter } from "../../types";

export const chapter32: Chapter & { whoFor: string } = {
  id: "c32",
  number: 32,
  level: "ADVANCED",
  whoFor: "For traders weighing pool yield against its hidden risk",
  title: "Liquidity Pools and Yield",
  description:
    "How pools work and pay, impermanent loss, yield farming, Stellar's 0.30% AMM fee, and when a pool beats a plain trade.",
  lessons: [
    {
      id: "c32-l1",
      title: "What is a liquidity pool and how do you earn from it?",
      paragraphs: [
        "A liquidity pool is a shared on-chain reserve of two assets that traders swap against automatically, with no order book and no counterparty to find. On Stellar you deposit both sides of a pair — say XLM and USDC — in equal value, and in return you receive pool shares that represent your slice of the reserves. Because a non-native token like USDC needs a trustline first, you must already be set up to hold both assets before you deposit.",
        "You earn because every swap that passes through the pool pays a 0.30% fee, and that fee is added straight back into the reserves. Your pool shares therefore claim a growing amount of the underlying assets over time: the more your pool is used, the more your shares are worth when you eventually withdraw. There is no fixed interest rate — your yield is simply your pro-rata cut of the trading fees the pool collects.",
        "The Advanced Stellar Features chapter compares AMM pools with the SDEX order book in depth. In short, the order book lets you name an exact limit price and wait for a match, while an AMM prices every swap off a formula against the current reserves and always fills instantly. Providing liquidity is the mirror image of trading: instead of taking a price, you supply the inventory that others trade against and collect fees for doing so.",
      ],
      example:
        "You deposit 100 USDC and an equal value of XLM into an XLM/USDC pool that holds 10,000 USDC-worth of reserves in total. Your shares represent 1% of the pool. Over a week the pool processes 50,000 USDC of swap volume, collecting 150 USDC in fees (0.30%). Your 1% share earns roughly 1.50 USDC-worth of that, quietly compounding into your reserves without you placing a single order.",
    },
    {
      id: "c32-l2",
      title: "What is impermanent loss and why is it a hidden risk?",
      paragraphs: [
        "Impermanent loss is the gap between what your deposited assets would have been worth if you had simply held them and what they are worth after sitting in the pool while their prices diverged. An AMM automatically rebalances your two assets to keep their values equal: as one asset rises, the pool sells some of it and buys more of the falling one. That is the opposite of what a holder wants, because you end up holding less of the winner and more of the loser.",
        "The loss is called impermanent because it only crystallises when you withdraw. If the two prices drift back to their original ratio, the gap closes and you keep your fees free and clear. But if the divergence is permanent, so is the loss. Crucially, impermanent loss is largest for volatile, uncorrelated pairs and smallest for pairs that track each other, which is why stablecoin-to-stablecoin pools are relatively safe.",
        "This is the hidden risk because the pool balance can look healthy while you are quietly worse off than a holder. The real question is always whether the fees you collected outweigh the impermanent loss you suffered. If the pair barely moved and volume was high, fees win; if one asset doubled while the other stayed flat, impermanent loss can easily swallow a week of fees.",
      ],
      example:
        "You deposit 100 USDC and 1,000 XLM when XLM is 0.10 USDC — a balanced 200 USDC position. XLM then doubles to 0.20 USDC. The AMM has been selling XLM the whole way up, so you withdraw about 707 XLM and 141 USDC, worth roughly 283 USDC. Had you simply held, your 100 USDC plus 1,000 XLM (now 200 USDC) would be 300 USDC. That 17-USDC shortfall is impermanent loss; if your fee income for the period was under 17 USDC, you came out behind.",
    },
    {
      id: "c32-l3",
      title: "What is yield farming?",
      paragraphs: [
        "Yield farming is the practice of actively moving your liquidity between pools and protocols to chase the highest return. Instead of parking assets in one pool and forgetting them, a farmer hunts for pools with the best combination of fee income and any extra incentive rewards, then reallocates as those opportunities shift. On Stellar's Soroban smart-contract platform, DeFi protocols such as Blend, DeFindex, and Soroswap add lending yields and reward tokens on top of plain AMM fees.",
        "The appeal is that headline yields can look far higher than a simple fee share, because protocols sometimes hand out their own tokens to attract liquidity. The catch is that those advertised numbers are rarely the real return. They usually ignore impermanent loss, the price risk of any reward token you are paid in, and the fact that high yields tend to decay fast once liquidity floods in.",
        "Farming stacks risks rather than removing them: smart-contract bugs, thin-liquidity pools, reward tokens that collapse, and the plain cost of frequent rebalancing. It is an advanced, hands-on activity, not passive income, and the returns are never guaranteed. None of this is financial advice — treat every advertised yield as a starting question, not a promise, and size positions to what you can afford to lose.",
      ],
      example:
        "A new Soroswap pool advertises a 40% annualised yield, mostly paid in its own reward token. A farmer moves liquidity in, but two weeks later a wave of new depositors dilutes the reward, the incentive token drops 30%, and XLM's move against USDC has added impermanent loss. The 40% headline quietly becomes a low-single-digit real return — before counting the fees spent hopping in and out.",
    },
    {
      id: "c32-l4",
      title: "How do AMM fees work on Stellar (0.30%) and who receives them?",
      paragraphs: [
        "Every swap routed through a Stellar liquidity pool pays a fixed 0.30% pool fee, taken from the input amount before the pricing formula runs. This is separate from the tiny network fee of around 0.00001 XLM that every Stellar transaction pays, and separate again from the small XLM minimum reserve each account keeps. The 0.30% is the swapper's cost of using the pool, and it never leaves the pool.",
        "The fee is not collected by Stellar, by Atrium, or by any central operator. It is added directly to the pool's reserves, which raises the value of every outstanding pool share. That means the liquidity providers receive it, pro-rata: if you own 5% of the shares, you effectively earn 5% of every fee the pool collects. You realise it only when you withdraw and find your shares now redeem for more assets than you put in.",
        "Because the fee scales with volume, a pool's real yield to providers depends far more on how much trading flows through it than on its size. A small, busy pool can out-earn a large, idle one. When you swap in Atrium's Manual Trading tab, a path payment may route through one of these pools, and the 0.30% is baked into the effective price you see alongside your slippage tolerance.",
      ],
      example:
        "A pool holds 200,000 USDC-worth of reserves and does 400,000 USDC of swap volume in a month, collecting 1,200 USDC in fees (0.30%). Those fees join the reserves, so the pool now backs the same shares with 201,200 USDC-worth of assets. A provider holding 5% of shares sees their stake rise by about 60 USDC — their pro-rata cut — payable when they withdraw.",
    },
    {
      id: "c32-l5",
      title: "When is a liquidity pool more attractive than a regular trade?",
      paragraphs: [
        "A regular trade is a one-off directional bet: you buy or sell on the SDEX or via an AMM swap, take a price, and you are done. Providing liquidity is the opposite stance — you are neutral on direction and instead rent out your inventory to earn a stream of fees. The Advanced Stellar Features chapter covers how AMM pricing and order-book matching differ; the decision here is not which venue prices better, but whether you want to trade or to be traded against.",
        "A pool becomes attractive when you expect to hold both assets anyway, when the pair is relatively stable or highly correlated, and when trading volume is high enough that fees comfortably beat impermanent loss. Stablecoin pairs are the classic case: tiny divergence, so almost no impermanent loss, while steady swap volume keeps fees flowing. In that setting your assets earn while they sit, which a plain trade can never do.",
        "A regular trade wins when you have a real directional view, when the pair is volatile and uncorrelated so impermanent loss would bite, or when you need to exit cleanly at a chosen price — which is exactly what a limit order on the SDEX gives you. The core trade-off is always yield versus impermanent loss: a pool pays you to stay neutral, and you should only accept that pay when the expected fees outweigh the drag of divergence.",
      ],
      example:
        "You hold USDC and a second Circle-style stablecoin and have no strong view on either. Trading one for the other once earns you nothing beyond the spread. Depositing both into a stable pool instead lets them earn the 0.30% fee on every swap that passes through, with near-zero impermanent loss because the two prices barely move. Here the pool clearly beats the one-off trade. Swap that stable pair for a volatile XLM/newtoken pool and the maths can flip the other way.",
    },
  ],
  quiz: [
    {
      id: "c32-q1",
      prompt: "You deposit XLM and USDC into a Stellar liquidity pool. Where does your yield actually come from?",
      options: [
        {
          text: "A fixed interest rate paid by Atrium for locking up your assets.",
          explanation:
            "No. Atrium pays no interest and takes no custody of pool fees. Pool yield is variable and comes from trading activity, not a promised rate.",
        },
        {
          text: "Your pro-rata share of the 0.30% fee that every swap through the pool pays into the reserves.",
          explanation:
            "Correct. Each swap adds a 0.30% fee to the pool's reserves, so your pool shares redeem for more assets over time. Your return is simply your slice of that fee flow.",
        },
        {
          text: "The tiny ~0.00001 XLM network fee that Stellar charges on each transaction.",
          explanation:
            "Wrong. The network fee is a separate protocol cost and does not flow to liquidity providers. Provider yield comes from the 0.30% pool fee, not the network fee.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c32-q2",
      prompt: "Which situation produces the LARGEST impermanent loss for a liquidity provider?",
      options: [
        {
          text: "A pool of two stablecoins whose prices stay within a fraction of a percent of each other.",
          explanation:
            "No. Correlated, near-identical prices barely diverge, so impermanent loss is minimal. This is the safest kind of pool for that reason.",
        },
        {
          text: "A volatile, uncorrelated pair where one asset doubles while the other stays flat.",
          explanation:
            "Correct. Impermanent loss grows with divergence between the two assets. A large one-sided move is the worst case, because the AMM sold the winner all the way up.",
        },
        {
          text: "A pool whose two assets both rise by exactly the same percentage.",
          explanation:
            "Wrong. If both assets move together their ratio is unchanged, so there is essentially no impermanent loss — divergence, not direction, is what causes it.",
        },
        {
          text: "A pool with very high swap volume but a stable price ratio.",
          explanation:
            "Wrong. High volume means more fees, and a stable ratio means little divergence — that is a favourable pool, not a source of large impermanent loss.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c32-q3",
      prompt: "A new Soroban pool advertises a 40% annualised yield, mostly paid in its own reward token. What should an advanced trader assume?",
      options: [
        {
          text: "The 40% is a reliable, guaranteed return you will keep.",
          explanation:
            "No. Advertised farming yields are rarely the real return and are never guaranteed. They typically ignore impermanent loss and the price risk of the reward token.",
        },
        {
          text: "The headline ignores impermanent loss, reward-token price risk, and yield decay, so the real return is likely far lower.",
          explanation:
            "Correct. Yield farming stacks risks: dilution as liquidity floods in, a reward token that can drop, impermanent loss, and rebalancing costs. Treat the number as a question, not a promise.",
        },
        {
          text: "Reward tokens carry no price risk because a protocol issued them.",
          explanation:
            "Wrong. A protocol's own token can fall sharply, and incentive tokens often do once emissions dilute. Being issued by a protocol gives no price protection.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c32-q4",
      prompt: "On Stellar, who ultimately receives the 0.30% pool fee paid on a swap?",
      options: [
        {
          text: "Atrium, as the app that routed the swap.",
          explanation:
            "No. Atrium does not collect pool fees. The 0.30% never leaves the pool and goes to the people who supplied the liquidity.",
        },
        {
          text: "The Stellar network validators, alongside the base network fee.",
          explanation:
            "Wrong. Validators are compensated by the separate ~0.00001 XLM network fee, not the 0.30% pool fee, which stays in the pool.",
        },
        {
          text: "The liquidity providers, pro-rata, via reserves added straight back into the pool.",
          explanation:
            "Correct. The fee is added to the pool's reserves, raising the value of every share. Providers realise their pro-rata cut when they withdraw more assets than they deposited.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c32-q5",
      prompt: "When is providing liquidity clearly more attractive than making a one-off SDEX trade?",
      options: [
        {
          text: "When you have a strong directional view and want to exit at one exact price.",
          explanation:
            "No. That is precisely when a regular trade wins — a limit order on the SDEX lets you name your exit price. A pool keeps you neutral, which fights a directional view.",
        },
        {
          text: "When you would hold both assets anyway, the pair is stable or correlated, and volume is high enough that fees beat impermanent loss.",
          explanation:
            "Correct. Neutral stance plus low divergence plus steady volume is the sweet spot: your assets earn the 0.30% fee while they sit, which a one-off trade can never do.",
        },
        {
          text: "When the pair is highly volatile and uncorrelated, so prices swing a lot.",
          explanation:
            "Wrong. Big divergence maximises impermanent loss, which can swallow your fees. A volatile, uncorrelated pair favours a directional trade, not liquidity provision.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
