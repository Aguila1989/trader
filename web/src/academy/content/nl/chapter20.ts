import type { Chapter } from "../../types";

export const chapter20: Chapter = {
  id: "c20",
  number: 20,
  level: "ADVANCED",
  title: "AI-trustlinesuggesties lezen",
  description: "Hoe de wekelijkse scan tokens scoort, wat een TOML-bestand is, hoe je een verslechteringswaarschuwing leest, waarom een volumepiek een valstrik kan zijn, en waarom een suggestie een startpunt is — geen oordeel.",
  lessons: [
    {
      id: "c20-l1",
      title: "Hoe de app tokens scoort als trustline-kandidaten",
      paragraphs: [
        "Eén keer per week analyseert de app de belangrijkste Stellar-tokens (plus de tokens die je al aanhoudt) en vraagt de AI om elk token te scoren als trustline-kandidaat. Elk token krijgt vier scores van 1 tot 10, plus een totaalscore die ze samenvat. De vier zijn liquiditeit, legitimiteit, trend en risico.",
        "Liquiditeit geeft aan hoe gemakkelijk je het token zou kunnen verhandelen — het reële volume tegenover XLM en de diepte van het orderboek. Legitimiteit beoordeelt hoe geloofwaardig het project oogt: een gepubliceerde stellar.toml, een echt home-domein, een bekende issuer, echte adoptie. Trend beoordeelt de recente prijsrichting over 7 dagen. Risico wordt zo gescoord dat hoger veiliger is — een 10 betekent het laagste risico, een 1 betekent zeer riskant.",
        "Omdat risico \"hoger = veiliger\" is, wijzen alle vier de scores en de totaalscore dezelfde kant op: groter is beter. De totaalscore is het oordeel van de AI in één oogopslag, maar de vier componenten vertellen je waarom. Een token kan uitstekende liquiditeit hebben maar toch een lage legitimiteitsscore, en precies die combinatie is wat de uitsplitsing aan het licht moet brengen.",
      ],
      example: "Een suggestiekaart toont USDC met Totaal 9, en daaronder Liquiditeit 9, Legitimiteit 10, Trend 7, Veiligheid 9. Een andere kaart toont een nieuw token met Totaal 4: Liquiditeit 6 maar Legitimiteit 2 en Veiligheid 3. De totaalcijfers alleen zouden je naar de eerste verleiden; de uitsplitsing legt precies uit waarom de tweede laag scoort ondanks behoorlijke liquiditeit.",
    },
    {
      id: "c20-l2",
      title: "Wat is een TOML-bestand en waarom maakt het uit als het ontbreekt?",
      paragraphs: [
        "Een stellar.toml is een klein openbaar bestand dat een issuer host op zijn home-domein (bijvoorbeeld op example.com/.well-known/stellar.toml). Daar verklaart een legitiem project zichzelf: de naam van de organisatie, de website, de contactgegevens en de exacte uitgevende accounts voor zijn tokens. Het is het equivalent op de chain van een verifieerbaar visitekaartje.",
        "De scan haalt dit bestand op voor elk token. Als het bestaat, kan de app je de projectnaam, beschrijving en website op de suggestiekaart tonen, en kun je dubbelchecken of de issuer in het bestand overeenkomt met de issuer die je zou vertrouwen. Als het ontbreekt, is niets daarvan mogelijk — je zou een issuer vertrouwen die ervoor heeft gekozen zichzelf niet kenbaar te maken.",
        "Daarom wordt een ontbrekende TOML als een rode vlag behandeld in plaats van als een neutraal feit. Het bewijst niet dat een token een scam is, maar het neemt de gemakkelijkste manier weg om het project te verifiëren, en het is een sterke reden om voorzichtig te zijn. Een token dat een TOML verliest die het eerder had, wordt als nog zorgwekkender beschouwd, omdat iets wat gedocumenteerd was nu onzichtbaar is geworden.",
      ],
      example: "Eén suggestie toont \"Project: Aquarius — aqua.network\" rechtstreeks opgehaald uit de TOML van de issuer, en de issuer-sleutel in het bestand komt overeen met die op de kaart. Een tweede suggestie toont \"Geen stellar.toml gevonden\" met een bijbehorende rode vlag. Dezelfde scan, zeer verschillende niveaus van verifieerbare identiteit.",
    },
    {
      id: "c20-l3",
      title: "Hoe je een verslechteringswaarschuwing interpreteert",
      paragraphs: [
        "Suggesties wijzen naar tokens die je zou kunnen toevoegen; waarschuwingen wijzen naar tokens die je al aanhoudt en waarvan de situatie sinds vorige week is verslechterd. Elke waarschuwing somt de specifieke triggers op die zijn afgegaan, zodat je nooit hoeft te gissen waarom een token gemarkeerd werd. De bot waarschuwt alleen — hij zal nooit een trustline voor je verwijderen.",
        "Er zijn zeven triggers. Scoredaling: de totaalscore daalde week op week met twee of meer punten. Lage liquiditeit: de liquiditeitsscore is lager dan 3. Volumedaling: het 7-daagse volume daalde met meer dan de helft. Nieuwe rode vlaggen: er verscheen een vlag die er eerder niet was. Minder holders: het aantal trustlines daalde met meer dan 10%. TOML verdwenen: een stellar.toml die er eerder was, is niet langer bereikbaar. Trend omlaag: de prijstrend sloeg om van stijgend of stabiel naar dalend.",
        "Eén enkele trigger is een aansporing om te kijken; meerdere tegelijk is een luider signaal. De kaart toont ook je huidige saldo en de geschatte XLM-waarde ervan, zodat je kunt afwegen hoeveel er werkelijk op het spel staat voordat je beslist om te onderzoeken, aan te houden, te verminderen of uit te stappen. Je kunt een waarschuwing zeven dagen snoozen als je hem hebt bekeken en er later op terug wilt komen.",
      ],
      example: "Een token dat je aanhoudt toont twee triggers: \"Volumedaling\" en \"Minder holders\". De kaart vermeldt dat het 7-daagse volume met 64% daalde en het aantal trustline-holders met 18% (5.000 → 4.100), terwijl je saldo van 1.200 ongeveer 90 XLM waard is. Twee onafhankelijke tekenen dat een project terrein verliest, plus een reëel bedrag dat op het spel staat — een duidelijke aanleiding om te onderzoeken in plaats van te negeren.",
    },
    {
      id: "c20-l4",
      title: "Wat is een volumepiek zonder fundamentals?",
      paragraphs: [
        "Handelsvolume is meestal een gezond teken, maar een plotselinge piek met niets reëels erachter is het tegenovergestelde. Een volumepiek zonder fundamentals is een uitbarsting van handel die niet gepaard gaat met enige verbetering in de zaken die een token waarde geven — geen extra holders, geen projectnieuws, geen dieper orderboek, vaak helemaal geen identificeerbare issuer.",
        "Het is een klassiek manipulatiepatroon. Een handvol accounts kan een token heen en weer wash-traden om volume te fabriceren en het hoog te laten ranken, in de hoop dat de activiteit zelf kopers lokt. De prijs schiet omhoog op de kunstmatige interesse, insiders verkopen in de nieuwe vraag, en het volume verdwijnt net zo snel als het verscheen.",
        "Daarom wordt de AI geïnstrueerd om een volumepiek zonder fundamentals als een rode vlag te markeren in plaats van hem te belonen. Volume betekent alleen iets als het ondersteund wordt door echte adoptie en liquiditeit. Wanneer de score-uitsplitsing een hoog recent volume toont maar zwakke legitimiteit en weinig holders, is die mismatch het verraderlijke teken.",
      ],
      example: "Een token schiet omhoog in de wekelijkse ranking op een 20x volumesprong, maar het aantal holders blijft vlak op 40, het heeft geen stellar.toml en het orderboek is flinterdun. De AI scoort de trend hoog maar de legitimiteit en veiligheid laag, en voegt de rode vlag \"plotselinge volumepiek zonder fundamentals\" toe. Het volume is echt; de substantie erachter niet.",
    },
    {
      id: "c20-l5",
      title: "AI-suggesties gebruiken als startpunt, niet als eindantwoord",
      paragraphs: [
        "De scan is een onderzoeksassistent, geen orakel. Hij comprimeert veel on-chain data tot een paar scores zodat je snel kunt trieëren, maar hij werkt met beperkte, openbare signalen en het oordeel van een taalmodel. Hij kan de werkelijke bedoelingen van een issuer niet kennen of het nieuws van morgen lezen. Een hoge score verkleint je shortlist; hij certificeert geen token.",
        "Elke suggestiekaart draagt om een reden dezelfde disclaimer: een trustline toevoegen is altijd een risico, het reserveert 0,5 XLM, en het stelt je bloot aan de issuer. Voeg nooit een trustline toe louter op basis van de suggestie. Gebruik hem om te beslissen wat het onderzoeken waard is, en verifieer dan zelf de issuer, de TOML, de holders en de liquiditeit.",
        "Behandel de scores als een aanzet tot gesprek met je eigen due diligence. De sterkste werkwijze is: laat de scan kandidaten naar boven brengen, lees de uitsplitsing en de rode vlaggen, bevestig de feiten onafhankelijk, en beslis pas dan. De uiteindelijke beslissing — en de verantwoordelijkheid — is altijd de jouwe.",
      ],
      example: "De scan stelt een token voor met Totaal 8. In plaats van het meteen toe te voegen, open je de website via de TOML, bevestig je dat de issuer-sleutel overeenkomt, bekijk je de holdertrend over meerdere weken, en controleer je of het XLM-orderboek werkelijk diep is. Alles houdt stand, dus voeg je de trustline weloverwogen toe — de suggestie startte het proces, je eigen onderzoek maakte het af.",
    },
  ],
  quiz: [
    {
      id: "c20-q1",
      prompt: "Wat betekent een hoge risico- (veiligheids)score op een suggestiekaart?",
      options: [
        { text: "Het token is zeer riskant — hoger betekent meer gevaar.", explanation: "Onjuist. De schaal is omgekeerd ten opzichte van die intuïtie: in deze app is de risico-/veiligheidsscore hoger = veiliger." },
        { text: "Het token is minder riskant — 10 betekent het laagste risico, 1 betekent zeer riskant.", explanation: "Juist. Risico wordt zo gescoord dat hoger veiliger is, waardoor alle vier de scores en de totaalscore dezelfde kant op wijzen: groter is beter." },
        { text: "Risico heeft niets te maken met de totaalscore.", explanation: "Onjuist. Risico is een van de vier componenten die de totaalscore bepalen." },
      ],
      correctIndex: 1,
    },
    {
      id: "c20-q2",
      prompt: "Waarom telt een ontbrekende stellar.toml als een rode vlag?",
      options: [
        { text: "Omdat het token zonder TOML automatisch een scam is.", explanation: "Onjuist. Een ontbrekende TOML bewijst geen fraude — maar het neemt de gemakkelijkste manier weg om het project te verifiëren, en daarom wordt het voorzichtig behandeld." },
        { text: "Omdat het de belangrijkste manier wegneemt om de issuer en het project te identificeren en te verifiëren.", explanation: "Juist. De TOML is waar een issuer zijn identiteit, website en uitgevende sleutels verklaart; zonder die vertrouw je een issuer die zichzelf niet kenbaar heeft gemaakt." },
        { text: "Omdat het de reserve van 0,5 XLM groter maakt.", explanation: "Onjuist. De reserve is altijd 0,5 XLM per trustline, ongeacht of er een TOML bestaat." },
      ],
      correctIndex: 1,
    },
    {
      id: "c20-q3",
      prompt: "De waarschuwing voor een aangehouden token vermeldt 'Volumedaling' en 'Minder holders'. Wat moet je concluderen?",
      options: [
        { text: "De bot heeft het token al verkocht om je te beschermen.", explanation: "Onjuist. De bot waarschuwt alleen; hij verwijdert nooit een trustline of verkoopt op basis van een waarschuwing. De beslissing is aan jou." },
        { text: "Twee onafhankelijke tekenen dat het project terrein verliest — een aanleiding om te onderzoeken.", explanation: "Juist. Elke trigger is een specifiek verslechteringssignaal; meerdere samen is een sterkere aansporing om te onderzoeken en te beslissen wat te doen." },
        { text: "Niets — waarschuwingen zijn willekeurig en kunnen genegeerd worden.", explanation: "Onjuist. Elke trigger komt overeen met een concrete drempel die in de week-op-week data overschreden is." },
      ],
      correctIndex: 1,
    },
    {
      id: "c20-q4",
      prompt: "Wat is een 'volumepiek zonder fundamentals'?",
      options: [
        { text: "Een uitbarsting van handel die niet gepaard gaat met meer holders, diepere liquiditeit of een geloofwaardige issuer.", explanation: "Juist. De activiteit is gefabriceerd (vaak wash trading) in plaats van ondersteund door echte adoptie, dus wordt hij gemarkeerd in plaats van beloond." },
        { text: "Een gestage, langetermijnstijging in volume samen met een groeiend aantal holders.", explanation: "Onjuist. Dat is gezonde, fundamenteel ondersteunde groei — het tegenovergestelde van de rode vlag." },
        { text: "Een daling in volume veroorzaakt door een marktbrede neergang.", explanation: "Onjuist. Het patroon is een piek omhoog in volume zonder substantie, niet een daling." },
      ],
      correctIndex: 0,
    },
    {
      id: "c20-q5",
      prompt: "Hoe moet je een hoog scorende AI-suggestie behandelen?",
      options: [
        { text: "Als een gecertificeerd veilig token dat je zonder verder nadenken kunt toevoegen.", explanation: "Onjuist. De scan werkt met beperkte openbare signalen; hij kan een token niet certificeren, en elke kaart waarschuwt ertegen om alleen op basis van de suggestie toe te voegen." },
        { text: "Als een startpunt voor je eigen onderzoek — verifieer de issuer, TOML, holders en liquiditeit voordat je beslist.", explanation: "Juist. Een hoge score verkleint je shortlist; de onafhankelijke verificatie en de uiteindelijke beslissing blijven aan jou." },
        { text: "Als irrelevant, aangezien AI-scores nooit nuttig zijn.", explanation: "Onjuist. De scores zijn een nuttig triagemiddel — ze zijn alleen geen vervanging voor due diligence." },
      ],
      correctIndex: 1,
    },
  ],
};
