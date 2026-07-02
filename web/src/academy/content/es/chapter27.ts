// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// Capítulo avanzado sobre los indicadores esenciales del análisis técnico: medias
// móviles, RSI, MACD, Bandas de Bollinger y cómo combinar un pequeño conjunto
// confluente sin ahogarse en señales contradictorias. Redactado con exactamente la
// misma forma que content/en/chapter22.ts, con la frase `whoFor` propia de cada
// capítulo tipada mediante una intersección local para que la interfaz Chapter en
// producción quede intacta. Este capítulo no posee términos de glosario nuevos;
// solo reutiliza términos enseñados en capítulos anteriores.
import type { Chapter } from "../../types";

export const chapter27: Chapter & { whoFor: string } = {
  id: "c27",
  number: 27,
  level: "ADVANCED",
  whoFor: "Para operadores listos para leer los indicadores que hay detrás del precio",
  title: "Análisis técnico — Indicadores esenciales",
  description:
    "Medias móviles, RSI, MACD y Bandas de Bollinger: qué mide cada uno y cómo combinar un pequeño conjunto de ellos sin ahogarse en señales contradictorias.",
  lessons: [
    {
      id: "c27-l1",
      title: "¿Qué es una media móvil (MA) y cómo se usa?",
      paragraphs: [
        "Una media móvil suaviza un precio dentado convirtiéndolo en una sola línea, promediando los últimos N precios de cierre a medida que avanza el tiempo. No predice nada; resume lo que el precio ya ha hecho, filtrando el ruido para que una tendencia sea más fácil de ver. Los operadores observan si el precio se sitúa por encima o por debajo de la línea, y si la línea misma se inclina hacia arriba o hacia abajo.",
        "Los dos tipos habituales se diferencian en cómo ponderan los datos. Una media móvil simple (SMA) trata por igual todos los precios de la ventana. Una media móvil exponencial (EMA) pondera con más peso los precios recientes, por lo que gira más rápido cuando el precio cambia, pero también da más bandazos. Ninguna es \"mejor\": la SMA es más estable, la EMA es más reactiva, y la elección depende de con qué rapidez quieras reaccionar.",
        "Un contraste resuelto lo hace concreto. Toma cinco cierres diarios de XLM en USDC: 0,100, 0,104, 0,108, 0,112, 0,126. La SMA de 5 periodos es su promedio simple, 0,110. Una EMA de 5 periodos se apoya mucho más en el último valor de 0,126, quedando cerca de 0,116, notablemente más alta porque el salto reciente domina. Si el precio cae después, la EMA retrocede antes que la SMA.",
        "En Atrium observarías estas tendencias en la página de detalle del token, donde el gráfico de precios ofrece pestañas de hora, día, semana y año con velas y volumen. Una pestaña más larga (semana o año) con una SMA más lenta muestra la tendencia de fondo; una pestaña más corta (hora o día) con una EMA reacciona a los movimientos intradía. Esto es solo lectura de gráficos: Atrium no dibuja indicadores ni coloca órdenes por ti.",
      ],
      example:
        "Dos personas describen una carretera con lomas. El caminante de la SMA promedia los últimos cinco carteles y llama a la carretera \"de suave subida\". El caminante de la EMA se apoya sobre todo en el cartel más nuevo, que acaba de decir \"ascenso empinado\", y la llama \"de subida rápida\". Ambos tienen razón sobre los mismos datos; la EMA simplemente reacciona antes a la información más fresca, a costa de sobrerreaccionar ante un único bache.",
    },
    {
      id: "c27-l2",
      title: "¿Qué es el RSI (Índice de Fuerza Relativa)?",
      paragraphs: [
        "El RSI es un oscilador de impulso que mide la velocidad de los cambios de precio recientes en una escala fija de 0 a 100. Compara el tamaño promedio de los movimientos al alza con el tamaño promedio de los movimientos a la baja a lo largo de una ventana de retroceso, clásicamente de 14 periodos. Una lectura alta significa que los compradores han estado dominando con fuerza; una lectura baja significa que lo han hecho los vendedores. Al estar acotado, el RSI es fácil de leer de un vistazo.",
        "Las señales convencionales son los niveles de 70 y 30. Por encima de 70 se dice que el activo está sobrecomprado: ha subido rápido y puede que le toque una pausa o un retroceso. Por debajo de 30 se dice que está sobrevendido: ha caído rápido y puede que le toque un rebote. Algunos operadores también observan la línea media de 50 como un divisor aproximado de tendencia, y buscan divergencias, cuando el precio marca un nuevo máximo pero el RSI no, lo que sugiere que el movimiento está perdiendo fuerza.",
        "La advertencia crucial es que sobrecomprado no significa \"vender ahora\", y sobrevendido no significa \"comprar ahora\". En una tendencia fuerte, el RSI puede quedarse clavado por encima de 70 durante días o semanas mientras el precio sigue subiendo, y ponerse corto en cada lectura de 70 te desangraría. El RSI es más fiable en un mercado lateral, en rango; en una tendencia potente se mantiene estirado y sus extremos engañan. Trátalo como una descripción del impulso, no como un disparador autónomo.",
        "En la página de detalle del token de Atrium podrías cambiar a la pestaña de día, leer las velas y notar que un token que se dispara con mucho volumen probablemente mostrará un RSI alto: un contexto útil, pero por sí solo no una razón para actuar en contra de la tendencia.",
      ],
      example:
        "Durante un rally rápido de XLM, el RSI en el gráfico de día alcanza 78. Un operador que vende en corto de forma refleja \"porque está sobrecomprado\" queda expulsado por el stop mientras el precio sigue rascando al alza durante otra semana con el RSI aún parado cerca de 80. La misma lectura de 78 durante una semana plana y en rango —donde el precio no deja de estancarse y resbalar hacia atrás— habría sido una señal mucho más fiable de que el empuje estaba sobreextendido.",
    },
    {
      id: "c27-l3",
      title: "¿Qué es el MACD y qué te dice sobre el impulso?",
      paragraphs: [
        "El MACD (Convergencia/Divergencia de Medias Móviles) convierte dos medias móviles en una lectura de impulso. La línea MACD es la diferencia entre una EMA rápida y una EMA lenta, clásicamente la de 12 periodos menos la de 26 periodos. Cuando la media rápida se aleja por encima de la lenta, el impulso se está formando al alza; cuando se hunde por debajo, el impulso gira a la baja. El cruce de la línea MACD por el cero marca dónde se cruzan realmente las dos medias.",
        "Una segunda línea, la línea de señal, es una EMA de 9 periodos de la propia línea MACD, una versión suavizada de ella. El evento estelar es el cruce: cuando la línea MACD cruza al alza a través de la línea de señal se lee como un fortalecimiento del impulso alcista, y un cruce a la baja como un debilitamiento. Estas señales van con retraso, porque están construidas a partir de promedios de precios pasados, así que confirman un cambio en lugar de anticiparlo.",
        "El histograma es la tercera pieza: barras que muestran la brecha entre la línea MACD y la línea de señal. Barras que crecen significan que las dos líneas se están separando y el impulso se está acelerando; barras que se encogen significan que están convergiendo y el impulso se está desvaneciendo, lo que a menudo precede al propio cruce. Leer el histograma es una forma de ver venir un giro un compás antes de que las líneas se crucen de verdad.",
        "Como todos los indicadores de aquí, el MACD describe el impulso en precios que Atrium representa en el gráfico de detalle del token; nunca coloca una operación. Cualquier decisión que resulte sigue pasando por las herramientas normales de la app y, en el Trading con bot, por el umbral de confianza del analista de IA y los factores de riesgo.",
      ],
      example:
        "El XLM cotizado en USDC ha estado deslizándose, y las barras del histograma MACD por debajo de cero empiezan a encogerse día a día incluso antes de que el precio gire: el impulso a la baja se está desvaneciendo. Unos días después la línea MACD cruza al alza a través de su línea de señal, confirmando el cambio que el histograma ya había insinuado. Un operador que observaba el histograma tuvo un aviso anticipado; quien esperó al cruce obtuvo una señal más tardía pero más confirmada.",
    },
    {
      id: "c27-l4",
      title: "¿Qué son las Bandas de Bollinger?",
      paragraphs: [
        "Las Bandas de Bollinger envuelven una media móvil en dos bandas de volatilidad. La línea central suele ser una SMA de 20 periodos. Las bandas superior e inferior se sitúan a un número fijo de desviaciones estándar de ella, normalmente dos. Como la desviación estándar crece cuando el precio oscila mucho y se encoge cuando se calma, las bandas se ensanchan automáticamente en tramos volátiles y se estrechan en los tranquilos. Son una imagen de cuán estirado y cuán volátil está el precio en este momento.",
        "Dos rasgos concentran la mayor atención. Un estrechamiento (squeeze) es cuando las bandas se estrechan de golpe, señalando una volatilidad inusualmente baja: un resorte comprimido. Te dice que estadísticamente es más probable un movimiento mayor pronto, pero, y esto es crucial, no te dice la dirección. Un toque de la banda superior o inferior significa que el precio está lejos de su promedio reciente; en un rango eso suele preceder a una vuelta hacia el centro, pero en una tendencia fuerte el precio puede \"caminar por la banda\", pegándose a ella mientras sigue avanzando.",
        "Los límites honestos importan. Las Bandas de Bollinger no predicen hacia dónde se dirige el precio. Un estrechamiento pronostica que la volatilidad debería expandirse, no si la ruptura sube o baja. Un toque de banda no es una señal automática de reversión. Describen la volatilidad y la distancia respecto al promedio: un contexto genuinamente útil, pero solo eso. Emparejar un toque de banda con una lectura del RSI o un giro del MACD te da mucho más que las bandas por sí solas.",
        "Todo esto lo leerías en el gráfico de velas de Atrium en la página de detalle del token, eligiendo una pestaña de marco temporal que encaje con tu horizonte: una pestaña de semana para una vista de swing, una pestaña de hora para la volatilidad intradía.",
      ],
      example:
        "En el gráfico de semana de XLM/USDC las Bandas de Bollinger se aprietan en un estrechamiento cerrado tras una quincena tranquila: la volatilidad se ha drenado. Días después el precio rompe con fuerza fuera del rango y las bandas se abren de par en par. El estrechamiento avisó correctamente de que venía un gran movimiento; nunca dijo en qué dirección, así que un operador que apostó por un sentido basándose solo en el estrechamiento estaba adivinando.",
    },
    {
      id: "c27-l5",
      title: "Cómo combinar indicadores sin confundirte",
      paragraphs: [
        "El error más común de los principiantes es la sobrecarga de indicadores: apilar una docena de herramientas en un gráfico hasta que se contradicen entre sí, y entonces quedarse paralizado. El RSI dice sobrevendido, el MACD dice impulso a la baja, las bandas dicen estrechamiento, y no tienes ni idea de qué hacer. Añadir más indicadores no añade más certeza. La mayoría están construidos a partir de los mismos datos de precio y volumen, así que una pantalla llena de ellos en su mayoría se repite mientras da la sensación de ser confirmación independiente.",
        "La solución es un conjunto pequeño, deliberadamente confluente, que mida cosas distintas. Un trío sensato: una herramienta de tendencia (una media móvil), una herramienta de impulso (RSI o MACD) y una herramienta de volatilidad (Bandas de Bollinger). Confluencia significa que actúas solo cuando coinciden; por ejemplo, precio por encima de una MA ascendente (tendencia al alza), RSI recuperándose desde sobreventa (impulso girando) y un estrechamiento de banda resolviéndose al alza (volatilidad expandiéndose a tu favor). Cuando discrepan, la respuesta honesta suele ser no hacer nada.",
        "Decide tu conjunto y tus reglas de antemano, en un momento de calma, exactamente como el Capítulo 22 sobre Psicología del trading insta a hacer con un plan de trading. Eso te evita echar mano de un indicador nuevo cada vez que no te gusta lo que dicen los actuales, una forma de caza de confirmación que conduce directo de vuelta a la sobrecarga. Vale más un puñado de herramientas que entiendes a fondo que muchas que lees por encima.",
        "En la práctica leerías esta confluencia directamente en el gráfico de detalle del token de Atrium, cambiando entre pestañas de marco temporal y revisando velas y volumen, para luego encaminar cualquier decisión a través del formulario manual o, en el Trading con bot, sopesarla frente a la puntuación de confianza del analista de IA. Este es contenido educativo, no asesoramiento financiero: ningún indicador ni combinación garantiza un resultado.",
      ],
      example:
        "Un operador que observa XLM/USDC usa solo tres herramientas. El precio se sitúa por encima de una MA de 50 periodos ascendente, el RSI se ha levantado desde 32 de vuelta por encima de 40 y un estrechamiento de Bollinger acaba de romper al alza: tres cosas distintas (tendencia, impulso, volatilidad) apuntando todas en la misma dirección, así que la operación tiene una confluencia real. Una semana después solo la MA está de acuerdo, mientras que el RSI y las bandas están neutros; con las señales divididas, el movimiento disciplinado es apartarse en lugar de forzarlo.",
    },
  ],
  quiz: [
    {
      id: "c27-q1",
      prompt: "Dados los cinco cierres 0,100, 0,104, 0,108, 0,112, 0,126, ¿cómo se compara una EMA de 5 periodos con la SMA de 5 periodos de 0,110?",
      options: [
        {
          text: "La EMA es más alta que 0,110, porque pondera con más peso el valor más reciente de 0,126.",
          explanation:
            "Correcto. Una EMA se apoya en los precios recientes, así que el último salto a 0,126 la lleva por encima de la SMA de ponderación uniforme de 0,110, que es exactamente la razón por la que una EMA reacciona más rápido a los movimientos frescos.",
        },
        {
          text: "La EMA es más baja que 0,110, porque descarta el precio más reciente.",
          explanation:
            "Al revés. Una EMA no descarta el precio más nuevo; lo enfatiza. Ese 0,126 reciente empuja la EMA hacia arriba, no hacia abajo.",
        },
        {
          text: "La EMA es igual a 0,110, porque ambas medias producen siempre el mismo número.",
          explanation:
            "No. Solo coinciden cuando los precios están planos. Con una serie ascendente, las ponderaciones distintas hacen que la EMA y la SMA diverjan.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c27-q2",
      prompt: "El RSI en el gráfico de día lleva más de una semana clavado por encima de 70 mientras el precio sigue subiendo. ¿Qué te dice esto?",
      options: [
        {
          text: "Es una señal de venta garantizada: el precio debe revertir en el momento en que el RSI cruce 70.",
          explanation:
            "Esta es la trampa clásica del RSI. En una tendencia fuerte el RSI puede permanecer sobrecomprado durante mucho tiempo, y ponerse corto en cada lectura de 70 desangra a un operador.",
        },
        {
          text: "El RSI está roto y debería ignorarse por completo en este token.",
          explanation:
            "No es así. El RSI está funcionando exactamente como fue diseñado, reflejando un impulso fuerte y sostenido. El error es esperar que sus extremos actúen como disparadores de reversión en una tendencia.",
        },
        {
          text: "En una tendencia fuerte el RSI puede permanecer sobrecomprado mucho tiempo; sus extremos son mucho más fiables en mercados en rango que en tendencias.",
          explanation:
            "Correcto. Sobrecomprado no significa \"vender ahora\". Los extremos 70/30 del RSI son más fiables en rangos laterales; en una tendencia potente se mantiene estirado y engaña.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c27-q3",
      prompt: "¿Qué representa el histograma del MACD y por qué lo observan los operadores?",
      options: [
        {
          text: "Muestra la brecha entre la línea MACD y la línea de señal; barras que se encogen pueden avisar de un movimiento que se desvanece antes de que las líneas se crucen de verdad.",
          explanation:
            "Correcto. El histograma es la distancia entre las dos líneas. Barras que se encogen hacia cero significan que el impulso está convergiendo, lo que a menudo precede al propio cruce: un aviso anticipado.",
        },
        {
          text: "Muestra el volumen de negociación bruto de cada vela.",
          explanation:
            "No. El volumen es una serie aparte (Atrium lo representa en el gráfico del token). El histograma del MACD es la brecha entre la línea MACD y su línea de señal.",
        },
        {
          text: "Muestra el saldo de la cuenta en USDC a lo largo del tiempo.",
          explanation:
            "No. El histograma no tiene nada que ver con tu saldo; es puramente la diferencia entre la línea MACD y la línea de señal.",
        },
        {
          text: "Predice el objetivo de precio futuro exacto del activo.",
          explanation:
            "Ningún indicador predice un precio exacto. El histograma describe el impulso midiendo la brecha entre dos líneas; no pronostica nada preciso.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c27-q4",
      prompt: "Aparece un estrechamiento de Bandas de Bollinger en el gráfico. ¿Qué puedes concluir legítimamente de él?",
      options: [
        {
          text: "El precio está a punto de subir, porque un estrechamiento es una señal alcista.",
          explanation:
            "Un estrechamiento no dice nada sobre la dirección. Leerlo como alcista es adivinar; la ruptura podría ser igual de fácilmente a la baja.",
        },
        {
          text: "La volatilidad es inusualmente baja y estadísticamente es más probable un movimiento mayor pronto, pero el estrechamiento no te dice la dirección.",
          explanation:
            "Correcto. Bandas estrechas significan baja volatilidad, un resorte comprimido. Aumenta las probabilidades de un movimiento mayor pero calla sobre si es al alza o a la baja, razón por la cual los operadores lo emparejan con otras herramientas.",
        },
        {
          text: "El token ha perdido su trustline y ya no se puede operar.",
          explanation:
            "Sin relación. Un estrechamiento es una lectura de volatilidad en el gráfico de precios; las trustlines son una aceptación a nivel de cuenta para tener un token y no tienen nada que ver con el ancho de las bandas.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c27-q5",
      prompt: "Tu gráfico tiene diez indicadores y tres de ellos ahora se contradicen entre sí. ¿Cuál es la respuesta sensata?",
      options: [
        {
          text: "Añadir tres indicadores más hasta que una mayoría coincida.",
          explanation:
            "Esto es sobrecarga de indicadores. La mayoría de los indicadores están construidos a partir de los mismos datos de precio, así que apilar más en su mayoría repite información mientras da la sensación de ser confirmación fresca.",
        },
        {
          text: "Elegir el indicador que en este momento diga lo que esperabas oír.",
          explanation:
            "Eso es caza de confirmación: escoger a dedo la herramienta que halaga tu sesgo. Abandona todo proceso basado en reglas y conduce directo de vuelta a la confusión.",
        },
        {
          text: "Recortar hasta un conjunto pequeño y confluente —una de tendencia, una de impulso, una de volatilidad— y actuar solo cuando coincidan; de lo contrario, apartarse.",
          explanation:
            "Correcto. Un conjunto deliberadamente pequeño que mide cosas distintas da una confluencia real. Cuando discrepan, el movimiento honesto suele ser no hacer nada, y el conjunto debería elegirse con calma de antemano como parte de un plan de trading.",
        },
      ],
      correctIndex: 2,
    },
  ],
};
