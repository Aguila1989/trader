// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
import type { Chapter } from "../../../types";

export const chapter23: Chapter & { whoFor: string } = {
  id: "c23",
  number: 23,
  level: "BASIC",
  whoFor: "Para quienes operan y quieren mantener la calma en las subidas y bajadas",
  title: "Ciclos de mercado",
  description:
    "Mercados alcistas y bajistas, temporadas de altcoins, correcciones frente a desplomes, por qué las monedas tienden a moverse juntas y cómo actuar cuando el mercado cae.",
  lessons: [
    {
      id: "c23-l1",
      title: "¿Qué es un mercado alcista y un mercado bajista?",
      paragraphs: [
        "Los mercados se mueven en tramos largos, no en líneas rectas. Un mercado alcista es un periodo sostenido en el que los precios suben de forma generalizada y la mayoría de la gente se siente optimista. Un mercado bajista es lo contrario: un periodo sostenido en el que los precios bajan de forma generalizada y se impone la cautela. Ninguno dura para siempre, y uno siempre acaba dando paso al otro.",
        "Los nombres provienen de cómo ataca cada animal. Un toro lanza los cuernos hacia arriba, y un oso da un zarpazo hacia abajo, lo cual es una forma práctica de recordar cuál es cuál. En un mercado alcista el ánimo es de confianza y los compradores están ansiosos; en un mercado bajista el ánimo es de miedo y dominan los vendedores.",
        "Lo más importante que debe entender quien empieza es que ambos son completamente normales. Los precios no solo suben, y tampoco solo bajan. Esperar de antemano ambos tipos de clima te evita llevarte un susto cuando cambia la estación.",
      ],
      example:
        "Piensa en el año como si tuviera estaciones. La primavera es un mercado alcista: las cosas crecen, todo se ve verde y da la sensación de que va a durar. El invierno es un mercado bajista: el crecimiento se detiene, los días son grises y puede parecer que el frío no terminará nunca. Pero la primavera siempre vuelve y el invierno siempre regresa. Ambos son normales, y ambos pasan. Quien opera y entra en pánico en invierno simplemente ha olvidado que las estaciones cambian.",
    },
    {
      id: "c23-l2",
      title: "¿Qué es una temporada de altcoins?",
      paragraphs: [
        "En las criptomonedas, las monedas más grandes y conocidas suelen marcar el rumbo. Cuando esos gigantes ya han subido mucho, la atención a menudo se desborda hacia monedas más pequeñas, a veces llamadas monedas \"alt\", abreviatura de alternativas. Un periodo en el que estas monedas más pequeñas suben especialmente rápido, superando a las más grandes, se llama temporada de altcoins.",
        "Durante una temporada de altcoins la emoción puede ser intensa, porque las monedas pequeñas pueden moverse un porcentaje muy grande en poco tiempo. Sin embargo, eso funciona en ambas direcciones. Las mismas monedas que se disparan rápido también pueden caer con la misma rapidez cuando el ánimo se enfría, así que las ganancias rápidas vienen con un riesgo rápido.",
        "Para quien opera con calma, la lección es no perseguir cada moneda que se mueve rápido. Los movimientos veloces resultan emocionantes, pero una moneda que puede duplicarse en una semana también puede reducirse a la mitad en una semana. Entender qué es una temporada de altcoins te ayuda a ver la emoción por lo que es, en vez de dejarte arrastrar por ella.",
      ],
      example:
        "Imagina un gran desfile en el que las carrozas enormes van primero y atraen a las mayores multitudes. Una vez que han pasado, los artistas más pequeños que van detrás tienen su momento, y durante un rato la multitud los aclama con más fuerza. Una temporada de altcoins es ese tramo del desfile: los números pequeños de pronto eclipsan a los gigantes durante un estallido corto y lleno de energía, antes de que el desfile siga adelante.",
    },
    {
      id: "c23-l3",
      title: "¿Qué es una corrección de mercado frente a un desplome?",
      paragraphs: [
        "No toda caída es un desastre. Una corrección de mercado es un retroceso moderado y normal, a menudo de alrededor del diez por ciento, que interrumpe una tendencia alcista sin ponerle fin. Las correcciones son saludables: permiten que un precio demasiado entusiasmado se enfríe y recupere el aliento, y ocurren con regularidad incluso en un mercado alcista fuerte.",
        "Un desplome de mercado es otra bestia. Es una caída repentina y severa, mucho más pronunciada y profunda que una corrección normal, y suele venir acompañada de miedo real. Donde una corrección es una pausa, un desplome puede sentirse como si el suelo se abriera bajo tus pies, con los precios cayendo rápido durante horas o días.",
        "Distinguir uno del otro importa porque exigen reacciones distintas. Entrar en pánico ante una corrección rutinaria puede llevarte a vender una buena posición sin motivo, mientras que tratar un desplome genuino como \"solo un retroceso\" puede hacer que ignores un peligro real. A ninguno de los dos conviene responder con pura emoción.",
      ],
      example:
        "Imagina que bajas caminando por una colina. Una corrección de mercado es un escalón corto y empinado hacia abajo en un camino que, por lo demás, sube: una pequeña sacudida, pero en conjunto sigues ascendiendo. Un desplome de mercado se parece más a que el sendero cede de repente bajo tus pies. Ambos implican bajar, pero uno es un bache normal del paseo y el otro es una caída para la que debes prepararte.",
    },
    {
      id: "c23-l4",
      title: "¿Por qué a veces todo el mercado se mueve junto?",
      paragraphs: [
        "Algunos días parece que casi todas las monedas están en verde, y otros días casi todas están en rojo, todas a la vez. Esto se debe a que los precios no solo los impulsa la historia propia de cada moneda, sino un ánimo compartido en todo el mercado. Cuando el miedo o la codicia se extienden, tocan casi todo al mismo tiempo.",
        "Las monedas más grandes actúan como un ancla para el resto. Como hay tanto dinero y tanta atención concentrados en las monedas más grandes, cuando estas se mueven con fuerza tienden a arrastrar a las más pequeñas en la misma dirección. Una ola de confianza eleva todo el campo, y una ola de miedo lo hunde todo en conjunto.",
        "Saber esto te evita malinterpretar un día en rojo. Si tu moneda cae mientras todo lo demás también cae, normalmente significa que todo el mercado está nervioso, no que algo ande específicamente mal con tu moneda. Separar el ánimo general del mercado de las noticias propias de una moneda es un hábito tranquilizador y útil.",
      ],
      example:
        "Piensa en los barcos de un puerto cuando sube o baja la marea. No importa si un barco es grande o pequeño, viejo o nuevo; cuando la marea sube, todos suben juntos, y cuando baja, todos descienden juntos. El ánimo del mercado es esa marea. En un día de mucho miedo la marea se retira y casi todas las monedas caen con ella, sin importar sus propios méritos.",
    },
    {
      id: "c23-l5",
      title: "¿Cómo debes comportarte en un mercado bajista?",
      paragraphs: [
        "El mayor error en una caída es la venta por pánico, deshacerse de una posición solo porque la bajada del precio resulta insoportable. Ese reflejo tiende a consolidar una pérdida en el peor momento posible. El camino más firme es bajar el ritmo, ceñirte al plan que hiciste cuando estabas tranquilo y evitar tomar decisiones completamente nuevas en pleno arrebato de miedo.",
        "Quedarte en la seguridad de algo parecido al efectivo también es una opción perfectamente válida, no un fracaso. Mantener monedas estables como USDC durante un mercado bajista te permite apartarte de los vaivenes sin salir del ecosistema, y puedes volver a entrar más adelante cuando te sientas preparado. Elegir no hacer nada durante un tiempo es en sí mismo una decisión.",
        "Una caída también es un regalo de tiempo. Con menos presión para actuar, puedes centrarte en aprender: estudia cómo se puntúan las monedas, lee el AI Log y familiarízate con las herramientas. En esta aplicación un stop loss puede definir tu salida de antemano para que una sola operación no se descontrole, lo cual encaja bien con la mentalidad tranquila y de plan primero que se trató en capítulos anteriores. Esto es educación, no asesoramiento financiero, y solo tú puedes decidir qué se ajusta a tu situación.",
      ],
      example:
        "Imagina un pequeño bote atrapado en una tormenta. El marinero que entra en pánico arroja la carga por la borda y salta del barco asustado. El marinero tranquilo arría las velas, mantiene un rumbo firme y espera a que pase el mal tiempo. En un mercado bajista, mover algunos fondos a monedas estables es como arriar las velas, y negarte a vender por pánico es como quedarte con el bote hasta que regresen aguas más calmadas.",
    },
  ],
  quiz: [
    {
      id: "c23-q1",
      prompt: "¿Cómo deberías pensar sobre un mercado alcista y un mercado bajista?",
      options: [
        {
          text: "Un mercado alcista es normal, pero un mercado bajista es señal de que el mercado está roto y se ha ido para siempre.",
          explanation:
            "No es así. Ambos son fases normales. Igual que la primavera y el invierno, un mercado bajista es tan natural como un mercado alcista, y siempre acaba pasando.",
        },
        {
          text: "Ambos son fases normales y recurrentes: los precios suben durante un tramo, luego bajan durante un tramo, y cada uno acaba dando paso al otro.",
          explanation:
            "Correcto. Los mercados se mueven en ciclos. Esperar tanto la estación de subidas como la de bajadas te evita llevarte un susto cuando cambia el ánimo.",
        },
        {
          text: "Puedes ignorar la diferencia sin problema, porque los precios solo suben con el tiempo.",
          explanation:
            "No. Los precios no solo suben. Ignorar las fases de bajada es exactamente lo que deja a quienes operan sin preparación cuando llega un mercado bajista.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c23-q2",
      prompt: "Durante una temporada de altcoins, las monedas más pequeñas suben muy rápido. ¿Cuál es la forma tranquila de verlo?",
      options: [
        {
          text: "Las monedas alt que suben rápido son dinero garantizado, así que deberías comprar tantas como sea posible.",
          explanation:
            "No. Una moneda que puede duplicarse rápido también puede reducirse a la mitad rápido. No hay ninguna garantía, y perseguir cada moneda que se mueve rápido es como la gente se lleva un chasco.",
        },
        {
          text: "La emoción es real, pero las mismas monedas que se disparan rápido pueden caer con la misma rapidez, así que las ganancias rápidas vienen con un riesgo rápido.",
          explanation:
            "Correcto. Una temporada de altcoins es emocionante pero tiene dos caras. Reconocerla por lo que es te ayuda a evitar dejarte arrastrar por la euforia.",
        },
        {
          text: "Una temporada de altcoins significa que las monedas más grandes han dejado de importar para siempre.",
          explanation:
            "No es cierto. Las monedas más grandes siguen marcando el rumbo del mercado; una temporada de altcoins es solo un tramo en el que las monedas más pequeñas las superan temporalmente.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c23-q3",
      prompt: "¿Cuál es la diferencia entre una corrección de mercado y un desplome de mercado?",
      options: [
        {
          text: "Un desplome de mercado es un retroceso pequeño y saludable, mientras que una corrección de mercado es un colapso total.",
          explanation:
            "Esto los tiene al revés. Una corrección es el retroceso pequeño y normal; un desplome es la caída repentina y severa.",
        },
        {
          text: "Son exactamente lo mismo con dos nombres diferentes.",
          explanation:
            "No. Se diferencian en tamaño y velocidad, y por eso exigen reacciones distintas.",
        },
        {
          text: "Una corrección es un retroceso moderado y normal (a menudo de alrededor del diez por ciento) que interrumpe una subida, mientras que un desplome es una caída repentina, mucho más pronunciada y profunda.",
          explanation:
            "Correcto. Una corrección es una pausa que permite que los precios se enfríen; un desplome se siente como si el suelo se abriera bajo tus pies y señala un peligro real.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c23-q4",
      prompt: "Tu moneda está cayendo, pero casi todas las demás monedas también caen al mismo tiempo. ¿Qué suele significar esto?",
      options: [
        {
          text: "Todo el mercado está de ánimo temeroso, y el sentimiento general del mercado arrastra a la mayoría de las monedas hacia abajo en conjunto.",
          explanation:
            "Correcto. Igual que una marea hace descender todos los barcos, una ola de miedo hunde todo el campo a la vez. Normalmente no es algo específico de tu moneda.",
        },
        {
          text: "Algo anda mal de forma específica y única con tu moneda.",
          explanation:
            "Probablemente no. Cuando todo cae junto, apunta a un ánimo compartido del mercado más que a un problema con tu moneda concreta.",
        },
        {
          text: "Es una coincidencia, y que las monedas se muevan juntas al mismo tiempo no significa nada.",
          explanation:
            "No. Que las monedas se muevan juntas es un patrón real, impulsado por el sentimiento compartido y por las monedas más grandes que arrastran al resto.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
