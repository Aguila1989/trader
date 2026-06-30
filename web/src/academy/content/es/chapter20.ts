import type { Chapter } from "../../types";

export const chapter20: Chapter = {
  id: "c20",
  number: 20,
  level: "ADVANCED",
  title: "Cómo leer las sugerencias de trustlines de la IA",
  description: "Cómo el escaneo semanal puntúa los tokens, qué es un archivo TOML, cómo leer una advertencia de deterioro, por qué un pico de volumen puede ser una trampa y por qué una sugerencia es un punto de partida, no un veredicto.",
  lessons: [
    {
      id: "c20-l1",
      title: "Cómo la app puntúa los tokens como candidatos a trustline",
      paragraphs: [
        "Una vez por semana, la app analiza los principales tokens de Stellar (más los tokens que ya tienes) y pide a la IA que puntúe cada uno como candidato a trustline. Cada token recibe cuatro puntuaciones del 1 al 10, además de una puntuación general que las resume. Las cuatro son liquidez, legitimidad, tendencia y riesgo.",
        "La liquidez valora con qué facilidad podrías operar el token: su volumen real frente a XLM y la profundidad de su libro de órdenes. La legitimidad valora cuán creíble parece el proyecto: un stellar.toml publicado, un dominio propio real, un emisor conocido, una adopción genuina. La tendencia valora la dirección reciente del precio en los últimos 7 días. El riesgo se puntúa de modo que más alto es más seguro: un 10 significa el menor riesgo y un 1 significa muy arriesgado.",
        "Como el riesgo es \"más alto = más seguro\", las cuatro puntuaciones y la general apuntan en la misma dirección: más grande es mejor. La puntuación general es el juicio de un vistazo de la IA, pero los cuatro componentes te dicen por qué. Un token puede tener una liquidez excelente y a la vez una puntuación de legitimidad baja, y esa combinación es exactamente lo que el desglose está ahí para revelar.",
      ],
      example: "Una tarjeta de sugerencia muestra USDC con General 9 y, debajo, Liquidez 9, Legitimidad 10, Tendencia 7, Seguridad 9. Otra tarjeta muestra un token nuevo con General 4: Liquidez 6, pero Legitimidad 2 y Seguridad 3. Los números generales por sí solos te inclinarían hacia el primero; el desglose explica con precisión por qué el segundo puntúa bajo a pesar de una liquidez decente.",
    },
    {
      id: "c20-l2",
      title: "¿Qué es un archivo TOML y por qué importa su ausencia?",
      paragraphs: [
        "Un stellar.toml es un pequeño archivo público que un emisor aloja en su dominio propio (por ejemplo, en example.com/.well-known/stellar.toml). Es donde un proyecto legítimo se declara a sí mismo: el nombre de la organización, el sitio web, los datos de contacto y las cuentas emisoras exactas de sus tokens. Es el equivalente en la cadena de una tarjeta de presentación verificable.",
        "El escaneo descarga este archivo para cada token. Cuando existe, la app puede mostrarte el nombre del proyecto, la descripción y el sitio web en la tarjeta de sugerencia, y puedes verificar que el emisor del archivo coincide con el emisor en el que confiarías. Cuando falta, nada de eso es posible: estarías confiando en un emisor que ha elegido no identificarse.",
        "Por eso un TOML ausente se trata como una señal de alarma en lugar de un dato neutral. No prueba que un token sea una estafa, pero elimina la forma más fácil de verificar el proyecto y es una razón de peso para ser cauteloso. Un token que pierde un TOML que antes tenía se trata como aún más preocupante, porque algo que estaba documentado se ha apagado.",
      ],
      example: "Una sugerencia muestra \"Proyecto: Aquarius — aqua.network\", extraído directamente del TOML del emisor, y la clave del emisor en el archivo coincide con la de la tarjeta. Una segunda sugerencia muestra \"No se encontró stellar.toml\" y una señal de alarma a juego. El mismo escaneo, niveles de identidad verificable muy distintos.",
    },
    {
      id: "c20-l3",
      title: "Cómo interpretar una advertencia de deterioro",
      paragraphs: [
        "Las sugerencias señalan tokens que podrías añadir; las advertencias señalan tokens que ya tienes cuya situación ha empeorado desde la semana pasada. Cada advertencia enumera los disparadores específicos que se activaron, así nunca tienes que adivinar por qué se marcó un token. El bot solo advierte: nunca eliminará una trustline por ti.",
        "Hay siete disparadores. Caída de puntuación: la puntuación general bajó dos o más puntos de una semana a otra. Liquidez baja: la puntuación de liquidez está por debajo de 3. Caída de volumen: el volumen de 7 días cayó más de la mitad. Nuevas señales de alarma: apareció una señal que antes no estaba. Menos holders: el número de trustlines bajó más del 10%. TOML desaparecido: un stellar.toml que existía antes ya no es accesible. Tendencia a la baja: la tendencia del precio pasó de alza o estable a baja.",
        "Un solo disparador es un aviso para mirar; varios a la vez son una señal más fuerte. La tarjeta también muestra tu saldo actual y su valor estimado en XLM, así puedes sopesar cuánto está realmente en juego antes de decidir si investigar, mantener, reducir o salir. Puedes posponer una advertencia siete días si ya la has revisado y quieres volver a verla más tarde.",
      ],
      example: "Un token que tienes muestra dos disparadores: \"Caída de volumen\" y \"Menos holders\". La tarjeta indica que el volumen de 7 días cayó un 64% y que los holders con trustline bajaron un 18% (5.000 → 4.100), con tu saldo de 1.200 valorado en unos 90 XLM. Dos signos independientes de un proyecto que pierde tracción, más una cantidad real en juego: un claro motivo para investigar en lugar de ignorar.",
    },
    {
      id: "c20-l4",
      title: "¿Qué es un pico de volumen sin fundamentos?",
      paragraphs: [
        "El volumen de operaciones suele ser una señal saludable, pero un pico repentino sin nada real detrás es lo contrario. Un pico de volumen sin fundamentos es una explosión de operaciones que no va acompañada de ninguna mejora en las cosas que dan valor a un token: ni más holders, ni novedades del proyecto, ni un libro de órdenes más profundo y, a menudo, ningún emisor identificable.",
        "Es un patrón clásico de manipulación. Un puñado de cuentas puede hacer wash trading de un token de un lado a otro para fabricar volumen y posicionarlo alto, esperando que la propia actividad atraiga compradores. El precio sube por el interés artificial, los iniciados venden a la nueva demanda y el volumen desaparece tan rápido como apareció.",
        "Por eso se le indica a la IA que marque un pico de volumen sin fundamentos como una señal de alarma en lugar de premiarlo. El volumen solo significa algo cuando está respaldado por una adopción y una liquidez genuinas. Cuando el desglose de puntuaciones muestra un volumen reciente alto pero una legitimidad débil y pocos holders, esa discrepancia es la pista.",
      ],
      example: "Un token se dispara en el ranking semanal con un salto de volumen de 20x, pero su número de holders se mantiene plano en 40, no tiene stellar.toml y su libro de órdenes es muy poco profundo. La IA puntúa alto su tendencia, pero baja su legitimidad y su seguridad, y añade la señal de alarma \"pico de volumen repentino sin fundamentos\". El volumen es real; la sustancia detrás de él no.",
    },
    {
      id: "c20-l5",
      title: "Usar las sugerencias de la IA como punto de partida, no como respuesta final",
      paragraphs: [
        "El escaneo es un asistente de investigación, no un oráculo. Comprime muchos datos on-chain en unas pocas puntuaciones para que puedas hacer un triaje rápido, pero trabaja a partir de señales públicas y limitadas y del juicio de un modelo de lenguaje. No puede conocer las verdaderas intenciones de un emisor ni leer las noticias de mañana. Una puntuación alta reduce tu lista de finalistas; no certifica un token.",
        "Cada tarjeta de sugerencia lleva el mismo descargo de responsabilidad por una razón: añadir una trustline siempre es un riesgo, reserva 0,5 XLM y te expone al emisor. Nunca añadas una trustline basándote solo en la sugerencia. Úsala para decidir qué vale la pena investigar y luego verifica tú mismo el emisor, el TOML, los holders y la liquidez.",
        "Trata las puntuaciones como el punto de partida de una conversación con tu propia diligencia debida. El mejor flujo de trabajo es: deja que el escaneo saque a la luz candidatos, lee el desglose y las señales de alarma, confirma los datos de forma independiente y solo entonces decide. La decisión final, y la responsabilidad, siempre son tuyas.",
      ],
      example: "El escaneo sugiere un token con General 8. En lugar de añadirlo de inmediato, abres su sitio web desde el TOML, confirmas que la clave del emisor coincide, echas un vistazo a la tendencia de sus holders a lo largo de varias semanas y compruebas que el libro de órdenes en XLM es realmente profundo. Todo cuadra, así que añades la trustline de forma deliberada: la sugerencia inició el proceso, tu propia investigación lo terminó.",
    },
  ],
  quiz: [
    {
      id: "c20-q1",
      prompt: "En una tarjeta de sugerencia, ¿qué significa una puntuación de riesgo (seguridad) alta?",
      options: [
        { text: "El token es muy arriesgado: más alto significa más peligro.", explanation: "Incorrecto. La escala está invertida respecto a esa intuición: en esta app, la puntuación de riesgo/seguridad es más alta = más segura." },
        { text: "El token tiene menor riesgo: 10 significa el menor riesgo y 1 significa muy arriesgado.", explanation: "Correcto. El riesgo se puntúa de modo que más alto es más seguro, lo que mantiene las cuatro puntuaciones y la general apuntando en la misma dirección: más grande es mejor." },
        { text: "El riesgo no tiene nada que ver con la puntuación general.", explanation: "Incorrecto. El riesgo es uno de los cuatro componentes que informan la puntuación general." },
      ],
      correctIndex: 1,
    },
    {
      id: "c20-q2",
      prompt: "¿Por qué un stellar.toml ausente cuenta como señal de alarma?",
      options: [
        { text: "Porque el token es automáticamente una estafa si no lo tiene.", explanation: "Incorrecto. Un TOML ausente no prueba fraude, pero elimina la forma más fácil de verificar el proyecto, por eso se trata con cautela." },
        { text: "Porque elimina la principal forma de identificar y verificar al emisor y al proyecto.", explanation: "Correcto. El TOML es donde un emisor declara su identidad, su sitio web y sus claves emisoras; sin él estarías confiando en un emisor que no se ha identificado." },
        { text: "Porque hace que la reserva de 0,5 XLM sea mayor.", explanation: "Incorrecto. La reserva siempre es de 0,5 XLM por trustline, exista o no un TOML." },
      ],
      correctIndex: 1,
    },
    {
      id: "c20-q3",
      prompt: "La advertencia de un token que tienes enumera 'Caída de volumen' y 'Menos holders'. ¿Qué deberías concluir?",
      options: [
        { text: "El bot ya ha vendido el token para protegerte.", explanation: "Incorrecto. El bot solo advierte; nunca elimina una trustline ni vende basándose en una advertencia. La decisión es tuya." },
        { text: "Dos signos independientes de que el proyecto pierde tracción: un motivo para investigar.", explanation: "Correcto. Cada disparador es una señal de deterioro específica; varios juntos son un indicio más fuerte para investigar y decidir qué hacer." },
        { text: "Nada: las advertencias son aleatorias y pueden ignorarse.", explanation: "Incorrecto. Cada disparador corresponde a un umbral concreto que se ha cruzado en los datos de una semana a otra." },
      ],
      correctIndex: 1,
    },
    {
      id: "c20-q4",
      prompt: "¿Qué es un 'pico de volumen sin fundamentos'?",
      options: [
        { text: "Una explosión de operaciones que no va acompañada de más holders, mayor liquidez ni un emisor creíble.", explanation: "Correcto. La actividad está fabricada (a menudo wash trading) en lugar de estar respaldada por una adopción genuina, por eso se marca en lugar de premiarse." },
        { text: "Un aumento constante y a largo plazo del volumen junto con una base de holders en crecimiento.", explanation: "Incorrecto. Eso es un crecimiento saludable y respaldado por fundamentos: lo opuesto a la señal de alarma." },
        { text: "Una caída del volumen causada por una bajada generalizada del mercado.", explanation: "Incorrecto. El patrón es un pico al alza del volumen sin sustancia, no una caída." },
      ],
      correctIndex: 0,
    },
    {
      id: "c20-q5",
      prompt: "¿Cómo deberías tratar una sugerencia de la IA con puntuación alta?",
      options: [
        { text: "Como un token certificado como seguro que puedes añadir sin pensarlo más.", explanation: "Incorrecto. El escaneo trabaja a partir de señales públicas limitadas; no puede certificar un token, y cada tarjeta advierte contra añadirlo basándose solo en la sugerencia." },
        { text: "Como un punto de partida para tu propia investigación: verifica el emisor, el TOML, los holders y la liquidez antes de decidir.", explanation: "Correcto. Una puntuación alta reduce tu lista de finalistas; la verificación independiente y la decisión final siguen siendo tuyas." },
        { text: "Como algo irrelevante, ya que las puntuaciones de la IA nunca son útiles.", explanation: "Incorrecto. Las puntuaciones son una herramienta de triaje útil: simplemente no sustituyen a la diligencia debida." },
      ],
      correctIndex: 1,
    },
  ],
};
