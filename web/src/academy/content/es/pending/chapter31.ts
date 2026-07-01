// PENDING — do not activate until green light.
// Chapter 31 (Tokenomics): supply, market cap, minting and burning, and using
// tokenomics as a complementary lens on an AI trustline suggestion. Authored to
// the same shape as content/en/chapter22.ts, ADVANCED level, with the per-chapter
// `whoFor` one-liner typed via a local intersection so the live Chapter interface
// stays untouched until integration. This chapter owns no new glossary terms.
import type { Chapter } from "../../../types";

export const chapter31: Chapter & { whoFor: string } = {
  id: "c31",
  number: 31,
  level: "ADVANCED",
  whoFor: "Para quienes juzgan un token por su suministro, no por su bombo",
  title: "Tokenómica",
  description:
    "Suministro, capitalización de mercado e inflación mediante la emisión y la quema — y cómo usar la tokenómica como lente cuando la IA sugiere una nueva trustline.",
  lessons: [
    {
      id: "c31-l1",
      title: "¿Qué es la tokenómica?",
      paragraphs: [
        "La tokenómica es la economía de un token: cuántas unidades existen, cómo se crean las nuevas (emisión), quién las tiene (distribución) y qué comportamiento premia su diseño (incentivos). Es el reglamento que gobierna el suministro monetario de un solo activo, decidido por quien lo emite. En Stellar, XLM tiene su propia política monetaria fija, mientras que cualquier emisor puede crear un token personalizado y escribir sus propias reglas en un archivo stellar.toml.",
        "Los cuatro pilares importan porque el precio es solo la mitad del valor. Un token puede parecer activo en el gráfico y, sin embargo, estar diluyéndose en silencio porque su emisor crea más unidades, o estar tan concentrado que un puñado de billeteras puede mover el mercado a su antojo. Leer el suministro y la distribución te dice si el precio que ves refleja un activo escaso y ampliamente repartido, o uno abundante controlado por unos pocos privilegiados.",
        "No necesitas una hoja de cálculo para empezar. Tres preguntas cubren casi todo: cuántos tokens están en circulación ahora, cuántos podrían existir jamás y quién se beneficia cuando el suministro cambia. La tokenómica no es más que la disciplina de hacerse esas preguntas antes de confiarle tu capital a un token. Este material es educativo, no asesoramiento financiero — el objetivo es ayudarte a leer un token, no decirte cuál comprar.",
      ],
      example:
        "Piensa en el recinto de un concierto. El número de asientos impresos en las entradas es el suministro, la taquilla decidiendo si imprime más es la emisión, quién tiene esas entradas es la distribución, y las ventajas que trae un asiento en primera fila son los incentivos. Dos conciertos pueden cobrar el mismo precio por entrada, pero el que sigue imprimiendo entradas de más resta valor, en silencio, a cada entrada ya existente. La tokenómica es leer el plano de asientos antes de pagar.",
    },
    {
      id: "c31-l2",
      title: "¿Qué son el suministro circulante y el suministro máximo?",
      paragraphs: [
        "El suministro circulante es la cantidad de tokens realmente disponibles y negociables en este momento. El suministro máximo es la mayor cantidad que puede existir jamás según las reglas del token. La diferencia entre ambos son los tokens prometidos pero aún no liberados — bloqueados en calendarios de adquisición del equipo, reservados para recompensas futuras o simplemente todavía no emitidos.",
        "Imagina una ciudad. Las viviendas que la gente puede alquilar o comprar hoy son el suministro circulante. El plan total de urbanización en los libros del ayuntamiento — cada parcela recalificada para futura construcción — es el suministro máximo. Si una ciudad tiene 10.000 viviendas ocupadas pero un plan para 100.000, sabes que se avecina una oleada de vivienda nueva. Esa construcción futura competirá con las viviendas que hoy están en pie y puede rebajar su precio, aunque todavía no se haya edificado nada.",
        "Para un token, esa urbanización futura es el riesgo de dilución. Si el suministro circulante es una pequeña porción del suministro máximo, hay grandes tramos de tokens programados para desbloquearse, y cada desbloqueo suma vendedores al mercado. Un token que hoy se negocia bien puede ir a la baja durante meses simplemente porque su calendario de suministro sigue liberando unidades nuevas. Compara siempre las dos cifras antes de juzgar un precio como alto o bajo.",
      ],
      example:
        "Un token se negocia a 2 USDC con 50 millones de tokens en circulación, pero su suministro máximo es de 500 millones. Solo se ha liberado el 10 por ciento. Los 450 millones restantes están previstos para desbloquearse a lo largo de los próximos tres años para el equipo y los primeros inversores. Aunque la demanda se mantenga plana, ese flujo constante de nuevos vendedores puede lastrar el precio — así que los 2 USDC que pagas hoy no compiten solo con los tenedores de hoy, sino con nueve veces más tokens esperando en la reserva.",
    },
    {
      id: "c31-l3",
      title: "¿Qué es la capitalización de mercado y cómo se calcula?",
      paragraphs: [
        "La capitalización de mercado es el valor total del suministro circulante de un token: capitalización de mercado = precio x suministro circulante. Responde a una pregunta más amplia que el precio por sí solo — no cuánto cuesta una unidad, sino cuánto vale toda la reserva negociable. Una capitalización de mercado de 50 millones de USDC significa que el mercado valora actualmente todos los tokens en circulación, sumados, en aproximadamente esa cifra.",
        "Por eso un precio bajo por token no es lo mismo que barato. El precio depende por completo de cómo esté repartido el suministro. Un token a 0,001 USDC con 100.000 millones de unidades en circulación tiene una capitalización de mercado de 100 millones de USDC — muchísimo mayor que un token a 200 USDC con solo 100.000 unidades, que vale apenas 20 millones. El precio de una sola unidad no te dice nada sobre el tamaño hasta que lo multiplicas por el suministro.",
        "Merece la pena conocer dos ángulos más. La valoración totalmente diluida aplica las mismas cuentas al suministro máximo en lugar del circulante, mostrando cuánto valdría el token si todas las unidades futuras existieran hoy — una comprobación de sensatez útil frente a la dilución que aprendiste en la lección anterior. Y la capitalización de mercado dividida entre el volumen diario de negociación da pistas sobre la liquidez: una capitalización enorme con poco volumen significa que quizá te cueste salir al precio cotizado.",
      ],
      example:
        "Estás comparando dos tokens en la página de detalle del token. El Token A muestra 0,02 USDC por unidad; el Token B muestra 45 USDC por unidad. B parece \"caro\". Pero A tiene 8.000 millones de tokens en circulación (capitalización de mercado de 160 millones de USDC), mientras que B tiene 1 millón en circulación (capitalización de mercado de 45 millones de USDC). A es, con diferencia, el activo mayor, a pesar de su diminuto precio de etiqueta. Juzgar solo por el precio de la etiqueta te habría dejado exactamente al revés.",
    },
    {
      id: "c31-l4",
      title: "¿Qué es la inflación en cripto? Emisión y quema de tokens",
      paragraphs: [
        "La inflación en cripto significa que el suministro crece con el tiempo. El mecanismo es la emisión: el emisor crea tokens nuevos y los añade a la circulación, a menudo para financiar recompensas, pagos de staking o una tesorería. Cada token recién emitido es un derecho sobre el mismo valor subyacente, así que, a menos que la demanda crezca en la misma medida, la porción de cada tenedor existente pasa a ser una parte ligeramente menor del total — eso es la dilución.",
        "La quema es lo contrario. Los tokens se envían a una dirección desde la que nadie puede gastarlos, retirándolos del suministro de forma permanente. Un diseño deflacionario quema tokens más rápido de lo que los emite, así que el total se encoge y cada token restante representa una porción mayor. En Stellar esto se hace recuperando suministro hacia el emisor o enviándolo a una cuenta inutilizable; el propio XLM tiene un suministro fijo sin emisión continua, por lo que no se infla.",
        "Para un tenedor, la dirección y el ritmo del cambio de suministro son tan importantes como el precio. Un token que en silencio emite un 10 por ciento más de unidades cada año es un viento en contra que pagas incluso cuando el precio parece plano, porque tu porción de propiedad se erosiona año tras año. Un calendario de quema creíble es un viento a favor. Ninguno es automáticamente bueno ni malo — un proyecto incipiente puede necesitar emitir para impulsar la adopción — pero deberías saber hacia dónde se mueve el suministro y por qué antes de tenerlo.",
      ],
      example:
        "Tienes 1.000 unidades de un token, que es el 1 por ciento de un suministro de 100.000 unidades. El emisor entonces emite 100.000 unidades nuevas para un programa de recompensas, duplicando el suministro a 200.000. Sigues teniendo 1.000 unidades, pero ahora eso es solo el 0,5 por ciento del token. Tu posición no se encogió — el pastel se duplicó — pero tu porción se redujo a la mitad. Si el precio no hubiera subido para reflejar la nueva demanda, tu participación acaba de perder, en silencio, la mitad de su peso relativo.",
    },
    {
      id: "c31-l5",
      title: "Cómo usar la tokenómica para evaluar una sugerencia de trustline de la IA",
      paragraphs: [
        "Cuando el escaneo semanal, de solo observación, de Atrium sugiere una nueva trustline, la tokenómica es tu lista de verificación previa a la confianza. Antes de optar por tener un token — lo que cuesta una pequeña reserva de XLM y te expone al emisor — hazte las tres preguntas de este capítulo. ¿Cuál es el suministro circulante frente al suministro máximo, para poder calibrar la dilución? ¿Cuál es la capitalización de mercado, para no dejarte engañar por un precio bajo por token? Y ¿el token se está emitiendo, quemando o es fijo, para saber hacia dónde deriva tu porción? Un token puede superar todas las señales técnicas y aun así ser una mala tenencia si su suministro está destinado a dispararse.",
        "Esta lente es deliberadamente complementaria a lo que la IA ya mide. Los capítulos de sugerencias de trustline, el Capítulo 20 y el Capítulo 21, explican cómo el escaneo puntúa cuatro señales por token — liquidez, legitimidad, tendencia y riesgo — apoyándose en pistas como la profundidad del libro de órdenes, el número de trustlines de un token y señales de confianza del emisor, como la presencia o la ausencia de un stellar.toml, y cómo hace seguimiento de las advertencias de deterioro de los tokens que tienes a lo largo de doce semanas de historial. Esas señales leen el comportamiento del mercado en torno a un token. La tokenómica lee el propio diseño monetario del token, algo que ninguna profundidad del libro de órdenes ni número de trustlines puede revelar. Juntas responden a mitades distintas de una misma pregunta: ¿es este activo tanto bien negociado como bien estructurado?",
        "Ten presentes las propias salvaguardas de la aplicación mientras haces esto. El escaneo nunca añade ni elimina automáticamente una trustline — la decisión siempre es tuya — y un stellar.toml ausente es una señal de alarma precisamente porque oculta los metadatos del emisor que usarías para verificar el suministro y la autoridad de emisión. Si no puedes averiguar quién puede emitir el token ni cuánto puede llegar a existir, trata esa opacidad en sí misma como una señal de riesgo, y apóyate en consecuencia en tus factores de riesgo de tamaño de posición y de volatilidad. Esto es orientación educativa, no asesoramiento financiero.",
      ],
      example:
        "El escaneo destaca un token con una fuerte profundidad de liquidez y un número saludable de trustlines — las señales de la IA aparecen en verde. Antes de optar por él, revisas la tokenómica. El suministro circulante es el 5 por ciento del suministro máximo, y el stellar.toml revela que el emisor conserva plena autoridad de emisión con un calendario de desbloqueo de tres años. Las señales del mercado decían \"bien negociado\", pero el diseño del suministro dice \"fuerte dilución por delante y control de la emisión en un solo par de manos\". Renuncias a la trustline — no porque la IA se equivocara, sino porque una segunda lente complementaria detectó un riesgo que las señales del mercado no podían ver.",
    },
  ],
  quiz: [
    {
      id: "c31-q1",
      prompt: "¿Qué conjunto de factores describe mejor lo que abarca la \"tokenómica\"?",
      options: [
        {
          text: "El suministro, la emisión, la distribución y los incentivos del token.",
          explanation:
            "Correcto. La tokenómica es la economía de un token — cuántas unidades existen, cómo se crean las nuevas, quién las tiene y qué premia su diseño. Juntos te dicen si el precio refleja un activo escaso y ampliamente repartido o uno abundante y concentrado.",
        },
        {
          text: "Solo el precio de mercado actual y la variación porcentual de 24 horas.",
          explanation:
            "Demasiado estrecho. El precio y su variación reciente son datos del gráfico, no tokenómica. No dicen nada sobre cuánto suministro existe ni quién controla su emisión.",
        },
        {
          text: "El color de las velas y la forma de las barras de volumen.",
          explanation:
            "No. Esas son pistas de lectura del gráfico en la página de detalle del token. La tokenómica trata del diseño monetario subyacente del token, no de la apariencia de su gráfico de precios.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c31-q2",
      prompt: "Un token tiene 50 millones de tokens en circulación y un suministro máximo de 500 millones. ¿Por qué te importa esa diferencia como tenedor?",
      options: [
        {
          text: "No importa — solo el suministro circulante afecta al precio.",
          explanation:
            "Incorrecto. La diferencia representa 450 millones de tokens programados para desbloquearse. Cada desbloqueo suma vendedores al mercado, lo que puede lastrar el precio durante meses aunque la demanda se mantenga estable.",
        },
        {
          text: "Los 450 millones de tokens sin liberar son dilución futura: a medida que se desbloquean, suman vendedores y pueden presionar el precio.",
          explanation:
            "Correcto. Como una ciudad con 10.000 viviendas pero un plan para 100.000, la urbanización futura compite con lo que existe hoy. Una pequeña porción circulante de un gran suministro máximo es un viento en contra de dilución que deberías tener en cuenta antes de comprar.",
        },
        {
          text: "Un suministro máximo grande garantiza que el precio subirá a medida que se emitan más tokens.",
          explanation:
            "Al revés. Emitir más unidades sin una demanda que las acompañe diluye la porción de cada tenedor. Más suministro es un viento en contra, no una garantía de precios más altos.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c31-q3",
      prompt: "El Token A se negocia a 0,02 USDC con 8.000 millones de unidades en circulación. El Token B se negocia a 45 USDC con 1 millón de unidades en circulación. ¿Cuál es el activo mayor por capitalización de mercado, y por qué?",
      options: [
        {
          text: "El Token B, porque su precio por unidad de 45 USDC es mucho más alto que el de A.",
          explanation:
            "Esta es la trampa exacta de la que advierte la lección. Un precio alto por token no significa \"más grande\" — debes multiplicar el precio por el suministro circulante para obtener la capitalización de mercado.",
        },
        {
          text: "Son del mismo tamaño, porque la capitalización de mercado depende solo del precio.",
          explanation:
            "Incorrecto. La capitalización de mercado es el precio multiplicado por el suministro circulante, así que dos tokens con suministros muy distintos casi nunca tienen la misma capitalización, ni siquiera a precios similares.",
        },
        {
          text: "El Token A, porque 0,02 x 8.000 millones = 160 millones de USDC, frente a los 45 x 1 millón = 45 millones de USDC de B.",
          explanation:
            "Correcto. Capitalización de mercado = precio x suministro circulante. El diminuto precio de etiqueta de A oculta una reserva negociable mucho mayor. Un precio bajo por token nunca es automáticamente \"barato\" hasta que tienes en cuenta el suministro.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c31-q4",
      prompt: "Un emisor emite 100.000 tokens nuevos para un programa de recompensas, duplicando el suministro de 100.000 a 200.000. Tú tenías 1.000 tokens. ¿Qué le pasó a tu porción de propiedad?",
      options: [
        {
          text: "Tu porción cayó del 1 por ciento al 0,5 por ciento — el suministro se duplicó mientras tu tenencia se mantuvo igual.",
          explanation:
            "Correcto. La emisión es inflación: tus 1.000 tokens no cambian, pero ahora representan una porción de la mitad de tamaño de un pastel duplicado. A menos que el precio subiera para reflejar la nueva demanda, tu participación relativa se diluyó.",
        },
        {
          text: "Tu porción se mantuvo en el 1 por ciento, porque sigues teniendo la misma cantidad de tokens.",
          explanation:
            "Incorrecto. Tener la misma cantidad no es lo mismo que tener la misma porción. Cuando el total se duplica, tu tenencia fija cubre una fracción menor de él.",
        },
        {
          text: "Tu porción subió, porque más tokens en circulación hace que cada tenedor sea más importante.",
          explanation:
            "Ocurre lo contrario. La nueva emisión diluye a los tenedores existentes — más unidades significa que cada una, incluida la tuya, representa una porción menor del total.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c31-q5",
      prompt: "El escaneo de trustlines de la IA destaca un token con una fuerte profundidad de liquidez y un alto número de trustlines. ¿Cómo debería encajar la tokenómica en tu decisión?",
      options: [
        {
          text: "Las señales verdes de la IA bastan por sí solas; la tokenómica no aporta nada nuevo.",
          explanation:
            "Incorrecto. Las cuatro señales del escaneo — liquidez, legitimidad, tendencia y riesgo — leen el comportamiento del mercado en torno a un token. No pueden ver el propio diseño de suministro del token, que es justo la brecha que llena la tokenómica.",
        },
        {
          text: "Usa la tokenómica como lente complementaria: revisa el suministro circulante frente al máximo, la capitalización de mercado y la emisión o la quema antes de optar por él.",
          explanation:
            "Correcto. Como explican los Capítulos 20 y 21, el escaneo puntúa las señales del mercado; la tokenómica lee el diseño monetario del token. Un token puede superar todas las señales técnicas y aun así ser una mala tenencia si su suministro está destinado a dispararse o su autoridad de emisión es opaca.",
        },
        {
          text: "Ignora por completo a la IA y deja que la aplicación añada automáticamente la trustline basándose solo en la tokenómica.",
          explanation:
            "Erróneo por partida doble. Las dos lentes son complementarias, no rivales — y la aplicación nunca añade una trustline automáticamente. Añadir una es siempre tu propia decisión, tomada con una pequeña reserva de XLM en juego.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
