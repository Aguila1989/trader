// Hoofdstuk 39: AI-handel instellen. Zie content/en/chapter39.ts voor de
// structurele toelichting (dit is een natuurlijke vertaling, geen woord-voor-
// woord vertaling).
import type { Chapter } from "../../types";

export const chapter39: Chapter & { whoFor: string } = {
  id: "c39",
  number: 39,
  level: "BASIC",
  whoFor: "Voor Premium-gebruikers die voor het eerst AI-handel instellen",
  title: "AI-handel instellen",
  description:
    "Wat een AI-API-sleutel is, hoe je er een aanmaakt bij Anthropic, OpenAI, Google of DeepSeek, en hoe je begrijpt wat de AI je daadwerkelijk kost.",
  lessons: [
    {
      id: "c39-l1",
      title: "Wat is een AI-API-sleutel en waarom heb je er een nodig?",
      paragraphs: [
        "Wanneer de AI voor jou handelt, draait die niet binnen Atrium zelf — telkens als de AI moet 'nadenken', stuurt Atrium een vraag over het internet naar een aanbieder van grote taalmodellen (een bedrijf zoals Anthropic, OpenAI, Google of DeepSeek), en die aanbieder stuurt een antwoord terug. Die heen-en-terugreis is wat elk AI-handelsvoorstel dat je ziet daadwerkelijk oplevert.",
        "Atrium verkoopt geen AI-toegang door en rekent geen opslag boven op wat die aanbieders vragen. In plaats daarvan brengen Premium-gebruikers hun eigen API-sleutel mee: een account dat je rechtstreeks aanmaakt bij de aanbieder van je keuze, en dat rechtstreeks door die aanbieder wordt gefactureerd. Zo houd jij altijd zelf de controle over welke aanbieder en welk model je AI-handel gebruikt, en kun je je eigen bestedingslimieten rechtstreeks in het dashboard van die aanbieder bekijken en aanpassen, in plaats van te vertrouwen op een opslag van een tussenpartij.",
        "Een API-sleutel kun je het best zien als een persoonlijk wachtwoord voor een betaalde dienst — wie hem heeft, kan geld uitgeven op jouw account bij die aanbieder, dus je moet er even zorgvuldig mee omgaan als met een bankwachtwoord. Het is niet hetzelfde als je Atrium-login, en ook niet hetzelfde als de geheime sleutel van je wallet; hij communiceert uitsluitend met de AI-aanbieder, nooit met het Stellar-netwerk.",
        "Atrium bewaart je API-sleutel versleuteld, met dezelfde AES-256-GCM-versleuteling die al wordt gebruikt om de geheime sleutel van je wallet te beschermen. De sleutel wordt alleen in het geheugen ontsleuteld, voor een fractie van een seconde, op het exacte moment dat de AI een aanvraag moet doen — hij wordt nooit in leesbare vorm teruggeschreven naar schijf, nooit opnieuw getoond op het scherm nadat je hem de eerste keer hebt ingeplakt, en nooit weggeschreven naar enig logbestand.",
        "Je kiest ook het model, niet alleen de provider: in Instellingen > Account > AI API Key staat een optioneel Model-veld. Laat je het leeg, dan gebruikt Atrium een verstandig standaardmodel voor jouw provider; vul je een specifiek model-id in (bijvoorbeeld een goedkopere of juist krachtigere variant), dan draait elk AI-verzoek op precies dat model, op jouw eigen rekening. De knop Test verbinding controleert het model-id samen met je sleutel, zodat een typefout al vóór het opslaan faalt in plaats van bij je eerste tradevoorstel.",
      ],
      example:
        "Zie Atrium als een dispatcher en de AI-aanbieder als de eigenlijke denker: wanneer de AI de markt scant, haalt Atriums server je versleutelde sleutel op, ontsleutelt hem in het geheugen net lang genoeg om één aanvraag te doen bij bijvoorbeeld Anthropic, krijgt een handelssuggestie terug, en gooit de ontsleutelde kopie meteen weg. Je ziet de sleutel nooit meer terug nadat je hem de eerste keer hebt ingetypt, en er verschijnt nergens iets van in de logs van Atrium.",
    },
    {
      id: "c39-l2",
      title: "Hoe kom je aan een Claude-API-sleutel (Anthropic)",
      paragraphs: [
        "Anthropic is het bedrijf achter de Claude-modellen, waaronder Claude Sonnet en Claude Opus, die Atrium allebei kan gebruiken voor AI-handel. Om een sleutel te krijgen ga je naar console.anthropic.com in je browser en log je in, of maak je een nieuw account aan als je er nog geen hebt.",
        "Eenmaal ingelogd zoek je het onderdeel API Keys in de console, klik je op Create Key, geef je hem eventueel een naam (iets als \"Atrium trading\" maakt hem later makkelijk herkenbaar), en kopieer je de gegenereerde sleutel. Dit is de enige keer dat de volledige sleutel wordt getoond — Anthropic laat hem daarna niet nog eens zien, dus kopieer hem meteen voordat je wegnavigeert.",
        "AI-API-kosten worden rechtstreeks door Anthropic in rekening gebracht op jouw account. Ze staan volledig los van je Atrium-abonnement. De typische kost voor AI-handel ligt rond de €0,001–€0,05 per handelsvoorstel, afhankelijk van het gekozen model en hoeveel marktdata in elke scan verwerkt wordt. Het is de moeite om af en toe je gebruik te checken in Anthropics eigen console, waar je precies ziet wat je hebt uitgegeven en waar je bestedingslimieten kunt instellen.",
        "Terug in Atrium plak je de sleutel in Instellingen → Account → AI-API-sleutel, kies je Anthropic als aanbieder, klik je op Verbinding testen om te bevestigen dat het werkt, en klik je daarna op Opslaan.",
        "Behandel deze sleutel als elk ander wachtwoord: deel hem met niemand, en plak hem nergens anders dan in dat ene instellingenveld in Atrium.",
      ],
      example:
        "Je logt in op console.anthropic.com, klikt op API Keys → Create Key, noemt hem \"Atrium trading\", en kopieert de string die getoond wordt (die begint met sk-ant-...). In Atrium open je Instellingen → Account → AI-API-sleutel, kies je Anthropic uit de keuzelijst, plak je de sleutel, klik je op Verbinding testen en zie je een groen succesbericht, en klik je dan op Opslaan — AI-handel kan nu Claude gebruiken.",
    },
    {
      id: "c39-l3",
      title: "Hoe kom je aan een GPT-API-sleutel (OpenAI)",
      paragraphs: [
        "OpenAI is het bedrijf achter de GPT-modellen, waaronder GPT-4 en GPT-4o, die Atrium eveneens kan gebruiken voor AI-handel. Om een sleutel te krijgen ga je naar platform.openai.com in je browser en log je in, of maak je een account aan als je er nog geen hebt.",
        "Zoek binnen het platform het onderdeel API Keys, klik op Create new secret key, geef hem een herkenbare naam zoals \"Atrium trading\", en kopieer de sleutel meteen — net als bij Anthropic toont OpenAI de volledige sleutel maar één keer, op het moment van aanmaken.",
        "De AI-API-kosten worden hier rechtstreeks door OpenAI in rekening gebracht op jouw account, volledig los van je Atrium-abonnement. De typische kost voor AI-handel ligt rond de €0,001–€0,05 per handelsvoorstel, afhankelijk van het model en de omvang van elke scan. Het dashboard van OpenAI toont een lopend overzicht van je gebruik, dus kijk er af en toe even naar om je uitgaven in de gaten te houden.",
        "Terug in Atrium plak je de sleutel in Instellingen → Account → AI-API-sleutel, kies je OpenAI als aanbieder, klik je op Verbinding testen om te bevestigen dat het werkt, en klik je daarna op Opslaan.",
        "Zoals altijd: deel deze sleutel met niemand, en plak hem nergens anders dan in dat ene instellingenveld in Atrium.",
      ],
      example:
        "Je logt in op platform.openai.com, opent API Keys, klikt op Create new secret key, noemt hem \"Atrium trading\", en kopieert de string die getoond wordt (die begint met sk-...). In Atrium open je Instellingen → Account → AI-API-sleutel, kies je OpenAI uit de keuzelijst, plak je de sleutel, klik je op Verbinding testen en zie je een groen succesbericht, en klik je dan op Opslaan — AI-handel kan nu GPT gebruiken.",
    },
    {
      id: "c39-l4",
      title: "Hoe kom je aan een Gemini-API-sleutel (Google)",
      paragraphs: [
        "Google biedt de Gemini-modellen aan, waaronder Gemini Pro en Gemini Ultra, als nog een optie voor AI-handel in Atrium. Om een sleutel te krijgen ga je naar aistudio.google.com in je browser en log je in met je Google-account.",
        "Zoek binnen Google AI Studio de knop Get API Key, volg de stappen om een nieuwe sleutel aan te maken (mogelijk moet je hem koppelen aan een Google Cloud-project), en kopieer de sleutel zodra hij is aangemaakt.",
        "De AI-API-kosten worden hier rechtstreeks door Google in rekening gebracht op jouw account, volledig los van je Atrium-abonnement. De typische kost voor AI-handel ligt rond de €0,001–€0,05 per handelsvoorstel, afhankelijk van het model en de scanomvang. Het factureringsdashboard van Google Cloud toont je gebruik, dus is het de moeite waard om daar af en toe te kijken en eventueel een budgetwaarschuwing in te stellen.",
        "Terug in Atrium plak je de sleutel in Instellingen → Account → AI-API-sleutel, kies je Google als aanbieder, klik je op Verbinding testen om te bevestigen dat het werkt, en klik je daarna op Opslaan.",
        "Zoals altijd: deel deze sleutel met niemand, en plak hem nergens anders dan in dat ene instellingenveld in Atrium.",
      ],
      example:
        "Je logt in op aistudio.google.com, klikt op Get API Key, volgt de stappen om er een aan te maken, en kopieert de getoonde string. In Atrium open je Instellingen → Account → AI-API-sleutel, kies je Google uit de keuzelijst, plak je de sleutel, klik je op Verbinding testen en zie je een groen succesbericht, en klik je dan op Opslaan — AI-handel kan nu Gemini gebruiken.",
    },
    {
      id: "c39-l5",
      title: "Hoe kom je aan een DeepSeek-API-sleutel",
      paragraphs: [
        "DeepSeek is nog een AI-aanbieder die Atrium ondersteunt, en vaak de goedkoopste van de vier om te gebruiken. Om een sleutel te krijgen ga je naar platform.deepseek.com in je browser en log je in, of maak je een account aan als je er nog geen hebt.",
        "Zoek binnen het platform het onderdeel API Keys, klik op Create Key, geef hem een herkenbare naam zoals \"Atrium trading\", en kopieer de sleutel meteen — net als bij de andere aanbieders toont DeepSeek de volledige sleutel maar één keer.",
        "De AI-API-kosten worden hier rechtstreeks door DeepSeek in rekening gebracht op jouw account, volledig los van je Atrium-abonnement. De typische kost voor AI-handel ligt rond de €0,001–€0,05 per handelsvoorstel, en DeepSeek is doorgaans de goedkoopste van de ondersteunde aanbieders per aanvraag. Het dashboard toont je lopende gebruik, dus kijk er af en toe naar om je uitgaven bij te houden.",
        "Terug in Atrium plak je de sleutel in Instellingen → Account → AI-API-sleutel, kies je DeepSeek als aanbieder, klik je op Verbinding testen om te bevestigen dat het werkt, en klik je daarna op Opslaan.",
        "Zoals altijd: deel deze sleutel met niemand, en plak hem nergens anders dan in dat ene instellingenveld in Atrium.",
      ],
      example:
        "Je logt in op platform.deepseek.com, opent API Keys, klikt op Create Key, noemt hem \"Atrium trading\", en kopieert de getoonde string. In Atrium open je Instellingen → Account → AI-API-sleutel, kies je DeepSeek uit de keuzelijst, plak je de sleutel, klik je op Verbinding testen en zie je een groen succesbericht, en klik je dan op Opslaan — AI-handel kan nu DeepSeek gebruiken, doorgaans tegen de laagste kost per aanvraag van de vier.",
    },
    {
      id: "c39-l6",
      title: "Je AI-API-kosten begrijpen",
      paragraphs: [
        "Elke keer dat de AI de markt beoordeelt en een handelsvoorstel doet, kost die ene 'gedachte' een klein bedrag — doorgaans zo'n €0,001 tot €0,05, afhankelijk van welke aanbieder en welk model je hebt gekozen en hoeveel marktdata in die specifieke scan is meegenomen. Het is een piepklein bedrag per voorstel, maar het loopt op naarmate het vaker gebeurt.",
        "Dat is het belangrijkste om te begrijpen over de schaal ervan: kosten worden vooral bepaald door hoe vaak de AI de markt scant, niet door hoeveel je handelt. Een kortere auto-scan-interval betekent meer scans per dag, wat betekent dat je AI-aanbieder je vaker apart in rekening brengt, zelfs op dagen waarop de AI uiteindelijk niets voorstelt om op te reageren. Wil je de AI-kosten voorspelbaar houden, dan is het scaninterval de belangrijkste knop om aan te draaien.",
        "Het helpt om je kosten te zien als drie volledig gescheiden potjes. Je Atrium-abonnement (Premium, maandelijks of jaarlijks gefactureerd) betaalt voor het platform zelf. Handelskosten worden in XLM aan het platform betaald bij elke trade die je doet, handmatig of via AI, tegen een percentage bepaald door je kostenschijf. AI-gebruik betaal je rechtstreeks aan de AI-aanbieder die je hebt gekozen, voor elke scan en elk voorstel dat hij genereert. Deze drie overlappen nooit en worden nooit samengevoegd — elk wordt door een andere partij gefactureerd, voor iets anders.",
        "Bij elke aanbieder kun je in het dashboard bestedingslimieten of budgetwaarschuwingen instellen, en het is de moeite waard om dit eenmalig te doen wanneer je je sleutel instelt: de console van Anthropic, het platform van OpenAI, het factureringsdashboard van Google Cloud, en het dashboard van DeepSeek bieden allemaal een vorm van maandelijkse limiet of gebruiksmelding, zodat je op tijd merkt als de kosten sneller oplopen dan verwacht.",
        "Als een sleutel ooit zonder tegoed komt te zitten of een door jou ingestelde bestedingslimiet bereikt, zal de AI-aanbieder aanvragen beginnen te weigeren. In Atrium betekent dat simpelweg dat er geen AI-handelsvoorstellen meer verschijnen, met een duidelijke foutmelding op de plek waar het voorstel had gestaan — het heeft geen invloed op je account, je wallet, of je vermogen om te handelen. Handmatig handelen blijft precies zoals voorheen werken, omdat het nooit afhankelijk is van een AI-aanbieder; je hoeft alleen tegoed bij te storten of de limiet te verhogen bij je aanbieder om AI-voorstellen weer te laten komen.",
      ],
      example:
        "Stel dat je Claude Sonnet gebruikt met een auto-scan-interval van 15 minuten — dat zijn 96 scans per dag, elk goed voor een paar duizendste van een euro, wat zelfs op een drukke dag ruim onder een euro per dag aan AI-kosten blijft. Los daarvan factureert je Premium-abonnement die maand €10, ongeacht hoeveel je hebt gehandeld, en betaalt elke uitgevoerde trade zijn eigen kleine XLM-kost op basis van je volumeschijf. Op een dag bereikt je Anthropic-sleutel de maandelijkse limiet van €20 die je in de console had ingesteld: AI-voorstellen stoppen met een foutmelding in Atrium, maar je kunt nog steeds het tabblad Handmatig openen en zelf handelen zonder onderbreking, en het verhogen van de limiet (of wachten tot volgende maand) laat AI-voorstellen meteen weer binnenkomen.",
    },
  ],
  quiz: [
    {
      id: "c39-q1",
      prompt: "Wie factureert je eigenlijk voor het AI-gebruik wanneer die de markt scant of een handelsvoorstel doet?",
      options: [
        {
          text: "De AI-aanbieder die je hebt gekozen (Anthropic, OpenAI, Google of DeepSeek), rechtstreeks en los van je Atrium-abonnement.",
          explanation:
            "Juist. Atrium verkoopt geen AI-toegang door en rekent geen opslag — je brengt je eigen API-sleutel mee, en de aanbieder erachter factureert je account rechtstreeks voor wat de AI gebruikt.",
        },
        {
          text: "Atrium, inbegrepen in je maandelijkse Premium-abonnement.",
          explanation:
            "Nee. Je Premium-abonnement betaalt alleen voor het platform zelf. AI-gebruik is een aparte kost, rechtstreeks gefactureerd door de aanbieder van de sleutel die je hebt opgegeven.",
        },
        {
          text: "Niemand — AI-gebruik is gratis zodra je een Premium-abonnement hebt.",
          explanation:
            "Nee. Elke AI-aanvraag kost een klein bedrag, in rekening gebracht door de aanbieder op het account achter je API-sleutel — het is echt geld, meestal gewoon een heel klein bedrag per voorstel.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c39-q2",
      prompt: "Waar plak je de API-sleutel van je AI-aanbieder in Atrium?",
      options: [
        {
          text: "Instellingen → Account → AI-API-sleutel, en nergens anders.",
          explanation:
            "Juist. Dat ene instellingenveld is de enige plek waar je sleutel ooit in Atrium mag worden geplakt — behandel hem als een wachtwoord en plak hem nergens anders.",
        },
        {
          text: "Rechtstreeks in een chatbericht aan de AI, zodat die zich kan identificeren bij zijn aanbieder.",
          explanation:
            "Nee. De AI vraagt je nooit om je sleutel in een gesprek. Die hoort alleen thuis in Instellingen → Account → AI-API-sleutel.",
        },
        {
          text: "Op het tabblad Bot van de Trading-pagina, naast de instelling Alleen-lezen / Paper / Live.",
          explanation:
            "Nee. De instelling voor handelstoegang en de API-sleutel staan op verschillende plekken — de sleutel hoort thuis in Instellingen → Account → AI-API-sleutel.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c39-q3",
      prompt: "Wat gebeurt er eigenlijk met je API-sleutel nadat je hem in Atrium hebt opgeslagen?",
      options: [
        {
          text: "Hij wordt versleuteld opgeslagen (dezelfde AES-256-GCM-versleuteling als voor walletsleutels) en alleen in het geheugen ontsleuteld, heel even, telkens als de AI een aanvraag doet — hij wordt nooit meer getoond en nooit gelogd.",
          explanation:
            "Juist. De sleutel wordt op dezelfde manier beschermd als de geheime sleutel van je wallet: versleuteld opgeslagen, kort ontsleuteld in het geheugen alleen op het moment van gebruik, nooit meer getoond, en nooit weggeschreven naar een log.",
        },
        {
          text: "Hij wordt in leesbare tekst opgeslagen zodat de supportmedewerkers hem aan je kunnen voorlezen als je hem vergeet.",
          explanation:
            "Nee. De sleutel wordt versleuteld opgeslagen en wordt nooit meer getoond nadat je hem de eerste keer hebt ingeplakt — er is geen manier om hem later terug te halen of te tonen, niet door jou en niet door iemand anders.",
        },
        {
          text: "Hij wordt permanent doorgestuurd naar de servers van Atrium zelf en hergebruikt voor de AI-aanvragen van alle gebruikers.",
          explanation:
            "Nee. Je sleutel is van jou alleen — hij wordt uitsluitend kortstondig ontsleuteld om namens jou een aanvraag te doen, en wordt nooit gedeeld met of hergebruikt voor andere gebruikers.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c39-q4",
      prompt: "Welke van deze factoren heeft GEEN invloed op hoeveel je uitgeeft aan AI-API-kosten?",
      options: [
        {
          text: "Hoe lang geleden je je Atrium-account hebt aangemaakt.",
          explanation:
            "Juist — dit is degene die er niet toe doet. De leeftijd van je account heeft totaal geen invloed op AI-kosten.",
        },
        {
          text: "Hoe vaak de AI de markt automatisch scant.",
          explanation:
            "Dit doet er wel toe — een kortere scaninterval betekent meer scans per dag, en elke scan is een aparte, gefactureerde aanvraag bij je AI-aanbieder.",
        },
        {
          text: "Welke aanbieder en welk model je hebt gekozen.",
          explanation:
            "Dit doet er wel toe — verschillende aanbieders en modellen rekenen andere bedragen per aanvraag, en dat is mede waarom Atrium je toelaat je eigen sleutel mee te brengen en vrij te kiezen.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
