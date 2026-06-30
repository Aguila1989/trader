import type { Chapter } from "../../types";

export const chapter21: Chapter = {
  id: "c21",
  number: 21,
  level: "EXPERT",
  title: "Evaluación de tokens en la cadena Stellar",
  description: "La mecánica detrás de las puntuaciones: qué miden las agregaciones de operaciones de Horizon, cómo se suma la profundidad del libro de órdenes, qué dice realmente el número de trustlines, cómo leer 12 semanas de historial de puntuaciones y cuándo anular a la IA.",
  lessons: [
    {
      id: "c21-l1",
      title: "Cómo funcionan las agregaciones de operaciones de Horizon",
      paragraphs: [
        "Las cifras de volumen del escaneo provienen del endpoint de agregaciones de operaciones de Horizon. Agrupa las operaciones completadas de un par de activos en intervalos de tiempo fijos —la app usa intervalos horarios para la cifra de 24 horas e intervalos diarios para la cifra de 7 días— y reporta, por intervalo, el precio de apertura/máximo/mínimo/cierre, el número de operaciones y el volumen del activo base negociado.",
        "Dos detalles importan. Primero, esto es actividad del DEX liquidada en la cadena para ese par específico (el token contra XLM), no la cifra reportada por un exchange ni los swaps de pools AMM que el escaneo del libro de órdenes no puede ver — así que un token cuya liquidez vive contra USDC o en un pool puede parecer más delgado aquí de lo que realmente es. Segundo, Horizon omite por completo los intervalos vacíos, así que \"24 velas horarias\" en un mercado delgado pueden en realidad abarcar varios días.",
        "La app suma el volumen base a lo largo de los intervalos para obtener sus cifras de volumen de 24h y 7d, y compara la apertura del primer intervalo con el cierre del último para etiquetar la tendencia de 7 días como al alza, estable o a la baja. Conocer la fuente explica los límites: un volumen bajo aquí significa específicamente un volumen bajo del DEX en el par XLM, que es la señal honesta de si realmente podrías negociar el token en este lugar.",
      ],
      example: "Un token reporta un volumen de 7 días de 40.000 a partir de agregaciones diarias contra XLM. Lo revisas y ves solo 5 intervalos diarios no vacíos — la negociación ocurrió en 5 de los 7 días. La cifra es real pero irregular, y no dice nada sobre el mercado de USDC posiblemente más profundo de ese token. La ponderas en consecuencia en lugar de interpretar 40.000 como liquidez diaria estable.",
    },
    {
      id: "c21-l2",
      title: "Cómo se calcula la profundidad del libro de órdenes",
      paragraphs: [
        "La profundidad en el escaneo es una instantánea de la liquidez en reposo, distinta del volumen negociado. La app obtiene el libro de órdenes en vivo del token contra XLM y suma los importes de los diez mejores niveles de demanda (bids) y los diez mejores niveles de oferta (asks), normalizados a unidades del activo base. El volumen te dice qué se ha negociado; la profundidad te dice qué está ahí, listo para negociarse ahora mismo.",
        "La profundidad es lo que determina tu deslizamiento (slippage) en una orden real. Un libro con grandes tamaños apilados cerca del precio de mercado absorbe una operación considerable con poco movimiento de precio; un libro delgado significa que incluso una orden modesta atraviesa varios niveles y se ejecuta a un precio medio mucho peor. Dos tokens con un volumen de 24h idéntico pueden tener una profundidad completamente distinta, y el delgado es el más peligroso para entrar o salir.",
        "Como es una instantánea de un solo momento, la profundidad puede cambiar de minuto a minuto, y una sola orden grande en reposo puede embellecerla. Léela junto con el volumen y el spread: una liquidez sana es un volumen constante, un spread ajustado y profundidad en ambos lados del libro — no solo una cifra impresionante aislada.",
      ],
      example: "El token A y el token B muestran ambos un volumen de 24h cercano a 50.000. Pero la profundidad de los diez mejores niveles de A suma 30.000 unidades base con un spread de 20 bps, mientras que la de B suma 1.200 con un spread de 400 bps. Una salida de 10.000 unidades apenas mueve el precio de A; en B atraviesa todos los niveles. Mismo volumen, liquidez real muy distinta — la profundidad es lo que te lo reveló.",
    },
    {
      id: "c21-l3",
      title: "Qué revela el número de trustlines sobre la adopción",
      paragraphs: [
        "El número de trustlines proviene del endpoint de activos de Horizon —el campo num_accounts— y es la cantidad de cuentas que han abierto una trustline hacia ese token. Es el indicador (proxy) más amplio disponible para la adopción: cuántas cuentas distintas han elegido poder mantener este activo. Un token con 15.000 trustlines ha superado un listón muy diferente al de uno con 30.",
        "Pero ten claro exactamente qué significa y qué no. Cuenta a los poseedores (quienes abren la trustline), no a los traders activos, e incluye cuentas inactivas y con saldo cero — cada cuenta que alguna vez abrió la trustline y no la ha cerrado. Así que es una medida del alcance acumulado, no de la actividad actual. Un número alto con un volumen casi nulo es un token que alguna vez fue adoptado y ahora está en silencio.",
        "La forma más útil de usarlo es como denominador y como tendencia. Contrástalo con el volumen y la profundidad: muchos poseedores más liquidez real es adopción genuina; muchos poseedores sin liquidez es un token estancado o abandonado. Y de semana en semana, un número de trustlines en descenso —poseedores cerrando activamente sus posiciones— es uno de los disparadores de deterioro, precisamente porque la gente que se va es una señal significativa.",
      ],
      example: "Un token muestra 9.000 trustlines, lo que parece sólido — hasta que notas un volumen de 24h de aproximadamente cero y un precio plano durante semanas. El contraste revela un activo que atrajo poseedores hace mucho y ahora está inactivo. La semana siguiente el número marca 8.000: una caída del 11% activa la advertencia de \"menos poseedores\", confirmando que los poseedores se están yendo activamente en lugar de estar simplemente ociosos.",
    },
    {
      id: "c21-l4",
      title: "Interpretar 12 semanas de historial de puntuaciones",
      paragraphs: [
        "Cada escaneo semanal almacena una instantánea por token, y la app conserva al menos 12 semanas de ese historial. Las puntuaciones de una semana son una foto; doce semanas son una película. La trayectoria de la puntuación general y sus cuatro componentes es mucho más informativa que cualquier lectura aislada, porque muestra si un token se está fortaleciendo, decayendo o simplemente es ruidoso.",
        "Busca dirección y consistencia. Un token cuyas puntuaciones de legitimidad y liquidez se mantienen estables o suben a lo largo de muchas semanas se está ganando confianza; uno cuyas puntuaciones bajan poco a poco te está diciendo algo, aunque ninguna semana individual active una advertencia. Distingue una tendencia real de un pico puntual — una sola mala semana entre once buenas suele ser ruido, mientras que tres descensos consecutivos son un patrón.",
        "Los disparadores de semana en semana se activan ante cambios de un solo paso, pero la vista de 12 semanas es donde detectas la sangría lenta que esos umbrales pueden pasar por alto — un token que va de 8 a 7 a 6 a 5 a lo largo de un mes nunca activa la regla de caída de dos puntos en ninguna semana individual, y sin embargo se ha deteriorado claramente. Usa el historial para confirmar que una advertencia es parte de una tendencia, o para notar un deterioro que los disparadores aún no han señalado.",
      ],
      example: "Un token nunca activa una advertencia, pero su puntuación general de 12 semanas marca 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3 — un descenso mensual constante que la regla de dos puntos en una sola semana nunca capta. La película, no la foto, te dice que recortes o salgas. Otro token rebota 7, 8, 6, 8, 7 — ruidoso pero sin tendencia, y no motivo de alarma.",
    },
    {
      id: "c21-l5",
      title: "Cuándo anular una sugerencia de la IA y cómo documentarlo",
      paragraphs: [
        "Tú eres quien toma la decisión final, y hay buenas razones para anular el escaneo en ambas direcciones. Podrías rechazar un token con puntuación alta porque tienes conocimiento fuera de la cadena que al modelo le falta — una disputa conocida del equipo, una nube regulatoria, un riesgo de depeg. O podrías añadir uno con puntuación baja porque entiendes por qué puntúa bajo y aceptas ese riesgo de forma deliberada, por ejemplo un proyecto nuevo pero creíble al que el modelo penaliza puramente por su corto historial.",
        "Anula basándote en evidencia, no en una corazonada. Antes de ir en contra de una puntuación, anota los hechos específicos que lo justifican: qué vio el escaneo, qué sabes tú que él no sabe, y qué señales concretas (identidad del emisor, profundidad, tendencia de poseedores, contenido del TOML) respaldan tu decisión. Si no puedes articular una razón por la que el modelo se equivoca, eso suele ser señal de que debes ceder ante él.",
        "Documentar tu razonamiento es lo que hace que las anulaciones sean revisables más adelante. Registra la fecha, el token, las puntuaciones del momento, tu decisión y tu justificación — el aplazamiento (snooze) de una advertencia, una nota en tu propio registro, o un comentario junto a la posición. Cuando lo revises dentro de unas semanas podrás juzgar si tu anulación quedó justificada por el resultado, y construyes un historial en lugar de repetir instintos no probados.",
      ],
      example: "El escaneo marca un token que mantienes con una advertencia de deterioro, pero sabes que la caída de volumen es una interrupción de exchange de una semana, no decadencia. Aplazas la advertencia durante siete días y anotas: \"2026-07-01, token X, general 5 (era 7); la caída de volumen es la ventana de mantenimiento del exchange Acme, no fundamentos; poseedores y TOML sin cambios; revisar en el próximo escaneo.\" La semana siguiente las métricas se recuperan, tu decisión documentada queda reivindicada, y la nota demuestra por qué mantuviste.",
    },
  ],
  quiz: [
    {
      id: "c21-q1",
      prompt: "Un token muestra un volumen de 7 días saludable en el escaneo, pero sospechas que la mayor parte de su liquidez está en otro lugar. ¿Qué mide realmente la cifra de volumen?",
      options: [
        { text: "Operaciones del DEX liquidadas en la cadena para ese token contra XLM, sumadas a partir de los intervalos de agregación de Horizon.", explanation: "Correcto. Es específicamente el volumen del DEX en el par XLM — excluye los pools AMM y otros pares de cotización, así que un token con mucha liquidez en USDC puede parecer más delgado aquí de lo que realmente es." },
        { text: "El volumen total de negociación del token en todos los exchanges y lugares del mundo.", explanation: "Incorrecto. Horizon solo reporta las operaciones del SDEX liquidadas para el par consultado, no el volumen externo ni agregado." },
        { text: "El número de cuentas que actualmente mantienen el token.", explanation: "Incorrecto. Eso es el número de trustlines del endpoint de activos, una métrica completamente distinta." },
      ],
      correctIndex: 0,
    },
    {
      id: "c21-q2",
      prompt: "Dos tokens tienen un volumen de 24h casi idéntico, pero debes salir de una posición grande rápidamente. ¿Qué métrica te dice mejor cuánto costará esa salida?",
      options: [
        { text: "El número de trustlines, ya que más poseedores significa una salida más fácil.", explanation: "Incorrecto. El número de poseedores no dice nada sobre la liquidez en reposo ahora mismo; puedes tener muchos poseedores inactivos y un libro vacío." },
        { text: "La profundidad del libro de órdenes —el tamaño sumado en los mejores niveles de demanda/oferta— ya que determina tu deslizamiento.", explanation: "Correcto. La profundidad es la liquidez en reposo disponible ahora; un libro delgado hace que una orden grande atraviese niveles y se ejecute a un precio medio mucho peor, sin importar el volumen pasado." },
        { text: "La etiqueta de tendencia de precio de 7 días.", explanation: "Incorrecto. La tendencia te dice la dirección, no cuánto tamaño puede absorber el libro a la salida." },
      ],
      correctIndex: 1,
    },
    {
      id: "c21-q3",
      prompt: "Un token muestra 9.000 trustlines pero casi ningún volumen de negociación y un precio plano. ¿Cuál es la lectura más precisa?",
      options: [
        { text: "Está muy activo ahora mismo, porque el número de trustlines prueba que hay negociación en vivo.", explanation: "Incorrecto. El número de trustlines incluye cuentas inactivas y con saldo cero; mide el alcance acumulado, no la actividad actual." },
        { text: "Fue adoptado en algún momento pero ahora está mayormente inactivo — alto alcance acumulado, poca actividad actual.", explanation: "Correcto. Muchos poseedores con un volumen casi nulo apunta a un token que alguna vez fue adoptado y ahora está en silencio; el número es un denominador, léelo contra el volumen y la profundidad." },
        { text: "El número de trustlines debe ser un error, porque los poseedores siempre negocian.", explanation: "Incorrecto. Los poseedores con frecuencia se quedan inactivos; un número alto sin volumen es un patrón común y significativo, no un error de datos." },
      ],
      correctIndex: 1,
    },
    {
      id: "c21-q4",
      prompt: "La puntuación general de un token que mantienes marca 8, 7, 6, 5 a lo largo de cuatro semanas consecutivas pero nunca activa la advertencia de caída de dos puntos. ¿Qué deberías sacar del historial de 12 semanas?",
      options: [
        { text: "Nada va mal, porque ninguna semana individual cayó dos puntos.", explanation: "Incorrecto. El disparador de una sola semana pasa por alto un descenso lento y constante; la trayectoria es el motivo de conservar el historial." },
        { text: "Una clara tendencia a la baja que los umbrales por semana pasan por alto — una señal para recortar o salir.", explanation: "Correcto. Cuatro descensos seguidos de un punto nunca activan la regla de dos puntos, y sin embargo la película muestra un deterioro evidente que la foto no puede." },
        { text: "Las puntuaciones son solo ruido y pueden ignorarse.", explanation: "Incorrecto. Un descenso monótono de cuatro semanas es una tendencia, no ruido; la consistencia en una dirección es exactamente lo que hay que tener en cuenta." },
      ],
      correctIndex: 1,
    },
    {
      id: "c21-q5",
      prompt: "El escaneo marca un token que mantienes, pero tienes evidencia específica de que la caída es una interrupción temporal de un exchange. ¿Cuál es la forma disciplinada de anular la advertencia?",
      options: [
        { text: "Ignorar la advertencia en silencio y seguir adelante, ya que tienes la sensación de que está bien.", explanation: "Incorrecto. Una corazonada no documentada no puede revisarse después; anula basándote en evidencia articulada, no en una sensación." },
        { text: "Aplazar la advertencia y registrar la fecha, las puntuaciones, tu razonamiento y un plan de revisión para que la decisión sea revisable.", explanation: "Correcto. Documentar los hechos específicos (qué vio el escaneo, qué sabes tú que él no, cuándo volver a comprobar) hace que la anulación sea responsable y construye un historial." },
        { text: "Vender de inmediato toda la posición para ir sobre seguro.", explanation: "Incorrecto. Si tu evidencia dice que la caída es temporal, una salida forzada contradice tu propio análisis; el objetivo es una decisión razonada y documentada." },
      ],
      correctIndex: 1,
    },
  ],
};
