// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// Complemento de microestructura de mercado para el Capítulo 12 ("Funciones avanzadas de Stellar").
// Esto NO es un capítulo independiente. Con la luz verde, añade c12ExtraLessons a
// chapter12.lessons[] (después de c12-l5) y c12ExtraQuiz a chapter12.quiz[] (después de
// c12-q5). Los ids continúan la numeración existente: lecciones c12-l6/c12-l7, cuestionario
// c12-q6/c12-q7. La lección sobre maker/taker usa los términos del glosario "maker" y
// "taker" tal cual para que su primera aparición se enlace automáticamente a un tooltip.
import type { Lesson, QuizQuestion } from "../../types";

export const c12ExtraLessons: Lesson[] = [
  {
    id: "c12-l6",
    title: "Dinámica maker frente a taker y cómo afecta a la estrategia",
    paragraphs: [
      "Cada ejecución en el libro de órdenes del SDEX tiene dos lados, y el protocolo los trata de forma muy distinta en cuanto a coste, aunque no cobre a ninguno una comisión porcentual. El libro de órdenes se casa por prioridad de precio y luego de tiempo: en cada nivel de precio se ejecuta primero el mejor precio, y entre las ofertas que comparten un mismo precio se ejecuta antes la más antigua que la más nueva. Esa única regla es la que crea los dos roles que debes entender antes de poder siquiera razonar sobre estrategia.",
      "Un maker es una oferta que reposa en el libro y espera. Cuando envías un manageSellOffer o un manageBuyOffer a un precio que no cruza el libro actual, no se ejecuta de inmediato; se une a la cola en su nivel de precio y se queda allí aportando liquidez para que otra persona opere contra ella. Como esperó, obtiene su precio: una puja en reposo se ejecuta a la puja, una oferta en reposo se ejecuta a la oferta. En efecto, el maker captura el spread en lugar de pagarlo. El coste de ser maker es el tiempo y el riesgo de ejecución, ya que el mercado puede alejarse antes de que alguien cruce hacia ti y tu oferta puede no ejecutarse nunca.",
      "Un taker es la imagen especular. Cuando envías una oferta con un precio que cruza el libro existente, o simplemente necesitas una ejecución inmediata, estás levantando la mejor oferta en reposo del otro lado. Obtienes certeza de ejecución dentro del próximo cierre de ledger, pero lo pagas cruzando el spread: comprando a la oferta, vendiendo a la puja. Sobre una ventaja medida en unos pocos puntos básicos, ceder un spread de 10 puntos básicos en la entrada y otro más en la salida puede borrar toda la ganancia teórica de una operación de ida y vuelta. Por eso la distinción entre maker y taker no es contabilidad académica; es la diferencia entre un spread que ganas y un spread que pagas.",
      "La estrategia se deduce directamente. Una estrategia de captura de spread, que es lo que ejecuta este bot, quiere ser maker tan a menudo como sea posible, por eso prioriza al maker: reposa su oferta en la mejor puja u oferta y deja que las contrapartes crucen hacia ella, convirtiendo el spread de un coste en una fuente de ventaja. Solo cruza como taker cuando una ejecución inmediata importa de verdad más que el spread, por ejemplo para cerrar una posición que ha alcanzado su stop. Una estrategia de momentum o impulsada por noticias hace la disyuntiva opuesta, aceptando el coste del spread del taker para garantizar que está en el mercado antes de que el movimiento continúe. Ninguno de los dos roles es universalmente mejor; el correcto depende de si vale más la certeza de ejecución o la mejora de precio para la operación que tienes delante.",
    ],
    example:
      "El libro de XLM/USDC muestra una mejor puja de 0,1170 y una mejor oferta de 0,1180, un spread de 10 puntos básicos. Actuando como taker para comprar ahora mismo, levantas la oferta y pagas 0,1180. Actuando como maker, en cambio reposas una orden de compra a 0,1170, uniéndote a la cola de pujas detrás de cualquier oferta más antigua que haya allí. Cuando más tarde un vendedor cruza hacia abajo hasta 0,1170, tu oferta se ejecuta a 0,1170 dentro de ese cierre de ledger. Mismo activo, mismo momento: el taker pagó 0,0010 por XLM de spread mientras que el maker lo capturó, un vuelco del spread completo de 10 puntos básicos entre los dos roles en una sola ejecución.",
  },
  {
    id: "c12-l7",
    title: "El impacto en el precio y cómo calcularlo para una orden grande",
    paragraphs: [
      "El impacto en el precio es lo que ocurre cuando tu orden es mayor que la liquidez que hay al mejor precio. En el SDEX el libro de órdenes es una pila de ofertas discretas en reposo a precios crecientes (o decrecientes). Una orden taker pequeña se ejecuta por completo contra el nivel superior y se cierra cerca del precio cotizado. Una orden taker grande agota el nivel superior, luego ejecuta el siguiente nivel a un precio peor, luego el nivel posterior, recorriendo el libro hacia arriba hasta que toda la cantidad queda ejecutada. Tu precio medio de ejecución es, por tanto, peor que el precio que veías cotizado, y la brecha entre ambos es el impacto en el precio de tu orden.",
      "Puedes estimar el impacto antes de operar directamente a partir de la profundidad mostrada, porque el libro te dice exactamente cuánto volumen reposa en cada nivel. Recorre los niveles en orden, cubriendo tu cantidad de forma voraz: toma todo lo que hay al mejor precio, luego lo que aún necesites al siguiente precio, y así sucesivamente hasta agotar tu orden. Multiplica la cantidad tomada en cada nivel por el precio de ese nivel, suma esos productos y divide entre tu cantidad total para obtener tu precio medio de ejecución ponderado por volumen. Compara esa media con la cotización del mejor precio de la que partiste y la diferencia, expresada como porcentaje, es tu impacto en el precio estimado. Cuanto más profundo sea el libro cerca de la cima, menor será el impacto para el mismo tamaño de orden; un libro poco profundo hace que incluso una orden modesta recorra varios niveles.",
      "El impacto en el precio, el slippage y la liquidez son tres perspectivas de la misma realidad subyacente, y merece la pena ser preciso sobre cómo se relacionan. El slippage, tratado en \"Entender los precios\" (Capítulo 2), es la diferencia entre el precio que esperabas y el precio que realmente obtuviste; el impacto en el precio es el componente específico del slippage que tu propia orden causa al consumir profundidad, a diferencia del slippage debido a que el mercado se mueve entre la cotización y la ejecución. La liquidez es simplemente cuánta profundidad hay apilada cerca de la cima del libro: una liquidez profunda absorbe una orden grande con poco impacto, una liquidez escasa no. \"Evaluación de tokens en la cadena Stellar\" (Capítulo 21) explica cómo la aplicación suma la profundidad del libro de órdenes en las señales de liquidez con las que puntúa los tokens; esa profundidad sumada es exactamente la misma escalera que recorres para estimar el impacto aquí.",
      "Para una orden grande, la respuesta práctica es reducir el impacto en lugar de aceptarlo. Dividir una orden grande en piezas más pequeñas a lo largo del tiempo permite que cada pieza se ejecute más cerca de la cima de un libro que se repone, en vez de recorrer de golpe un solo agujero profundo. Reposar la orden como maker a un precio límite, en lugar de cruzar como taker, evita recorrer el libro por completo a costa de la certeza de ejecución. Y la tolerancia de slippage editable de la aplicación en el formulario de Trading manual es tu salvaguarda: limita cuánto puede desviarse la ejecución de la cotización, de modo que una orden cuyo impacto estimado supere tu tolerancia se rechaza antes de que se ejecute a un precio que nunca pretendiste.",
    ],
    example:
      "Quieres comprar 5.000 XLM como taker. La escalera de ofertas del lado USDC muestra 2.000 XLM ofrecidos a 0,1180, otros 2.000 a 0,1185 y 3.000 a 0,1195. Tu orden ejecuta 2.000 a 0,1180, 2.000 a 0,1185 y los últimos 1.000 a 0,1195, con un coste de 236,0 + 237,0 + 119,5 = 592,5 USDC. Divide entre 5.000 y tu precio medio de ejecución es 0,1185, frente a los 0,1180 que veías cotizados en la cima. Eso supone un impacto en el precio del 0,42 por ciento, causado por completo por tu orden al recorrer el libro. Dividirla en cinco órdenes de 1.000 XLM, o reposar una oferta límite a 0,1180, reduciría cada una ese impacto.",
  },
];

export const c12ExtraQuiz: QuizQuestion[] = [
  {
    id: "c12-q6",
    prompt: "En el libro de órdenes del SDEX, ¿qué distingue a un maker de un taker, y por qué este bot prefiere ser maker?",
    options: [
      {
        text: "Un maker reposa una oferta en el libro y, cuando alguien cruza hacia ella, se ejecuta a su propio precio y captura el spread; un taker cruza el libro para una ejecución inmediata y paga el spread. El bot prioriza al maker para ganar el spread en lugar de pagarlo.",
        explanation:
          "Correcto. Bajo la prioridad de precio y luego de tiempo, una oferta maker en reposo se ejecuta a su precio publicado, convirtiendo el spread en una ventaja ganada, mientras que un taker levanta el lado opuesto y cede el spread a cambio de certeza de ejecución. Por eso una estrategia de captura de spread reposa sus ofertas priorizando al maker y solo actúa como taker cuando una ejecución inmediata importa más que el spread.",
      },
      {
        text: "Un maker paga una comisión porcentual al exchange mientras que un taker opera gratis, así que el bot evita ser maker para esquivar la comisión.",
        explanation:
          "Incorrecto. El SDEX no cobra ninguna comisión porcentual a ninguno de los dos lados, solo la diminuta comisión base por operación; la verdadera diferencia es que el taker cruza y paga el spread mientras que el maker reposa y lo captura, que es justamente por lo que el bot prefiere ser maker.",
      },
      {
        text: "Un taker reposa en el libro y espera mientras que un maker cruza de inmediato, y el bot prefiere el rol de taker porque las órdenes en reposo nunca se ejecutan.",
        explanation:
          "Incorrecto. Los roles están invertidos: el maker es el que reposa y espera, el taker es el que cruza de inmediato. Las órdenes maker en reposo sí se ejecutan cuando una contraparte cruza hacia ellas, y el bot prioriza al maker precisamente para capturar el spread en esas ejecuciones.",
      },
      {
        text: "Un maker siempre se ejecuta más rápido que un taker porque las ofertas más nuevas se casan primero, así que el bot elige el maker por velocidad.",
        explanation:
          "Incorrecto. El casamiento es de la más antigua primero a un precio dado, no de la más nueva primero, y el taker es el rol con ejecución inmediata garantizada. El bot prefiere el maker por la captura del spread, aceptando ejecuciones más lentas e inciertas, no por velocidad.",
      },
    ],
    correctIndex: 0,
  },
  {
    id: "c12-q7",
    prompt: "Una escalera de ofertas muestra 2.000 XLM ofrecidos a 0,1180, luego 2.000 a 0,1185 y luego 3.000 a 0,1195. Envías una compra taker de 5.000 XLM. ¿Cómo estimas el impacto en el precio y cuál es?",
    options: [
      {
        text: "Supones que toda la orden se ejecuta al precio de cima de 0,1180, así que el impacto en el precio es cero.",
        explanation:
          "Incorrecto. Solo hay 2.000 XLM en reposo a 0,1180. Una orden de 5.000 XLM agota ese nivel y sube hacia niveles peores, así que el precio medio de ejecución está por encima de 0,1180 y el impacto no es cero.",
      },
      {
        text: "Recorres la escalera de forma voraz, tomas 2.000 a 0,1180, 2.000 a 0,1185 y 1.000 a 0,1195, lo que da una media ponderada por volumen de 0,1185, alrededor de un 0,42 por ciento peor que la cotización de 0,1180.",
        explanation:
          "Correcto. Ejecutar la orden a través de los niveles cuesta 236,0 + 237,0 + 119,5 = 592,5 USDC por 5.000 XLM, una media de 0,1185. Frente a la cotización de cima de libro de 0,1180, eso supone aproximadamente un impacto en el precio del 0,42 por ciento, el coste de que tu propia orden consuma profundidad al recorrer el libro.",
      },
      {
        text: "Usas solo el nivel más profundo, 0,1195, como precio de ejecución, lo que da alrededor de un 1,3 por ciento de impacto para los 5.000 XLM completos.",
        explanation:
          "Incorrecto. La orden no se ejecuta por completo al peor nivel; ejecuta cada nivel por turnos hasta agotarse, así que debes ponderar por volumen entre 0,1180, 0,1185 y 0,1195. Eso da una media de 0,1185 y un impacto de alrededor del 0,42 por ciento, no del 1,3 por ciento.",
      },
    ],
    correctIndex: 1,
  },
];
