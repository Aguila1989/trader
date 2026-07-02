// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
import type { Chapter } from "../../types";

export const chapter36: Chapter & { whoFor: string } = {
  id: "c36",
  number: 36,
  level: "EXPERT",
  whoFor: "Para operadores que quieren confiar en una IA —y dudar de ella— con criterio",
  title: "La IA en el trading: oportunidades y peligros",
  description:
    "Cómo se entrenan los modelos de trading, dónde se cuelan el sobreajuste y el sesgo de anticipación, los riesgos éticos y sistémicos del trading automatizado, en qué se diferencia la IA transparente de Atrium y cuándo conviene apagarla.",
  lessons: [
    {
      id: "c36-l1",
      title: "¿Cómo se entrenan los modelos de trading con IA?",
      paragraphs: [
        "Un modelo de trading se ajusta a datos históricos. Tú eliges las variables (las entradas que lee el modelo) y una etiqueta (aquello que intenta predecir). Las variables podrían ser los rendimientos recientes, la profundidad del libro de órdenes obtenida de Horizon, el volumen de agregación de operaciones, la volatilidad o un recuento de trustlines como indicador aproximado de adopción. La etiqueta suele ser un resultado futuro: si el precio medio será más alto dentro de una hora, o si se alcanzará un objetivo antes que un stop. El modelo aprende cualquier correspondencia estadística entre las variables y la etiqueta que minimice su error sobre esos datos pasados.",
        "El supuesto silencioso es que el mañana rima con el ayer. Eso solo se cumple mientras el régimen de mercado se mantiene estable. Cuando el régimen cambia —la liquidez se seca en un libro delgado de XLM/USDC, una stablecoin pierde su paridad, los diferenciales se amplían o un nuevo pool AMM redirige el flujo—, las relaciones que el modelo memorizó dejan de dar fruto. Esto es un cambio de régimen, y por mucho que se entrene sobre el régimen antiguo, ningún modelo queda preparado para él.",
        "En la práctica dominan dos modos de fallo. Basura de entrada: si los datos de entrenamiento están mal —marcas de tiempo incorrectas, sesgo de supervivencia por tokens retirados, precios de un momento de liquidez nula—, el modelo aprende fielmente la basura. El sesgo de anticipación es más sutil y más peligroso: la información se filtra hacia atrás en el tiempo. Si una variable en la barra T se calcula usando datos que solo eran conocibles en T+1 (un precio de cierre usado para \"predecir\" ese mismo cierre, una etiqueta suavizada sobre el futuro, una ejecución supuesta a un precio al que nadie podría haber operado), el backtest parece brillante porque el modelo hace trampa en silencio. En vivo, esos datos futuros no existen, y la ventaja se esfuma.",
        "Protegerse de esto exige una disciplina temporal estricta: cada variable debe poder calcularse usando solo información disponible antes del punto de decisión, las divisiones deben ser cronológicas (nunca barajes las filas de una serie temporal) y los costos deben modelarse al precio al que realmente podrías haber operado, no al precio medio. Un modelo entrenado sin esa disciplina no mide habilidad: mide su propia capacidad de espiar.",
      ],
      example:
        "Supongamos que etiquetas cada barra horaria con 1 si el rendimiento de la hora siguiente es positivo y le das al modelo una variable llamada \"volatilidad de esta barra\", pero por accidente calculas esa volatilidad a partir del máximo y el mínimo de la barra que intentas predecir. El máximo y el mínimo solo se conocen una vez terminada la hora. El modelo aprende una regla casi perfecta, la curva de capital del backtest se dispara, y en vivo falla al instante: el número de volatilidad que necesita sencillamente aún no está disponible en el momento en que debe decidir. Eso es el sesgo de anticipación escondido dentro de una variable de apariencia inocente.",
    },
    {
      id: "c36-l2",
      title: "¿Qué es el sobreajuste y por qué a veces una estrategia con buen backtest falla en el trading en vivo?",
      paragraphs: [
        "El sobreajuste ocurre cuando un modelo aprende el ruido de sus datos de entrenamiento en lugar de la señal. Toda serie de precios es en parte estructura real y en parte azar. Un modelo con suficientes parámetros, o una estrategia afinada con suficientes perillas, puede ajustarse a la perfección a las oscilaciones aleatorias de un historial concreto. Entonces produce un backtest precioso —curva de capital suave, Sharpe alto, drawdown minúsculo— que describe el pasado con exquisitez y no predice el futuro en absoluto.",
        "La señal reveladora es la brecha entre el rendimiento dentro de la muestra y fuera de la muestra. Dentro de la muestra (los datos con los que ajustaste) siempre luce bien; eso es lo que hace el ajuste. Lo que importa es fuera de la muestra: datos frescos que el modelo nunca vio, idealmente una ventana temporal posterior. Si la ventaja sobrevive fuera de la muestra y a lo largo de una prueba de avance progresivo —entrenar repetidamente sobre el pasado y validar sobre la siguiente porción intacta—, puede que sea real. Si solo existe dentro de la muestra, ajustaste ruido. Cuidado también con la trampa de las comparaciones múltiples: prueba doscientas combinaciones de parámetros y unas cuantas lucirán maravillosas por pura casualidad, exactamente igual que lanzar suficientes monedas hasta que una caiga diez veces cara.",
        "Incluso una ventaja genuina puede morir al chocar con la realidad por culpa de los costos. Cada ejecución paga algo: el diferencial entre compra y venta, el deslizamiento cuando tu orden mueve el libro, la comisión del 0,30 % del pool AMM en Stellar, más la diminuta comisión de red en XLM. Un backtest ejecutado al precio medio ignora todo esto. Una estrategia que en un backtest sin fricciones deja unos pocos puntos básicos por operación puede quedar rotundamente negativa una vez descontados un diferencial y un deslizamiento realistas: la ventaja era menor que el costo de cosecharla. Peor aún, el costo escala con la frecuencia: una estrategia de mucha rotación paga el diferencial una y otra vez, así que los modelos que lucen más activos en un backtest suelen ser los más frágiles ante la fricción real.",
        "Esto no es una advertencia abstracta específica para Atrium. Su propio banco de investigación halló que una ventaja medida en XLM/USDC era significativa solo con costos muy bajos y desaparecía por completo una vez aplicadas comisiones realistas: un juego de captura de diferencial, no una ventaja duradera. El flujo de trabajo honesto es, por tanto, exigir primero la supervivencia fuera de la muestra, después volver a ejecutar con supuestos de costos pesimistas y creer únicamente en una ventaja que supere ambas vallas. Nada de esto es una promesa de ganancia ni asesoramiento de inversión; es una disciplina para no engañarte a ti mismo.",
      ],
      example:
        "Un caso clásico: se optimiza una estrategia sobre una cuadrícula de longitudes de media móvil con un año de datos de XLM/USDC y el cruce 9/21 muestra un asombroso rendimiento de 4x casi sin drawdown. Llévalo hacia adelante sobre los seis meses siguientes que nunca vio y sangra sin parar. El par 9/21 no capturó un ritmo real del mercado: dio la casualidad de que coincidió con un puñado de vaivenes afortunados de ese año concreto. Añade el diferencial y la comisión AMM de 30bps que realmente habría pagado en cada giro y hasta el resultado dentro de la muestra se vuelve negativo. El backtest medía suerte más cero costos, no una ventaja repetible.",
    },
    {
      id: "c36-l3",
      title: "¿Cuáles son los riesgos éticos del trading con IA?",
      paragraphs: [
        "La automatización escala la intención —incluida la mala intención— mucho más allá de lo que una persona podría hacer a mano. Tácticas de manipulación que son ilegales en los mercados regulados se vuelven trivialmente rápidas cuando las ejecuta un bot: el spoofing (publicar órdenes grandes que nunca piensas ejecutar, para fingir demanda, y luego cancelarlas), el layering o el wash trading (operar contigo mismo para inflar el volumen aparente y atraer a compradores reales). Una IA que descubra que tal táctica es rentable en un backtest la repetirá con gusto miles de veces a menos que una persona se lo prohíba. Hacer esto no solo es poco ético; en muchas jurisdicciones es abuso de mercado, y nada de esto es asesoramiento legal: la cuestión es que automatizar un ardid no blanquea su legalidad.",
        "La velocidad introduce su propio peligro. Cuando muchos participantes automatizados reaccionan a la misma señal en milisegundos, un pequeño choque puede desencadenar en cascada un flash crash: una caída y un rebote violentos y autorreforzados, impulsados por algoritmos que golpean los stops de los demás y retiran liquidez todos a la vez. Ningún actor individual busca el desplome; este emerge de la interacción. El flash crash bursátil de 2010 es el ejemplo canónico, pero la misma dinámica puede aparecer en cualquier plaza con flujo automatizado, incluidos los libros de órdenes delgados en cadena.",
        "El riesgo más profundo es sistémico y proviene de la uniformidad. Si miles de modelos se entrenan con datos parecidos y objetivos parecidos, convergen en posiciones parecidas y actúan igual. Esa correlación es invisible en mercados tranquilos y letal bajo tensión: todos están largos en la misma operación abarrotada, el modelo de riesgo de todos dice \"reducir\" en el mismo umbral, y todos venden contra la misma oferta que se desvanece a la vez. La diversidad de estrategias es un bien público para la estabilidad del mercado; el monocultivo es frágil. Como operador individual no puedes arreglar el sistema, pero sí puedes reconocer que \"la IA dice comprar\" resulta mucho menos reconfortante si todas las demás IA también lo dicen, y puedes dimensionar tus posiciones de modo que un desmontaje masivo no te arruine.",
      ],
      example:
        "Imagina un libro delgado de XLM/USDC donde cincuenta bots comparten una regla: \"si el precio cae un 3 % en un minuto, recorta la posición\". Una venta modesta empuja el precio un 3 % hacia abajo. Los cincuenta disparan a la vez, cada venta arrastra el precio más abajo y vuelve a activar la misma regla para el siguiente bot. En segundos el precio se abre en un salto muy por debajo de su valor justo casi sin noticias reales: un flash crash nacido puramente de la automatización correlacionada. Los bots que hicieron una pausa, o cuya regla era ligeramente distinta, son los que sobrevivieron para comprar la caída.",
    },
    {
      id: "c36-l4",
      title: "¿En qué se diferencia la IA de esta app de un algoritmo de trading general?",
      paragraphs: [
        "Un algoritmo de trading general suele ser una caja negra que opera de forma autónoma: entra la señal, sale la orden, sin explicación y a menudo sin ninguna persona en el circuito. Atrium se basa en el principio opuesto: transparencia y control con la persona en el circuito. La IA es una analista, no un piloto automático. Ella propone; tú dispones.",
        "En concreto, cada idea llega como una propuesta que lleva una puntuación de confianza de 0 a 100, y el backend solo ejecuta automáticamente una propuesta que iguale o supere el umbral que tú fijes. Por debajo de tu umbral, nada ocurre sin ti. Este circuito de proponer y luego aprobar está envuelto en límites estrictos que la IA no puede anular: un tope de trading y una compuerta de pausa por drawdown que detiene la actividad cuando las pérdidas rebasan un nivel establecido. La IA puede querer operar; no puede exceder las barreras de protección que tú configuraste.",
        "También das forma a su comportamiento mediante seis factores de riesgo independientes, cada uno fijado en LOW, MED o HIGH: Tamaño de la posición, Distancia del stop-loss, Tolerancia al drawdown, Frecuencia de operación, Tolerancia a la volatilidad del activo y Tolerancia al deslizamiento. Estos no son cosméticos: se entretejen en los límites efectivos que impone el motor de políticas y en el prompt con el que razona la analista, de modo que un perfil conservador produce de verdad operaciones más pequeñas, más raras y con stops más ceñidos. Todo lo que decide la IA queda registrado: la subpestaña AI Log dentro de la pestaña Logs anota cada propuesta con filtros, exportación a CSV y paginación, para que puedas auditar por qué actuó en lugar de confiar en una caja negra silenciosa.",
        "Este capítulo se mantiene deliberadamente en el plano de los principios. La mecánica vive en otras partes de la Academia: el capítulo \"Inmersión profunda en el trading con IA\" recorre de principio a fin cómo forma y puntúa la analista una propuesta, y el capítulo \"Ajustes de riesgo de la IA: control total\" cubre cada uno de los seis factores y exactamente cómo acotan el comportamiento de la IA. Si quieres el cómo, acude allí; aquí solo necesitamos el porqué: un diseño transparente, acotado y aprobado por una persona es lo que te permite tanto confiar en la IA como dudar de ella de manera intencionada.",
      ],
      example:
        "Digamos que la analista propone comprar XLM con una confianza de 62 mientras tu umbral de autoejecución es 75. En un algoritmo de caja negra esa operación simplemente se dispararía. En Atrium no se ejecuta nada: la propuesta espera tu aprobación, e incluso si la apruebas, la compuerta de pausa por drawdown y el tope de trading siguen aplicándose. La propuesta, su puntuación y tu decisión aterrizan todas en el AI Log, así que una semana después puedes filtrarla, exportar la fila y ver exactamente por qué se sugirió la operación y qué elegiste hacer.",
    },
    {
      id: "c36-l5",
      title: "¿Cuándo deberías apagar la IA?",
      paragraphs: [
        "La única regla que hay detrás de todas las señales concretas es esta: apaga la IA cuando las condiciones se salgan del rango con el que se entrenó el modelo. Un modelo solo es fiable dentro de la distribución de datos de la que aprendió. Empújalo a un terreno que nunca ha visto y su puntuación de confianza pierde todo sentido: puede estar sumamente confiado y completamente equivocado, porque está extrapolando en lugar de reconocer.",
        "La volatilidad extrema es la primera bandera. Cuando el precio de un token oscila mucho más allá de su rango histórico, las relaciones estadísticas que el modelo aprendió ya no describen lo que está ocurriendo. La iliquidez es la segunda: en un libro delgado o un pool AMM poco profundo, el deslizamiento en la ejecución puede empequeñecer cualquier ventaja, y los precios de ejecución que el modelo supone se vuelven ficción. Los choques de noticias son el tercero: una pérdida de paridad, un emisor que desaparece, la suspensión de un exchange, un titular regulatorio. Estos son precisamente los eventos ausentes de los suaves datos históricos de entrenamiento, y rompen las correlaciones al instante. Cuando algo genuinamente nuevo golpea la cinta, el juicio de una persona sobre el contexto le gana al reconocimiento de patrones de un modelo.",
        "También hay un sistema de alerta temprana de comportamiento integrado en la propia app. Si notas una serie de propuestas rechazadas por el motor de políticas, o que fallan repetidamente al ejecutarse, o que la analista produce ideas de baja confianza como nunca solía hacer, trátalo como el modelo diciéndote que está desconcertado. Las subpestañas AI Log y Trade History hacen visible ese patrón. La jugada práctica es cambiar a manual: baja por debajo del umbral de autoejecución o desactiva la autoejecución por completo, reduce el tamaño y usa la pestaña Trading manual con una tolerancia al deslizamiento sensata hasta que las condiciones vuelvan a algo que el modelo realmente haya visto antes. Apagar la IA no es un fracaso de la herramienta: es usarla con criterio, y es la misma disciplina que ampliar tus propios stops cuando tienes dudas.",
      ],
      example:
        "Una stablecoin que tienes empieza a tambalearse fuera de su paridad de la noche a la mañana y los precios cotizados en USDC se vuelven un caos; el libro de órdenes se adelgaza a medida que los creadores de mercado se retiran. Tu IA sigue disparando propuestas, varias son rechazadas por la compuerta de drawdown, y las que pasan son de baja confianza. Esa combinación —una ruptura de régimen impulsada por noticias, liquidez que se derrumba y un grupo de propuestas rechazadas o fallidas en el AI Log— es el momento de manual para desactivar la autoejecución, reducir el tamaño y operar a mano hasta que se resuelva la pérdida de paridad y el mercado vuelva a ser legible.",
    },
  ],
  quiz: [
    {
      id: "c36-q1",
      prompt: "Una variable en el instante T de tu modelo se calcula usando el precio de cierre de la barra en el instante T, que solo se conoce una vez que esa barra ha terminado. El backtest luce espectacular pero los resultados en vivo se desploman. ¿Qué ocurrió?",
      options: [
        {
          text: "Sesgo de anticipación: la variable usó información que aún no estaba disponible en el punto de decisión, así que el modelo estaba efectivamente espiando el futuro.",
          explanation:
            "Correcto. Usar datos conocibles solo en T o después para tomar la decisión en T permite al modelo \"hacer trampa\" en el backtest. En vivo, esos datos futuros aún no existen, así que la ventaja aparente se desvanece al chocar con la realidad.",
        },
        {
          text: "Cambio de régimen: el mercado simplemente se comportó de otra manera en el período en vivo.",
          explanation:
            "El cambio de régimen es real, pero no es lo que se describe aquí. El problema es estructural —una variable que espía datos futuros— e inflaría el backtest incluso en el mismo período. El fallo en vivo es instantáneo, no una deriva gradual de régimen.",
        },
        {
          text: "Sobreajuste: el modelo memorizó ruido a lo largo de demasiados parámetros.",
          explanation:
            "El sobreajuste es un fallo distinto. Aquí la cuestión es una filtración temporal en una sola variable, no un modelo demasiado flexible ajustándose al azar. Incluso un modelo simple luciría estupendo con esta filtración y fallaría en vivo.",
        },
        {
          text: "Basura de entrada: los precios de entrenamiento estaban mal o corruptos.",
          explanation:
            "Los precios pueden estar perfectamente limpios. El defecto es que un precio correcto se usa en un momento en el que aún no podía conocerse: una filtración de tiempo, no datos malos.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c36-q2",
      prompt: "Tienes una estrategia con una preciosa curva de capital en el backtest. ¿Qué comprobación distingue mejor una ventaja real de un ajuste a la curva?",
      options: [
        {
          text: "Confirmar que el backtest usó el precio medio para que los resultados queden limpios de ruido.",
          explanation:
            "Al revés. Usar el precio medio esconde costos reales como el diferencial, el deslizamiento y la comisión AMM del 0,30 %, lo que embellece los resultados. Quieres los costos modelados al precio al que realmente podrías operar, no eliminados.",
        },
        {
          text: "Comprobar que el rendimiento dentro de la muestra sea lo más alto posible.",
          explanation:
            "El rendimiento dentro de la muestra siempre es alto: eso es lo que hace el ajuste. Un gran resultado dentro de la muestra no te dice nada sobre si la ventaja es real; es la comprobación menos informativa.",
        },
        {
          text: "Probarla fuera de la muestra sobre datos posteriores que el modelo nunca vio, idealmente con un procedimiento de avance progresivo.",
          explanation:
            "Correcto. Una ventaja que sobrevive sobre datos frescos, cronológicamente posteriores y que nunca entrenó —de forma repetida, mediante avance progresivo— tiene muchas más probabilidades de ser real. Si solo existe dentro de la muestra, ajustaste ruido.",
        },
        {
          text: "Probar muchas más combinaciones de parámetros y quedarte con la que mejor luzca.",
          explanation:
            "Esto empeora el sobreajuste. Probar cientos de combinaciones garantiza que algunas luzcan maravillosas por pura casualidad —la trampa de las comparaciones múltiples—, no que alguna sea una ventaja genuina.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c36-q3",
      prompt: "Cincuenta bots en un libro delgado de XLM/USDC comparten la regla \"recorta la posición si el precio cae un 3 % en un minuto\". Una venta modesta inclina el precio un 3 % hacia abajo y en segundos el precio se abre en un salto muy por debajo del valor justo. ¿Qué ilustra esto?",
      options: [
        {
          text: "Un único manipulador haciendo spoofing en el libro de órdenes.",
          explanation:
            "Aquí nadie coloca órdenes falsas. La cascada emerge de muchos bots honestos reaccionando al mismo disparador real a la vez: un efecto emergente, no la manipulación de un solo actor.",
        },
        {
          text: "Un flash crash impulsado por la automatización correlacionada y la uniformidad sistémica.",
          explanation:
            "Correcto. Cuando muchos modelos actúan igual, un pequeño choque los activa a todos de forma simultánea, cada venta impulsa la siguiente, retirando liquidez y abriendo el precio en un salto. Nadie busca el desplome; emerge del comportamiento correlacionado en un libro delgado.",
        },
        {
          text: "Aversión a la pérdida que lleva a las personas a vender presas del pánico en el fondo.",
          explanation:
            "Esto trata de reglas automatizadas disparándose en milisegundos, no de una respuesta emocional humana. La aversión a la pérdida es un concepto de psicología; el mecanismo aquí es la ejecución algorítmica correlacionada.",
        },
        {
          text: "Sesgo de anticipación en los datos de entrenamiento de los bots.",
          explanation:
            "El sesgo de anticipación es un defecto de backtesting sobre datos futuros que se filtran en las variables. No tiene nada que ver con bots en vivo golpeando de forma síncrona la misma regla de stop y encadenando el precio.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c36-q4",
      prompt: "La analista propone comprar XLM con una puntuación de confianza de 62, pero tu umbral de autoejecución es 75. En Atrium, ¿qué ocurre?",
      options: [
        {
          text: "La operación se dispara automáticamente, porque la IA generó una propuesta.",
          explanation:
            "Así se comporta un piloto automático de caja negra, no Atrium. Una propuesta por debajo de tu umbral no se ejecuta automáticamente: el diseño con la persona en el circuito implica que nada ocurre sin tu aprobación.",
        },
        {
          text: "Nada se ejecuta automáticamente; la propuesta te espera, y aun tras la aprobación siguen aplicándose la compuerta de drawdown y el tope de trading.",
          explanation:
            "Correcto. El backend solo ejecuta automáticamente al igualar o superar tu umbral. Por debajo, la propuesta es solo un consejo que puedes aprobar o ignorar, y los topes estrictos y la compuerta de pausa por drawdown permanecen vigentes en todo caso.",
        },
        {
          text: "La IA eleva su propia confianza a 75 para que la operación pueda proceder.",
          explanation:
            "La IA no puede reescribir su puntuación para superar tu umbral. El umbral es una barrera de protección que tú controlas; el propósito mismo del diseño es que la IA no pueda anular los límites que fijaste.",
        },
        {
          text: "Los seis factores de riesgo se ignoran porque la confianza está por debajo del umbral.",
          explanation:
            "Los factores de riesgo no se omiten: dan forma continuamente a los límites efectivos y al razonamiento de la analista. Una puntuación por debajo del umbral solo significa que no hay autoejecución, no que las barreras de protección se apaguen.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c36-q5",
      prompt: "Una stablecoin que operas empieza a perder su paridad de la noche a la mañana, el libro de órdenes se adelgaza y tu AI Log muestra un grupo de propuestas rechazadas y de baja confianza. ¿Cuál es la jugada sensata?",
      options: [
        {
          text: "Subir un poco tu umbral de autoejecución y dejar que la IA siga operando a través de él.",
          explanation:
            "Un retoque al umbral no arregla el problema de fondo: las condiciones están fuera del rango entrenado del modelo. Las puntuaciones de confianza no son fiables en este régimen, así que apoyarse en ellas —incluso con una valla más alta— es confianza mal puesta.",
        },
        {
          text: "Confiar en la propuesta de mayor confianza, ya que la confianza es más alta justo cuando el modelo está más seguro.",
          explanation:
            "Una puntuación de confianza solo tiene sentido dentro de la distribución de datos de la que aprendió el modelo. Durante una pérdida de paridad el modelo extrapola hacia un terreno no visto, donde puede estar confiadamente equivocado. Aquí una confianza alta no es tranquilizadora.",
        },
        {
          text: "Desactivar la autoejecución, reducir el tamaño y operar de forma manual hasta que se resuelva la pérdida de paridad y el mercado vuelva a ser legible.",
          explanation:
            "Correcto. Una ruptura de régimen impulsada por noticias, más una liquidez que se derrumba, más una serie de propuestas rechazadas o fallidas es la señal de manual de que las condiciones están fuera del rango del modelo. Cambiar a manual y reducir el tamaño es usar la herramienta con criterio, no abandonarla.",
        },
        {
          text: "No hacer nada distinto: la compuerta de drawdown se encargará de todo por sí sola.",
          explanation:
            "La compuerta de drawdown es un salvavidas que limita las pérdidas, no un sustituto del juicio. Se dispara después de que el daño se acumula; reconocer temprano la ruptura de régimen y pasar a manual evita las pérdidas que la compuerta tendría que absorber de otro modo.",
        },
      ],
      correctIndex: 2,
    },
  ],
};
