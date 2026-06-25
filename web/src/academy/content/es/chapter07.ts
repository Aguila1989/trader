import type { Chapter } from "../../types";

export const chapter07: Chapter = {
  id: "c7",
  number: 7,
  level: "ADVANCED",
  title: "Precio objetivo y precio de invalidacion",
  description: "Define un objetivo de ganancia y un nivel de stop, y aprende como su relacion beneficio/riesgo decide si el bot deja pasar una operacion.",
  lessons: [
    {
      id: "c7-l1",
      title: "Que es un precio objetivo?",
      paragraphs: [
        "Un precio objetivo es el precio al que planeas tomar ganancias. En el formulario de orden de Trading manual, lo defines dentro de la seccion Avanzado, en el campo opcional Precio objetivo. El tooltip de la app lo describe de forma simple: el precio al que quieres tomar ganancias, y el bot cerrara la posicion automaticamente cuando se alcance ese precio.",
        "El objetivo es el lado del beneficio de la operacion. En una compra, se ubica por encima de tu entrada, porque ganas cuando el precio sube hasta alcanzarlo. La distancia desde tu entrada hasta tu objetivo es el beneficio que buscas capturar.",
        "Definir un objetivo convierte una esperanza vaga en una salida concreta. En lugar de mirar el grafico y reaccionar emocionalmente, decides de antemano donde la idea ha dado sus frutos, y el bot actua por ti cuando ese nivel se imprime. Esto mantiene tus salidas disciplinadas y consistentes.",
      ],
      example: "Compras XLM a 0.118 USDC y esperas un movimiento hasta 0.130. Ingresas 0.130 como Precio objetivo. El beneficio que buscas es la distancia desde la entrada hasta el objetivo, 0.130 menos 0.118, es decir 0.012 por unidad. Si el precio llega a 0.130, el bot cierra la posicion y registra esa ganancia por ti, sin que necesites mirar la pantalla.",
    },
    {
      id: "c7-l2",
      title: "Que es un precio de invalidacion?",
      paragraphs: [
        "Un precio de invalidacion es el nivel donde se demuestra que tu idea de operacion estaba equivocada. Lo defines en la misma seccion Avanzado, en el campo opcional Precio de invalidacion. El tooltip de la app lo explica directamente: si el precio baja hasta este nivel, la idea de operacion se considera invalida, y suele usarse para fijar un stop loss.",
        "La invalidacion es el lado del riesgo de la operacion. En una compra, se ubica por debajo de tu entrada, porque la idea falla si el precio cae en lugar de subir. La distancia desde tu entrada hasta tu invalidacion es el riesgo que aceptas si te equivocas.",
        "Nombrar el nivel donde te equivocas es lo que separa una operacion de una apuesta. Una vez que el precio lo atraviesa, aguantar es solo tener esperanza. El monitor vigila tus posiciones abiertas y propone un cierre cuando se rompe el nivel de invalidacion, de modo que la perdida queda limitada al tamano que elegiste de antemano.",
      ],
      example: "Compras XLM a 0.118 USDC. Tu idea depende de que el soporte en 0.114 aguante, asi que ingresas 0.114 como Precio de invalidacion. El riesgo que aceptas es la distancia desde la entrada hasta la invalidacion, 0.118 menos 0.114, es decir 0.004 por unidad. Si el precio baja a 0.114, el soporte ha fallado, la idea es invalida, y el monitor propone cerrar la posicion para frenar las perdidas.",
    },
    {
      id: "c7-l3",
      title: "Como funcionan juntos el precio objetivo y el precio de invalidacion",
      paragraphs: [
        "El objetivo y la invalidacion son las dos mitades de un mismo plan. El objetivo mide tu beneficio, la distancia desde la entrada hasta el. La invalidacion mide tu riesgo, la distancia desde la entrada hacia abajo hasta ella. Dividir el beneficio entre el riesgo da la relacion beneficio/riesgo, el unico numero que te dice si vale la pena tomar una operacion.",
        "El bot impone una relacion beneficio/riesgo minima, que por defecto es 1.2. El beneficio dividido entre el riesgo debe superar ese minimo, o la operacion se bloquea con una violacion de politica. En una compra esto tambien exige que el objetivo este por encima de la entrada y la invalidacion por debajo de la entrada, para que las dos distancias tengan sentido.",
        "Esta verificacion te protege de operaciones desequilibradas en las que arriesgas mucho para ganar poco. Incluso una estrategia que acierta solo la mitad de las veces puede ser rentable si sus ganancias son mayores que sus perdidas, y la relacion es la forma en que el bot garantiza esa proporcion antes de comprometer cualquier capital.",
      ],
      example: "Compras a 0.118, objetivo 0.130, invalidacion 0.114. El beneficio es 0.130 menos 0.118, es decir 0.012. El riesgo es 0.118 menos 0.114, es decir 0.004. La relacion es 0.012 dividido entre 0.004, es decir 3.0, comodamente por encima del minimo de 1.2, asi que la operacion se permite. Si en cambio fijaras el objetivo en 0.1184, el beneficio seria 0.0004 frente a 0.004 de riesgo, una relacion de 0.1, y el bot la bloquearia.",
    },
    {
      id: "c7-l4",
      title: "Como definirlos correctamente para una operacion",
      paragraphs: [
        "Define primero la invalidacion, no el objetivo. Eligela a partir del grafico, en el nivel que realmente demostraria que tu idea estaba equivocada, como justo por debajo de un soporte que esperas que aguante. Anclar el stop a una estructura real, en lugar de a cuanto deseas perder, lo mantiene honesto.",
        "Luego elige un objetivo que un movimiento realista pueda alcanzar de verdad, idealmente cerca de una resistencia o de un maximo previo. Despues calcula el beneficio dividido entre el riesgo y confirma que supera el minimo de 1.2. Si no lo hace, la solucion no es ampliar el objetivo de forma arbitraria, sino encontrar una mejor entrada o una invalidacion mas ajustada que siga siendo valida.",
        "Un error comun es alejar el objetivo solo para pasar la verificacion de la relacion. Eso produce un numero que es poco probable que el mercado alcance. La relacion es un filtro, no una meta; ambos niveles deben seguir siendo precios por los que el mercado pueda operar de forma plausible.",
      ],
      example: "Quieres comprar XLM cerca de 0.118. El soporte esta en 0.115, asi que fijas la invalidacion en 0.115, lo que da 0.003 de riesgo. Para superar el minimo de 1.2 necesitas al menos 0.0036 de beneficio, asi que un objetivo de 0.1216 o superior califica. Ves una resistencia en 0.124, asi que pones el objetivo alli, lo que da 0.006 de beneficio, una relacion de 2.0, una operacion limpia y realista.",
    },
    {
      id: "c7-l5",
      title: "Como usa la IA el precio objetivo y el precio de invalidacion en las propuestas",
      paragraphs: [
        "Cuando el analista de IA genera una propuesta de operacion, no se limita a elegir una direccion. Cada propuesta ya incluye un targetPrice y un invalidationPrice, de modo que la idea llega con su salida de ganancia y su nivel de stop totalmente especificados. El invalidationPrice es el propio stop del analista, el precio al que abandonaria la idea.",
        "Como la propuesta lleva ambos niveles, se le aplica la misma verificacion de beneficio/riesgo. El bot puede confirmar que la idea del analista supera la relacion minima antes de que la propuesta se convierta en una orden ejecutable, aplicando una regla consistente tanto a las operaciones manuales como a las impulsadas por la IA.",
        "Una vez que una posicion esta abierta, el monitor usa el nivel de invalidacion de forma continua. Vigila la posicion abierta y propone un cierre si la posicion rompe su invalidacion, de modo que el stop del analista realmente se aplica en el mercado en lugar de ser solo una sugerencia sobre el papel.",
      ],
      example: "El analista propone comprar XLM a 0.118 con targetPrice 0.128 e invalidationPrice 0.114. El beneficio es 0.010, el riesgo es 0.004, una relacion de 2.5 que supera el minimo de 1.2, asi que la propuesta es valida. La apruebas y la posicion se abre. Mas tarde el precio se desliza hasta 0.114, se rompe la invalidacion, y el monitor propone cerrar la posicion, aplicando el propio stop del analista.",
    },
  ],
  quiz: [
    {
      id: "c7-q1",
      prompt: "En el formulario de Trading manual, que hace el campo Precio objetivo para una posicion de compra?",
      options: [
        { text: "Fija el precio al que quieres tomar ganancias, y el bot cierra la posicion automaticamente cuando se alcanza ese precio.", explanation: "Correcto. Esto coincide exactamente con el tooltip de la app: el objetivo es tu nivel de toma de ganancias y el bot cierra la posicion cuando se alcanza." },
        { text: "Fija el precio por debajo de la entrada donde la idea de operacion se considera invalida.", explanation: "Incorrecto. Eso describe el precio de invalidacion, el nivel de stop por debajo de la entrada, no el objetivo." },
        { text: "Le indica al bot la cantidad maxima de capital a comprometer en la operacion.", explanation: "Incorrecto. El precio objetivo es un nivel de salida, no un ajuste de tamano de posicion ni un limite de capital." },
        { text: "Fija la tolerancia de slippage que aceptara la orden.", explanation: "Incorrecto. El slippage es un asunto aparte; el precio objetivo es puramente tu nivel de salida para tomar ganancias." },
      ],
      correctIndex: 0,
    },
    {
      id: "c7-q2",
      prompt: "Que representa el precio de invalidacion?",
      options: [
        { text: "El precio al que tomas ganancias en una operacion ganadora.", explanation: "Incorrecto. Ese es el precio objetivo; la invalidacion tiene que ver con que la idea falle, no con que tenga exito." },
        { text: "El precio promedio de todas tus operaciones pasadas sobre este token.", explanation: "Incorrecto. La invalidacion es un nivel de stop con vista al futuro para esta operacion, no un promedio historico." },
        { text: "El nivel donde, si el precio baja hasta el, la idea de operacion se considera invalida; suele usarse como stop loss.", explanation: "Correcto. Esta es la definicion del tooltip de la app: alcanzarlo significa que la idea ha fallado, y sirve como tu stop loss." },
      ],
      correctIndex: 2,
    },
    {
      id: "c7-q3",
      prompt: "Compras a 0.120, fijas un objetivo de 0.126 y una invalidacion de 0.114. Con la relacion beneficio/riesgo minima por defecto de 1.2, que ocurre?",
      options: [
        { text: "La operacion se bloquea, porque el beneficio de 0.006 es menor que el riesgo de 0.006.", explanation: "Incorrecto. El beneficio es 0.126 menos 0.120 = 0.006 y el riesgo es 0.120 menos 0.114 = 0.006, asi que son iguales, no menores." },
        { text: "La operacion se bloquea, porque la relacion es 1.0, que no supera el minimo de 1.2.", explanation: "Correcto. El beneficio 0.006 dividido entre el riesgo 0.006 es 1.0, por debajo del minimo de 1.2, asi que el bot la bloquea con una violacion de politica." },
        { text: "La operacion se permite, porque se proporcionaron tanto un objetivo como una invalidacion.", explanation: "Incorrecto. Proporcionar ambos niveles es necesario pero no suficiente; la relacion debe superar el minimo, y 1.0 no lo hace." },
        { text: "La operacion se permite, porque la relacion de 1.0 esta lo bastante cerca de 1.2.", explanation: "Incorrecto. La relacion debe superar el minimo; 1.0 esta por debajo de 1.2 y el bot no la redondea hacia arriba." },
      ],
      correctIndex: 1,
    },
    {
      id: "c7-q4",
      prompt: "Como usa el analista de IA los precios objetivo y de invalidacion?",
      options: [
        { text: "Incluye un targetPrice y un invalidationPrice en cada propuesta, y el monitor propone un cierre si una posicion abierta rompe su invalidacion.", explanation: "Correcto. El analista especifica ambos niveles en cada propuesta, la invalidacion es su stop, y el monitor lo aplica proponiendo un cierre cuando se rompe." },
        { text: "Ignora estos niveles porque solo tienen sentido en las operaciones manuales.", explanation: "Incorrecto. El analista fija ambos niveles por si mismo en cada propuesta; no son exclusivos de las operaciones manuales." },
        { text: "Fija solo un precio objetivo y deja el stop por completo en manos del usuario.", explanation: "Incorrecto. La propuesta incluye un invalidationPrice como el propio stop del analista, no solo un objetivo." },
        { text: "Los usa solo para colorear el grafico y nunca actua sobre ellos.", explanation: "Incorrecto. El monitor propone activamente cerrar una posicion cuando se rompe su nivel de invalidacion, asi que los niveles impulsan acciones." },
      ],
      correctIndex: 0,
    },
  ],
};
