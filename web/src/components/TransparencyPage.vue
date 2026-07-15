<script setup lang="ts">
// Public /transparency page (2026-07 Feature 2): how Atrium earns its money.
// All body copy is DELIBERATELY blunt and rendered verbatim (Dutch), per the
// product spec — do not rephrase or soften. The AI-provider framing is
// deliberate too: the user chooses and pays their own AI provider; Atrium
// routes trades, it does not supply the intelligence.
// Colors come exclusively from the semantic CSS variables in style.css.
import { SUPPORT_EMAIL } from "../support";
</script>

<template>
  <div class="transparency">
    <!-- HERO -->
    <header class="tp-hero">
      <h1 class="tp-title">Zo verdient Atrium zijn geld</h1>
      <p class="tp-sub">Geen verrassingen. Geen kleine lettertjes. Gewoon hoe het werkt.</p>
    </header>

    <!-- SECTION 1: verdienmodel -->
    <section class="tp-section">
      <h2 class="tp-h2">Atrium's verdienmodel</h2>
      <p class="tp-body">
        Wij nemen een klein percentage op elke trade die via het platform wordt uitgevoerd. Dat
        is het. Geen abonnementskosten voor de basisfuncties, geen verborgen spread, geen betaald
        onderzoek, geen gesponsorde token-listings die jouw portefeuille beïnvloeden. De AI die
        de trades voorstelt, is die van jou — jij kiest de provider, jij betaalt de AI-kosten
        rechtstreeks aan je provider.
      </p>

      <!-- Fee table: horizontal scroll on narrow viewports instead of breaking -->
      <div class="tp-table-wrap">
        <table class="tp-table">
          <thead>
            <tr>
              <th>Wat</th>
              <th>Bedrag</th>
              <th>Wanneer</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Trade fee</td>
              <td>0,08% – 0,28% van de trade-waarde, volgens volumeschijf</td>
              <td>Alleen bij uitvoering</td>
            </tr>
            <tr>
              <td>Academy</td>
              <td>€0</td>
              <td>Altijd gratis</td>
            </tr>
            <tr>
              <td>Account aanmaken</td>
              <td>€0</td>
              <td>—</td>
            </tr>
            <tr>
              <td>Walletbeheer</td>
              <td>€0</td>
              <td>—</td>
            </tr>
            <tr>
              <td>AI-kosten</td>
              <td>Jouw verantwoordelijkheid</td>
              <td>Rechtstreeks aan jouw AI-provider</td>
            </tr>
            <tr>
              <td>Premium functies</td>
              <td>In development (Stripe)</td>
              <td>Optioneel, nooit verplicht</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- The full tier schedule. KEEP IN SYNC with TIER_RATES in
           src/fees/engine.ts — this page's entire promise is that the numbers
           here are the numbers the engine charges. -->
      <h3 class="tp-h3">Trade fee per volumeschijf</h3>
      <p class="tp-body">
        Je schijf wordt dagelijks herberekend op basis van je handelsvolume van de vorige
        kalendermaand. Hoe meer je handelt, hoe lager het percentage — en Premium betaalt in
        elke schijf minder.
      </p>
      <div class="tp-table-wrap">
        <table class="tp-table">
          <thead>
            <tr>
              <th>Schijf (maandvolume)</th>
              <th>Gratis</th>
              <th>Premium handmatig</th>
              <th>Premium AI</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Brons (&lt; 5.000 XLM)</td>
              <td>0,28%</td>
              <td>0,18%</td>
              <td>0,14%</td>
            </tr>
            <tr>
              <td>Zilver (5.000 – 20.000 XLM)</td>
              <td>0,23%</td>
              <td>0,16%</td>
              <td>0,12%</td>
            </tr>
            <tr>
              <td>Goud (20.000 – 50.000 XLM)</td>
              <td>0,18%</td>
              <td>0,13%</td>
              <td>0,10%</td>
            </tr>
            <tr>
              <td>Platina (&gt; 50.000 XLM)</td>
              <td>0,12%</td>
              <td>0,08%</td>
              <td>0,08%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="tp-note muted">
        Premium functies geven je meer controle en meer AI-mogelijkheden — maar de kern van
        Atrium, inclusief de Academy, blijft gratis. De AI-provider en het model zijn altijd
        jouw keuze.
      </p>
    </section>

    <!-- SECTION 2: hoe de industrie echt werkt -->
    <section class="tp-section">
      <h2 class="tp-h2b">Hoe de crypto-industrie echt werkt</h2>
      <ul class="tp-rows">
        <li class="tp-row">
          <svg viewBox="0 0 24 24" class="tp-ic"><path d="M4 8h13M14 4.5L17.5 8 14 11.5M20 16H7M10 12.5L6.5 16l3.5 3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
          <div>
            <strong>Spread-manipulatie</strong>
            <p class="tp-row-body">
              De prijs die je ziet is niet altijd de prijs die je betaalt. Platforms passen de
              koop- en verkoopprijs aan om zelf een marge te pakken, bovenop de officiële
              marktprijs.
            </p>
          </div>
        </li>
        <li class="tp-row">
          <svg viewBox="0 0 24 24" class="tp-ic"><path d="M12 3.5l2.5 5.3 5.8.7-4.3 4 1.1 5.7-5.1-2.8-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
          <div>
            <strong>Betaalde token-listings</strong>
            <p class="tp-row-body">
              Projecten betalen soms tienduizenden dollars om op een exchange te verschijnen.
              Dat betekent dat het platform belang heeft bij die token — niet per se jij.
            </p>
          </div>
        </li>
        <li class="tp-row">
          <svg viewBox="0 0 24 24" class="tp-ic"><path d="M22 9L12 5 2 9l10 4 10-4v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /><path d="M6 10.6V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
          <div>
            <strong>Cursussen als product</strong>
            <p class="tp-row-body">
              Veel crypto-educatieplatforms vragen €199–€999 voor cursusmateriaal dat verouderd
              is binnen zes maanden. De kennis is niet de reden dat het duur is — de marge is de
              reden.
            </p>
          </div>
        </li>
        <li class="tp-row">
          <svg viewBox="0 0 24 24" class="tp-ic"><rect x="5" y="11" width="14" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
          <div>
            <strong>Staking- en liquiditeitskosten</strong>
            <p class="tp-row-body">
              Platforms houden een deel van je staking-opbrengst in, of nemen een fee op het
              toevoegen en verwijderen van liquiditeit. Vaak staat dit in de kleine lettertjes.
            </p>
          </div>
        </li>
      </ul>
    </section>

    <!-- SECTION 3: promise block -->
    <section class="tp-promise">
      <h2 class="tp-promise-h">Wat wij beloven</h2>
      <p class="tp-promise-body">
        Wij zullen de Academy nooit achter een betaalmuur zetten. Wij zullen nooit tokens
        promoten waar wij financieel belang bij hebben. Wij zullen onze fee-structuur altijd
        publiek houden en updaten als er iets verandert. De AI die jouw trades uitvoert is
        altijd jouw keuze — wij leggen je nooit een specifieke provider op. Als wij ooit iets
        veranderen aan hoe wij verdienen, staat dat hier — vooraf, niet achteraf.
      </p>
    </section>
    <p class="tp-contact muted">
      Vragen over ons verdienmodel? Stuur ons een bericht via
      <a class="tp-mail" :href="`mailto:${SUPPORT_EMAIL}`">{{ SUPPORT_EMAIL }}</a>.
    </p>
  </div>
</template>

<style scoped>
.transparency {
  max-width: 860px;
  margin: 0 auto;
  padding: 28px 20px 48px;
  padding-bottom: calc(48px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.tp-hero { display: flex; flex-direction: column; gap: 8px; }
.tp-title { font-size: 22px; font-weight: 500; margin: 0; }
.tp-sub { font-size: 15px; color: var(--muted); max-width: 480px; margin: 0; }

.tp-section { display: flex; flex-direction: column; gap: 14px; }
.tp-h2 { font-size: 18px; font-weight: 500; margin: 0; }
.tp-h2b { font-size: 18px; font-weight: 500; margin: 0; }
.tp-h3 { font-size: 15px; font-weight: 500; margin: 6px 0 0; }
.tp-body { margin: 0; font-size: 14.5px; line-height: 1.65; }
.tp-note { margin: 0; font-size: 13px; line-height: 1.6; }

/* Fee table (scrolls horizontally on narrow viewports). min-width:0 lets this
   flex-column child actually SHRINK below the table's min-width, so the scroll
   happens inside the wrapper — never on the page body. */
.tp-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; min-width: 0; max-width: 100%; }
.tp-section { min-width: 0; }
.tp-table {
  border-collapse: collapse;
  font-size: 14px;
  width: 100%;
  min-width: 480px; /* keeps three readable columns; wrapper scrolls below this */
}
.tp-table th,
.tp-table td {
  border: 0.5px solid var(--border);
  padding: 10px 14px;
  text-align: left;
}
.tp-table th {
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  background: var(--surface-1);
}

/* Industry rows */
.tp-rows { list-style: none; margin: 0; padding: 0; }
.tp-row {
  display: flex;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 0.5px solid var(--border);
}
.tp-row:last-child { border-bottom: none; }
.tp-ic { width: 20px; height: 20px; flex: none; color: var(--text-accent); margin-top: 2px; }
.tp-row strong { font-size: 14px; }
.tp-row-body { margin: 4px 0 0; font-size: 13.5px; line-height: 1.6; color: var(--muted); }

/* Promise block */
.tp-promise {
  background: var(--bg-accent);
  border: 0.5px solid var(--border-accent);
  border-radius: 12px;
  padding: 20px 24px;
}
.tp-promise-h { margin: 0 0 10px; font-size: 16px; font-weight: 500; color: var(--text-accent); }
.tp-promise-body { margin: 0; font-size: 14px; line-height: 1.7; }

.tp-contact { margin: -8px 0 0; font-size: 13px; }
.tp-mail { color: var(--text-accent); text-decoration: none; display: inline-block; padding: 12px 0; }

@media (max-width: 640px) {
  .transparency { gap: 22px; }
}
</style>
