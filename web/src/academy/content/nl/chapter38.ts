// Hoofdstuk 38: Aan de slag met Atrium. Zie content/en/chapter38.ts voor de
// structurele toelichting (dit is een natuurlijke vertaling, geen woord-voor-
// woord vertaling).
import type { Chapter } from "../../types";

export const chapter38: Chapter & { whoFor: string } = {
  id: "c38",
  number: 38,
  level: "BASIC",
  whoFor: "Voor iedereen die Atrium voor het eerst opent",
  title: "Aan de slag met Atrium",
  description:
    "Een korte rondleiding door de app: de zijbalk, je portefeuille, handelsmodi, Handmatig versus Bot-handel, en waar je later weer hulp vindt.",
  lessons: [
    {
      id: "c38-l1",
      title: "Hoe begin je met deze app",
      paragraphs: [
        "De linker zijbalk is je belangrijkste manier om door de app te navigeren — Trading, Ontvangen & Versturen, Openstaande betalingen, Logboek en de Academy staan er allemaal in. Op een desktop- of tabletscherm staat de zijbalk vast aan de linkerkant, en je kunt hem inklappen tot alleen iconen door op het kleine pijltje bovenaan te klikken, zodat er meer ruimte overblijft voor de pagina zelf. Op een telefoon is de zijbalk standaard verborgen en wordt hij een menu dat inschuift: tik op de ☰-knop om hem te openen, tik op een link (of op de achtergrond) om hem weer te sluiten.",
        "Bovenaan de app toont het portefeuillegedeelte in de header altijd je totale walletwaarde, zodat je overal in de app kunt zien hoe het ervoor staat. Tik of klik op een token in dat overzicht en je komt op de detailpagina van dat token terecht, waar je de koers, jouw bezit en instellingen zoals stop-losses kunt bekijken.",
        "De Trading-pagina heeft twee tabbladen, en het is goed om precies te weten wat elk tabblad regelt. Het tabblad Bot bevat de instelling Alleen-lezen / Paper / Live voor handelstoegang. Deze instelling geldt alleen voor de AI, niet voor jou: bij Alleen-lezen kan de AI enkel toekijken en kun jij alleen zelf handmatig handelen; bij Paper simuleert de AI trades zonder dat er echt geld beweegt; bij Live mag de AI echte orders on-chain versturen. Live is de enige modus met echte gevolgen voor de bot, dus lees de waarschuwing op het scherm goed voordat je ooit overschakelt — een live order kun je niet terugdraaien.",
        "Het tabblad Handmatig is waar je zelf, met de hand, trades plaatst. Handmatige orders worden nooit vastgehouden voor goedkeuring, ongeacht welke handelstoegangsmodus actief is — zodra je een handmatige trade indient, wordt die meteen uitgevoerd (of, wanneer de toegangsmodus Paper is, verwerkt als een papieren trade). Op het tabblad Bot vind je ook het AI-handelen zelf: om de AI aan te zetten en te laten handelen heb je een Premium-abonnement nodig, en moet je bovendien je eigen API-sleutel opgeven voor de AI-provider die je wilt gebruiken.",
        "De Academy — waar je dit nu leest — is voor iedereen volledig gratis, op elk niveau, en je hoeft er zelfs niet voor ingelogd te zijn. Kom gerust op elk moment terug om een onderwerp op te frissen.",
        "Wil je ooit de interactieve rondleiding van de app nog eens zien, dan hoef je er niet naar te zoeken: open Instellingen, ga naar Account, en kies Tutorial herstarten om hem helemaal opnieuw te doorlopen.",
      ],
      example:
        "Stel je je eerste vijf minuten in de app voor: je werpt een blik op de header en ziet je totale walletwaarde; op je telefoon tik je op ☰ om de zijbalk te bekijken en zie je de link naar de Academy; je opent het tabblad Bot van de Trading-pagina en merkt dat de toegangsmodus op Alleen-lezen staat, dus je gaat naar het tabblad Handmatig en plaatst zelf een kleine handmatige trade, die meteen wordt uitgevoerd; later, wanneer je een opfrisser wilt, open je Instellingen → Account → Tutorial herstarten en bekijk je de rondleiding opnieuw vanaf het begin.",
    },
    {
      id: "c38-l2",
      title: "Wat is het verschil tussen Gratis en Premium?",
      paragraphs: [
        "Met Gratis krijg je eigenlijk al bijna alles wat de app kan. Handmatig handelen is volledig toegankelijk, zonder beperkingen — je kunt orders plaatsen, annuleren en aanpassen, en een stop loss of trailing stop instellen om een positie te beschermen terwijl je even niet oplet. Ook de liquiditeitsscanner is gratis, zodat je kunt nagaan hoe vlot een token verhandelbaar is voordat je erin stapt, en auto-swap naar XLM staat gratis klaar om losse tokens automatisch terug om te zetten naar je basisvaluta. De volledige Academy, elk hoofdstuk en elke quiz, is op elk niveau gratis. Het enige wat Gratis niet omvat, is AI-handel.",
        "Premium ontgrendelt twee dingen. Ten eerste AI-handel zelf: eenmaal geabonneerd kun je de AI aanzetten en aansturen met instellingen per risicofactor, zodat hij handelt binnen grenzen die jij kiest in plaats van als een alles-of-niets-schakelaar. Ten tweede verlaagt Premium je handelskosten in elke volumeschijf, los van wat AI-handel zelf nog aan resultaat kan opleveren. Premium kost €10 per maand, of €96 per jaar — een besparing van ongeveer 20% ten opzichte van maandelijks betalen. Om de AI daadwerkelijk te laten handelen heb je bovendien je eigen API-sleutel nodig van een AI-provider zoals Anthropic of OpenAI, wat in een later hoofdstuk aan bod komt; die AI-provider rekent apart af voor wat de AI zelf verbruikt, bovenop je Atrium-abonnement.",
        "Elke trade op het platform, handmatig of via AI, betaalt een klein percentage aan kosten, en dat percentage hangt af van je volumeschijf. Je schijf wordt dagelijks opnieuw berekend op basis van je handelsvolume op het platform in de vorige kalendermaand, en kan dus stijgen of dalen naarmate je activiteit verandert: Brons is onder 5.000 XLM maandvolume, Zilver is 5.000–20.000, Goud is 20.000–50.000, en Platina is boven 50.000. Binnen elke schijf betaalt Gratis het hoogste percentage, Premium handmatig minder, en Premium AI-handel het minst van allemaal. Elk nieuw account start op Brons. Er is geen minimumbedrag aan kosten, maar trades kleiner dan 1 XLM tellen niet mee om je schijf op te bouwen, ook al betaal je er wel gewoon de kosten van die schijf voor.",
        "Je kunt het vergelijken met een sportschoolabonnement: hoe meer je het gebruikt, hoe goedkoper elk bezoek wordt. Een veelhandelaar wordt behandeld als een fanatieke sporter en betaalt een lager percentage per trade, gewoon omdat hij vaker langskomt, en een Premium-abonnement is daarbovenop het ledentarief — een extra korting op elke schijf.",
        "Als vuistregel: handel je meer dan zo'n €500 per maand, dan levert alleen al de lagere Premium-kost doorgaans meer op dan de €10 per maand die het kost, nog voordat je meerekent wat AI-handel zelf kan toevoegen.",
      ],
      example:
        "Stel dat je in een maand voor 8.000 XLM aan volume verhandelt — dat plaatst je in de Zilver-schijf. Als Gratis-gebruiker kosten je trades die maand elk 0,23%. Stap je over naar Premium en handel je handmatig met hetzelfde volume, dan zakt de kost naar 0,16% per trade; laat je de AI voor je handelen op Zilver, dan zakt het verder naar 0,12%. De schijf wordt dagelijks herberekend op basis van het volume van vorige maand, dus handel je volgende maand voor 25.000 XLM, dan schuif je door naar Goud en dalen de percentages opnieuw — ongeacht of je Gratis of Premium bent.",
    },
  ],
  quiz: [
    {
      id: "c38-q1",
      prompt: "Waar vind je de instelling Alleen-lezen / Paper / Live voor handelstoegang, en wat regelt die eigenlijk?",
      options: [
        {
          text: "Op het tabblad Bot van de Trading-pagina, en ze geldt alleen voor de AI — je eigen handmatige trades zijn altijd toegestaan.",
          explanation:
            "Juist. De instelling voor handelstoegang staat op het tabblad Bot. Alleen-lezen stopt de AI met handelen, Paper laat hem simuleren, en Live laat hem echte orders versturen — maar handmatig handelen wordt door deze instelling nooit geblokkeerd.",
        },
        {
          text: "In de zijbalk, en ze sluit je buiten de hele app totdat je een modus kiest.",
          explanation:
            "Nee. De instelling staat op het tabblad Bot van de Trading-pagina, en ze sluit je nooit buiten handmatig handelen of enig ander deel van de app.",
        },
        {
          text: "Op het tabblad Handmatig, en ze bepaalt of je eigen trades goedkeuring nodig hebben.",
          explanation:
            "Niet helemaal. De instelling staat op het tabblad Bot en regelt de AI, niet je handmatige trades. Handmatige trades worden altijd meteen uitgevoerd, ongeacht deze instelling.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c38-q2",
      prompt: "Je plaatst een trade op het tabblad Handmatig. Moet die eerst worden goedgekeurd voor hij wordt uitgevoerd?",
      options: [
        {
          text: "Ja, elke handmatige trade wacht op een aparte goedkeuringsstap, net als AI-trades dat soms doen.",
          explanation:
            "Nee. Handmatige trades staan nooit in de wachtrij voor goedkeuring — dat geldt alleen ooit voor AI-voorstellen wanneer auto-trade uitstaat.",
        },
        {
          text: "Nee — je eigen handmatige trades worden meteen uitgevoerd (of als papieren trade verwerkt in Paper-modus), zonder goedkeuringsstap.",
          explanation:
            "Juist. Handmatig handelen is volledig van jou: wat je indient op het tabblad Handmatig gaat direct door, onmiddellijk.",
        },
        {
          text: "Dat hangt af van of je een Premium-abonnement hebt.",
          explanation:
            "Nee. Een Premium-abonnement is nodig om de AI te laten handelen — het heeft geen invloed op je eigen handmatige trades, die altijd meteen worden uitgevoerd.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c38-q3",
      prompt: "Je hebt de interactieve tutorial van de app al eens doorlopen, maar wilt hem opnieuw zien. Waar ga je naartoe?",
      options: [
        {
          text: "Instellingen → Account → Tutorial herstarten.",
          explanation:
            "Juist. De tutorial kan op elk moment opnieuw worden gestart vanuit het onderdeel Account binnen Instellingen.",
        },
        {
          text: "De Academy, onder een apart hoofdstuk 'Tutorial'.",
          explanation:
            "Niet helemaal. De Academy is een apart, gratis leercentrum — de interactieve rondleiding zelf herstart je vanuit Instellingen → Account, niet vanuit een Academy-hoofdstuk.",
        },
        {
          text: "Er is geen manier om hem nog eens te zien nadat hij is gesloten.",
          explanation:
            "Nee. Je kunt hem altijd opnieuw afspelen via Instellingen → Account → Tutorial herstarten.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c38-q4",
      prompt: "Welke van deze functies is alleen beschikbaar voor Premium-abonnees?",
      options: [
        {
          text: "AI-handel, met instellingen per risicofactor.",
          explanation:
            "Juist. AI-handel is de enige functie die achter Premium zit. Handmatig handelen, stop losses en trailing stops, de liquiditeitsscanner, auto-swap naar XLM, en de volledige Academy zijn allemaal gratis.",
        },
        {
          text: "Handmatig handelen en stop losses.",
          explanation:
            "Nee. Handmatig handelen, inclusief stop losses en trailing stops, is volledig beschikbaar met Gratis — daar zit niets Premium-only aan.",
        },
        {
          text: "De Academy.",
          explanation:
            "Nee. De Academy is gratis voor iedereen, op elk niveau, of je nu wel of niet op Premium zit.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c38-q5",
      prompt: "Wat bepaalt in welke kostenschijf (Brons, Zilver, Goud, Platina) je zit?",
      options: [
        {
          text: "Hoe lang geleden je je account hebt aangemaakt.",
          explanation:
            "Nee. De leeftijd van je account speelt geen enkele rol — een gloednieuw account en een account van jaren oud worden op dezelfde manier beoordeeld, puur op volume.",
        },
        {
          text: "Je handelsvolume op het platform in de vorige kalendermaand, dagelijks herberekend.",
          explanation:
            "Juist. Je schijf is puur gebaseerd op hoeveel je vorige kalendermaand op het platform hebt verhandeld, en wordt elke dag herberekend, zodat hij kan stijgen of dalen naarmate je volume verandert.",
        },
        {
          text: "Of je een eenmalige betaling hebt gedaan om een hogere schijf te ontgrendelen.",
          explanation:
            "Nee. Je kunt een schijf niet rechtstreeks kopen — schijven komen alleen voort uit echt handelsvolume, en een Premium-abonnement verandert het percentage dat je binnen een schijf betaalt, niet in welke schijf je zit.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
