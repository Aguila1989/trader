import type { Chapter } from "../../types";

export const chapter20: Chapter = {
  id: "c20",
  number: 20,
  level: "ADVANCED",
  title: "Reading AI Trustline Suggestions",
  description: "How the weekly scan scores tokens, what a TOML file is, how to read a deterioration warning, why a volume spike can be a trap, and why a suggestion is a starting point — not a verdict.",
  lessons: [
    {
      id: "c20-l1",
      title: "How the app scores tokens as trustline candidates",
      paragraphs: [
        "Once a week the app analyses the top Stellar tokens (plus the tokens you already hold) and asks the AI to score each one as a trustline candidate. Every token gets four scores from 1 to 10, plus an overall score that summarises them. The four are liquidity, legitimacy, trend, and risk.",
        "Liquidity rates how easily you could trade the token — its real volume against XLM and the depth of its order book. Legitimacy rates how credible the project looks: a published stellar.toml, a real home domain, a known issuer, genuine adoption. Trend rates the recent 7-day price direction. Risk is scored so that higher is safer — a 10 means lowest risk, a 1 means very risky.",
        "Because risk is \"higher = safer\", all four scores and the overall point the same way: bigger is better. The overall score is the AI's at-a-glance judgement, but the four components tell you why. A token can have great liquidity yet a low legitimacy score, and that combination is exactly what the breakdown is there to reveal.",
      ],
      example: "A suggestion card shows USDC with Overall 9, and underneath Liquidity 9, Legitimacy 10, Trend 7, Safety 9. Another card shows a new token with Overall 4: Liquidity 6 but Legitimacy 2 and Safety 3. The overall numbers alone would tempt you toward the first; the breakdown explains precisely why the second scores low despite decent liquidity.",
    },
    {
      id: "c20-l2",
      title: "What is a TOML file and why does its absence matter?",
      paragraphs: [
        "A stellar.toml is a small public file an issuer hosts at its home domain (for example at example.com/.well-known/stellar.toml). It is where a legitimate project declares itself: the organisation name, website, contact details, and the exact issuing accounts for its tokens. It is the chain's equivalent of a verifiable business card.",
        "The scan fetches this file for each token. When it exists, the app can show you the project name, description, and website on the suggestion card, and you can cross-check that the issuer in the file matches the issuer you would be trusting. When it is missing, none of that is possible — you would be trusting an issuer that has chosen not to identify itself.",
        "That is why a missing TOML is treated as a red flag rather than a neutral fact. It does not prove a token is a scam, but it removes the easiest way to verify the project, and it is a strong reason to be cautious. A token that loses a TOML it previously had is treated as even more concerning, because something that was documented has gone dark.",
      ],
      example: "One suggestion shows \"Project: Aquarius — aqua.network\" pulled straight from the issuer's TOML, and the issuer key in the file matches the one on the card. A second suggestion shows \"No stellar.toml found\" and a red flag to match. Same scan, very different levels of verifiable identity.",
    },
    {
      id: "c20-l3",
      title: "How to interpret a deterioration warning",
      paragraphs: [
        "Suggestions point at tokens you might add; warnings point at tokens you already hold whose situation has worsened since last week. Each warning lists the specific triggers that fired, so you are never guessing why a token was flagged. The bot only warns — it will never remove a trustline for you.",
        "There are seven triggers. Score drop: the overall score fell by two or more points week over week. Low liquidity: the liquidity score is below 3. Volume drop: 7-day volume fell by more than half. New red flags: a flag appeared that was not there before. Fewer holders: the trustline count dropped by more than 10%. TOML gone: a stellar.toml that existed before is no longer reachable. Trend down: the price trend flipped from up or stable to down.",
        "A single trigger is a nudge to look; several at once is a louder signal. The card also shows your current balance and its estimated XLM value, so you can weigh how much is actually at stake before deciding whether to research, hold, reduce, or exit. You can snooze a warning for seven days if you have reviewed it and want to revisit later.",
      ],
      example: "A token you hold shows two triggers: \"Volume drop\" and \"Fewer holders\". The card reads 7-day volume dropped 64% and Trustline holders dropped 18% (5,000 → 4,100), with your balance of 1,200 worth about 90 XLM. Two independent signs of a project losing traction, plus a real amount at stake — a clear prompt to investigate rather than ignore.",
    },
    {
      id: "c20-l4",
      title: "What is a volume spike without fundamentals?",
      paragraphs: [
        "Trading volume is usually a healthy sign, but a sudden spike with nothing real behind it is the opposite. A volume spike without fundamentals is a burst of trading that is not matched by any improvement in the things that give a token value — no more holders, no project news, no deeper order book, often no identifiable issuer at all.",
        "It is a classic manipulation pattern. A handful of accounts can wash-trade a token back and forth to manufacture volume and rank it highly, hoping the activity itself lures buyers. The price pops on the artificial interest, insiders sell into the new demand, and the volume vanishes as quickly as it appeared.",
        "This is why the AI is told to flag a volume spike without fundamentals as a red flag rather than reward it. Volume only means something when it is backed by genuine adoption and liquidity. When the score breakdown shows high recent volume but weak legitimacy and few holders, that mismatch is the tell.",
      ],
      example: "A token rockets up the weekly ranking on a 20x volume jump, but its holder count is flat at 40, it has no stellar.toml, and its order book is paper-thin. The AI scores its trend high but its legitimacy and safety low, and adds the red flag \"sudden volume spike without fundamentals.\" The volume is real; the substance behind it is not.",
    },
    {
      id: "c20-l5",
      title: "Using AI suggestions as a starting point, not a final answer",
      paragraphs: [
        "The scan is a research assistant, not an oracle. It compresses a lot of on-chain data into a few scores so you can triage quickly, but it works from limited, public signals and a language model's judgement. It cannot know an issuer's true intentions or read tomorrow's news. A high score narrows your shortlist; it does not certify a token.",
        "Every suggestion card carries the same disclaimer for a reason: adding a trustline is always a risk, it reserves 0.5 XLM, and it exposes you to the issuer. Never add a trustline on the strength of the suggestion alone. Use it to decide what is worth investigating, then verify the issuer, the TOML, the holders, and the liquidity yourself.",
        "Treat the scores as a conversation starter with your own due diligence. The strongest workflow is: let the scan surface candidates, read the breakdown and red flags, confirm the facts independently, and only then decide. The final call — and the responsibility — is always yours.",
      ],
      example: "The scan suggests a token with Overall 8. Rather than adding it immediately, you open its website from the TOML, confirm the issuer key matches, glance at its holder trend over several weeks, and check the XLM order book is genuinely deep. Everything holds up, so you add the trustline deliberately — the suggestion started the process, your own research finished it.",
    },
  ],
  quiz: [
    {
      id: "c20-q1",
      prompt: "On a suggestion card, what does a high risk (safety) score mean?",
      options: [
        { text: "The token is very risky — higher means more danger.", explanation: "Incorrect. The scale is inverted from that intuition: in this app the risk/safety score is higher = safer." },
        { text: "The token is lower risk — 10 means lowest risk, 1 means very risky.", explanation: "Correct. Risk is scored so higher is safer, which keeps all four scores and the overall pointing the same way: bigger is better." },
        { text: "Risk has nothing to do with the overall score.", explanation: "Incorrect. Risk is one of the four components that inform the overall score." },
      ],
      correctIndex: 1,
    },
    {
      id: "c20-q2",
      prompt: "Why does a missing stellar.toml count as a red flag?",
      options: [
        { text: "Because the token is automatically a scam without one.", explanation: "Incorrect. A missing TOML does not prove fraud — but it removes the easiest way to verify the project, which is why it is treated cautiously." },
        { text: "Because it removes the main way to identify and verify the issuer and project.", explanation: "Correct. The TOML is where an issuer declares its identity, website, and issuing keys; without it you are trusting an issuer that hasn't identified itself." },
        { text: "Because it makes the 0.5 XLM reserve larger.", explanation: "Incorrect. The reserve is always 0.5 XLM per trustline regardless of whether a TOML exists." },
      ],
      correctIndex: 1,
    },
    {
      id: "c20-q3",
      prompt: "A held token's warning lists 'Volume drop' and 'Fewer holders'. What should you conclude?",
      options: [
        { text: "The bot has already sold the token to protect you.", explanation: "Incorrect. The bot only warns; it never removes a trustline or sells on the strength of a warning. The decision is yours." },
        { text: "Two independent signs the project is losing traction — a prompt to investigate.", explanation: "Correct. Each trigger is a specific deterioration signal; several together is a stronger cue to research and decide what to do." },
        { text: "Nothing — warnings are random and can be ignored.", explanation: "Incorrect. Each trigger corresponds to a concrete threshold being crossed in the week-over-week data." },
      ],
      correctIndex: 1,
    },
    {
      id: "c20-q4",
      prompt: "What is a 'volume spike without fundamentals'?",
      options: [
        { text: "A burst of trading not matched by more holders, deeper liquidity, or a credible issuer.", explanation: "Correct. The activity is manufactured (often wash trading) rather than backed by genuine adoption, so it is flagged rather than rewarded." },
        { text: "A steady, long-term rise in volume alongside a growing holder base.", explanation: "Incorrect. That is healthy, fundamentally-backed growth — the opposite of the red flag." },
        { text: "A drop in volume caused by a market-wide downturn.", explanation: "Incorrect. The pattern is a spike up in volume without substance, not a decline." },
      ],
      correctIndex: 0,
    },
    {
      id: "c20-q5",
      prompt: "How should you treat a high-scoring AI suggestion?",
      options: [
        { text: "As a certified safe token you can add without further thought.", explanation: "Incorrect. The scan works from limited public signals; it can't certify a token, and every card warns against adding on the suggestion alone." },
        { text: "As a starting point for your own research — verify the issuer, TOML, holders, and liquidity before deciding.", explanation: "Correct. A high score narrows your shortlist; independent verification and the final decision remain yours." },
        { text: "As irrelevant, since AI scores are never useful.", explanation: "Incorrect. The scores are a useful triage tool — they just aren't a substitute for due diligence." },
      ],
      correctIndex: 1,
    },
  ],
};
