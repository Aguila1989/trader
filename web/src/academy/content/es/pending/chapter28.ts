// PENDING — do not activate until green light.
import type { Chapter } from "../../../types";

export const chapter28: Chapter & { whoFor: string } = {
  id: "c28",
  number: 28,
  level: "ADVANCED",
  whoFor: "Para operadores que quieren leer la estructura directamente en el gráfico",
  title: "Análisis técnico — Patrones de gráfico",
  description:
    "Soportes y resistencias, tendencias, patrones de gráfico clásicos, retrocesos de Fibonacci y cómo aplicarlos en el gráfico de precios de este panel.",
  lessons: [
    {
      id: "c28-l1",
      title: "¿Qué son el soporte y la resistencia?",
      paragraphs: [
        "El soporte y la resistencia son niveles de precio donde el mercado ha cambiado de opinión una y otra vez. Piensa en un suelo y un techo. El soporte es el suelo: un precio al que el mercado no deja de caer, pero que le cuesta romper hacia abajo, porque allí aparecen suficientes compradores. La resistencia es el techo: un precio al que el mercado no deja de subir, pero que le cuesta romper hacia arriba, porque allí aparecen suficientes vendedores. Ambos son la memoria en acción, y marcan los niveles donde las multitudes del pasado decidieron que un precio era barato o caro.",
        "Estos niveles se forman porque los operadores los recuerdan. Si XLM/USDC rebotó tres veces en 0,11, los compradores vigilan un cuarto rebote y los vendedores colocan órdenes justo por encima, de modo que el nivel se refuerza a sí mismo. En el Stellar Decentralized Exchange esto es literal: el libro de órdenes on-chain muestra las ofertas de compra agrupándose cerca del soporte y las de venta cerca de la resistencia, y la profundidad del libro de órdenes forma parte de cómo este panel puntúa la liquidez de un token.",
        "Los niveles no aguantan para siempre. Cuando el precio cierra de forma decidida a través de un suelo o un techo con volumen fuerte, ese nivel se rompe y a menudo intercambia su papel. Una resistencia rota se convierte con frecuencia en un nuevo soporte, y un soporte roto se convierte en una nueva resistencia, porque la multitud vuelve a anclar sus expectativas en el nivel nuevo. Un empujón débil que se revierte enseguida es más probable que sea una ruptura falsa que una genuina, así que esperar la confirmación importa.",
      ],
      example:
        "En la página de detalle del token XLM/USDC, el precio se estanca cerca de 0,12 en tres subidas distintas a lo largo de una semana: eso es resistencia, un techo. En el cuarto intento, una vela cierra limpiamente por encima de 0,12 con un salto en las barras de volumen. Durante los dos días siguientes, el precio vuelve a bajar hasta 0,12 y aguanta. El viejo techo se ha convertido en un suelo: la resistencia pasó a ser soporte, y el nivel que vigilabas sigue importando, solo que con su papel invertido.",
    },
    {
      id: "c28-l2",
      title: "¿Qué es una tendencia y cómo se identifica?",
      paragraphs: [
        "Una tendencia es la dirección general hacia la que el precio va desplazándose, ignorando los pequeños zigzags del camino. La forma limpia de leerla es fijarse en los puntos de giro: los picos y valles locales. Una tendencia alcista forma máximos más altos y mínimos más altos: cada subida rebasa un poco el pico anterior, y cada retroceso se detiene por encima del valle anterior. Una tendencia bajista es la imagen espejo: máximos más bajos y mínimos más bajos, cada rebote fallando antes y cada caída llegando más hondo.",
        "Cuando no se cumple ninguno de los dos patrones —los máximos y los mínimos caen más o menos en el mismo lugar— el mercado se mueve de lado, rebotando entre un soporte y una resistencia horizontales en lugar de tener tendencia. Las tendencias también coexisten en distintas escalas de tiempo a la vez: un token puede estar en una tendencia alcista de varios meses mientras dibuja dentro de ella una tendencia bajista de dos días. Por eso el marco temporal que elijas cambia la respuesta, y por eso alinear tu operación con la tendencia mayor suele ser mejor que combatirla.",
        "Una tendencia está intacta solo hasta que su estructura se rompe. Una tendencia alcista queda en duda en el momento en que el precio forma un mínimo más bajo, superando un valle de giro previo; una tendencia bajista queda en duda cuando el precio forma un máximo más alto. Esa ruptura de estructura es tu señal objetiva de que la dirección podría estar cambiando, en lugar de una corazonada de que ya ha corrido bastante.",
      ],
      example:
        "Al leer XLM/USDC en la vista de semana, trazas los giros: 0,10, de vuelta a 0,09, hasta 0,115, de vuelta a 0,10, hasta 0,13. Cada pico es más alto que el anterior (0,115, luego 0,13) y cada valle también es más alto (0,09, luego 0,10): máximos más altos y mínimos más altos de manual, así que la tendencia es alcista. Si el siguiente retroceso, en cambio, rompiera por debajo de 0,10 para formar un mínimo más bajo, la estructura alcista quedaría en duda y tú apretarías tus supuestos.",
    },
    {
      id: "c28-l3",
      title: "Patrones de gráfico comunes",
      paragraphs: [
        "Los patrones de gráfico son formas recurrentes que insinúan lo que una multitud está a punto de hacer. Un hombro-cabeza-hombro es un patrón de techo: tres picos donde el del medio (la cabeza) es el más alto y los dos exteriores (los hombros) son más bajos y están más o menos al mismo nivel. Una línea trazada bajo los dos valles que hay entre ellos es la línea de cuello. Cuando el precio cierra por debajo de esa línea de cuello, señala que la tendencia alcista probablemente se ha agotado y que puede seguir una caída. Da la vuelta a toda la figura —un mínimo, un mínimo más bajo y luego un mínimo más alto— y tienes un hombro-cabeza-hombro invertido, un patrón de suelo que insinúa un giro al alza.",
        "Un doble techo parece la letra M: el precio sube hasta un máximo, retrocede, sube hasta casi exactamente el mismo máximo y vuelve a fallar. Ese techo rechazado dos veces sugiere que los compradores se han agotado, y una caída por debajo del valle intermedio lo confirma. Un doble suelo es el espejo, una forma de W: dos intentos fallidos de empujar más abajo, insinuando que los vendedores se han agotado y que puede estar empezando una subida. Ambos patrones no son en realidad más que un soporte o una resistencia aguantando dos veces, dibujados como una forma fácil de recordar.",
        "Una bandera es una breve pausa dentro de un movimiento fuerte. Tras una carrera brusca, el precio se desplaza de lado o suavemente en contra del movimiento dentro de un pequeño rectángulo inclinado —la bandera— colgando del empinado movimiento inicial que forma el mástil. Suele resolverse en la dirección del movimiento original, como si el mercado hubiera recuperado el aliento antes de continuar. Ninguna de estas formas es una garantía; son probabilidades que mejoran cuando el volumen y la tendencia más amplia coinciden, y fallan lo bastante a menudo como para que un stop loss siga siendo imprescindible.",
      ],
      example:
        "En la vista de día de un token ves tres picos cerca de 0,14, 0,16 y 0,14: un hombro-cabeza-hombro claro, con la línea de cuello trazada a través de los dos valles en torno a 0,125. El precio cierra entonces por debajo de 0,125 mientras las barras de volumen se hinchan. El patrón se ha activado: la tendencia alcista previa está señalando agotamiento, y un operador que use la pestaña de Trading manual del panel podría colocar un stop loss justo por encima del hombro derecho para acotar el riesgo si la ruptura resulta ser falsa.",
    },
    {
      id: "c28-l4",
      title: "¿Qué son los retrocesos de Fibonacci y cómo se usan?",
      paragraphs: [
        "Tras un movimiento fuerte, el precio rara vez avanza en línea recta: retrocede parte del camino antes de, a veces, reanudarse. Los retrocesos de Fibonacci son un conjunto de niveles horizontales que muchos operadores usan para estimar cuán hondo podría llegar ese retroceso. Anclas la herramienta desde el inicio de un movimiento hasta su final, y esta dibuja líneas en porcentajes fijos de ese rango. Los niveles que más vigilan los operadores son el 38,2 %, el 50 % y el 61,8 %: un retroceso del 38,2 % es una caída superficial, y el 61,8 % es uno profundo que devuelve la mayor parte del movimiento.",
        "La idea es que estos ratios actúan como posible soporte en una tendencia alcista (o resistencia en una bajista), zonas donde un retroceso puede detenerse y la tendencia puede reanudarse. El nivel del 50 % no es realmente un número de Fibonacci, pero se incluye por convención porque los precios devuelven muy a menudo cerca de la mitad de un movimiento. Bien usados, estos niveles son candidatos que vigilar, no órdenes: un lugar donde buscar un rebote, idealmente donde un nivel de Fibonacci coincida con un soporte o una resistencia que ya hayas identificado por tu cuenta.",
        "Ten cuidado de no depender demasiado de ellos. Los niveles de Fibonacci son en parte autocumplidos —funcionan en parte porque suficientes operadores vigilan las mismas líneas— y es fácil trazarlos a partir de puntos de giro elegidos a conveniencia hasta que alguno parezca encajar. Trata como más significativo un nivel que coincida con estructura previa o con un número redondo, confirma siempre con la acción del precio en lugar de comprar a ciegas en una línea, y protege la idea con un stop loss por si el retroceso se convierte en una reversión completa.",
      ],
      example:
        "XLM/USDC sube de 0,10 hasta 0,15, un movimiento de 0,05. Al anclar la herramienta de Fibonacci de 0,10 a 0,15, el nivel del 38,2 % queda cerca de 0,131, el del 50 % cerca de 0,125 y el del 61,8 % cerca de 0,119. El precio retrocede y se estabiliza justo alrededor de 0,125 —el nivel del 50 %—, que además resulta ser una vieja repisa de resistencia del mes pasado. Dos señales independientes apuntando al mismo precio hacen de 0,125 un punto más creíble donde vigilar la reanudación de la tendencia alcista de lo que sería una línea de Fibonacci solitaria.",
    },
    {
      id: "c28-l5",
      title: "Cómo usar el gráfico de precios de este panel para el análisis técnico",
      paragraphs: [
        "La página de detalle del token es donde todo esto se junta. Su gráfico de precios tiene pestañas de hora, día, semana y año, y cada pestaña es una lente distinta sobre el mismo activo. El capítulo Leer el mercado ya cubre cómo funcionan el gráfico en sí y las velas, así que esta lección da por sentado que sabes leerlas y se centra solo en aplicar soportes y resistencias, tendencias y patrones a lo largo de esas cuatro pestañas.",
        "Trabaja de arriba hacia abajo. Empieza en la pestaña de año para ver la tendencia dominante y los principales niveles de soporte y resistencia que han aguantado a largo plazo: los grandes suelos y techos dignos de respeto. Baja a la pestaña de semana para situar los máximos y mínimos de giro que definen la tendencia actual, y luego a la de día para encontrar el patrón que podrías operar, como un doble suelo o una bandera. Por último, usa la pestaña de hora para cronometrar una entrada cerca de un nivel, vigilando una ruptura o un rebote en lugar de adivinar. Lee las barras de volumen en paralelo: una ruptura de soporte o resistencia con volumen creciente es mucho más convincente que una con volumen escaso.",
        "Una vez que el gráfico te indica un nivel, conviértelo en un plan usando las propias herramientas del panel. Un nivel de soporte en el que confíes se convierte en un precio de stop loss en la pestaña de Trading manual; un nivel de resistencia se convierte en un precio objetivo; y la distancia entre tu entrada y tu precio de invalidación es exactamente el ratio de recompensa-riesgo que el panel comprueba antes de dejar pasar una operación. Esto es educación, no asesoramiento financiero: los patrones describen probabilidades, nunca certezas, así que cada lectura sigue necesitando una salida definida.",
      ],
      example:
        "Quieres operar XLM/USDC. En la pestaña de año la tendencia es claramente alcista, con soporte de largo plazo en 0,09. La pestaña de semana muestra máximos más altos y mínimos más altos aún intactos. La pestaña de día dibuja una bandera que pausa tras una subida, y la de hora muestra el precio rebotando en el borde inferior de la bandera en 0,118 con volumen creciente. Compras cerca de 0,118, colocas el stop loss justo debajo, en 0,115 (invalidación), y fijas un objetivo en el máximo previo de 0,14: una lectura construida pestaña a pestaña y luego conectada a las herramientas de stop loss y objetivo del panel.",
    },
  ],
  quiz: [
    {
      id: "c28-q1",
      prompt: "El precio sube repetidamente hasta 0,12 en XLM/USDC, pero no consigue cerrar por encima de ese nivel. ¿Qué papel está desempeñando 0,12 y qué suele ocurrir si el precio por fin cierra de forma decidida por encima?",
      options: [
        {
          text: "Es soporte (un suelo); un cierre por encima significa que el suelo se ha derrumbado.",
          explanation:
            "Los papeles están cambiados. Un nivel por encima del cual el precio no consigue subir es un techo —resistencia—, no un suelo. El soporte es el nivel al que el precio no deja de caer, pero por encima del cual aguanta.",
        },
        {
          text: "Es resistencia (un techo); una vez roto, a menudo se convierte en un nuevo soporte.",
          explanation:
            "Correcto. Un nivel repetidamente rechazado por encima es resistencia. Cuando el precio cierra de forma decidida a través de él, la multitud vuelve a anclarse y el viejo techo actúa con frecuencia como un nuevo suelo en el siguiente retroceso.",
        },
        {
          text: "Es resistencia y, una vez roto, desaparece por completo y ya no vuelve a importar.",
          explanation:
            "Aciertas a medias en la etiqueta, pero fallas en las consecuencias. Una resistencia rota rara vez se esfuma sin más; lo habitual es que intercambie su papel y se convierta en soporte, así que el nivel sigue importando.",
        },
        {
          text: "Es un nivel de Fibonacci, así que no hace falta confirmación ni volumen para operar la ruptura.",
          explanation:
            "No. Este es un nivel de resistencia horizontal corriente, no un retroceso de Fibonacci, y operar cualquier ruptura a ciegas sin volumen ni confirmación es exponerse a quedar atrapado en una ruptura falsa.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c28-q2",
      prompt: "Trazas los puntos de giro en la pestaña de semana y encuentras: 0,10, 0,09, 0,115, 0,10, 0,13. ¿Cómo clasificarías esta tendencia?",
      options: [
        {
          text: "Una tendencia bajista, porque el precio empezó en 0,10 y hubo retrocesos.",
          explanation:
            "Los retrocesos por sí solos no hacen una tendencia bajista. Una tendencia bajista necesita máximos más bajos y mínimos más bajos; aquí los picos (0,115 luego 0,13) y los valles (0,09 luego 0,10) suben ambos.",
        },
        {
          text: "Un rango lateral, porque el precio no deja de rebotar arriba y abajo.",
          explanation:
            "Un rango significa que los máximos y los mínimos caen más o menos en el mismo nivel. Aquí cada máximo y cada mínimo es progresivamente más alto, así que tiene tendencia, no está en rango.",
        },
        {
          text: "Una tendencia alcista, porque los giros muestran máximos más altos (0,115 luego 0,13) y mínimos más altos (0,09 luego 0,10).",
          explanation:
            "Correcto. La estructura que define una tendencia alcista son los máximos más altos y los mínimos más altos, y ambos están presentes aquí, así que la tendencia es alcista hasta que un mínimo más bajo rompa esa estructura.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c28-q3",
      prompt: "En la vista de día ves tres picos —uno más bajo, uno intermedio más alto y luego otro más bajo— con una línea trazada bajo los dos valles que hay entre ellos. El precio cierra entonces por debajo de esa línea con volumen creciente. ¿Qué patrón es este y qué sugiere?",
      options: [
        {
          text: "Un patrón de techo hombro-cabeza-hombro; un cierre por debajo de la línea de cuello señala que la tendencia alcista puede estar agotándose y que podría seguir una caída.",
          explanation:
            "Correcto. Tres picos con una cabeza más alta en el medio y una línea de cuello bajo los valles son un hombro-cabeza-hombro. Cerrar por debajo de la línea de cuello, sobre todo con volumen creciente, es el disparador que advierte de una posible caída.",
        },
        {
          text: "Un doble suelo (forma de W) que señala que los vendedores se han agotado y que es probable una subida.",
          explanation:
            "Forma equivocada. Un doble suelo es una W de dos mínimos fallidos, un patrón de suelo. Tres picos con el del medio más alto son un techo, y aquí el precio rompió a la baja, no al alza.",
        },
        {
          text: "Una bandera alcista, lo que significa que el movimiento previo simplemente continuará al alza tras una breve pausa.",
          explanation:
            "Una bandera es una pequeña pausa lateral que cuelga de un mástil empinado, no tres picos distintos con una línea de cuello. Y una ruptura por debajo de la línea de cuello apunta hacia abajo, lo contrario de una bandera que continúa al alza.",
        },
        {
          text: "Un hombro-cabeza-hombro invertido, un patrón de suelo que insinúa un giro al alza.",
          explanation:
            "Un hombro-cabeza-hombro invertido es esta forma dada la vuelta —un mínimo, un mínimo más bajo y luego un mínimo más alto— y rompe al alza. Lo que se describe aquí es la versión estándar, del derecho, que rompe a la baja.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c28-q4",
      prompt: "Tras una carrera de 0,10 a 0,15, dibujas un retroceso de Fibonacci y el precio se estabiliza cerca del nivel del 61,8 %, que además coincide con una vieja repisa de resistencia. ¿Cómo deberías tratarlo?",
      options: [
        {
          text: "Comprar de inmediato sin stop, porque un nivel de Fibonacci del 61,8 % siempre aguanta.",
          explanation:
            "Ningún nivel aguanta siempre. Un retroceso del 61,8 % es en realidad una caída profunda que devuelve la mayor parte del movimiento, y comprar sin stop te deja desprotegido si el retroceso se convierte en una reversión completa.",
        },
        {
          text: "Tratarlo como una zona más creíble donde vigilar un rebote porque coinciden dos señales independientes, confirmando aun así con el precio y usando un stop loss.",
          explanation:
            "Correcto. Un nivel de Fibonacci es solo un candidato que vigilar, pero su peso crece cuando se solapa con estructura independiente, como una resistencia previa. Aun así confirmas con la acción del precio y proteges la idea con un stop.",
        },
        {
          text: "Ignorarlo, ya que los niveles de Fibonacci no significan nada y nunca influyen en el precio.",
          explanation:
            "Demasiado tajante. Los niveles de Fibonacci son en parte autocumplidos porque muchos operadores vigilan las mismas líneas, así que pueden importar —sobre todo donde se alinean con estructura real— aunque no sean mágicos.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c28-q5",
      prompt: "Quieres aplicar análisis técnico en el gráfico de precios de un token en este panel, que tiene pestañas de hora, día, semana y año. ¿Cuál es el flujo de trabajo más sensato?",
      options: [
        {
          text: "Usar solo la pestaña de hora, ya que el detalle a corto plazo es lo único que importa para cualquier operación.",
          explanation:
            "Trabajar solo en la pestaña de hora es tener anteojeras. Te perderías la tendencia dominante y los principales soportes y resistencias de largo plazo que revelan las pestañas de semana y año, y operarías con facilidad en contra del panorama general.",
        },
        {
          text: "Trabajar de arriba hacia abajo: la pestaña de año para la tendencia dominante y los niveles principales, la de semana para los giros de la tendencia actual, la de día para un patrón y la de hora para cronometrar una entrada, leyendo el volumen en todo momento.",
          explanation:
            "Correcto. Empezar amplio e ir estrechando mantiene tu operación alineada con la tendencia mayor, encuentra un patrón operable y cronometra la entrada cerca de un nivel, con el volumen confirmando cualquier ruptura; luego el nivel se convierte en un stop loss o un objetivo en el panel.",
        },
        {
          text: "Elegir la pestaña que ahora mismo muestre una forma que te guste e ignorar las demás.",
          explanation:
            "Elegir a conveniencia un marco temporal que te favorece es la manera en que los operadores se engañan. Un patrón en la pestaña de día puede apuntar en un sentido mientras la tendencia de año apunta en el otro; las pestañas están pensadas para leerse juntas, de arriba hacia abajo.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
