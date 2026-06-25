import type { Chapter } from "../../types";

export const chapter12: Chapter = {
  id: "c12",
  number: 12,
  level: "EXPERT",
  title: "Geavanceerde Stellar-functies",
  description:
    "Duik dieper in het SDEX-orderboek, trustlines, path payments, AMM-pools en het terugbrengen van je posities naar XLM.",
  lessons: [
    {
      id: "c12-l1",
      title: "Wat is de SDEX (Stellar Decentralized Exchange)?",
      paragraphs: [
        "De SDEX is de Stellar Decentralized Exchange, een orderboek dat rechtstreeks in het Stellar-protocol is ingebouwd. Er is geen apart bedrijf dat hem beheert: iedereen met een account kan koop- of verkooporders plaatsen, en die orders matchen on-chain met elkaar. Elke markt, zoals XLM tegen USDC, heeft zijn eigen orderboek met openstaande orders die wachten om gevuld te worden.",
        "Deze bot doet al zijn geautomatiseerde trading op het SDEX-orderboek en plaatst daar limit- en market-orders. Hij handelt niet op een gecentraliseerde exchange en hij stuurt de trading-loop niet via liquidity pools. Wanneer de AI besluit te handelen, plaatst hij een order op de relevante SDEX-markt en laat het protocol die matchen.",
        "Een kenmerkend detail is hoe de bot instapt: hij gebruikt maker-first execution. In plaats van de spread te kruisen en de prijs te betalen die de andere kant vraagt, plaatst hij liever zijn eigen order op de huidige beste bid of ask. Door als maker op het orderboek te blijven staan, probeert hij de spread te vangen in plaats van die te betalen, wat enorm uitmaakt wanneer de edge maar een paar basispunten breed is.",
      ],
      example:
        "Stel dat het XLM/USDC-orderboek een beste bid van 0.1170 en een beste ask van 0.1180 toont. Om XLM te kopen betaalt een maker-first bot niet de ask van 0.1180. In plaats daarvan plaatst hij zijn eigen kooporder op 0.1170 en voegt zich bij de bid-kant. Als er een verkoper langskomt die die order raakt, koopt de bot op 0.1170 en steekt de spread in eigen zak, in plaats van naar 0.1180 te kruisen en die weg te geven.",
    },
    {
      id: "c12-l2",
      title: "Wat is een trustline en wanneer heb je er een nodig?",
      paragraphs: [
        "Een trustline is een expliciete opt-in waarmee je Stellar-account een specifieke niet-native asset van een specifieke uitgever mag aanhouden. Assets op Stellar worden gedefinieerd door een code plus het account dat ze heeft uitgegeven, dus USDC uitgegeven door Circle is iets anders dan elke andere token die zichzelf ook USDC noemt. Voordat je account een asset kan ontvangen of aanhouden, moet je een trustline openen naar exact dat paar van code en uitgever.",
        "De enige asset die nooit een trustline nodig heeft is XLM, de native lumen. Al het andere wel. Je voegt trustlines toe en verwijdert ze vanuit het dashboard, en de balanscontrole vooraf van de app verifieert dat er al een trustline bestaat voor elke asset die een trade zou ontvangen, zodat een aankoop geen asset kan binnenhalen waarvoor je geen line hebt om hem aan te houden.",
        "Trustlines zijn in zekere zin niet gratis: elke open trustline verhoogt de minimale XLM-reserve van je account een beetje. Die reserve staat vast en kan niet worden uitgegeven of verhandeld zolang de line open is. Het is dus de moeite waard om trustlines te sluiten voor assets die je niet meer aanhoudt, zowel om een beetje reserve terug te winnen als om je wallet netjes te houden.",
      ],
      example:
        "Je wilt dat de bot USDC van Circle koopt. Eerst open je op het dashboard een trustline naar USDC uitgegeven door het uitgevende account van Circle. Die trustline tilt je minimale XLM-reserve een stukje omhoog en zet een klein beetje XLM vast. Nu komt een aankoop die USDC ontvangt door de balanscontrole vooraf. Als je later al je USDC verkoopt en de trustline sluit, komt die reserve weer vrij.",
    },
    {
      id: "c12-l3",
      title: "Wat is een path payment en hoe gebruikt deze app die?",
      paragraphs: [
        "Een path payment is een Stellar-betaling die de ene asset omzet in een andere asset binnen één atomische transactie, waarbij hij automatisch via een of meer tussenliggende markten hopt om een route te vinden. Je geeft aan wat je wilt sturen en wat je wilt ontvangen, en het netwerk loopt een pad af, bijvoorbeeld van de te sturen asset naar een tussenasset naar de te ontvangen asset, allemaal samen afgewikkeld of helemaal niet.",
        "Deze app gebruikt path payments voor de Swap- en Convert-functie van de wallet, niet voor de geautomatiseerde orderboek-trading-loop. Wanneer je een swap aanvraagt, produceert de app een quote die de route of het pad toont dat hij heeft gevonden en het geschatte bedrag dat je zou ontvangen. Je bekijkt die quote voordat je je vastlegt, zodat je de conversie kunt zien voordat ze gebeurt.",
        "Omdat de hele hop atomisch is, voltooit een path payment ofwel de volledige conversie, ofwel mislukt hij netjes zonder dat er iets verandert. Er is geen risico dat je halverwege omzet en met een ongewenste tussenasset blijft zitten. Dat maakt path payments een net hulpmiddel om te schuiven tussen assets die je daadwerkelijk wilt aanhouden.",
      ],
      example:
        "Je houdt yXLM aan en wilt USDC, maar er is misschien geen diepe directe markt tussen beide. Je vraagt een swap aan. De app geeft een quote terug waarvan het pad yXLM naar XLM en vervolgens XLM naar USDC routeert, met de schatting dat je ongeveer 96 USDC zou ontvangen. Je accepteert, en de path payment voert beide hops uit in één atomische transactie: ofwel eindig je met de USDC, ofwel draait alles terug en houd je je yXLM.",
    },
    {
      id: "c12-l4",
      title: "Wat is een AMM liquidity pool op Stellar?",
      paragraphs: [
        "Naast het orderboek ondersteunt Stellar ook automated market maker-pools. Een AMM liquidity pool houdt twee assets samen, gefinancierd door liquidity providers die beide kanten inleggen. Traders swappen dan tegen de pool in plaats van tegen de order van een andere trader, en de pool prijst elke swap met een constant-product-formule, waarbij het product van de twee reserves ongeveer constant blijft naarmate de ene kant gekocht en de andere verkocht wordt.",
        "Het is belangrijk om duidelijk te zijn over wat deze bot doet. De bot routeert zijn geautomatiseerde trades niet via AMM-pools. Zijn trading-loop bewerkt het SDEX-orderboek en plaatst maker-first orders zoals eerder beschreven. AMM-pools worden hier geïntroduceerd als een algemeen Stellar-concept dat je kunt tegenkomen, niet als een plek waar de strategie van de bot zich op richt.",
        "Er is één subtiele uitzondering die de moeite waard is om te kennen. Path payments, die de Swap-functie aandrijven, kunnen op protocolniveau toevallig via een AMM-pool routeren als het netwerk vindt dat het beste pad daardoor loopt. Dat is het protocol dat een efficiënte route kiest voor een eenmalige conversie, en het staat los van de orderboek-trading die de bot uitvoert in zijn scan-loop.",
      ],
      example:
        "Stel je een XLM/USDC-pool voor met 100000 XLM en 12000 USDC. Een trader swapt wat USDC in, de USDC-reserve van de pool stijgt, zijn XLM-reserve daalt, en de constant-product-regel zet de koers zo dat de prijs opschuift naarmate de tradeomvang groeit. De bot negeert deze pool voor zijn geautomatiseerde trades en plaatst in plaats daarvan orders op het orderboek, al zou een eenmalige Swap-quote een conversie legitiem via zo'n pool kunnen routeren.",
    },
    {
      id: "c12-l5",
      title: "Wat is auto-swap naar XLM en wanneer zou je het gebruiken?",
      paragraphs: [
        "Auto-swap naar XLM betekent dat je je niet-XLM-posities terugbrengt naar XLM met de Swap- en Convert-functie. Omdat die functie op path payments is gebouwd, is auto-swap eigenlijk een gemak bovenop swappen: in plaats van elke token met de hand om te zetten, helpt het verspreide niet-native balansen terug te verzamelen in de native lumen.",
        "Er zijn een paar goede redenen om ernaar te grijpen. Consolideren naar XLM kan de koopkant vrijmaken, want door XLM aan te houden kan de bot XLM in dips verkopen wanneer er een kans opduikt. Het vereenvoudigt ook een rommelige wallet vol kleine restjes tokens, en het kan je XLM-balans aanvullen zodat die de minimale reserve die trustlines en basisvereisten van het account vragen comfortabel dekt.",
        "Beschouw auto-swap als een evoluerende gemaksfunctie en niet als een volledig automatisch achtergrondproces dat je wallet stilletjes leegveegt. Jij houdt de controle: het bouwt voort op dezelfde Swap-quotes die je zelf zou bekijken, zodat je kunt zien wat elke conversie zou opleveren voordat ze gebeurt. Gebruik het bewust, bij het opruimen of herpositioneren, niet als een instelling die je aanzet en vervolgens vergeet.",
      ],
      example:
        "Je wallet bevat 40 USDC, 15 AQUA en een magere 300 XLM die nauwelijks boven je reserve uitkomt. Je wilt de XLM-verkopende koopkant van de bot actief en je reserve comfortabel. Je gebruikt auto-swap naar XLM, wat swap-quotes produceert die de USDC en AQUA omzetten in XLM. Na het accepteren houd je één grotere XLM-balans aan, een nettere wallet, en genoeg speelruimte boven de minimale reserve om trustlines open te houden en vrij te handelen.",
    },
  ],
  quiz: [
    {
      id: "c12-q1",
      prompt: "Wat is de SDEX, en hoe handelt deze bot erop?",
      options: [
        {
          text: "Een gecentraliseerde exchange waarmee de bot verbindt via een API-sleutel en bij elke order de spread kruist.",
          explanation:
            "Onjuist. De SDEX is decentraal en ingebouwd in het protocol, en de bot plaatst maker-orders in plaats van altijd de spread te kruisen.",
        },
        {
          text: "Een decentraal orderboek op protocolniveau waar de bot maker-first orders plaatst om de spread te vangen.",
          explanation:
            "Correct. De SDEX is het ingebouwde on-chain orderboek van Stellar, en de bot plaatst zijn orders liever op de beste bid of ask dan die te kruisen.",
        },
        {
          text: "Een AMM liquidity pool waartegen de geautomatiseerde loop van de bot bij elke trade swapt.",
          explanation:
            "Onjuist. De bot handelt op het orderboek, niet via AMM-pools; pools zijn een apart Stellar-concept.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c12-q2",
      prompt: "Wanneer moet je een trustline openen?",
      options: [
        {
          text: "Voordat je welke asset dan ook aanhoudt of ontvangt, inclusief XLM.",
          explanation:
            "Onjuist. XLM is de native asset en heeft nooit een trustline nodig; alleen niet-native assets wel.",
        },
        {
          text: "Pas nadat een trade al is mislukt bij gebrek aan een trustline.",
          explanation:
            "Onjuist. De balanscontrole vooraf verifieert eerst de trustline, dus de trustline zou voor de trade moeten bestaan, niet na een mislukking.",
        },
        {
          text: "Voordat je account een specifieke niet-native asset van een specifieke uitgever kan aanhouden, zoals USDC van Circle.",
          explanation:
            "Correct. Een trustline is de opt-in voor een specifiek paar van code en uitgever, en elke open trustline verhoogt je minimale XLM-reserve een beetje.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c12-q3",
      prompt: "Wat doet een path payment, en hoe gebruikt deze app die?",
      options: [
        {
          text: "Het zet de ene asset om in een andere in één atomische transactie, en de app gebruikt het voor de Swap- en Convert-functie van de wallet.",
          explanation:
            "Correct. Een path payment hopt atomisch via tussenliggende markten, en de app gebruikt het voor swaps die een route en een geschat ontvangen bedrag tonen, niet voor de orderboek-loop.",
        },
        {
          text: "Het is het mechanisme dat de bot gebruikt voor elke geautomatiseerde orderboek-trade.",
          explanation:
            "Onjuist. De geautomatiseerde trading-loop gebruikt SDEX-orderboekorders; path payments drijven daarentegen de Swap-functie aan.",
        },
        {
          text: "Het splitst een betaling op in meerdere aparte transacties die elk onafhankelijk worden afgewikkeld.",
          explanation:
            "Onjuist. Een path payment is één atomische transactie die ofwel de volledige conversie voltooit, ofwel volledig terugdraait.",
        },
        {
          text: "Het opent automatisch een trustline voor elke asset die je ontvangt.",
          explanation:
            "Onjuist. Trustlines worden apart geopend op het dashboard; een path payment zet assets om, hij maakt geen trustlines aan.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c12-q4",
      prompt: "Wat is een AMM liquidity pool op Stellar, en handelt deze bot er via?",
      options: [
        {
          text: "Het is het belangrijkste orderboek van het protocol, en de bot plaatst al zijn orders daar.",
          explanation:
            "Onjuist. Het orderboek en AMM-pools zijn verschillende mechanismen; de bot plaatst orders op het orderboek, wat geen pool is.",
        },
        {
          text: "Het is een constant-product-pool van twee assets waartegen traders swappen, en de bot routeert zijn geautomatiseerde trades erdoor.",
          explanation:
            "Onjuist. De omschrijving van de pool klopt, maar de bot routeert geautomatiseerde trades niet via pools; hij handelt op het orderboek.",
        },
        {
          text: "Het is een constant-product-pool van twee assets gefinancierd door liquidity providers, en de bot handelt op het orderboek in plaats van geautomatiseerde trades via pools te routeren.",
          explanation:
            "Correct. AMM-pools prijzen swaps met een constant-product-formule, maar de geautomatiseerde loop van de bot gebruikt het SDEX-orderboek; alleen een eenmalige path payment zou toevallig via een pool kunnen routeren.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c12-q5",
      prompt: "Waar dient auto-swap naar XLM vooral voor?",
      options: [
        {
          text: "Niet-XLM-posities terugbrengen naar XLM om de koopkant vrij te maken, de wallet op te ruimen of de reserve aan te vullen.",
          explanation:
            "Correct. Het is een gemak gebouwd op de Swap-functie dat niet-native balansen verzamelt in XLM, wat helpt om te herpositioneren voor het verkopen van XLM, de wallet te vereenvoudigen en de minimale reserve te dekken.",
        },
        {
          text: "Een volledig automatisch achtergrondproces dat stilletjes elke token leegveegt zonder dat je iets bekijkt.",
          explanation:
            "Onjuist. Het is een evoluerend gemak gebouwd op Swap-quotes die je kunt bekijken; het is geen achtergrondproces dat je zonder toezicht laat lopen.",
        },
        {
          text: "Een manier om in bulk trustlines te openen voor nieuwe assets die je wilt gaan verhandelen.",
          explanation:
            "Onjuist. Auto-swap zet posities om in XLM; trustlines openen voor nieuwe assets is een aparte actie op het dashboard.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
