// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
import type { Chapter } from "../../types";

export const chapter24: Chapter & { whoFor: string } = {
  id: "c24",
  number: 24,
  level: "BASIC",
  whoFor: "Para cualquiera que quiera una base segura donde resguardar su dinero",
  title: "Stablecoins y USDC",
  description:
    "Qué es una stablecoin, qué es USDC y quién lo respalda, por qué funciona como una base estable para tu cartera, los riesgos reales y cómo usarlo en esta aplicación.",
  lessons: [
    {
      id: "c24-l1",
      title: "¿Qué es una stablecoin?",
      paragraphs: [
        "Una stablecoin es un token diseñado para mantener un valor estable en lugar de subir y bajar bruscamente. La mayoría busca igualar una moneda corriente, uno a uno, de modo que un token siempre valga un dólar o un euro. Ese valor objetivo se llama peg, y sostener el peg es el propósito mismo de la moneda.",
        "Las criptomonedas normales como XLM pueden dispararse o desplomarse mucho en un solo día, lo cual resulta emocionante pero estresante si solo quieres que tu dinero se quede quieto. Una stablecoin te ofrece la comodidad de conservar valor en la blockchain, donde puedes enviarlo y operarlo al instante, manteniendo el precio aburrido y predecible.",
        "Piensa en una stablecoin como una versión digital de una moneda que ya conoces. Se mueve a la velocidad de la red y vive en tu billetera de criptomonedas, pero su valor está pensado para seguir siendo el mismo que el del dinero cotidiano al que sigue.",
      ],
      example:
        "Imagina un euro digital: exactamente el mismo valor que un euro en tu banco, uno a uno, pero que vive en la blockchain en lugar de en una cuenta bancaria. Podrías enviarlo al otro lado del mundo en segundos, y uno de estos euros digitales seguiría valiendo un euro real. Ese valor estable de uno a uno es el peg, y una moneda construida para sostenerlo es una stablecoin.",
    },
    {
      id: "c24-l2",
      title: "¿Qué es USDC y quién está detrás de él?",
      paragraphs: [
        "USDC es una de las stablecoins más utilizadas, y busca equivaler siempre a un dólar estadounidense. Lo emite una empresa llamada Circle, lo que significa que Circle es la parte que crea nuevos USDC y promete respaldar cada token como un dólar. En la red Stellar, USDC es un token que puedes conservar, enviar y operar igual que cualquier otro.",
        "La promesa solo funciona si los dólares están realmente ahí. Por cada USDC en circulación, Circle afirma tener una cantidad equivalente en reservas seguras, como dólares reales y bonos gubernamentales a corto plazo. Si alguna vez devuelves tus USDC, deberías poder obtener un dólar real a cambio, y ese respaldo es lo que mantiene el valor estable.",
        "Así que confiar en USDC significa realmente confiar en que Circle mantenga suficientes reservas y sea honesto acerca de ellas. Esto no es asesoramiento financiero, y ninguna reserva está libre de riesgo, pero la idea básica es sencilla: el token es un derecho sobre un dólar real que reposa en algún lugar seguro.",
      ],
      example:
        "Imagina el mostrador de un guardarropa. Entregas tu abrigo y recibes un ticket numerado. El ticket no es el abrigo, pero todo el mundo lo trata como si valiera exactamente un abrigo porque confían en que el mostrador lo devolverá. USDC es ese ticket, Circle atiende el mostrador y las reservas son los abrigos guardados en la trastienda. Mientras haya un dólar real por cada ticket, el ticket conserva su valor.",
    },
    {
      id: "c24-l3",
      title: "¿Por qué usar USDC como moneda base de tu cartera?",
      paragraphs: [
        "Cuando posees varias monedas cuyos precios se mueven todos a la vez, es difícil saber si realmente te está yendo bien. Una stablecoin resuelve esto ofreciéndote una vara de medir estable. Como USDC se mantiene cerca de un dólar, medir todo respecto a él muestra con claridad tus ganancias y pérdidas reales, en lugar de tener que adivinar mientras cada precio oscila.",
        "USDC también es un lugar donde aparcar valor sin salir del mundo cripto. Si vendes una moneda y trasladas lo obtenido a USDC, tu dinero queda fuera de los vaivenes del mercado pero sigue en tu billetera, listo para operar de nuevo en segundos. No tienes que retirar a un banco y esperar para volver a entrar.",
        "En esta aplicación, USDC es la moneda base principal, así que la mayor parte de las compras y ventas se mide y cotiza respecto a él. Eso lo convierte en la base natural a la que regresas entre operaciones, y en un punto de referencia limpio para leer cómo evoluciona tu cartera.",
      ],
      example:
        "Piensa en USDC como la base en un juego del pillapilla. Sales corriendo para hacer una jugada, una operación en este caso, y luego puedes volver de un salto a la base, donde estás a salvo y puedes recuperar el aliento. Como la base nunca se mueve, siempre sabes exactamente cuánto has recorrido, y por eso conservar valor en USDC hace que tus ganancias y pérdidas sean fáciles de leer.",
    },
    {
      id: "c24-l4",
      title: "¿Son las stablecoins siempre estables? Los riesgos explicados",
      paragraphs: [
        "La palabra estable es un objetivo, no una garantía. Una stablecoin puede perder su peg y operarse por menos que el dólar al que se supone que iguala, y a esto se le llama depeg. Puede durar unas pocas horas o, en los peores casos, no recuperarse nunca del todo. La estabilidad depende por completo de que la promesa que hay detrás de la moneda se sostenga de verdad.",
        "La principal preocupación es la confianza en el emisor y en las reservas. Si la gente teme que la empresa no tenga realmente suficientes activos seguros, o no pueda acceder a ellos, se apresura a vender, y el precio se desliza por debajo de un dólar. Un depeg suele ser una crisis de confianza: en cuanto quienes lo poseen dudan del respaldo, la propia venta impulsada por esa duda empuja el precio aún más abajo.",
        "Esto no significa que las stablecoins sean malas, solo que ningún token está completamente libre de riesgo. Vale la pena saber quién emite una moneda y cómo está respaldada antes de confiar en ella como tu base. Esto es solo educativo y no es asesoramiento financiero.",
      ],
      example:
        "En 2022 una stablecoin llamada UST, que dependía de un software ingenioso en lugar de dólares reales en reserva, perdió su peg y se desplomó de un dólar a unos pocos centavos en cuestión de días, arrasando enormes cantidades de valor. Eso es un depeg en su forma más severa. Es el recordatorio más claro de que estable es un objetivo que la moneda intenta sostener, no una ley de la naturaleza, y de que el respaldo que hay detrás de una moneda importa de verdad.",
    },
    {
      id: "c24-l5",
      title: "Cómo usar USDC en esta aplicación para swaps y operaciones",
      paragraphs: [
        "Antes de poder tener USDC en Stellar, necesitas una trustline con Circle, el emisor. Una trustline es una pequeña aceptación que le dice a la red que estás dispuesto a tener ese token concreto; cuesta una diminuta reserva de XLM y solo hay que hacerla una vez por token. Esta aplicación puede guiarte para añadirla, y hasta que exista tu billetera simplemente no puede recibir USDC.",
        "Una vez que tienes algo de USDC, lo usas a través del formulario TÚ VENDES y TÚ COMPRAS de la pestaña de Trading manual. Para comprar una moneda pones USDC en el lado TÚ VENDES y la moneda que quieres en el lado TÚ COMPRAS; para volver a la seguridad haces lo contrario y terminas conservando USDC de nuevo. Puedes operar al precio de mercado actual o fijar un precio límite, y ajustar tu tolerancia de deslizamiento para que un mercado que se mueve rápido no ejecute tu orden a un precio inesperado.",
        "Como USDC es la moneda base de la aplicación, la mayoría de los swaps pasan de forma natural hacia dentro o hacia fuera de él, lo que lo convierte en la moneda en la que descansas entre operaciones. Si quieres un recorrido más detallado del formulario de compra y venta y del deslizamiento, los capítulos sobre trading manual lo cubren paso a paso.",
      ],
      example:
        "Supongamos que tienes 100 USDC y quieres algo de XLM. Abres el formulario TÚ VENDES y TÚ COMPRAS, pones USDC en el lado de venta y XLM en el lado de compra, revisas la tolerancia de deslizamiento y confirmas. Más tarde, para asegurar la ganancia y descansar, ejecutas el mismo formulario a la inversa, vendiendo XLM de vuelta a USDC. Tu valor está de nuevo en casa, en la moneda base estable, listo para el siguiente movimiento en cuanto decidas hacerlo.",
    },
  ],
  quiz: [
    {
      id: "c24-q1",
      prompt: "¿Qué describe mejor una stablecoin?",
      options: [
        {
          text: "Un token diseñado para mantener un valor estable, que normalmente iguala una moneda uno a uno.",
          explanation:
            "Correcto. El propósito de una stablecoin es mantenerse estable, por lo general anclada a un dólar o un euro, de modo que se comporta como una versión digital del dinero corriente.",
        },
        {
          text: "Una moneda cuyo precio está pensado para subir lo más rápido posible.",
          explanation:
            "No. Eso describe un activo especulativo. Una stablecoin es lo contrario: busca mantenerse aburrida y sin cambios, no dispararse.",
        },
        {
          text: "La moneda nativa que paga las comisiones de la red Stellar.",
          explanation:
            "Eso es XLM, no una stablecoin. El precio de XLM se mueve libremente, mientras que una stablecoin está construida para mantener un valor fijo.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c24-q2",
      prompt: "¿Quién emite USDC y qué se supone que lo respalda?",
      options: [
        {
          text: "Nadie lo emite; su valor proviene puramente de la oferta y la demanda.",
          explanation:
            "No. USDC no está respaldado solo por las fuerzas del mercado. Una empresa concreta lo emite y promete reservas reales detrás de cada token.",
        },
        {
          text: "La propia red Stellar lo acuña y garantiza el valor en dólares.",
          explanation:
            "No exactamente. Stellar es solo la red sobre la que vive USDC. La red no lo emite ni conserva las reservas.",
        },
        {
          text: "Circle lo emite, y se supone que cada token está respaldado por dólares reales y reservas seguras.",
          explanation:
            "Correcto. Circle crea USDC y afirma tener un valor equivalente en activos seguros, así que cada token es un derecho sobre un dólar real. Confiar en USDC significa confiar en ese respaldo.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c24-q3",
      prompt: "¿Por qué USDC es una buena moneda base para medir tu cartera?",
      options: [
        {
          text: "Porque su precio sube de forma constante, así que tus tenencias siempre crecen.",
          explanation:
            "No. USDC no está diseñado para subir en absoluto; se mantiene cerca de un dólar. Su utilidad viene de ser estable, no de crecer.",
        },
        {
          text: "Porque se mantiene cerca de un dólar, dándote una vara de medir estable y un lugar donde aparcar valor sin salir del mundo cripto.",
          explanation:
            "Correcto. Un valor estable te permite leer con claridad las ganancias y pérdidas y quedarte al margen de los vaivenes del mercado sin salir de tu billetera. En esta aplicación USDC es la moneda base principal.",
        },
        {
          text: "Porque nunca puede perder valor bajo ninguna circunstancia.",
          explanation:
            "No es cierto. Incluso una stablecoin puede deslizarse de su peg. Su valor es estable como objetivo, no como garantía absoluta.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c24-q4",
      prompt: "¿Qué significa que una stablecoin experimente un depeg?",
      options: [
        {
          text: "Que se revaloriza de forma permanente hasta valer más de un dólar.",
          explanation:
            "No. Un depeg no es una revalorización. Significa que la moneda se ha alejado de su valor previsto, normalmente a la baja, y puede no recuperarse del todo.",
        },
        {
          text: "Que se aleja de su valor objetivo y ya no iguala al dólar al que se supone que sigue.",
          explanation:
            "Correcto. Un depeg es cuando una stablecoin pierde su peg, a menudo porque quienes la poseen pierden la confianza en el emisor o las reservas y se apresuran a vender, empujando el precio por debajo de un dólar.",
        },
        {
          text: "Que la red la convierte automáticamente en XLM.",
          explanation:
            "No. Nada convierte la moneda en XLM. Un depeg es simplemente que el precio no logra sostener su valor previsto de uno a uno.",
        },
        {
          text: "Que la aplicación cierra la trustline con el emisor.",
          explanation:
            "No. Un depeg tiene que ver con el precio, no con las trustlines, y esta aplicación nunca añade ni elimina una trustline por su cuenta. Un depeg puede ocurrir mientras tu trustline permanece perfectamente abierta.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
