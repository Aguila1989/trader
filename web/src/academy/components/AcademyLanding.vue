<script setup lang="ts">
// Public /academy landing (2026-07 Feature 1D): what an anonymous visitor sees
// instead of the chapter overview. Hero + transparency manifesto + locked
// lesson grid + sign-up banner. All body copy is DELIBERATELY blunt and
// rendered verbatim (Dutch), per the product spec - do not rephrase or soften.
// Colors come exclusively from the semantic CSS variables in style.css.
//
// The grid shows the real curriculum (chapters, per active locale). Chapter 1
// holds the free preview lesson (c1-l1) and is the only unlocked card; every
// other card is locked and clicking it routes to login (the parent's
// openChapter handles the redirect with the exact lesson deeplink).
import { computed } from "vue";
import { getChapters } from "../content";
import { useLocale } from "../locale";
import { PREVIEW_CHAPTER_ID } from "../preview";
import type { Level } from "../types";

const emit = defineEmits<{ (e: "open", chapterId: string): void }>();

const { locale } = useLocale();
const chapters = computed(() => getChapters(locale.value));

// Difficulty badge: the spec's three labels mapped onto the real level system.
const LEVEL_LABEL: Record<Level, string> = {
  BASIC: "Beginner",
  ADVANCED: "Gemiddeld",
  EXPERT: "Gevorderd",
};

// No duration field exists in the content model; estimate reading time from
// the lesson count (~4 min per lesson) so the meta line is honest, not fake.
function minutes(lessonCount: number): number {
  return Math.max(5, lessonCount * 4);
}
</script>

<template>
  <div class="landing">
    <!-- HERO -->
    <section class="hero">
      <span class="hero-pill">
        <svg viewBox="0 0 24 24" class="ic"><path d="M22 9L12 5 2 9l10 4 10-4v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /><path d="M6 10.6V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
        Atrium Academy
      </span>
      <h1 class="hero-title">Leer traden op de Stellar DEX</h1>
      <p class="hero-sub">
        Van je eerste trustline tot geavanceerde AI-strategieën — volledig gratis, in je eigen
        tempo.
      </p>
      <div class="hero-ctas">
        <router-link class="cta cta-primary" :to="{ path: '/register', query: { redirect: '/academy' } }">
          <svg viewBox="0 0 24 24" class="ic"><circle cx="9" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="2" /><path d="M3.5 19c.7-3 3-4.5 5.5-4.5s4.8 1.5 5.5 4.5M18 8v6M15 11h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
          Gratis account aanmaken
        </router-link>
        <router-link class="cta cta-ghost" :to="{ path: '/login', query: { redirect: '/academy' } }">
          <svg viewBox="0 0 24 24" class="ic"><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 8l4 4-4 4M14 12H3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
          Al een account? Log in
        </router-link>
      </div>
    </section>

    <hr class="divider" />

    <!-- TRANSPARENCY MANIFESTO -->
    <section class="manifesto">
      <article class="mcard">
        <svg viewBox="0 0 24 24" class="ic mic ic-success"><path d="M12 20s-7-4.5-9-9c-1.2-2.8.6-6 3.7-6 1.9 0 3.4 1 4.3 2.6C11.9 6 13.4 5 15.3 5c3.1 0 4.9 3.2 3.7 6-2 4.5-9 9-9 9z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
        <h3 class="mhead">Kennis verdienen wij niet aan</h3>
        <p class="mbody">
          Leren is een recht, geen product. De meeste crypto-cursussen vragen honderden euro voor
          kennis die gewoon toegankelijk zou moeten zijn. Dat vinden wij niet eerlijk. De Atrium
          Academy is gratis — vandaag, morgen, altijd. Geen verborgen premium tier, geen upsell na
          les 3.
        </p>
      </article>

      <article class="mcard">
        <svg viewBox="0 0 24 24" class="ic mic ic-accent"><path d="M19 5L5 19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /><circle cx="7" cy="7" r="2.5" fill="none" stroke="currentColor" stroke-width="2" /><circle cx="17" cy="17" r="2.5" fill="none" stroke="currentColor" stroke-width="2" /></svg>
        <h3 class="mhead">Hoe verdienen wij dan?</h3>
        <p class="mbody">
          Wij nemen een klein percentage op de trades die worden uitgevoerd via het platform.
          Alleen als jij handelt, verdienen wij. Geen maandelijkse lidmaatschapskosten voor
          basisfuncties, geen verborgen spreads, geen betaald advies. Ons belang en jouw belang
          lopen gelijk.
        </p>
        <div class="mpills">
          <span class="pill pill-accent">
            <svg viewBox="0 0 24 24" class="ic ic-s"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2" /><path d="M14.5 9.5a3 3 0 1 0 0 5M12 6.5v2M12 15.5v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
            <!-- Real tiered range — keep in sync with TIER_RATES (src/fees/engine.ts). -->
            0,08 – 0,28% per trade
          </span>
          <span class="pill pill-success">
            <svg viewBox="0 0 24 24" class="ic ic-s"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
            Geen abonnementskosten
          </span>
        </div>
      </article>

      <article class="mcard">
        <svg viewBox="0 0 24 24" class="ic mic ic-warning"><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /><circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" stroke-width="2" /></svg>
        <h3 class="mhead">Wat andere platforms verdienen aan jou</h3>
        <p class="mbody">
          Traditionele crypto-exchanges leven van spread-manipulatie, betaalde listings,
          staking-fees en verborgen liquiditeitskosten. Bij veel cursusplatforms betaal je ook
          voor de les én de tool. Wij geloven dat transparantie geen marketingtruc is — het is
          hoe een eerlijk product werkt.
        </p>
        <router-link class="mlink" to="/transparency">
          Lees onze volledige fee-structuur →
          <svg viewBox="0 0 24 24" class="ic ic-inline"><path d="M14 5h5v5M19 5l-8 8M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </router-link>
      </article>
    </section>

    <hr class="divider" />

    <!-- LESSON GRID -->
    <section class="lessons">
      <p class="lessons-label">Lessen — inloggen om te starten</p>
      <div class="lgrid">
        <button
          v-for="ch in chapters"
          :key="ch.id"
          class="lcard"
          :class="{ locked: ch.id !== PREVIEW_CHAPTER_ID, preview: ch.id === PREVIEW_CHAPTER_ID }"
          type="button"
          @click="emit('open', ch.id)"
        >
          <span class="lcard-top">
            <span class="pill lvl" :class="'lvl-' + ch.level.toLowerCase()">
              {{ LEVEL_LABEL[ch.level] }}
            </span>
            <span v-if="ch.id === PREVIEW_CHAPTER_ID" class="pill pill-preview">GRATIS PREVIEW</span>
          </span>
          <span class="lcard-title">{{ ch.title }}</span>
          <span class="lcard-meta">
            <svg viewBox="0 0 24 24" class="ic ic-s"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2" /><path d="M12 8v4l2.5 2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
            ~{{ minutes(ch.lessons.length) }} min
          </span>
          <svg v-if="ch.id !== PREVIEW_CHAPTER_ID" viewBox="0 0 24 24" class="ic lcard-lock"><rect x="5" y="11" width="14" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
        </button>
      </div>
    </section>

    <!-- SIGN-UP BANNER -->
    <section class="banner">
      <div class="banner-text">
        <strong>Gratis — altijd. Alleen een account nodig.</strong>
        <span class="muted">Volg je voortgang bij, haal quizcertificaten en unlock alle lessen.</span>
      </div>
      <router-link class="cta cta-primary" :to="{ path: '/register', query: { redirect: '/academy' } }">
        <svg viewBox="0 0 24 24" class="ic"><circle cx="9" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="2" /><path d="M3.5 19c.7-3 3-4.5 5.5-4.5s4.8 1.5 5.5 4.5M18 8v6M15 11h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
        Gratis account aanmaken
      </router-link>
    </section>
  </div>
</template>

<style scoped>
.landing {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.ic {
  width: 18px;
  height: 18px;
  flex: none;
}
.ic-s {
  width: 13px;
  height: 13px;
}
.ic-inline {
  width: 13px;
  height: 13px;
  vertical-align: -2px;
}

/* --- hero ------------------------------------------------------------- */
.hero {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding-top: 8px;
}
.hero-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-accent);
  color: var(--text-accent);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
}
.hero-title {
  font-size: 22px;
  font-weight: 500;
  margin: 0;
}
.hero-sub {
  font-size: 15px;
  color: var(--muted);
  max-width: 520px;
  margin: 0;
}
.hero-ctas {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 18px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}
.cta-primary {
  background: var(--fill-accent);
  color: #fff;
}
.cta-ghost {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
}
.cta-primary:active,
.cta-ghost:active {
  filter: brightness(1.15);
}

.divider {
  border: none;
  border-top: 0.5px solid var(--border);
  margin: 0;
}

/* --- manifesto ---------------------------------------------------------- */
.manifesto {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}
.mcard {
  background: var(--surface-1);
  border: 0.5px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
}
.mic {
  width: 22px;
  height: 22px;
}
.ic-success {
  color: var(--text-success);
}
.ic-accent {
  color: var(--text-accent);
}
.ic-warning {
  color: var(--text-warning);
}
.mhead {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}
.mbody {
  font-size: 13.5px;
  color: var(--muted);
  margin: 0;
  line-height: 1.55;
}
.mpills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
}
.pill-accent {
  background: var(--bg-accent);
  color: var(--text-accent);
}
.pill-success {
  background: var(--bg-success);
  color: var(--text-success);
}
.mlink {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--text-accent);
  font-size: 13px;
  text-decoration: none;
  min-height: 44px; /* tap target */
}
.mlink:active {
  filter: brightness(1.2);
}

/* --- lesson grid ---------------------------------------------------------- */
.lessons-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  margin: 0 0 10px;
}
.lgrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.lcard {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  border-radius: 12px;
  background: var(--surface-1);
  border: 0.5px solid var(--border);
  padding: 16px;
  min-height: 110px; /* comfortably > 44px tap target */
  text-align: left;
  color: var(--text);
  font: inherit;
  cursor: pointer;
}
.lcard.locked {
  opacity: 0.65;
}
.lcard.preview {
  border-color: var(--border-accent);
  background: var(--bg-accent);
  opacity: 1;
}
.lcard-top {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
}
.lvl {
  padding: 3px 10px;
}
.lvl-basic {
  background: var(--bg-success);
  color: var(--text-success);
}
.lvl-advanced {
  background: var(--bg-warning);
  color: var(--text-warning);
}
.lvl-expert {
  background: var(--bg-danger);
  color: var(--text-danger);
}
.pill-preview {
  background: var(--fill-accent);
  color: #fff;
  font-size: 10px;
  padding: 2px 7px;
}
.lcard-title {
  font-size: 14px;
  font-weight: 500;
}
.lcard-meta {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--muted);
}
.lcard-lock {
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 15px;
  height: 15px;
  color: var(--muted);
}

/* --- sign-up banner --------------------------------------------------------- */
.banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  background: var(--surface-1);
  border: 0.5px solid var(--border-accent);
  border-radius: 12px;
  padding: 16px 20px;
}
.banner-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 14px;
}

/* --- responsive --------------------------------------------------------- */
@media (max-width: 640px) {
  .manifesto {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 600px) {
  .banner {
    flex-direction: column;
    align-items: stretch;
  }
  .banner .cta {
    width: 100%;
  }
}
@media (max-width: 480px) {
  .hero-ctas {
    flex-direction: column;
    align-self: stretch;
  }
  .hero-ctas .cta {
    width: 100%;
  }
}
</style>
