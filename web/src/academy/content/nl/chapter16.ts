import type { Chapter } from "../../types";

export const chapter16: Chapter = {
  id: "c16",
  number: 16,
  level: "ADVANCED",
  title: "Hoe authenticatie achter de schermen werkt",
  description:
    "Een blik achter het inlogscherm: wat een JWT is, waarom de token in een httpOnly-cookie zit, hoe accountvergrendeling werkt en waarom je sessie uiteindelijk verloopt.",
  lessons: [
    {
      id: "c16-l1",
      title: "Wat is een JWT en hoe bewijst die dat je bent ingelogd?",
      paragraphs: [
        "HTTP heeft een kort geheugen: elke aanvraag aan de server staat op zichzelf, dus iets moet de server bij elke aanvraag opnieuw vertellen wie je bent. Een JWT (JSON Web Token) is dat geheugensteuntje. Wanneer je succesvol inlogt, maakt de server een kleine token aan die zegt wie je bent en wanneer hij verloopt, en ondertekent die met een geheim dat alleen de server kent.",
        "Zie een JWT als een polsbandje met stempel op een festival. Aan de ingang toon je je identiteitskaart één keer; in ruil krijg je een polsbandje. Daarna werpt het personeel bij elk podium alleen even een blik op het bandje — ze controleren niet telkens opnieuw je identiteitskaart. De stempel is moeilijk na te maken, dus het bandje zelf bewijst dat je werd binnengelaten.",
        "De handtekening is de stempel. De server kan een teruggestuurde token bekijken en de handtekening verifiëren om te weten dat hij die token zelf heeft uitgegeven en dat niemand er iets aan veranderd heeft — zonder de inhoud van de token ergens op te slaan. Wordt zelfs maar één teken van de token gewijzigd, dan klopt de handtekening niet meer en wordt de token geweigerd.",
      ],
      example:
        "Na het inloggen bevat je token ongeveer dit: \"gebruiker = jij, uitgegeven = 15u, verloopt = morgen 15u,\" plus een handtekening. Bij je volgende klik stuurt de browser hem terug; de server controleert de handtekening, ziet dat hij geldig en niet verlopen is en toont je gegevens — zonder dat een tweede wachtwoord nodig is.",
    },
    {
      id: "c16-l2",
      title: "Wat is een httpOnly-cookie en waarom is dat veiliger dan een token in de browser bewaren?",
      paragraphs: [
        "Een cookie is een klein stukje gegevens dat de browser voor een site bewaart en automatisch terugstuurt bij elke aanvraag aan die site. Een httpOnly-cookie heeft een speciale markering die de browser zegt: geef dit door aan de server, maar laat JavaScript op de pagina het nooit lezen.",
        "Die markering is precies waar het om draait. Als een token ergens wordt bewaard waar JavaScript bij kan — zoals in localStorage — dan kan één enkel kwaadaardig of foutief script op de pagina de token lezen en naar een aanvaller sturen (een aanval die XSS heet). Een token in een httpOnly-cookie kan door geen enkel script gelezen worden, dus zelfs een script dat zich op de pagina binnensluipt kan je sessie niet stelen.",
        "Cookies die automatisch meereizen brengen een ander risico met zich mee: een andere site zou kunnen proberen je browser een aanvraag te laten afvuren met jouw cookie (dat heet CSRF). De app blokkeert dat door bij elke aanvraag die iets wijzigt te controleren waar die vandaan komt en door de cookie als \"same-site\" te markeren, zodat de browser hem niet meestuurt bij aanvragen die door andere sites zijn gestart.",
      ],
      example:
        "Twee manieren om dezelfde token te bewaren. In localStorage: een schadelijk reclamescript voert `localStorage.getItem('token')` uit en mailt hem weg — einde verhaal. In een httpOnly-cookie: hetzelfde script draait en krijgt niets terug, omdat de browser weigert de cookie aan JavaScript prijs te geven.",
    },
    {
      id: "c16-l3",
      title: "Wat is accountvergrendeling en waarom beschermt die jou?",
      paragraphs: [
        "Accountvergrendeling beperkt hoe vaak iemand achter elkaar naar je wachtwoord mag raden. Na een vastgesteld aantal mislukte pogingen — vijf in deze app — wordt het account tijdelijk vergrendeld gedurende een afkoelperiode (vijftien minuten), waarin zelfs het juiste wachtwoord geweigerd wordt.",
        "Dit verslaat \"brute kracht\": een programma dat duizenden wachtwoorden per seconde probeert tot er één werkt. Met vergrendeling krijgt een aanvaller maar een handvol pogingen voordat hij moet wachten, wat een aanval van enkele minuten verandert in een die jaren zou duren. Elke mislukte poging wordt bovendien gelogd met tijdstip en bronadres, zodat verdachte uitbarstingen zichtbaar worden.",
        "Hier is een zorgvuldig evenwicht nodig. Vergrendeling moet raders tegenhouden zonder dat ze JOU opzettelijk kunnen buitensluiten, en zonder te verraden of een e-mailadres überhaupt geregistreerd is. Daarom verschijnt bij foute pogingen de algemene boodschap \"ongeldig e-mailadres of wachtwoord\", en wordt de vergrendelingsmelding alleen getoond aan iemand die werkelijk het juiste wachtwoord heeft — de echte eigenaar.",
      ],
      example:
        "Een aanvaller schrijft een script dat 1.000 wachtwoorden tegen je account uitprobeert. Na de vijfde foute gok gaat de deur vijftien minuten dicht, dus in een uur lukt het hem maar zo'n twintig pogingen in plaats van miljoenen. De aanval wordt hopeloos traag, en in het logboek staat een muur van mislukkingen vanaf één adres.",
    },
    {
      id: "c16-l4",
      title: "Wat is sessieverloop en waarom verloopt je login?",
      paragraphs: [
        "Elke sessie heeft een vervaltijd die bij het inloggen in de token wordt ingebakken. Standaard geeft deze app een token uit die 24 uur meegaat; vink je \"Onthoud mij\" aan, dan gaat hij 30 dagen mee. Eenmaal dat moment voorbij is, wordt de token niet meer aanvaard en wordt je gevraagd opnieuw in te loggen.",
        "Verloop beperkt de schade als een token ooit uitlekt. Een token die eeuwig zou blijven leven, zou een permanente sleutel zijn; een token die verloopt, is een sleutel die vanzelf stopt met werken, zodat een kopie uit een verlaten sessie nutteloos wordt zodra het tijdvenster sluit. Het is de digitale versie van een hotelsleutelkaart die bij het uitchecken wordt gedeactiveerd.",
        "Uitloggen wacht niet alleen op het verloop — het trekt de sessie onmiddellijk in op de server, zodat de token vanaf dat moment wordt geweigerd, ook al is zijn vervaltijd nog niet bereikt. Je wachtwoord opnieuw instellen doet hetzelfde met elke sessie, en daarom is een reset de snelste manier om iedereen die er niet hoort te zijn buiten te zetten.",
      ],
      example:
        "Je logt in op een gedeelde laptop zonder \"Onthoud mij\" en vergeet uit te loggen. De 24-uurstoken verloopt 's nachts stilletjes, dus 's ochtends kan die browser je account niet meer bereiken. Had je op Uitloggen geklikt, dan was de toegang afgesneden op het moment dat je wegging — en een wachtwoordreset zou elke sessie overal in één klap beëindigen.",
    },
  ],
  quiz: [
    {
      id: "c16-q1",
      prompt: "Wat is een JWT, in de vergelijking met het festivalpolsbandje?",
      options: [
        {
          text: "Een ondertekende token die je krijgt nadat je één keer bent ingelogd, en die de server bij elke aanvraag opnieuw controleert in plaats van weer naar je wachtwoord te vragen.",
          explanation:
            "Juist. Net als een polsbandje met stempel bewijst de ondertekende token dat je werd binnengelaten, zodat de server je wachtwoord niet telkens opnieuw hoeft te controleren.",
        },
        {
          text: "Je wachtwoord, dat bij elke aanvraag opnieuw wordt meegestuurd.",
          explanation:
            "Nee. Het hele punt is dat je wachtwoord één keer wordt gecontroleerd; daarna neemt de token zijn plaats in.",
        },
        {
          text: "Een lijst van elke pagina die je hebt bezocht.",
          explanation: "Nee. Een JWT bevat wie je bent en wanneer hij verloopt, geen surfgeschiedenis.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c16-q2",
      prompt: "Waarom is de sessietoken in een httpOnly-cookie bewaren veiliger dan in localStorage?",
      options: [
        {
          text: "JavaScript op de pagina kan een httpOnly-cookie niet lezen, dus een kwaadaardig script (XSS) kan de token niet stelen.",
          explanation:
            "Juist. De httpOnly-markering verbergt de cookie voor alle scripts op de pagina en sluit zo de meest voorkomende manier af waarop een token gestolen wordt.",
        },
        {
          text: "httpOnly-cookies laten de app sneller laden.",
          explanation: "Nee. Het is een beveiligingseigenschap, geen prestatie-eigenschap.",
        },
        {
          text: "localStorage is versleuteld en cookies niet.",
          explanation:
            "Nee. Het verschil zit in de leestoegang door scripts, niet in versleuteling — localStorage is gewoon leesbaar voor elk script op de pagina.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c16-q3",
      prompt: "Hoe beschermt accountvergrendeling jou?",
      options: [
        {
          text: "Ze blokkeert verdere pogingen na meerdere foute wachtwoorden, waardoor snel brute-force-raden onpraktisch wordt.",
          explanation:
            "Juist. Een korte vergrendeling na enkele mislukkingen verandert miljoenen mogelijke gokken per uur in een handvol.",
        },
        {
          text: "Ze verwijdert je account na één fout wachtwoord.",
          explanation:
            "Nee. Vergrendeling is een tijdelijke pauze na meerdere mislukkingen, geen verwijdering na één.",
        },
        {
          text: "Ze mailt je wachtwoord naar je toe als je een fout maakt.",
          explanation:
            "Nee. Wachtwoorden worden nooit gemaild (en zelfs niet in leesbare vorm opgeslagen); vergrendeling vertraagt het raden gewoon.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c16-q4",
      prompt: "Waarom verloopt je inlogsessie uiteindelijk?",
      options: [
        {
          text: "Zodat een uitgelekte of vergeten token na een vastgesteld venster vanzelf stopt met werken, wat de schade beperkt.",
          explanation:
            "Juist. Verloop is als een hotelsleutelkaart die bij het uitchecken wordt gedeactiveerd — een uitgelekte token wordt nutteloos zodra het venster sluit.",
        },
        {
          text: "Omdat de server geen ruimte meer heeft om sessies te bewaren.",
          explanation:
            "Nee. Verloop is een bewuste veiligheidslimiet, geen opslagprobleem — de levensduur staat in de token zelf.",
        },
        {
          text: "Om je te dwingen elke dag je wachtwoord te veranderen.",
          explanation:
            "Nee. Verloop vraagt je opnieuw in te loggen; het vereist geen nieuw wachtwoord.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
