import type { Chapter } from "../../types";

export const chapter05: Chapter = {
  id: "c5",
  number: 5,
  level: "ADVANCED",
  title: "Stop Losses",
  description: "Como un stop loss limita las perdidas, como configurar uno manualmente, como los gestiona la IA y que ocurre en el momento exacto en que se dispara.",
  lessons: [
    {
      id: "c5-l1",
      title: "Que es un stop loss y por que usarlo?",
      paragraphs: [
        "Un stop loss es una salida predefinida. Decides de antemano el peor precio que estas dispuesto a aceptar, y el bot vigila el mercado por ti. En el momento en que el mercado alcanza ese nivel, cierra la posicion para que una perdida pequena nunca crezca en silencio hasta convertirse en una grande. La idea central es quitarle la emocion y el tiempo de reaccion a la decision mientras duermes o estas lejos del panel.",
        "Un stop tiene en cuenta la direccion. Para una posicion larga, es decir cuando realmente tienes el activo, el stop se ubica por debajo del precio actual y se dispara cuando el precio cae hasta el nivel del trigger o lo toca. Esto protege el valor que ya tienes en lugar de perseguir nuevas entradas.",
        "Los stops no son un seguro gratis. Si colocas el trigger demasiado cerca del precio, el ruido normal del mercado te sacara; si lo pones demasiado lejos, asumes una perdida mayor. La app tambien mantiene un porcentaje de stop loss de respaldo como red de seguridad por defecto, asi que incluso una posicion sin proteccion tiene un suelo.",
      ],
      example: "Tienes 1,000 XLM comprados a 0.118 USDC. Configuras un trigger de stop en 0.112 USDC. Mientras XLM se mueve entre 0.118 y 0.114 no pasa nada. Si una caida arrastra el precio hasta 0.112, el stop se dispara y el bot sale, limitando tu perdida a unos 6 USDC en lugar de dejarla bajar hasta 0.100, lo que habria costado alrededor de 18 USDC.",
    },
    {
      id: "c5-l2",
      title: "Como configurar un stop loss en esta app (manual)",
      paragraphs: [
        "Abre el panel de stop loss y usa la seccion de stop losses manuales. Hay un selector entre Stop Loss Regular, un precio de trigger fijo, y Trailing Stop Loss, que sigue al precio hacia arriba y se explica en el siguiente capitulo. Para un stop manual, elige Regular.",
        "Completa los cuatro campos. Elige el token que tienes y el quote contra el que estas valorando, normalmente USDC. Introduce el precio de Trigger, el nivel al que quieres salir. Luego elige cuanto cerrar: Vender todo liquida toda la tenencia, o fija una Cantidad concreta para salir solo en parte y mantener el resto expuesto.",
        "Una vez guardado, el stop aparece en la lista manual con un boton de Cancelar. No hace nada hasta que el precio alcanza el trigger; cancelarlo elimina la proteccion de inmediato. Puedes tener varios stops sobre el mismo par a la vez, por ejemplo un stop parcial mas arriba y un respaldo completo mas abajo.",
      ],
      example: "Tienes 2,000 XLM y quieres proteger la mayor parte. Cambia a Stop Loss Regular, fija el token XLM, el quote USDC, el Trigger en 0.110 y la Cantidad en 1,500 en lugar de Vender todo. Si XLM cae a 0.110 el bot vende 1,500 XLM y conservas 500 XLM todavia en el mercado. El stop aparece entonces en la lista manual, donde puedes Cancelarlo si cambias de opinion.",
    },
    {
      id: "c5-l3",
      title: "Como la IA configura y gestiona los stop losses automaticamente",
      paragraphs: [
        "Ademas de los stops manuales, la IA puede colocar los suyos propios. Estos aparecen en una seccion aparte de stop losses de la IA y, lo mas importante, cada uno lleva una columna de notas que explica el razonamiento de la IA, por ejemplo por que eligio ese nivel de trigger para esa posicion. Nunca te quedas adivinando contra que esta protegiendo un stop automatico.",
        "La IA usa la misma maquinaria que tu. Elige un token, un quote, un trigger y una cantidad, y el resultado es un stop real que se ubica en una lista que puedes leer. La diferencia es que la IA dimensiona el trigger a partir de su propia lectura de la volatilidad y el riesgo, en lugar de un numero que tu escribiste.",
        "Los stops de la IA no quedan fuera de tu alcance. Cada stop de la IA en la lista tiene un boton de Cancelar, igual que uno manual, asi que mantienes el control. Si no estas de acuerdo con el nivel de la IA puedes cancelarlo y poner el tuyo propio, o dejar el stop de la IA en su lugar como una capa extra por debajo del tuyo manual.",
      ],
      example: "Despues de comprar 1,000 XLM a 0.118, la IA anade su propio stop en 0.113 con la nota El fondo del rango de las ultimas 24h ronda 0.114, colocando el stop justo debajo del soporte. Lees ese razonamiento en la columna de notas, coincides en que es sensato y lo dejas. Si la nota hubiera dicho trigger fijado en 0.117, peligrosamente ajustado, podrias hacer clic en Cancelar y reemplazarlo por uno mas amplio que decidas tu.",
    },
    {
      id: "c5-l4",
      title: "Cual es la diferencia entre un stop loss manual y uno de la IA?",
      paragraphs: [
        "Mecanicamente son identicos. Ambos son triggers que tienen en cuenta la direccion, ambos pasan por cada control de seguridad cuando se disparan y ambos aparecen en una lista con un boton de Cancelar. La diferencia esta solo en quien eligio los numeros y en donde se lista el stop.",
        "Un stop manual refleja tu criterio: tu escribiste el trigger y la cantidad, asi que es exactamente tan ajustado o tan holgado como decidiste. Un stop de la IA refleja el criterio del modelo y viene con una justificacion escrita en su columna de notas, algo que un stop manual no tiene. Viven en secciones separadas, stop losses manuales y stop losses de la IA, asi que distingues de un vistazo cual es cual.",
        "Como son independientes, pueden coexistir e incluso solaparse. Usar ambos es un patron habitual: tu stop manual expresa tu limite de riesgo personal, mientras que el stop de la IA actua como una segunda opinion o un respaldo mas profundo. Cancelar uno nunca afecta al otro.",
      ],
      example: "Sobre los mismos 1,000 XLM fijas un stop manual en 0.110 porque esa es tu linea de comodidad. La IA fija de forma independiente su stop en 0.113 con una nota sobre el soporte. Ambos estan en sus propias listas. Si XLM baja, el stop de la IA en 0.113 se dispara primero; si ese se hubiera cancelado, tu stop manual en 0.110 aun atraparia la caida. Cada uno tiene su propio boton de Cancelar.",
    },
    {
      id: "c5-l5",
      title: "Que ocurre cuando se dispara un stop loss, paso a paso",
      paragraphs: [
        "Primero, el monitor de posiciones detecta que el precio de mercado ha cruzado tu trigger. No espera a que cierre una vela; la propia ruptura inicia la salida. El bot envia entonces una orden de cierre agresiva, con un precio que cruza el mejor precio actual para que se ejecute ya. Deliberadamente no se queda esperando de forma pasiva junto a un mercado en caida, porque un mercado en caida dejaria una orden pasiva sin ejecutar mientras las perdidas se acumulan.",
        "Esa orden de cierre sigue siendo una operacion real, asi que pasa por cada control de seguridad: el kill switch, la lista blanca, los limites de slippage y la verificacion previa de saldo. Como cerrar una posicion reduce el riesgo, la salida se autoejecuta de inmediato incluso en el modo de aprobar cada operacion. Un stop nunca se queda varado esperando a que un humano haga clic en aprobar.",
        "Si la liquidez es escasa, la orden puede ejecutarse solo en parte. El resto queda en espera, y el stop puede volver a dispararse para terminar el trabajo, limitado a aproximadamente una vez cada cinco minutos por par para no inundar de ordenes. Lo unico que detiene a un stop es el kill switch, que bloquea todo el trading incluidas las salidas, asi que con el kill switch activado tu stop queda registrado pero no se disparara.",
      ],
      example: "Tu stop sobre 1,000 XLM esta fijado en 0.112. El precio marca 0.1119, cruzandolo. El monitor se dispara y el bot envia una venta cruzada contra el mejor bid actual cerca de 0.1118 para que se ejecute al instante, superando las verificaciones de slippage y saldo. Solo se ejecutan 600 XLM contra los bids disponibles; los otros 400 quedan en espera. Unos cinco minutos despues, con el precio aun por debajo de 0.112, el stop se vuelve a disparar y cierra los 400 restantes.",
    },
  ],
  quiz: [
    {
      id: "c5-q1",
      prompt: "Cual es el proposito principal de un stop loss?",
      options: [
        { text: "Comprar automaticamente mas de un activo cuando su precio sube.", explanation: "Incorrecto. Un stop loss para una posicion larga es una salida que vende, no una orden de compra que suma a una posicion ganadora." },
        { text: "Predefinir una salida que limita una perdida cerrando la posicion una vez que el precio alcanza un nivel elegido.", explanation: "Correcto. El trigger se decide de antemano para que una perdida pequena no crezca en silencio hasta volverse grande, sin que necesites tiempo de reaccion." },
        { text: "Garantizar que siempre vendas al precio mas alto posible.", explanation: "Incorrecto. Un stop protege la parte baja; no captura los maximos y un stop demasiado ajustado puede incluso sacarte durante el ruido normal." },
      ],
      correctIndex: 1,
    },
    {
      id: "c5-q2",
      prompt: "Al configurar un Stop Loss Regular manual, que campos proporcionas?",
      options: [
        { text: "Solo un porcentaje de caida; la app completa todo lo demas.", explanation: "Incorrecto. Un porcentaje fijo es la red de seguridad de respaldo por defecto, no lo que introduces para un stop Regular manual." },
        { text: "Token, Quote, un precio de Trigger, y o bien Vender todo o una Cantidad concreta.", explanation: "Correcto. Eliges el activo y su quote, el nivel del trigger y cuanto cerrar, optando por Vender todo o una Cantidad parcial." },
        { text: "Un precio de compra y un precio de venta que el bot promedia.", explanation: "Incorrecto. Un stop Regular es un unico precio de trigger para una salida, no un par de precios para promediar." },
        { text: "Solo el token; la IA decide el trigger por ti.", explanation: "Incorrecto. Eso describe un stop de la IA. Un stop manual requiere que tu fijes el trigger y la cantidad." },
      ],
      correctIndex: 1,
    },
    {
      id: "c5-q3",
      prompt: "En que se diferencia un stop loss de la IA de uno manual?",
      options: [
        { text: "Los stops de la IA no se pueden cancelar, mientras que los manuales si.", explanation: "Incorrecto. Cada stop de la IA tiene un boton de Cancelar en su lista, igual que un stop manual." },
        { text: "Los stops de la IA se saltan los controles de seguridad que los manuales si deben pasar.", explanation: "Incorrecto. Ambos tipos pasan por cada control de seguridad cuando se disparan; la mecanica es identica." },
        { text: "La IA eligio los numeros y el stop se lista por separado con una columna de notas que muestra su razonamiento.", explanation: "Correcto. Mecanicamente son identicos; la diferencia es quien fijo el trigger y que los stops de la IA llevan una justificacion escrita en su propia seccion." },
      ],
      correctIndex: 2,
    },
    {
      id: "c5-q4",
      prompt: "Cuando se dispara un stop loss, como coloca el bot la orden de cierre?",
      options: [
        { text: "Envia una orden agresiva con un precio que cruza el mejor precio actual para que se ejecute ya.", explanation: "Correcto. El bot no espera de forma pasiva junto a un mercado en caida; cruza el spread para ejecutar de inmediato y limitar la perdida." },
        { text: "Deja una orden pasiva al precio del trigger y espera a un comprador.", explanation: "Incorrecto. Quedarse pasivo en un mercado en caida dejaria la orden sin ejecutar mientras las perdidas se acumulan, que es justo lo que el bot evita." },
        { text: "Cancela la posicion al instante sin enviar ninguna orden al mercado.", explanation: "Incorrecto. Cerrar sigue significando enviar una orden real que se ejecuta contra el libro de ordenes y pasa los controles de seguridad." },
        { text: "Espera a que un humano apruebe la salida antes de hacer nada.", explanation: "Incorrecto. Los cierres que reducen riesgo se autoejecutan de inmediato incluso en el modo de aprobar cada operacion, asi que un stop nunca se queda varado." },
      ],
      correctIndex: 0,
    },
    {
      id: "c5-q5",
      prompt: "Que ocurre con tus stop losses mientras el kill switch esta activado?",
      options: [
        { text: "Los stops se disparan con normalidad porque las salidas estan exentas del kill switch.", explanation: "Incorrecto. El kill switch bloquea todo el trading incluidas las salidas de stop loss, asi que las salidas no estan exentas." },
        { text: "Los stops quedan registrados pero no se disparan, porque el kill switch bloquea todo el trading incluidas las salidas.", explanation: "Correcto. Un kill switch activado detiene cada orden, asi que un trigger cruzado se registra pero no se envia ninguna orden de cierre hasta que lo desactives." },
        { text: "Todos los stops se eliminan permanentemente en el momento en que el kill switch se enciende.", explanation: "Incorrecto. Los stops siguen registrados; simplemente quedan suspendidos hasta que se libere el kill switch." },
      ],
      correctIndex: 1,
    },
  ],
};
