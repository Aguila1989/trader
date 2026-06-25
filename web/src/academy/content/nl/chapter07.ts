import type { Chapter } from "../../types";

export const chapter07: Chapter = {
  id: "c7",
  number: 7,
  level: "ADVANCED",
  title: "Doelprijs en invalidatieprijs",
  description: "Stel een winstdoel en een stopniveau in, en leer hoe hun reward/risk-verhouding bepaalt of de bot een trade doorlaat.",
  lessons: [
    {
      id: "c7-l1",
      title: "Wat is een doelprijs?",
      paragraphs: [
        "Een doelprijs is de prijs waarop je van plan bent winst te nemen. In het orderformulier van Handmatig handelen stel je die in onder het kopje Geavanceerd, in het optionele veld Doelprijs. De tooltip in de app legt het simpel uit: de prijs waarop je winst wilt nemen, waarna de bot de positie automatisch sluit zodra die prijs wordt bereikt.",
        "Het doel is de reward-kant van je trade. Bij een buy ligt het boven je instap, want je maakt winst als de prijs stijgt tot dat niveau. De afstand van je instap omhoog naar je doel is de reward die je probeert binnen te halen.",
        "Een doel instellen verandert een vage hoop in een concrete uitstap. In plaats van naar de chart te staren en emotioneel te reageren, beslis je vooraf waar het idee zich heeft uitbetaald, en de bot handelt voor je zodra dat niveau verschijnt. Zo blijven je exits gedisciplineerd en consistent.",
      ],
      example: "Je koopt XLM op 0.118 USDC en je verwacht een beweging omhoog naar 0.130. Je vult 0.130 in als Doelprijs. De reward waar je op mikt is de afstand van instap tot doel, 0.130 min 0.118, dus 0.012 per eenheid. Als de prijs 0.130 bereikt, sluit de bot de positie en boekt die winst voor je in, zonder dat jij naar het scherm hoeft te kijken.",
    },
    {
      id: "c7-l2",
      title: "Wat is een invalidatieprijs?",
      paragraphs: [
        "Een invalidatieprijs is het niveau waarop je trade-idee bewezen onjuist is. Je stelt die in onder hetzelfde kopje Geavanceerd, in het optionele veld Invalidatieprijs. De tooltip in de app legt het rechtstreeks uit: als de prijs tot dit niveau zakt, wordt het trade-idee als ongeldig beschouwd, en het wordt meestal gebruikt om een stop loss in te stellen.",
        "De invalidatie is de risk-kant van je trade. Bij een buy ligt die onder je instap, want het idee faalt als de prijs daalt in plaats van stijgt. De afstand van je instap omlaag naar je invalidatie is het risico dat je accepteert als je het mis hebt.",
        "Het niveau benoemen waar je ongelijk hebt, is wat een trade onderscheidt van een gok. Zodra de prijs daar doorheen breekt, is vasthouden niets meer dan hopen. De monitor bewaakt je open posities en stelt voor te sluiten zodra het invalidatieniveau wordt doorbroken, zodat het verlies wordt begrensd op de omvang die je vooraf koos.",
      ],
      example: "Je koopt XLM op 0.118 USDC. Je idee hangt ervan af dat de steun op 0.114 standhoudt, dus je vult 0.114 in als Invalidatieprijs. Het risico dat je accepteert is de afstand van instap tot invalidatie, 0.118 min 0.114, dus 0.004 per eenheid. Als de prijs naar 0.114 zakt, is de steun gevallen, is het idee ongeldig, en stelt de monitor voor de positie te sluiten om het bloeden te stoppen.",
    },
    {
      id: "c7-l3",
      title: "Hoe doelprijs en invalidatieprijs samenwerken",
      paragraphs: [
        "Doel en invalidatie zijn twee helften van een plan. Het doel meet je reward, de afstand van instap omhoog ernaartoe. De invalidatie meet je risk, de afstand van instap omlaag ernaartoe. Reward delen door risk geeft de reward/risk-verhouding, het ene getal dat je vertelt of een trade het waard is om te nemen.",
        "De bot dwingt een minimale reward/risk-verhouding af, die standaard 1.2 is. Reward gedeeld door risk moet boven dat minimum uitkomen, anders wordt de trade geblokkeerd met een policy-overtreding. Bij een buy vereist dit ook dat het doel boven de instap ligt en de invalidatie onder de instap, zodat de twee afstanden kloppen.",
        "Deze controle beschermt je tegen scheve trades waarbij je veel riskeert om weinig te verdienen. Zelfs een strategie die maar de helft van de tijd gelijk heeft, kan winstgevend zijn als de winnaars groter zijn dan de verliezers, en de verhouding is hoe de bot die vorm garandeert voordat er kapitaal wordt ingezet.",
      ],
      example: "Je koopt op 0.118, doel 0.130, invalidatie 0.114. Reward is 0.130 min 0.118, dus 0.012. Risk is 0.118 min 0.114, dus 0.004. De verhouding is 0.012 gedeeld door 0.004, dus 3.0, ruim boven het minimum van 1.2, dus de trade wordt toegestaan. Zet je in plaats daarvan het doel op 0.1184, dan zou de reward 0.0004 zijn tegen 0.004 aan risk, een verhouding van 0.1, en de bot zou hem blokkeren.",
    },
    {
      id: "c7-l4",
      title: "Hoe je ze correct instelt voor een trade",
      paragraphs: [
        "Stel eerst de invalidatie in, niet het doel. Kies die op basis van de chart, op het niveau dat je idee echt onjuist zou bewijzen, zoals net onder een steun waarvan je verwacht dat die standhoudt. De stop verankeren aan echte structuur, in plaats van aan hoeveel je wilt verliezen, houdt hem eerlijk.",
        "Kies daarna een doel dat een realistische beweging ook echt kan bereiken, bij voorkeur dicht bij een weerstand of een eerdere top. Bereken dan reward gedeeld door risk en bevestig dat die boven het minimum van 1.2 uitkomt. Als dat niet zo is, is de oplossing niet om het doel willekeurig op te rekken, maar om een betere instap of een strakkere, nog steeds geldige invalidatie te vinden.",
        "Een veelgemaakte fout is het doel ver weg slepen alleen om door de verhoudingscontrole te komen. Dat levert een getal op dat de markt waarschijnlijk niet zal raken. De verhouding is een filter, geen doel; beide niveaus moeten prijzen blijven waar de markt aannemelijk doorheen kan handelen.",
      ],
      example: "Je wilt XLM kopen rond 0.118. De steun ligt op 0.115, dus je zet de invalidatie op 0.115, wat 0.003 aan risk geeft. Om boven het minimum van 1.2 te komen heb je minstens 0.0036 aan reward nodig, dus een doel van 0.1216 of hoger kwalificeert. Je ziet weerstand op 0.124, dus je zet het doel daar, wat 0.006 aan reward geeft, een verhouding van 2.0, een nette en realistische trade.",
    },
    {
      id: "c7-l5",
      title: "Hoe de AI doelprijs en invalidatieprijs gebruikt in voorstellen",
      paragraphs: [
        "Wanneer de AI-analist een trade-voorstel genereert, kiest die niet alleen een richting. Elk voorstel bevat al een targetPrice en een invalidationPrice, zodat het idee aankomt met zijn winst-exit en zijn stopniveau volledig vastgelegd. De invalidationPrice is de eigen stop van de analist, de prijs waarop die het idee zou laten varen.",
        "Omdat het voorstel beide niveaus meedraagt, geldt dezelfde reward/risk-controle ervoor. De bot kan bevestigen dat het idee van de analist boven de minimale verhouding uitkomt voordat het voorstel een uitvoerbare order wordt, waarmee een consistente regel wordt toegepast op zowel handmatige als AI-gestuurde trades.",
        "Zodra een positie open is, gebruikt de monitor het invalidatieniveau voortdurend. Hij bewaakt de open positie en stelt voor te sluiten als de positie zijn invalidatie doorbreekt, zodat de stop van de analist ook echt in de markt wordt afgedwongen in plaats van slechts een suggestie op papier te zijn.",
      ],
      example: "De analist stelt voor XLM te kopen op 0.118 met targetPrice 0.128 en invalidationPrice 0.114. Reward is 0.010, risk is 0.004, een verhouding van 2.5 die boven het minimum van 1.2 uitkomt, dus het voorstel is geldig. Je keurt het goed en de positie gaat open. Later zakt de prijs naar 0.114, de invalidatie wordt doorbroken, en de monitor stelt voor de positie te sluiten, waarmee de eigen stop van de analist wordt afgedwongen.",
    },
  ],
  quiz: [
    {
      id: "c7-q1",
      prompt: "Wat doet het veld Doelprijs in het formulier van Handmatig handelen voor een buy-positie?",
      options: [
        { text: "Het stelt de prijs in waarop je winst wilt nemen, en de bot sluit de positie automatisch wanneer die prijs wordt bereikt.", explanation: "Correct. Dit komt precies overeen met de tooltip in de app: het doel is je winst-niveau en de bot sluit de positie wanneer dat wordt bereikt." },
        { text: "Het stelt de prijs onder de instap in waar het trade-idee als ongeldig wordt beschouwd.", explanation: "Onjuist. Dat beschrijft de invalidatieprijs, het stopniveau onder de instap, niet het doel." },
        { text: "Het vertelt de bot hoeveel kapitaal er maximaal aan de trade mag worden toegewezen.", explanation: "Onjuist. De doelprijs is een uitstapniveau, geen instelling voor positiegrootte of kapitaallimiet." },
        { text: "Het stelt de slippage-tolerantie in die de order accepteert.", explanation: "Onjuist. Slippage is een aparte kwestie; de doelprijs is puur je winst-uitstapniveau." },
      ],
      correctIndex: 0,
    },
    {
      id: "c7-q2",
      prompt: "Wat stelt de invalidatieprijs voor?",
      options: [
        { text: "De prijs waarop je winst neemt op een winnende trade.", explanation: "Onjuist. Dat is de doelprijs; invalidatie gaat over het falen van het idee, niet over het slagen ervan." },
        { text: "De gemiddelde prijs van al je eerdere trades op deze token.", explanation: "Onjuist. Invalidatie is een vooruitkijkend stopniveau voor deze trade, geen historisch gemiddelde." },
        { text: "Het niveau waar, als de prijs ertoe zakt, het trade-idee als ongeldig wordt beschouwd; het wordt meestal als stop loss gebruikt.", explanation: "Correct. Dit is de definitie uit de tooltip in de app: dit niveau raken betekent dat het idee is gefaald, en het dient als je stop loss." },
      ],
      correctIndex: 2,
    },
    {
      id: "c7-q3",
      prompt: "Je koopt op 0.120, stelt een doel van 0.126 in en een invalidatie van 0.114. Met de standaard minimale reward/risk-verhouding van 1.2, wat gebeurt er?",
      options: [
        { text: "De trade wordt geblokkeerd, omdat de reward van 0.006 kleiner is dan de risk van 0.006.", explanation: "Onjuist. Reward is 0.126 min 0.120 = 0.006 en risk is 0.120 min 0.114 = 0.006, dus ze zijn gelijk, niet kleiner." },
        { text: "De trade wordt geblokkeerd, omdat de verhouding 1.0 is, wat niet boven het minimum van 1.2 uitkomt.", explanation: "Correct. Reward 0.006 gedeeld door risk 0.006 is 1.0, onder het minimum van 1.2, dus de bot blokkeert hem met een policy-overtreding." },
        { text: "De trade wordt toegestaan, omdat zowel een doel als een invalidatie zijn opgegeven.", explanation: "Onjuist. Beide niveaus opgeven is noodzakelijk maar niet voldoende; de verhouding moet nog steeds boven het minimum uitkomen, en 1.0 doet dat niet." },
        { text: "De trade wordt toegestaan, omdat de verhouding van 1.0 dicht genoeg bij 1.2 ligt.", explanation: "Onjuist. De verhouding moet boven het minimum uitkomen; 1.0 ligt onder 1.2 en de bot rondt hem niet naar boven af." },
      ],
      correctIndex: 1,
    },
    {
      id: "c7-q4",
      prompt: "Hoe gebruikt de AI-analist doel- en invalidatieprijzen?",
      options: [
        { text: "Hij neemt in elk voorstel een targetPrice en een invalidationPrice op, en de monitor stelt voor te sluiten als een open positie zijn invalidatie doorbreekt.", explanation: "Correct. De analist specificeert beide niveaus per voorstel, de invalidatie is zijn stop, en de monitor dwingt die af door voor te stellen te sluiten bij een doorbraak." },
        { text: "Hij negeert deze niveaus omdat ze alleen zinvol zijn voor handmatige trades.", explanation: "Onjuist. De analist stelt beide niveaus zelf in bij elk voorstel; ze zijn niet alleen voor handmatige trades." },
        { text: "Hij stelt alleen een doelprijs in en laat de stop volledig aan de gebruiker over.", explanation: "Onjuist. Het voorstel bevat een invalidationPrice als de eigen stop van de analist, niet alleen een doel." },
        { text: "Hij gebruikt ze alleen om de chart in te kleuren en handelt er nooit naar.", explanation: "Onjuist. De monitor stelt actief voor een positie te sluiten wanneer zijn invalidatieniveau wordt doorbroken, dus de niveaus sturen actie aan." },
      ],
      correctIndex: 0,
    },
  ],
};
