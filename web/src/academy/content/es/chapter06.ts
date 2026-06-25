import type { Chapter } from "../../types";

export const chapter06: Chapter = {
  id: "c6",
  number: 6,
  level: "ADVANCED",
  title: "Trailing Stop Loss",
  description:
    "Un stop que sigue al precio hacia arriba para asegurar ganancias pero que nunca baja, y como configurar uno aqui.",
  lessons: [
    {
      id: "c6-l1",
      title: "Que es un trailing stop loss?",
      paragraphs: [
        "Un trailing stop loss es una salida de proteccion cuyo precio de activacion sigue al mercado a tu favor pero nunca en tu contra. En lugar de fijar un solo precio, defines una distancia a seguir, y el bot mantiene la activacion esa distancia por debajo del mejor precio que ha visto.",
        "A medida que el precio sube, la activacion sube con el, ajustandose hacia arriba y protegiendo una mayor parte de tu ganancia. En el momento en que el precio se estanca o retrocede lo suficiente como para tocar la activacion, el stop se dispara y cierra la posicion cruzando el libro para ejecutarse de inmediato, igual que un stop normal.",
        "La app lo dice con claridad en su propio tooltip: un trailing stop sube automaticamente a medida que el precio asciende, asegurando ganancias, pero nunca baja. Tu defines la distancia a seguir, en unidades de precio o en porcentaje. Esto deja correr a los ganadores sin dejar de limitar cuanto de un movimiento devuelves.",
      ],
      example:
        "Tienes XLM comprado cerca de 0.110 USDC. Configuras un trailing stop con un trail del 5 por ciento. Con el mid actual de 0.120 la activacion inicial queda en 0.120 por 0.95, que es 0.114. El precio sube a 0.130, asi que la activacion sube a 0.1235. Si el precio luego retrocede a 0.1235, el stop se dispara y vende, asegurando mucho mas que tu entrada.",
    },
    {
      id: "c6-l2",
      title: "En que se diferencia un trailing stop loss de un stop loss normal?",
      paragraphs: [
        "Un stop loss normal tiene un unico precio de activacion fijo que eliges una vez y que nunca cambia por si solo. Te protege a la baja, pero si el precio sube no hace nada para capturar esa nueva ganancia. Tendrias que cancelar y volver a poner un stop mas alto a mano.",
        "Un trailing stop resuelve eso. Su activacion se calcula a partir de una referencia movil, el mejor precio visto hasta el momento, menos tu distancia de trail. Asi que migra hacia arriba automaticamente a medida que la operacion avanza, y solo hacia arriba. Nunca se deslizara hacia abajo en direccion a tu entrada por si solo.",
        "Ambos stops se comportan de forma identica cuando se disparan: cruzan el libro para ejecutarse ya, aceptando el precio actual para garantizar la salida. La unica diferencia es si la activacion esta congelada, como en un stop normal, o se autoajusta, como en un trailing stop. En el panel de stop loss alternas entre ellos con un interruptor.",
      ],
      example:
        "Dos stops sobre XLM comprado a 0.110. Un stop normal queda fijo en 0.105 para siempre. Un trailing stop puesto 0.005 por debajo del precio arranca en 0.115 cuando el mid es 0.120. El precio sube a 0.140: el stop normal sigue en 0.105 arriesgando toda la ganancia, mientras que la activacion del trailing ha subido a 0.135, asegurando alrededor de 0.025 de ganancia por unidad.",
    },
    {
      id: "c6-l3",
      title: "Que es un high water mark y como funciona?",
      paragraphs: [
        "El high-water mark es el unico numero que hace funcionar al trailing. Para una posicion larga es el precio mas alto que el bot ha observado desde que se creo el stop. Cada nuevo tick se compara con el, y el mark solo se actualiza cuando llega un precio mas alto.",
        "La activacion efectiva siempre se deriva de este mark: high-water mark por (1 menos el porcentaje dividido entre 100) para un trail por porcentaje, o high-water mark menos el monto para un trail por monto. Como el mark solo puede subir, la activacion solo puede subir. Un precio mas bajo nunca reduce el mark, asi que nunca afloja tu proteccion.",
        "En la lista de stops, cada trailing stop muestra una insignia de trailing, la activacion en vivo actual y una columna High-water para que veas el mark y la activacion moverse juntos en tiempo real. Ver esa columna ajustarse hacia arriba es la imagen mas clara de la ganancia asegurandose paso a paso.",
      ],
      example:
        "Trail por monto de 0.004 sobre XLM. El mid es 0.120, asi que el mark es 0.120 y la activacion es 0.116. El precio marca 0.123, 0.121, 0.128: el mark solo sigue los nuevos maximos a 0.123 y luego a 0.128, asi que la activacion sube a 0.119 y luego a 0.124. La caida a 0.121 dejo ambos intactos. La activacion termino en 0.124 y nunca bajo.",
    },
    {
      id: "c6-l4",
      title: "Trail por monto vs trail por porcentaje, cuando usar cada uno?",
      paragraphs: [
        "Cuando eliges Trailing Stop Loss tambien decides como medir la distancia: Trail por porcentaje o Trail por monto. Un trail por porcentaje escala con el precio, asi que la brecha en terminos absolutos crece a medida que el activo se aprecia. Un trail por monto mantiene la misma brecha fija en unidades de precio sin importar a donde vaya el precio.",
        "Los trails por porcentaje van bien con activos que se mueven de forma proporcional y con operaciones que quieres mantener a traves de grandes subidas, porque el margen para respirar se expande con la posicion. Los trails por monto van bien con un riesgo ajustado y bien definido, como un par estable tipo XLM contra USDC, donde piensas en unidades de precio fijas y quieres una distancia predecible.",
        "Elijas el que elijas, la app muestra una vista previa de un Initial stop price a partir del mid actual para que puedas verificar la distancia antes de confirmar. Si esa vista previa queda incomodamente cerca o lejos del precio, ajusta el numero antes de crear el stop.",
      ],
      example:
        "XLM con un mid de 0.120. Un trail del 5 por ciento da una activacion inicial de 0.114, una brecha de 0.006. Un trail por monto de 0.006 da ese mismo 0.114 hoy. Pero si el precio se duplica a 0.240, el trail por porcentaje ahora queda a 0.012 de distancia mientras que el trail por monto sigue a apenas 0.006, mucho mas ajustado al precio mas alto.",
    },
    {
      id: "c6-l5",
      title: "Como configurar un trailing stop loss en esta app (manual y con IA)",
      paragraphs: [
        "Para configurar uno manualmente, abre el panel de stop loss y cambia el interruptor a Trailing Stop Loss. Elige Trail por porcentaje o Trail por monto, introduce la distancia, y lee la vista previa del Initial stop price que la app calcula a partir del mid actual. Cuando la vista previa se vea bien, crea el stop y se sumara a la lista con su insignia de trailing.",
        "Una vez activo, no lo gestionas tick a tick. El bot mantiene el high-water mark por ti y recalcula la activacion en cada actualizacion de precio, asi que las columnas de activacion en vivo y High-water se actualizan solas. Si el precio retrocede hasta la activacion, se dispara y cierra cruzando el libro para ejecutarse ya.",
        "Los trailing stops tambien puede crearlos la IA en lugar de hacerse a mano. Un trailing stop puesto por la IA aparece en la misma lista con la misma insignia de trailing, activacion en vivo y columna High-water, y sigue las reglas de ajuste identicas. Tanto si lo configuras tu como la IA, la mecanica es exactamente la misma.",
      ],
      example:
        "Activas Trailing Stop Loss, eliges Trail por porcentaje e introduces 4. Con el mid en 0.120 el panel muestra una vista previa de un Initial stop price de 0.1152. Lo creas; la lista muestra una insignia de trailing, activacion 0.1152, high-water 0.120. El precio luego alcanza un pico de 0.135, asi que la columna High-water marca 0.135 y la activacion en vivo marca 0.1296.",
    },
  ],
  quiz: [
    {
      id: "c6-q1",
      prompt: "Que describe mejor a un trailing stop loss?",
      options: [
        {
          text: "Una salida de proteccion cuya activacion sigue al precio hacia arriba por una distancia fija pero nunca baja.",
          explanation:
            "Correcto. La activacion sigue al mejor precio por la distancia que elegiste y solo se ajusta hacia arriba, asegurando ganancias.",
        },
        {
          text: "Un precio de activacion fijo que configuras una vez y que nunca cambia.",
          explanation:
            "Eso describe un stop loss normal, no uno con trailing. La activacion de un trailing stop se mueve hacia la ganancia.",
        },
        {
          text: "Una orden que agrega a tu posicion automaticamente a medida que el precio sube.",
          explanation:
            "Un trailing stop nunca compra mas. Es una salida que cierra la posicion cuando el precio retrocede hasta la activacion movil.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c6-q2",
      prompt:
        "Cual es la diferencia clave entre un stop normal y un trailing stop en esta app?",
      options: [
        {
          text: "El stop normal se ejecuta a un precio limite mientras que el trailing stop nunca se ejecuta.",
          explanation:
            "Incorrecto. Ambos stops se disparan cruzando el libro para ejecutarse de inmediato; ninguno queda como limite pasivo al activarse.",
        },
        {
          text: "La activacion del trailing stop se autoajusta hacia arriba mientras que la activacion del stop normal se mantiene fija.",
          explanation:
            "Correcto. Un stop normal mantiene un precio fijo; el trailing stop recalcula su activacion a partir del high-water mark que sube.",
        },
        {
          text: "El trailing stop puede mover su activacion tanto hacia arriba como hacia abajo para seguir al precio.",
          explanation:
            "Incorrecto. La activacion del trailing solo se mueve hacia arriba en direccion a la ganancia; nunca baja.",
        },
        {
          text: "Solo el stop normal puede ser puesto por la IA.",
          explanation:
            "Incorrecto. Los trailing stops pueden configurarse manualmente o por la IA, y aparecen con una insignia de trailing en cualquier caso.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c6-q3",
      prompt:
        "El precio en una posicion larga va a 0.120, luego a 0.130, y despues retrocede a 0.126, con un trail por monto de 0.005. Cual es la activacion tras la caida a 0.126?",
      options: [
        {
          text: "0.121, porque la activacion sigue al ultimo precio de 0.126 hacia abajo.",
          explanation:
            "Incorrecto. El high-water mark no baja, asi que la activacion no baja cuando el precio retrocede.",
        },
        {
          text: "0.125, porque el high-water mark se quedo en 0.130 y 0.130 menos 0.005 es 0.125.",
          explanation:
            "Correcto. El mark se fijo en el maximo de 0.130, asi que la activacion se mantiene en 0.125 aunque el precio baje a 0.126.",
        },
        {
          text: "0.115, porque la activacion siempre esta 0.005 por debajo del precio inicial de 0.120.",
          explanation:
            "Incorrecto. La activacion se mide a partir del high-water mark, que subio a 0.130, no a partir del precio inicial.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c6-q4",
      prompt:
        "Por que podrias preferir un trail por monto sobre un trail por porcentaje en un par estable como XLM contra USDC?",
      options: [
        {
          text: "Porque un trail por monto se ensancha automaticamente a medida que el precio sube.",
          explanation:
            "Incorrecto. Ese es el comportamiento del trail por porcentaje. Un trail por monto mantiene una brecha fija en unidades de precio.",
        },
        {
          text: "Porque un trail por monto desactiva el high-water mark.",
          explanation:
            "Incorrecto. Ambos tipos de trail usan el mismo high-water mark; solo difiere el calculo de la distancia.",
        },
        {
          text: "Porque piensas en unidades de precio fijas y quieres una distancia predecible y constante.",
          explanation:
            "Correcto. Un trail por monto mantiene la misma brecha en unidades de precio sin importar a donde vaya el precio, dando un riesgo ajustado y predecible.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c6-q5",
      prompt:
        "Cuando configuras un trailing stop manualmente en el panel, que muestra la app antes de que lo crees?",
      options: [
        {
          text: "Una vista previa de un Initial stop price calculada a partir del mid actual.",
          explanation:
            "Correcto. Tras activar el trailing e introducir una distancia, la app muestra una vista previa de la activacion inicial a partir del mid actual para que puedas revisarla.",
        },
        {
          text: "Un precio de ejecucion garantizado al que el stop se ejecutara mas adelante.",
          explanation:
            "Incorrecto. Nada esta garantizado; cuando el stop se dispara cruza el libro para ejecutarse al precio vigente en ese momento.",
        },
        {
          text: "El high-water mark final que alcanzara el stop.",
          explanation:
            "Incorrecto. El high-water mark es desconocido de antemano; solo se desarrolla a medida que el precio se mueve despues de crear el stop.",
        },
        {
          text: "Una lista de operaciones pasadas que alcanzaron la misma activacion.",
          explanation:
            "Incorrecto. El panel muestra una vista previa de un initial stop price, no ejecuciones historicas.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
