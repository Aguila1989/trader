import type { Chapter } from "../../types";

export const chapter11: Chapter = {
  id: "c11",
  number: 11,
  level: "EXPERT",
  title: "Ajustes de riesgo y la IA",
  description: "Como los limites de politica configurables moldean cada operacion, y como los valores conservadores o agresivos expresan un perfil de riesgo.",
  lessons: [
    {
      id: "c11-l1",
      title: "Que son los factores de riesgo y por que importan?",
      paragraphs: [
        "Los factores de riesgo son los limites de politica que se interponen entre el bot y tu billetera. Antes de que salga cualquier orden, la propuesta se revisa contra cada limite. Si rompe alguno, la operacion se rechaza, se reduce o se bloquea por completo. Estas comprobaciones existen porque una sola operacion sobredimensionada o mal calculada puede causar mas dano que docenas de operaciones pequenas y buenas.",
        "Pienselos como barandillas de seguridad, no como una estrategia. No deciden que comprar; deciden cuanto, con que frecuencia y bajo que condiciones de mercado el bot tiene permitido actuar. Una senal rentable que llega con un spread terrible o despues de haber gastado el presupuesto de perdida diaria sera rechazada igualmente.",
        "Cada limite tiene un valor por defecto razonable, pero los valores por defecto estan ahi para que los cambies. Apretarlos reduce el peor caso que puedes sufrir en un dia; aflojarlos deja que el bot persiga mas oportunidades a costa de posibles drawdowns mayores.",
      ],
      example: "Con maxAmountPerTrade fijado en 10 unidades base y maxDailyLoss fijado en 25 XLM, el bot nunca puede arriesgar mas de 10 en una sola posicion y deja de abrir nuevas operaciones una vez que el dia ha perdido 25 XLM, sin importar lo confiable que parezca una senal.",
    },
    {
      id: "c11-l2",
      title: "Que controla cada factor de riesgo en esta app?",
      paragraphs: [
        "El tamano lo limita maxAmountPerTrade, con un techo mayor para los pares de stablecoins de primer nivel, asi que una operacion familiar de XLM/USDC puede permitirse mas grande que una exotica. La actividad la acota maxTradesPerDay y maxDailyVolume, que evitan que el bot opere en exceso. El riesgo total en juego a la vez se mantiene por debajo de maxOpenExposure, y un multiplicador por par limita cuanto puede concentrarse cualquier par individual.",
        "La calidad de ejecucion la protegen maxSlippageBps y maxEntrySpreadBps. Si el movimiento de precio esperado en la ejecucion supera tu tolerancia de slippage, o el libro de ordenes es mas amplio que tu limite de spread, el bot rechaza en lugar de pagar de mas. Estos previenen discretamente las peores ejecuciones.",
        "La estructura de la operacion la rige stopLossPct, la distancia de respaldo por debajo de la entrada, y minRiskReward, la relacion minima de recompensa-riesgo medida contra el nivel de invalidacion. El presupuesto de perdida diaria, maxDailyLoss, tambien reduce automaticamente el tamano de la posicion a medida que se acumulan las perdidas, antes de detener las nuevas entradas.",
      ],
      example: "Valores por defecto de maxAmountPerTrade 10 (50 para pares de primer nivel), maxDailyVolume 500 XLM, maxTradesPerDay 100, maxOpenExposure 150 XLM con un multiplicador por par de 3x, maxSlippageBps 50 (0.5%), maxEntrySpreadBps 100 (1%), stopLossPct 5% y minRiskReward 1.2 definen juntos una politica equilibrada.",
    },
    {
      id: "c11-l3",
      title: "LOW vs MEDIUM vs HIGH: que cambia en cada nivel?",
      paragraphs: [
        "No hay un unico boton ni menu desplegable de riesgo LOW, MEDIUM o HIGH en esta app. Un perfil de riesgo no es un solo interruptor; es la forma general que obtienes al elegir valores conservadores, equilibrados o agresivos en todos los limites anteriores. LOW, MEDIUM y HIGH son solo los nombres que damos a esas combinaciones.",
        "Un perfil LOW significa topes por operacion mas pequenos, un presupuesto de perdida diaria menor, limites de exposicion y slippage mas ajustados, y un colchon de stop loss mas amplio para evitar que te saquen de la posicion. Un perfil HIGH es lo contrario: operaciones mas grandes, un presupuesto de perdida mayor, exposicion y slippage mas holgados, y un stop mas ajustado. MEDIUM se situa en medio, cerca de los valores por defecto.",
        "No confundas esto con la confianza por propuesta de la IA, que tambien se etiqueta como baja, media o alta. Esa confianza describe con que fuerza cree la IA en una operacion especifica. En modo de trading automatico solo se ejecutan automaticamente las propuestas de confianza media y alta. La confianza es la IA calificando una operacion; un perfil de riesgo eres tu calificando tu propio apetito a traves de los valores de los limites.",
      ],
      example: "Un usuario LOW podria fijar maxAmountPerTrade en 4, maxDailyLoss en 10 XLM, maxSlippageBps en 25 y stopLossPct en 8%; un usuario HIGH podria fijar 20, 60 XLM, 80 y 3% en esos mismos campos.",
    },
    {
      id: "c11-l4",
      title: "Como afectan los ajustes de riesgo al tamano de posicion y la colocacion del stop loss de la IA",
      paragraphs: [
        "La IA propone una operacion, pero tus limites deciden su forma final. El tamano solicitado se recorta a maxAmountPerTrade y se reduce aun mas si empujara el riesgo total por encima de maxOpenExposure o del multiplicador por par. Asi que incluso una compra de alta confianza aterriza mas pequena cuando tus topes son ajustados.",
        "El presupuesto de perdida diaria anade una capa dinamica. A medida que las perdidas realizadas suben hacia maxDailyLoss, el bot reduce automaticamente el tamano de las nuevas posiciones desde alrededor del 100% hasta aproximadamente el 25%, y luego detiene las nuevas entradas por el dia mientras sigue permitiendo salidas que reducen el riesgo. Un stopLossPct mas amplio da a la operacion mas margen para respirar, pero, para el mismo tamano, implica una posible perdida mayor por operacion, lo que interactua con ese presupuesto.",
        "La colocacion del stop y minRiskReward trabajan juntos. El stop establece donde te equivocas; el objetivo debe superar minRiskReward frente a esa distancia o la propuesta se rechaza. Los stops mas ajustados exigen objetivos mas cercanos para mantener la relacion, moldeando que operaciones sobreviven al filtro.",
      ],
      example: "Si el dia ya esta abajo 20 de un presupuesto de 25 XLM, el bot esta en plena reduccion: una propuesta que normalmente dimensionaria en 10 unidades base puede recortarse a alrededor de 2.5, y una vez que las perdidas alcanzan los 25 XLM no se abre ninguna nueva entrada.",
    },
    {
      id: "c11-l5",
      title: "Como elegir el perfil de riesgo adecuado para tu situacion",
      paragraphs: [
        "Empieza por lo que puedes permitirte perder en un solo dia y luego fija maxDailyLoss en esa cifra primero; muchas otras decisiones se derivan de ella. Un presupuesto de perdida que te incomodaria alcanzar es demasiado alto. A partir de ahi, dimensiona maxAmountPerTrade y maxOpenExposure de modo que un mal dia normal se quede bien dentro de ese presupuesto.",
        "Ajusta los limites de slippage y spread a los pares que realmente operas. Los pares liquidos de primer nivel toleran un maxSlippageBps y un maxEntrySpreadBps mas ajustados; los pares finos necesitan valores mas holgados o simplemente nunca se ejecutaran. Fija stopLossPct y minRiskReward para reflejar cuanto ruido estas dispuesto a aguantar frente a lo favorable que debe ser una operacion para calificar.",
        "Trata el perfil como un ajuste vivo. Si el bot esta rechazando casi todo, tus limites pueden ser demasiado ajustados para el mercado; si los drawdowns se sienten alarmantes, aprieta el tamano, la exposicion y el presupuesto de perdida. Cambia un factor a la vez para que puedas ver su efecto.",
      ],
      example: "Un recien llegado cauteloso que opera mayormente XLM/USDC podria empezar en LOW: maxDailyLoss 10 XLM, maxAmountPerTrade 4, maxOpenExposure 50 XLM, maxSlippageBps 25, stopLossPct 7%, minRiskReward 1.5, y aflojar hacia los valores por defecto solo cuando los resultados lo justifiquen.",
    },
  ],
  quiz: [
    {
      id: "c11-q1",
      prompt: "Que describe mejor el papel de los factores de riesgo en este bot?",
      options: [
        { text: "Son barandillas que limitan cuanto, con que frecuencia y bajo que condiciones puede operar el bot, rechazando o reduciendo las operaciones que rompen un limite.", explanation: "Correcto. Los limites filtran cada propuesta antes de que se ejecute; restringen el comportamiento en lugar de generar senales." },
        { text: "Son la estrategia de trading que decide que activos comprar y vender.", explanation: "Incorrecto. Los limites no eligen activos; restringen el tamano, la frecuencia, la exposicion y la calidad de ejecucion de lo que sea que proponga la estrategia." },
        { text: "Solo se aplican a las operaciones manuales y se ignoran cuando la IA esta en funcionamiento.", explanation: "Incorrecto. Los limites se comprueban para las propuestas sin importar su origen, incluida la IA en modo de trading automatico." },
      ],
      correctIndex: 0,
    },
    {
      id: "c11-q2",
      prompt: "Que ocurre a medida que las perdidas realizadas suben hacia maxDailyLoss (por ejemplo, 25 XLM)?",
      options: [
        { text: "Nada cambia hasta que se supera el presupuesto, y entonces la billetera se bloquea por completo.", explanation: "Incorrecto. La reduccion empieza antes de alcanzar el presupuesto, e incluso en el limite siguen permitidas las salidas que reducen el riesgo." },
        { text: "El bot reduce automaticamente el tamano de las nuevas posiciones desde alrededor del 100% hasta aproximadamente el 25%, y luego detiene las nuevas entradas mientras sigue permitiendo salidas que reducen el riesgo.", explanation: "Correcto. El dimensionamiento se reduce dinamicamente a medida que se acerca el presupuesto, y solo las nuevas entradas se detienen en el limite." },
        { text: "El bot duplica el tamano de la posicion para recuperar las perdidas mas rapido.", explanation: "Incorrecto. Eso es comportamiento martingala; el bot hace lo contrario al reducir el tamano." },
        { text: "maxSlippageBps se afloja automaticamente para ejecutar mas operaciones.", explanation: "Incorrecto. El presupuesto de perdida controla el dimensionamiento y las entradas, no la tolerancia de slippage." },
      ],
      correctIndex: 1,
    },
    {
      id: "c11-q3",
      prompt: "Como configuras el bot en un perfil de riesgo LOW?",
      options: [
        { text: "Selecciona LOW en el unico menu desplegable de nivel de riesgo en los ajustes.", explanation: "Incorrecto. No existe tal boton ni menu desplegable unico; un perfil no es un solo interruptor." },
        { text: "Elige valores conservadores en los limites individuales: topes por operacion y de exposicion mas pequenos, un presupuesto de perdida diaria menor, slippage mas ajustado y un colchon de stop mas amplio.", explanation: "Correcto. LOW, MEDIUM y HIGH son nombres para combinaciones de valores de limites que tu mismo fijas; no hay un unico interruptor." },
        { text: "Pon la confianza de la IA en baja para que solo tome operaciones seguras.", explanation: "Incorrecto. La confianza de la IA califica propuestas individuales y es independiente de tu perfil de riesgo, que vive en los valores de los limites." },
      ],
      correctIndex: 1,
    },
    {
      id: "c11-q4",
      prompt: "Una propuesta de la IA pide comprar mas de lo que permite maxAmountPerTrade. Que ocurre con su tamano?",
      options: [
        { text: "Se recorta hasta el tope, y se reduce aun mas si superara maxOpenExposure o el multiplicador por par.", explanation: "Correcto. La IA propone, pero tus limites de tamano y exposicion moldean la orden final, incluso para operaciones confiables." },
        { text: "Se ejecuta al tamano solicitado porque la alta confianza de la IA anula los topes.", explanation: "Incorrecto. La confianza no esquiva los limites; el tamano se recorta igualmente a maxAmountPerTrade." },
        { text: "Toda la propuesta se descarta y se registra como un error.", explanation: "Incorrecto. Una solicitud sobredimensionada se reduce para que encaje en lugar de descartarse por completo." },
      ],
      correctIndex: 0,
    },
    {
      id: "c11-q5",
      prompt: "Al elegir un perfil de riesgo, que enfoque coincide con la guia de este capitulo?",
      options: [
        { text: "Maximizar maxAmountPerTrade y maxOpenExposure primero para capturar cada oportunidad.", explanation: "Incorrecto. Eso empieza por las palancas mas agresivas e ignora lo que puedes permitirte perder." },
        { text: "Copiar exactamente los ajustes de un amigo, ya que un perfil le sirve a todos.", explanation: "Incorrecto. Los perfiles deben reflejar tu propia tolerancia a las perdidas y los pares que operas, no copiarse a ciegas." },
        { text: "Fijar maxDailyLoss en lo que puedes permitirte perder en un dia primero, dimensionar los demas topes para que quepan dentro y ajustar un factor a la vez.", explanation: "Correcto. Anclarse en el presupuesto de perdida diaria y afinar de forma incremental es el enfoque recomendado." },
        { text: "Usar los limites de slippage y spread mas ajustados posibles en cada par sin importar la liquidez.", explanation: "Incorrecto. Los pares finos necesitan valores de slippage y spread mas holgados o nunca se ejecutaran; ajusta los limites al par." },
      ],
      correctIndex: 2,
    },
  ],
};
