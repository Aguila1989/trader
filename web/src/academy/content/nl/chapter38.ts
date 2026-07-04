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
  ],
};
