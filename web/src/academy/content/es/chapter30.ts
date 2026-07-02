// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// Advanced chapter on On-Chain Data: reading wallet activity, whale moves, and
// TVL to look under the market's hood and sanity-check the AI's suggestions.
// Authored to the exact same shape as content/en/chapter22.ts, with the
// per-chapter `whoFor` one-liner typed via a local intersection so the live
// Chapter interface stays untouched until integration. This chapter owns no new
// glossary terms; it reuses terms already taught in earlier chapters.
import type { Chapter } from "../../types";

export const chapter30: Chapter & { whoFor: string } = {
  id: "c30",
  number: 30,
  level: "ADVANCED",
  whoFor: "Para quienes operan y quieren mirar bajo el capó del mercado",
  title: "Datos on-chain",
  description:
    "Qué son los datos on-chain, qué revelan sobre un token las billeteras activas, los movimientos de las ballenas y el TVL, y cómo usar esas señales para contrastar las sugerencias de la IA.",
  lessons: [
    {
      id: "c30-l1",
      title: "¿Qué son los datos on-chain y en qué se diferencian de los datos de mercado?",
      paragraphs: [
        "Los datos de mercado describen el precio: la última operación, la oferta y la demanda, el volumen, las velas que ves en la página de detalle del token bajo las pestañas de hora, día, semana y año. Te dicen a cuánto se está operando un token y qué cantidad de él cambió de manos. Los datos on-chain describen algo completamente distinto: quién posee y mueve realmente el activo. Como Stellar es un libro de registro público, cada cuenta, cada trustline, cada pago y cada operación queda registrada de forma permanente y cualquiera puede volver a leerla.",
        "Los dos responden preguntas diferentes. Los datos de mercado responden qué está haciendo el precio en este momento. Los datos on-chain responden quién está detrás de ese precio. Un token puede tener un gráfico al alza mientras solo un puñado de billeteras se lo pasan de una a otra, o un gráfico plano mientras miles de nuevos poseedores abren trustlines discretamente. El precio por sí solo esconde eso; el libro de registro no.",
        "El valor práctico está en que los datos on-chain son difíciles de falsear a gran escala y se adelantan en lugar de ir detrás. Un gran poseedor moviendo fondos, una oleada de nuevas trustlines o la liquidez drenándose de un pool ocurren todos on-chain antes de reflejarse por completo en el precio. Leer el libro de registro es la forma de comprobar si un movimiento está respaldado por una participación real o si es solo un pequeño vaivén de precio sobre poco volumen. Piénsalo como mirar bajo el capó del mercado en lugar de fijarte únicamente en el velocímetro.",
      ],
      example:
        "Dos tokens muestran ambos un gráfico que se duplicó esta semana. El token A lo hizo con operaciones entre seis billeteras que se lo siguen vendiendo entre sí; el token B lo hizo mientras trescientas cuentas nuevas abrían trustlines y compraban pequeñas cantidades. Las velas se ven casi idénticas, pero la imagen on-chain es opuesta: A es un circuito cerrado, B es adopción genuina. Solo el libro de registro, no el gráfico de precio, te dice cuál es cuál.",
    },
    {
      id: "c30-l2",
      title: "¿Qué te dice el número de billeteras activas sobre un token?",
      paragraphs: [
        "El recuento de billeteras que poseen un token, y cuántas transaccionan activamente, es una de las señales de adopción más claras on-chain. Un token en manos de miles de cuentas independientes que lo operan y transfieren con regularidad tiene una base de usuarios real; un token que descansa en cinco billeteras que nunca se mueven no la tiene, diga lo que diga su precio. En Stellar el recuento de trustlines es un indicador directo de esto: como debes abrir una trustline antes de poder tener un token no nativo, el número de trustlines es aproximadamente el número de cuentas que eligieron tenerlo.",
        "Esto es exactamente uno de los datos de entrada que la app ya utiliza. La puntuación de tokens combina las agregaciones de operaciones de Horizon, la profundidad del libro de órdenes y el recuento de trustlines como medida de adopción, y el escáner de liquidez sondea los tokens para calibrar qué tan operables y qué tan ampliamente poseídos son. Cuando lees una sugerencia de trustline de la IA, la puntuación de adopción que hay detrás es en parte esta imagen de billeteras y trustlines, seguida a lo largo de doce semanas para que puedas ver si los poseedores están llegando o marchándose.",
        "La advertencia son las billeteras sybil. Nada impide que una sola persona abra cientos de cuentas y trustlines para simular adopción, y crear una cuenta en Stellar es barato. Así que los recuentos en bruto pueden estar inflados. Las defensas son ponderar la distribución por encima del número de cabezas (¿están las tenencias repartidas entre muchas billeteras independientes o concentradas en unas pocas?) y observar la tendencia en lugar de la instantánea: un crecimiento orgánico y sostenido es más difícil de falsear que un pico de un solo día de cuentas nuevas casi idénticas. Trata un recuento creciente de trustlines como evidencia de apoyo, no como prueba.",
      ],
      example:
        "El escáner de liquidez saca a la luz un token cuyo recuento de trustlines saltó de 400 a 1600 en una semana. Alentador a primera vista. Pero al mirar más de cerca, las 1200 nuevas trustlines se crearon todas dentro de la misma hora, por cuentas financiadas desde una única fuente, ninguna de las cuales operó jamás después. Eso es un patrón sybil: un solo actor fabricando la apariencia de adopción. Un token que en cambio sumó 1200 trustlines de forma sostenida a lo largo de la ventana de doce semanas, repartidas entre billeteras financiadas de forma independiente que realmente operan, es una señal de adopción mucho más sólida.",
    },
    {
      id: "c30-l3",
      title: "¿Qué son los movimientos de las ballenas y por qué quienes operan los siguen?",
      paragraphs: [
        "Una ballena es una billetera lo bastante grande como para que sus movimientos puedan mover un mercado por sí solos. Como el libro de registro es público, puedes observar estas billeteras: una ballena enviando un saldo grande a la dirección de un exchange o de un emisor conocido, abriendo o cerrando una trustline, o añadiendo y retirando liquidez de un pool AMM. Quienes operan siguen a las ballenas porque un gran poseedor a menudo tiene mejor información o simplemente el tamaño suficiente para que su acción por sí sola mueva el precio. Una ballena depositando una cantidad enorme para vender puede anticipar una caída; una ballena acumulando discretamente puede anticipar una subida.",
        "Leer el movimiento importa más que solo verlo. Una transferencia a un exchange o a un emisor insinúa la intención de vender o rescatar. Una transferencia entre dos billeteras que controla la misma entidad significa que en realidad nada ha cambiado de manos. Retirar liquidez de un pool adelgaza el mercado y puede amplificar el siguiente vaivén. El tamaño relativo al volumen normal del token es lo que hace significativo un movimiento: una transferencia del tamaño de una ballena en un token poco operado es mucho más disruptiva que la misma cantidad en uno profundo y líquido.",
        "El peligro es seguirlas a ciegas. Rara vez conoces la verdadera intención de la ballena, y algunos grandes jugadores telegrafían deliberadamente movimientos falsos para tentar a quienes operan con menos tamaño. On-chain, un movimiento también puede ser una reorganización interna, una migración de custodia o una operación de colateral que no tiene ningún significado direccional. Usa la actividad de las ballenas como un aviso para mirar más de cerca y para revisar la liquidez y tus propias herramientas de riesgo, nunca como una señal automática de compra o venta. Si un movimiento de ballena solo te da ganas de operar porque se siente urgente, ese impulso es FOMO, no análisis.",
      ],
      example:
        "Notas que una billetera que posee el 20% del suministro de un token pequeño envía todo su saldo a la dirección de un emisor tipo Circle, justo cuando el volumen diario de ese token es apenas una fracción de esa cantidad. Eso es una señal significativa: un poseedor tan grande dirigiéndose a la salida puede inundar el libro de órdenes y hundir el precio. La respuesta disciplinada no es vender presa del pánico junto a él, sino revisar la profundidad del libro de órdenes, ajustar o confirmar tu stop loss y decidir si tu tesis original sigue en pie, no reflejar el movimiento de la ballena por acto reflejo.",
    },
    {
      id: "c30-l4",
      title: "¿Qué es el TVL (valor total bloqueado)?",
      paragraphs: [
        "El TVL, o valor total bloqueado (Total Value Locked), es el valor total de los activos depositados en un pool o en un protocolo, normalmente expresado en USDC o en términos de dólares. Para un solo pool AMM es la suma de ambos lados del pool; para todo un protocolo es la suma a través de todos sus pools y bóvedas. En Stellar ves el TVL de la forma más directa en los pools de liquidez AMM, que cobran una comisión de pool del 0,30%, y en protocolos DeFi de Soroban como Blend, DeFindex y Soroswap. El TVL es una señal de tamaño y de confianza: un pool con millones bloqueados puede absorber operaciones más grandes con menos slippage, y un protocolo en el que la gente está dispuesta a bloquear dinero real ha ganado, como mínimo, algo de confianza.",
        "Para quien opera, la lectura más útil es la profundidad. Un TVL más alto en el pool contra el que operas suele significar que una orden de mercado mueve menos el precio, así que tu tolerancia al slippage es más fácil de respetar. Un TVL en descenso es una advertencia: la liquidez que sale de un pool lo vuelve más delgado y cada operación posterior más cara y más volátil. Observar la dirección del TVL a lo largo del tiempo a menudo te dice más que el número absoluto.",
        "El TVL tiene límites reales, así que no lo trates como una calificación de seguridad. Puede estar inflado por una sola ballena o por capital mercenario persiguiendo una recompensa temporal, y puede marcharse igual de rápido. Un TVL alto no significa que los contratos subyacentes estén auditados o sean seguros; los protocolos de Soroban conllevan riesgo de contrato inteligente por mucho que haya bloqueado. Y un TVL alto en dólares puede oscilar por sí mismo simplemente porque el precio de los activos depositados se movió, no porque alguien añadiera o retirara fondos. Lee el TVL como un dato de entrada sobre la profundidad y el interés del mercado, contrastado con el libro de órdenes real y la composición del pool, no como prueba de calidad o seguridad.",
      ],
      example:
        "Quieres cambiar una cantidad de tamaño medio a un token y ves dos rutas: un pool AMM con 2 000 000 USDC de TVL y otro con 40 000. El pool profundo puede completar tu orden con un slippage menor; el poco profundo podría mover el precio varios puntos porcentuales en tu contra y rebasar tu tolerancia al slippage. Pero una semana después notas que el TVL del pool profundo ha caído discretamente a 300 000 porque un gran proveedor retiró sus fondos. El mismo token, pero el mercado acaba de volverse más delgado: una señal para reducir el tamaño y volver a revisar la profundidad antes de operar, no para dar por hecho que la profundidad anterior sigue existiendo.",
    },
    {
      id: "c30-l5",
      title: "Cómo usar los datos on-chain para evaluar las sugerencias de la IA",
      paragraphs: [
        "El analista de IA propone operaciones con una puntuación de confianza de 0 a 100, y el backend solo ejecuta de forma automática las propuestas que igualan o superan tu umbral, sujetas al límite de trading y a la barrera de pausa por drawdown. Los datos on-chain son la forma de contrastar esa confianza con tus propios ojos en lugar de aceptar el número por fe. Antes de aceptar una propuesta, pregúntate si la imagen on-chain concuerda: ¿está el token en manos de muchas billeteras independientes?, ¿está subiendo su recuento de trustlines?, ¿hay suficiente TVL y profundidad de libro de órdenes para completar la operación dentro de tu tolerancia al slippage?, y ¿algún movimiento de ballena apunta en dirección contraria a la IA?",
        "La propia puntuación de la app ya integra buena parte de esto, y dos capítulos anteriores cubren exactamente cómo. El capítulo Cómo leer las sugerencias de trustline de la IA explica el escaneo semanal de solo observación de los tokens del top-N más los poseídos, las cuatro puntuaciones por token, las doce semanas de historial y las advertencias de deterioro, y recalca que la app nunca añade ni elimina una trustline de forma automática. El capítulo La evaluación de tokens en la cadena Stellar explica cómo se construye la puntuación de un token a partir de las agregaciones de operaciones de Horizon, la profundidad del libro de órdenes y la adopción basada en trustlines, además de la señal de alarma de un archivo emisor stellar.toml ausente. En lugar de duplicar esos, usa la lente on-chain de este capítulo para confirmar o cuestionar lo que esas puntuaciones resumen.",
        "Cuando los datos on-chain y la IA no coinciden, tómalo como una razón para bajar el ritmo, no como una anulación instantánea. Una confianza construida sobre liquidez escasa, una base de poseedores que se encoge o una ballena dirigiéndose a la salida merece más escepticismo del que la puntuación en bruto sugiere; a la inversa, una puntuación modesta respaldada por una adopción amplia y un TVL profundo puede ser más robusta de lo que parece. Decidas lo que decidas, vuelca tu conclusión en las herramientas de la app (tamaño de posición, stop loss, precio objetivo y precio de invalidación cuya relación beneficio-riesgo condiciona la operación) para que la decisión se base en reglas y no en una corazonada. Los datos on-chain no reemplazan a la IA ni a las puntuaciones; son la segunda opinión independiente que evita que confíes en un número seguro por encima de un mercado escaso. Nada de esto es asesoramiento financiero.",
      ],
      example:
        "La IA propone comprar un token con una confianza de 82, por encima de tu umbral, así que se ejecutaría de forma automática. Primero compruebas los datos on-chain: el recuento de trustlines ha resbalado durante tres semanas seguidas, el TVL del principal pool AMM se ha reducido a la mitad y un poseedor del top diez acaba de enviar un saldo grande hacia la dirección de un emisor. Tres señales on-chain independientes apuntan todas en dirección contraria al optimismo de la IA. No te limitas a desactivar la IA: reduces el tamaño de tu posición, colocas un stop loss más ajustado y confirmas el precio de invalidación para que la relación beneficio-riesgo aún justifique la operación. La puntuación te dio una opinión de partida; el libro de registro te dijo que la operaras con menor tamaño y con guardas más ajustadas.",
    },
  ],
  quiz: [
    {
      id: "c30-q1",
      prompt: "¿Cuál es la diferencia clave entre los datos de mercado y los datos on-chain?",
      options: [
        {
          text: "Los datos de mercado muestran el precio y el volumen, mientras que los datos on-chain muestran quién posee y mueve realmente el activo en el libro de registro público.",
          explanation:
            "Correcto. Los datos de mercado responden qué está haciendo el precio; los datos on-chain responden quién está detrás de ese precio: poseedores, trustlines, transferencias y actividad de los pools que el precio por sí solo esconde.",
        },
        {
          text: "Los datos de mercado son públicos y verificables, mientras que los datos on-chain son privados y solo los exchanges pueden verlos.",
          explanation:
            "Al revés. Los datos on-chain son la parte pública: el libro de registro de Stellar registra cada cuenta, trustline, pago y operación para que cualquiera los lea. Los datos de mercado son lo que se agrega encima.",
        },
        {
          text: "Son lo mismo mostrado en dos colores distintos en la página de detalle del token.",
          explanation:
            "No. Las pestañas de velas y volumen son datos de mercado; los datos on-chain son una vista aparte de la participación sobre la que dos gráficos de aspecto idéntico pueden discrepar por completo.",
        },
        {
          text: "Los datos on-chain siempre van por detrás del precio, así que solo son útiles después de que un movimiento haya terminado.",
          explanation:
            "Lo contrario está más cerca de la verdad. Las transferencias de las ballenas, las oleadas de trustlines y los cambios de liquidez a menudo ocurren on-chain antes de reflejarse por completo en el precio, y por eso el libro de registro puede adelantarse en lugar de ir detrás.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c30-q2",
      prompt: "El recuento de trustlines de un token salta de 400 a 1600 en una sola hora, todo desde cuentas financiadas por una única fuente que nunca operan después. ¿Qué indica esto con mayor probabilidad?",
      options: [
        {
          text: "Una adopción fuerte y genuina en la que deberías confiar de inmediato.",
          explanation:
            "No a partir de este patrón. La adopción real tiende a acumularse de forma sostenida a través de billeteras financiadas de forma independiente que realmente transaccionan, no en una explosión de una hora desde una única fuente de financiación.",
        },
        {
          text: "Un patrón sybil: un solo actor fabricando la apariencia de adopción con muchas cuentas baratas.",
          explanation:
            "Correcto. Como abrir una cuenta y una trustline en Stellar es barato, una sola persona puede falsear el número de cabezas. La misma fuente, la misma hora y la ausencia de operaciones posteriores son señales clásicas de sybil; pondera la distribución y la tendencia por encima de los recuentos en bruto.",
        },
        {
          text: "Que el escáner de liquidez está roto, ya que los recuentos de trustlines no pueden cambiar tan rápido.",
          explanation:
            "No. Los recuentos de trustlines sí pueden dispararse tan rápido de verdad; el escáner está reportando actividad real del libro de registro. La cuestión es si esa actividad es orgánica, y aquí no lo es.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c30-q3",
      prompt: "Ves que una ballena envía el 20% del suministro de un token pequeño y poco operado a la dirección de un emisor tipo exchange. ¿Cuál es la respuesta disciplinada?",
      options: [
        {
          text: "Vender todo de inmediato, porque las ballenas siempre saben más.",
          explanation:
            "No. Rara vez conoces la verdadera intención de una ballena, y algunas tientan deliberadamente a quienes operan con menos tamaño. Reflejar el movimiento por acto reflejo es seguirlas a ciegas, que es el principal peligro de observar a las ballenas.",
        },
        {
          text: "Ignorarlo por completo, ya que una sola billetera nunca puede afectar el precio de un token pequeño.",
          explanation:
            "Equivocado en el otro sentido. Una transferencia del tamaño de una ballena en un token poco operado es justo el caso que puede inundar el libro de órdenes y mover el precio con fuerza, así que no debería ignorarse.",
        },
        {
          text: "Tomarlo como un aviso para mirar más de cerca: revisar la profundidad del libro de órdenes, confirmar tu stop loss y decidir si tu tesis sigue en pie.",
          explanation:
            "Correcto. La actividad de las ballenas es una señal para investigar y gestionar el riesgo, no una compra o venta automática. Verifica la profundidad y apóyate en tus propias herramientas de riesgo en lugar de reaccionar a la urgencia.",
        },
        {
          text: "Suponer que es una reorganización interna sin significado y no hacer absolutamente nada.",
          explanation:
            "Demasiado desdeñoso. Podría ser un movimiento interno, pero una transferencia a la dirección de un emisor o un exchange insinúa la intención de vender o rescatar: motivo para mirar más de cerca, no para dar por hecho que no es nada.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c30-q4",
      prompt: "¿Qué afirmación sobre el TVL (valor total bloqueado) es correcta?",
      options: [
        {
          text: "Un TVL alto prueba que los contratos de un protocolo están auditados y son seguros de usar.",
          explanation:
            "No. El TVL es una señal de tamaño e interés, no una calificación de seguridad. Los protocolos de Soroban conllevan riesgo de contrato inteligente por mucho que haya bloqueado, y el TVL puede estar inflado por una sola ballena o por capital mercenario.",
        },
        {
          text: "Un TVL más alto en el pool contra el que operas generalmente significa menos slippage, pero puede marcharse rápido y no garantiza calidad.",
          explanation:
            "Correcto. Los pools más profundos absorben operaciones más grandes con menor impacto en el precio, pero el TVL puede drenarse rápido, estar inflado por un solo proveedor u oscilar solo porque los precios de los activos depositados se movieron: léelo como un dato de entrada, contrastado con la profundidad real.",
        },
        {
          text: "El TVL solo cambia cuando cambia el precio de los activos bloqueados, nunca por depósitos o retiros.",
          explanation:
            "Incompleto y engañoso. Los movimientos de precio sí desplazan un TVL denominado en dólares, pero los depósitos y retiros también lo cambian: un gran proveedor retirando liquidez es una causa común e importante de un TVL en descenso.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
