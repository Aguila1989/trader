import type { Chapter } from "../../types";

export const chapter10: Chapter = {
  id: "c10",
  number: 10,
  level: "EXPERT",
  title: "AI-trading in detail",
  description: "Een technische blik op hoe de analist redeneert, wat een voorstel bevat, wanneer je het accepteert of afwijst, hoe het samenleeft met handmatig handelen, en hoe je de AI-log leest.",
  lessons: [
    {
      id: "c10-l1",
      title: "Hoe de AI trade-voorstellen genereert: de data die hij gebruikt en hoe hij redeneert",
      paragraphs: [
        "De AI in deze bot heet de analist, en het is een tool-gedreven model en geen chatbox. Je kiest een provider uit de dropdown (Anthropic Claude, OpenAI of DeepSeek), en alleen providers met een ingestelde API-sleutel zijn selecteerbaar. De analist draait op drie triggers: Analyze voor een enkel paar, Scan de chain over het samengestelde XLM-universum plus een paar cross-paren, of de auto-scan-timer als je die hebt ingeschakeld. Hij streamt niet; elke run is een losse aanvraag die eindigt in nul of meer voorstellen.",
        "Redeneren gebeurt via tool-aanroepen, niet via giswerk. De analist vraagt get_account_balances om je holdings en je openstaande offers te zien, get_market voor de beste bid en ask uit het orderboek plus de zichtbare depth, en get_price_history voor OHLC-candles gebundeld met indicatoren die de server berekent. Die indicatoren worden op de backend berekend en niet door het model, zodat ze consistent zijn over runs heen: rsi14, ema8 versus ema24, atrPct en realizedVolPct, efficiencyRatio, rangePos van 0 op de bodem tot 1 op de top, volRatio, flowBuyPct, en een regime-tag van trending-up, trending-down, ranging of volatile.",
        "Cruciaal is dat de analist niet stateless is. Hij krijgt een trading-geheugenblok: gerealiseerde PnL van vandaag in XLM, ongerealiseerde PnL op open posities, je huidige posities, en recente trades die elk zijn voorzien van hun richting-gecorrigeerde procentuele beweging op plus-1u en plus-24u. Met die uitkomsten na de trade kan hij beoordelen of recente entries echt werkten in plaats van een grafiek in een vacuum opnieuw te draaien. Hij krijgt ook het actieve risicoprofiel te horen en de effectieve size-limiet per trade voor precies dat paar, zodat zijn voorgestelde hoeveelheid begrensd is voordat het beleid hem ooit ziet.",
        "Alles bij elkaar leest een enkele run ongeveer zo: haal holdings en offers op, haal het boek op, haal candles en indicatoren op, vouw het geheugen erin van hoe de laatste entries uitpakten, en beslis dan of het huidige regime en het boek een entry rechtvaardigen die de wallet ook echt binnen de size-limiet kan funden. Als niets die lat haalt, levert de analist voor dat paar geen voorstel terug, wat een normale en frequente uitkomst is.",
      ],
      example: "Een Scan-de-chain-run op XLM/USDC: get_market geeft beste bid 0.1176 en ask 0.1182 terug, get_price_history geeft regime ranging terug met rangePos 0.18, rsi14 41, ema8 die net boven ema24 kruist, flowBuyPct 0.61. Het geheugenblok toont dat de laatste twee dip-buys er op plus-1u plus 0.3 procent bij wonnen. De limiet per trade is 50 XLM. De analist stuurt een buy-voorstel van 40 XLM uit.",
    },
    {
      id: "c10-l2",
      title: "In een AI-voorstel: confidence-score, redenering, risico-momentopname, prijs",
      paragraphs: [
        "Elk voorstel wordt uitgestuurd via de tool propose_stellar_trade als een gestructureerd object, nooit als vrije tekst, zodat de backend er deterministisch op kan handelen. Het object draagt richting (buy of sell), de base- en quote-assets, een hoeveelheid, een limit_price, een post_only-vlag, een max_slippage_bps, een geschreven reden, een numerieke confidence-score van 0 tot 100, een target_price, een invalidation_price, en een optionele horizon uitgedrukt in uren, dagen of weken.",
        "Het confidence-veld is een recente en belangrijke wijziging: het is nu een numerieke score van 0 tot 100, geen label van laag, gemiddeld of hoog. Die precisie is belangrijk omdat Expert Mode de score rechtstreeks vergelijkt met jouw exacte minConfidence-drempel. Als de score tekortschiet, wordt het voorstel vastgehouden voor review en wordt er een event weggeschreven, bijvoorbeeld Proposal skipped: confidence 68 < threshold 70. Een ontbrekende of corrupte confidence faalt altijd dicht, dus een onjuist gevormde score wordt behandeld als een reject in plaats van een pass.",
        "De post_only-vlag codeert de maker-first-intentie. Als die gezet is, blijft de order op de touch liggen om de spread te vangen als maker, in plaats van het boek te kruisen en de taker-kant te betalen. Samen gelezen met max_slippage_bps begrenzen deze twee velden de uitvoeringskwaliteit: post_only wil de spread verdienen, terwijl de slippage-limiet begrenst hoe ver een kruisende fill mag afdrijven als het boek beweegt.",
        "De reden, target_price en invalidation_price vormen samen de these en de bijbehorende exit-kaart. De backend leidt een reward-to-risk-ratio af uit de afstand tussen limit_price en target_price versus limit_price en invalidation_price, en handhaaft een minimumratio (standaard 1.2) voordat de trade wordt toegestaan. Naast het voorstel wordt de volledige momentopname van het risicoprofiel gelogd zodat de condities controleerbaar zijn: de AI-log registreert per run een proposal-event en een risk_profile-event, en legt het actieve per-factor-profiel en de effectieve limieten op dat moment vast.",
      ],
      example: "Een propose_stellar_trade-payload: richting sell, base XLM, quote USDC, hoeveelheid 30, limit_price 0.1205, post_only true, max_slippage_bps 40, confidence 74, target_price 0.1232, invalidation_price 0.1188. Reward-to-risk is ongeveer 1.6, ruim boven het minimum van 1.2, en 74 haalt een minConfidence van 70, dus het voorstel passeert de poort en wordt gelogd met zijn risk_profile-momentopname.",
    },
    {
      id: "c10-l3",
      title: "Wanneer je een AI-voorstel accepteert en wanneer je het afwijst",
      paragraphs: [
        "Accepteren is een oordeel over drie dingen die het voorstel je aanreikt: de reden, de confidence-score, en de reward-to-risk van target versus invalidation. Een voorstel verdient acceptatie wanneer de geschreven reden netjes aansluit op de indicatoren en het boek die je kunt verifieren, de confidence comfortabel boven je drempel zit in plaats van er net langs te schuren, en de afstand tot target_price betekenisvol groter is dan de afstand tot invalidation_price. Als een van de drie zwak is, kijk je naar een marginaal idee, zelfs als de backend het technisch zou doorlaten.",
        "Fundability is de harde poort die mensen vergeten. Om het base-asset te BUYen moet je het quote-asset bezitten, en om te SELLen moet je het base-asset bezitten. De saldocontrole vooraf blokkeert een onfundbare trade, maar je moet er niet op leunen; een wallet met alleen XLM kan geen enkel buy-voorstel funden, hoe sterk de these ook is, en dat is precies de wallet-positionerings-valstrik die een gezonde analist nietsdoend doet lijken. Als je wilt dat de analist op dip-buying handelt, moet je eerst wat quote-asset bezitten. Daarom verzamelt een wallet met alleen base-asset onfundbare buy-voorstellen, terwijl elke fundbare sell nog steeds wordt uitgevoerd: de gemiste kansen zijn positioneringsmissers, niet het model dat te voorzichtig is.",
        "Wijs resoluut af wanneer de these dun is, wanneer de numerieke score onder of nauwelijks op je drempel zit, wanneer de limit_price al is weggelopen van waar de reden op gebouwd was, of wanneer accepteren je te zeer in een asset zou concentreren. In de modus elke trade goedkeuren wordt er niets ingediend tot je klikt, dus een reject kost je niets en houdt je beslissingshistorie schoon en betekenisvol voor latere review.",
        "Onthoud dat de backend het beleid hoe dan ook handhaaft, ongeacht jouw inschatting. Zelfs een voorstel waar je dol op bent moet de whitelist halen, de size-limiet per trade, de dagelijkse volume-, trade- en verlieslimieten, de slippage-grens, de minimale reward-to-risk-ratio, de blootstellingslimieten, de 24u-drawdown-pauze, en de saldocontrole vooraf. Jouw accept is groen licht, geen override; de poorten zijn het vangnet.",
      ],
      example: "De analist stelt voor om 40 XLM te kopen op 0.1180, confidence 82, target 0.1240, invalidation 0.1160, reward-to-risk ongeveer 3.0, reden een dunner wordende ask met flowBuyPct 0.66. De these, de score en de reward-to-risk houden allemaal stand, maar je wallet is 600 XLM en 0 USDC, dus het is onfundbaar; de saldocontrole vooraf zou het blokkeren en de juiste zet is eerst USDC aanhouden als je wilt dat deze buy-kant wordt uitgevoerd.",
    },
    {
      id: "c10-l4",
      title: "Hoe de AI en handmatig handelen op elkaar inwerken: voorrang, conflicten, samenleven",
      paragraphs: [
        "Handmatige en AI-trades lopen door een uitvoeringsengine en delen dezelfde veiligheidspoorten, maar ze verschillen op een bewuste manier: een handmatige order OMZEILT de AI-size-limiet per trade. De size-limiet bestaat om te begrenzen wat de analist namens jou sizet, dus wanneer je een order met de hand plaatst sizede je hem zelf en geldt de limiet niet. Elke andere poort geldt nog steeds, dus een handmatige order kan nooit de whitelist, slippage, verlieslimieten, drawdown-pauze of saldocontrole vooraf overslaan.",
        "Risicoverlagende exits hebben voorrang op goedkeuringsfrictie. Een stop-loss-close die een open positie verkleint, voert zichzelf meteen uit, zelfs in de modus elke trade goedkeuren, want de bot laat je niet zitten wachten om het uitstappen uit een verliesgevende positie goed te keuren. Entries en bijkopen wachten op je goedkeuring waar de modus dat vereist; beschermende exits doen dat niet, en die asymmetrie is opzettelijk zodat bescherming nooit achter een klik zit die je zou kunnen missen.",
        "AI- en handmatige stop losses leven samen in plaats van te vechten. Als je een handmatige stop hebt ingesteld en de analist er ook een draagt, handhaaft de monitor de meest beschermende van de twee, oftewel de stop die eerder uitstapt bij ongunstige beweging wint. Je eindigt nooit met een lossere AI-stop die een strakkere handmatige overschrijft; bescherming schuift altijd richting veiligheid. Dezelfde logica geldt als je een handmatige stop aanscherpt nadat de analist zijn eigen heeft gezet: de monitor volgt simpelweg het niveau dat nu dichterbij ligt, dus handmatig ingrijpen kan bescherming strenger maken maar nooit losser.",
        "Omdat beide stromen je echte saldi en limieten delen, werken ze op elkaar in via de wallet zelf. Een handmatige buy verbruikt quote-asset en verkleint de ruimte die overblijft onder de size-limiet voor het volgende idee van de analist; een handmatige sell maakt quote-asset vrij die daarna een AI-buy kan funden. De historietabel labelt elke fill als Handmatig of Bot zodat je kunt reconstrueren wie wat deed, en de kill switch staat boven beide en blokkeert alle handel ongeacht de bron.",
      ],
      example: "De modus is Live met elke trade goedkeuren. Je verkoopt handmatig 200 XLM voor USDC, gesizet boven de AI-limiet per trade, wat is toegestaan omdat handmatige orders die ene limiet omzeilen. De prijs zakt dan in je open long en een stop-loss-close vuurt af; die voert zichzelf uit zonder op goedkeuring te wachten omdat hij risico verlaagt. De handmatige stop op 0.1170 en de AI-stop op 0.1165 leven samen, en de monitor handhaaft 0.1170 als de meer beschermende.",
    },
    {
      id: "c10-l5",
      title: "Hoe je de AI-log leest en de beslissingshistorie interpreteert",
      paragraphs: [
        "De AI-log staat onder de Logs-tab in zijn eigen AI-log-subtab. Hij is gepagineerd en filterbaar op event-type, op token en op datum, en elke rij toont de redenering, de momentopname van het risicoprofiel, de confidence, de richting en de prijs voor dat event. Hem goed lezen betekent dat je hem behandelt als het redeneerspoor van de analist, niet alleen als een lijst fills.",
        "Leer het event-vocabulaire, want elk type vertelt een ander deel van het verhaal. Een proposal-event is een idee dat de analist uitstuurde; accepted en rejected registreren wat ermee gebeurde; risk_constraint markeert een voorstel dat een beleidspoort blokkeerde, zoals een size-limiet of een mislukte reward-to-risk; stop_loss registreert een beschermende exit; trail_update toont een trailing stop die meeschuift; cooldown toont dat de analist werd belet hetzelfde paar en dezelfde richting te snel opnieuw voor te stellen; en risk_profile legt het actieve profiel en de effectieve limieten vast op het moment van de run.",
        "De meest informatieve aflezingen koppelen events aan elkaar. Een proposal die onmiddellijk wordt gevolgd door een risk_constraint vertelt je dat het idee gezond was maar het beleid het stopte, wat een afstemmingssignaal is in plaats van een modelfout. Een run die helemaal geen proposal logt, of een proposal skipped-regel zoals confidence 68 < threshold 70, vertelt je dat de analist keek en afzag, wat precies is wat je het grootste deel van de tijd wilt zien. Een lange reeks onfundbare buys zonder fills is de wallet-positioneringssignatuur, geen overdreven voorzichtigheid.",
        "De altijd-aanwezige LiveLogDrawer vult de volledige log aan door de laatste ongeveer 20 gecombineerde events met deep-links te tonen, zodat je een blik op recente activiteit kunt werpen zonder de Logs-tab te openen en meteen naar de volledige entry kunt springen wanneer iets het onderzoeken waard lijkt. Gebruik de drawer voor live monitoring en de AI-log-subtab voor forensische review, filterend op token en datum wanneer je de beslissingshistorie van een enkel paar van begin tot eind wilt reconstrueren.",
      ],
      example: "De AI-log filteren op XLM over een dag toont: een risk_profile-event dat het actieve profiel vastlegt, dan een proposal buy op confidence 74, dan een risk_constraint die reward-to-risk 1.05 onder minimum 1.2 afleest, dus geen fill. Een uur later blokkeert een cooldown-event een vrijwel identieke buy. Het spoor vertelt je dat de analist actief en redelijk was, en dat het beleid, niet het model, je vlak hield.",
    },
  ],
  quiz: [
    {
      id: "c10-q1",
      prompt: "Welke set inputs ontvangt de analist daadwerkelijk bij een run?",
      options: [
        { text: "Alleen de ruwe OHLC-candles, met alle indicatoren door het model zelf berekend.", explanation: "Onjuist. De indicatoren zoals rsi14, ema8 versus ema24, atrPct, efficiencyRatio, rangePos, volRatio, flowBuyPct en de regime-tag worden server-side berekend en aan de analist aangereikt, niet door het model afgeleid." },
        { text: "Balances en openstaande offers, het orderboek en de depth, candles met server-berekende indicatoren, een trading-geheugenblok met uitkomsten na de trade, en de size-limiet per paar.", explanation: "Juist. De analist verzamelt deze via get_account_balances, get_market en get_price_history, plus het geheugenblok en de effectieve limiet per trade voor het paar." },
        { text: "Een continue prijsstroom die hij tick voor tick volgt.", explanation: "Onjuist. De analist is geen streaming-proces; hij draait op losse triggers (Analyze, Scan de chain of de auto-scan-timer) en leest elke keer een momentopname." },
        { text: "Je provider-API-sleutel plus de grafiek, en niets over je bestaande posities.", explanation: "Onjuist. De analist krijgt je posities, gerealiseerde en ongerealiseerde PnL, en recente uitkomsten na de trade gevoerd; de ruwe API-sleutel is nooit een beslissingsinput." },
      ],
      correctIndex: 1,
    },
    {
      id: "c10-q2",
      prompt: "Hoe wordt in Expert Mode het confidence-veld van het voorstel behandeld?",
      options: [
        { text: "Het is een label van laag, gemiddeld of hoog dat verwijst naar een auto-uitvoeringsniveau.", explanation: "Onjuist. Dat is de label-poort uit de basismodus; het veld is nu een numerieke score van 0 tot 100, en Expert Mode vergelijkt die met een exacte drempel." },
        { text: "Het is een numerieke score van 0 tot 100 die wordt vergeleken met jouw exacte minConfidence; onder de drempel wordt het vastgehouden en gelogd, en een ontbrekende of corrupte waarde faalt dicht.", explanation: "Juist. Expert Mode doet een precieze numerieke vergelijking, schrijft een skip-regel als confidence 68 < threshold 70 wanneer het tekortschiet, en behandelt een onjuist gevormde score als een reject." },
        { text: "Het is een winkans die de backend gebruikt om de order te sizen.", explanation: "Onjuist. Confidence is overtuiging, geen kans, en het sizet de order niet; de size-limiet per trade en jouw hoeveelheid doen dat." },
        { text: "Het wordt volledig genegeerd zodra reward-to-risk slaagt.", explanation: "Onjuist. De confidence-poort staat los van de reward-to-risk-controle; beide moeten slagen, en de score wordt sowieso gelogd." },
      ],
      correctIndex: 1,
    },
    {
      id: "c10-q3",
      prompt: "Een voorstel heeft een sterke reden, confidence 82, en reward-to-risk rond 3.0, maar je wallet houdt alleen XLM aan en het voorstel is een buy van XLM met USDC. Wat moet je concluderen?",
      options: [
        { text: "Het is onfundbaar; de saldocontrole vooraf blokkeert het, en om op de buy-kant te handelen moet je eerst wat USDC aanhouden.", explanation: "Juist. Kopen vereist dat je het quote-asset bij de hand hebt. Een wallet met alleen XLM kan een USDC-gequote buy niet funden, en dat is de wallet-positionerings-valstrik, geen overdreven voorzichtigheid." },
        { text: "Accepteer het; een hoge score en goede reward-to-risk overschrijven de noodzaak om het quote-asset aan te houden.", explanation: "Onjuist. Geen enkele score overschrijft fundability. Om het base-asset te kopen moet je het quote-asset aanhouden, hier USDC." },
        { text: "De backend converteert je XLM automatisch naar USDC om de buy te funden.", explanation: "Onjuist. Er is geen stille auto-conversie om een voorstel te bedienen; de saldocontrole vooraf blokkeert simpelweg een onfundbare trade." },
        { text: "Wijs het af omdat confidence 82 te hoog is om te vertrouwen.", explanation: "Onjuist. Een hoge score is geen reden om af te wijzen; de echte blokkade hier is fundability, niet de sterkte van de these." },
      ],
      correctIndex: 0,
    },
    {
      id: "c10-q4",
      prompt: "Hoe verschillen handmatige orders en AI-orders en hoe leven ze samen in de uitvoeringsengine?",
      options: [
        { text: "Handmatige orders slaan alle veiligheidspoorten over zodat je sneller kunt handelen.", explanation: "Onjuist. Handmatige orders passeren dezelfde poorten als AI-orders; ze omzeilen alleen de AI-size-limiet per trade, niets anders." },
        { text: "Een stop-loss-close moet altijd handmatig worden goedgekeurd, zelfs in automodi.", explanation: "Onjuist. Risicoverlagende exits, inclusief stop-loss-closes, voeren zichzelf meteen uit, zelfs in de modus elke trade goedkeuren." },
        { text: "Handmatige orders omzeilen de AI-size-limiet per trade, risicoverlagende exits voeren zichzelf uit zelfs in de modus elke trade goedkeuren, en als beide stops zetten handhaaft de monitor de meest beschermende.", explanation: "Juist. Handmatige sizing is van jou dus de AI-size-limiet geldt niet, exits wachten nooit op goedkeuring, en stops schuiven richting het strakkere, meer beschermende niveau." },
        { text: "Als zowel een AI- als een handmatige stop bestaat, wint de lossere AI-stop.", explanation: "Onjuist. De monitor handhaaft de meest beschermende stop, dus de strakkere wint, nooit de lossere." },
      ],
      correctIndex: 2,
    },
    {
      id: "c10-q5",
      prompt: "In de AI-log zie je een proposal-event dat onmiddellijk wordt gevolgd door een risk_constraint-event dat reward-to-risk 1.05 onder minimum 1.2 afleest. Wat vertelt dit je?",
      options: [
        { text: "De analist is stuk en produceerde een ongeldig voorstel.", explanation: "Onjuist. Het voorstel was correct gevormd; een beleidspoort, geen modelfout, weerhield het van uitvoering." },
        { text: "Een whitelist-overtreding blokkeerde de trade.", explanation: "Onjuist. De gelogde constraint is een reward-to-risk-tekort, geen whitelist-afwijzing; dat zijn aparte poorten en de log noemt welke afvuurde." },
        { text: "De trade filde maar tegen een slechtere prijs dan bedoeld.", explanation: "Onjuist. Een risk_constraint-event betekent dat de trade werd geblokkeerd voor uitvoering, dus er was helemaal geen fill." },
        { text: "Het idee was gezond maar het beleid blokkeerde het omdat reward-to-risk onder het minimum van 1.2 zakte, dus er was geen fill; het is een afstemmingssignaal, geen modelfout.", explanation: "Juist. Het koppelen van de proposal aan de risk_constraint toont beleidshandhaving, geen overdreven voorzichtigheid. Het reward-to-risk-minimum hield je vlak, en dat is zichtbaar en controleerbaar in de log." },
      ],
      correctIndex: 3,
    },
  ],
};
