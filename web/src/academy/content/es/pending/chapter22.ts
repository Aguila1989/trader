// PENDING — do not activate until green light.
import type { Chapter } from "../../../types";

export const chapter22: Chapter & { whoFor: string } = {
  id: "c22",
  number: 22,
  level: "BASIC",
  whoFor: "Para cualquiera que alguna vez haya vendido por pánico o comprado en el techo",
  title: "Psicología del trading",
  description:
    "Los juegos mentales que les cuestan dinero a quienes operan: el FOMO, el FUD, la aversión a la pérdida y los hábitos sencillos que mantienen tus decisiones tranquilas y basadas en reglas.",
  lessons: [
    {
      id: "c22-l1",
      title: "¿Qué es el FOMO y por qué lleva a malas decisiones?",
      paragraphs: [
        "FOMO significa el miedo a quedarse fuera. En el trading, es esa sensación de ansiedad de que una moneda se dispara sin ti, así que compras a toda prisa antes de pensarlo bien. La sensación es real, pero te empuja a comprar cuando el precio ya está alto y las ganancias fáciles ya se han esfumado.",
        "El problema es el momento. Cuando una moneda ya está por todas partes en tu feed y todo el mundo está entusiasmado, por lo general la mayor parte del movimiento ya ha ocurrido. Quienes persiguen esa euforia suelen llegar justo antes de que el precio se enfríe, y luego ven caer su nueva posición. La decisión la tomó la emoción, no un plan.",
        "Un enfoque más sereno consiste en decidir de antemano cuánto vale una moneda para ti y esperar a ese precio. Si nunca llega, simplemente dejas pasar la operación. Perderse una ganancia no es lo mismo que perder dinero, y siempre habrá otra oportunidad.",
      ],
      example:
        "Imagina que pasas por delante de un restaurante con una larga cola en la puerta. Nunca has comido ahí y no sabes nada de la comida, pero la multitud hace que te unas de todos modos. Eso es FOMO. Te pusiste en la fila porque otros lo hicieron, no porque comprobaras si la comida era buena. En el trading, comprar una moneda solo porque se está disparando es exactamente el mismo reflejo.",
    },
    {
      id: "c22-l2",
      title: "¿Qué es el FUD y cómo lo reconoces?",
      paragraphs: [
        "FUD son las siglas en inglés de miedo, incertidumbre y duda. Describe los comentarios negativos, a veces ciertos y a veces no, que se difunden para asustarte lo suficiente como para que vendas. Puede ser una advertencia honesta, o puede ser alguien que intenta hundir un precio para poder comprar barato.",
        "El truco para manejar el FUD es separar la afirmación de la emoción. Pregúntate qué se está diciendo exactamente, si existe alguna prueba y a quién le conviene que entres en pánico. Un vago Vamos a perderlo todo es muy distinto de un dato concreto y verificable que puedas comprobar por ti mismo.",
        "No tienes que ignorar las malas noticias, y los riesgos reales merecen atención real. Pero nunca deberías vender solo porque un mensaje aterrador te aceleró el corazón. Baja el ritmo, verifica y solo entonces decide.",
      ],
      example:
        "Piensa en alguien que grita fuego en un teatro lleno de gente. A veces de verdad hay humo y salir rápido es lo correcto. A veces no hay nada, y la persona solo quería que se vaciaran los asientos. El FUD es igual: antes de correr hacia la salida y vender todo, echa un vistazo alrededor y comprueba si de verdad hay humo.",
    },
    {
      id: "c22-l3",
      title: "¿Por qué la gente vende justo en el fondo?",
      paragraphs: [
        "Ocurre una y otra vez: un precio cae, quien lo tiene lo aguanta un tiempo y al final vende con desesperación, a menudo justo antes de que se recupere. Este patrón lo impulsa la aversión a la pérdida, un sesgo muy estudiado según el cual el dolor de perder se siente aproximadamente el doble de fuerte que el placer de una ganancia equivalente.",
        "Como una pérdida sobre el papel duele tanto, verla crecer se vuelve insoportable. Vender hace que la sensación desagradable pare ahora mismo, así que el cerebro lo interpreta como un alivio incluso cuando fija el peor precio posible. La decisión resuelve un problema emocional, no uno financiero.",
        "Saber esto de antemano es la defensa. Si decides tu precio de salida antes de sentir el miedo, es mucho menos probable que malvendas en el fondo solo para que desaparezca la incomodidad.",
      ],
      example:
        "Imagina dos sobres. En uno encuentras 50 USDC, una grata sorpresa. En el otro pierdes 50 USDC que ya tenías. La mayoría de la gente siente la pérdida mucho más intensamente que la ganancia, aunque la cantidad sea idéntica. Esa sensación desequilibrada es la aversión a la pérdida, y es justo lo que tienta a quien opera a vender en el punto más bajo.",
    },
    {
      id: "c22-l4",
      title: "¿Qué es un plan de trading y por qué lo necesitas?",
      paragraphs: [
        "Un plan de trading es un pequeño conjunto de reglas que escribes para ti antes de operar: qué vas a comprar, cuánto, a qué precio tomas ganancias y a qué precio aceptas una pérdida y sales. Convierte esperanzas difusas en acciones claras y decididas de antemano.",
        "El valor de un plan está en que lo escribes cuando estás tranquilo, no mientras un precio se desploma o se dispara. Cuando más tarde las emociones se disparan, no tienes que inventar una decisión sobre la marcha. Simplemente sigues las reglas que ya acordaste contigo mismo.",
        "En esta aplicación puedes trasladar partes de tu plan directamente a las herramientas. Un stop loss fija el precio al que sales de una operación perdedora, y un precio objetivo fija dónde tomas ganancias, de modo que el plan funciona incluso cuando no estás mirando.",
      ],
      example:
        "Si emprendes un viaje por carretera sin mapa ni GPS, conduces por intuición, tomas desvíos equivocados y discutes en cada cruce. Con una ruta planificada de antemano, cada giro ya está decidido y el trayecto es tranquilo. Un plan de trading es esa ruta: resuelves las decisiones difíciles antes de arrancar, no en pleno pánico al volante.",
    },
    {
      id: "c22-l5",
      title: "¿Cómo tomas una decisión sin emoción?",
      paragraphs: [
        "No puedes apagar los sentimientos, pero puedes impedir que lleven el volante. El truco central es decidir las reglas antes de que el dinero y la emoción estén en juego, y luego dejar que esas reglas tomen la decisión en el momento. Un plan de trading, un stop loss y un precio objetivo hacen esto por ti.",
        "También ayuda bajar el ritmo. La mayoría de las malas operaciones vienen de actuar en cuestión de segundos. Esperar aunque sean unos minutos, o consultarlo con la almohada cuando la decisión es grande, deja que el primer arrebato de miedo o codicia se disipe para que tu razonamiento se ponga al día. Si una operación solo tiene sentido mientras estás eufórico, por lo general no es una buena operación.",
        "Por último, anota por qué hiciste cada operación. Revisar tus propias notas más tarde te muestra con honestidad si mandaba la emoción o la lógica, y esa retroalimentación poco a poco te convierte en alguien que opera con más firmeza.",
      ],
      example:
        "Un piloto no se guía por su estado de ánimo durante una tormenta; sigue una lista de comprobación escrita, un paso tranquilo a la vez. Puedes tratar el trading de la misma manera: una pequeña lista de comprobación como ¿Está esto en mi plan? ¿He fijado mi salida? ¿Actúo por hechos o por miedo? convierte un impulso acalorado en una decisión fría y deliberada.",
    },
  ],
  quiz: [
    {
      id: "c22-q1",
      prompt: "Ves que una moneda se dispara y todo el mundo habla de ella en internet. Sientes el impulso de comprar de inmediato. ¿Cuál es la respuesta más sana?",
      options: [
        {
          text: "Comprar de golpe, porque si todos están entusiasmados el precio tiene que seguir subiendo.",
          explanation:
            "Esto es el FOMO en acción. Cuando una moneda ya está por todas partes, por lo general la mayor parte del movimiento ya ha ocurrido, y perseguirla a menudo significa comprar justo antes de que se enfríe.",
        },
        {
          text: "Detenerte, decidir cuánto vale realmente la moneda para ti y comprar solo a ese precio; de lo contrario, dejarla pasar.",
          explanation:
            "Correcto. Decidir tu precio de antemano sustituye la persecución emocional por una regla. Perderse una ganancia no es una pérdida, y siempre llegará otra oportunidad.",
        },
        {
          text: "Vender todo lo demás que tengas para comprar la mayor cantidad posible de ella.",
          explanation:
            "No. Entrar con más fuerza agranda el error del FOMO, no lo reduce, y abandona cualquier plan que tuvieras.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c22-q2",
      prompt: "Un mensaje dramático dice que una moneda está a punto de colapsar y que deberías vender ya. ¿Cómo deberías tratarlo?",
      options: [
        {
          text: "Vender de inmediato, porque el mensaje suena urgente y aterrador.",
          explanation:
            "Actuar solo por miedo es exactamente lo que el FUD está diseñado para provocar. La urgencia y el dramatismo no son lo mismo que las pruebas.",
        },
        {
          text: "Separar la afirmación de la emoción: buscar pruebas reales y preguntar a quién le conviene que entres en pánico.",
          explanation:
            "Correcto. El FUD mezcla el miedo con afirmaciones vagas. Verificar los datos concretos, y fijarte en quién se beneficia de tu pánico, mantiene la decisión racional.",
        },
        {
          text: "Ignorar para siempre todas las noticias negativas, porque siempre son falsas.",
          explanation:
            "No exactamente. Algunas malas noticias son reales y merecen atención. La habilidad está en verificar las afirmaciones, no en descartar toda advertencia.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c22-q3",
      prompt: "¿Por qué la aversión a la pérdida suele hacer que quienes operan vendan justo en el fondo?",
      options: [
        {
          text: "Porque vender barato es, matemáticamente, la mejor manera de obtener una ganancia.",
          explanation:
            "No. Vender en el fondo fija el peor precio. No tiene nada que ver con la ganancia y todo que ver con detener el dolor emocional.",
        },
        {
          text: "Porque el dolor de una pérdida creciente se siente tan fuerte que vender para que la sensación pare parece un alivio.",
          explanation:
            "Correcto. La aversión a la pérdida significa que las pérdidas duelen aproximadamente el doble de lo que satisfacen las ganancias equivalentes, así que la gente vende para acabar con la incomodidad incluso en el peor momento.",
        },
        {
          text: "Porque un plan de trading les obliga a vender al precio más bajo.",
          explanation:
            "Es justo lo contrario. Un plan con una salida prefijada es lo que evita la venta por pánico en el fondo.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c22-q4",
      prompt: "¿Cuál es el principal beneficio de escribir un plan de trading antes de operar?",
      options: [
        {
          text: "Garantiza que toda operación será rentable.",
          explanation:
            "Ningún plan puede garantizar ganancias. Los mercados son inciertos; un plan gestiona tu comportamiento, no el resultado.",
        },
        {
          text: "Decides tus reglas de compra, de toma de ganancias y de salida mientras estás tranquilo, para que las emociones acaloradas no tomen la decisión después.",
          explanation:
            "Correcto. Un plan fijado en un momento de calma significa que, cuando un precio oscila, sigues reglas que ya elegiste en lugar de improvisar bajo estrés.",
        },
        {
          text: "Te permite operar sin necesitar nunca un stop loss ni un precio objetivo.",
          explanation:
            "Al revés. Un stop loss y un precio objetivo son herramientas que ponen tu plan en acción, no cosas cuya necesidad elimina un plan.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
