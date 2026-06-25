import type { Chapter } from "../../types";

export const chapter08: Chapter = {
  id: "c8",
  number: 8,
  level: "ADVANCED",
  title: "Leer el mercado",
  description:
    "Aprende a leer graficos de precio, velas, marcos temporales, volumen y tendencias de liquidez tal como los presenta esta app.",
  lessons: [
    {
      id: "c8-l1",
      title: "Que es un grafico de precio y como se lee?",
      paragraphs: [
        "Un grafico de precio es una imagen de como se movio el precio de un token a lo largo del tiempo. El tiempo avanza de izquierda a derecha, asi que el punto mas antiguo esta a la izquierda y el mas reciente a la derecha. El precio va de abajo hacia arriba, asi que una linea o forma situada mas arriba significa un precio mas alto. Leer un grafico se reduce casi siempre a una sola pregunta: el precio en general esta subiendo, bajando o moviendose de lado en la parte del grafico que estas mirando?",
        "En esta app la vista de detalle del token dibuja el grafico a partir de datos reales de operaciones de Stellar Horizon, agrupados en periodos de tiempo fijos. Cada periodo se convierte en una vela en lugar de un solo punto, lo que mete cuatro precios en una forma en vez de uno solo. Eso te permite ver no solo donde termino el precio, sino cuanto oscilo por el camino.",
        "No leas demasiado en los pequenos vaivenes. Da un paso atras y mira primero la pendiente general, luego acercate al detalle. Un grafico te dice lo que ya paso, no lo que pasara despues, asi que tomalo como evidencia y no como una prediccion.",
      ],
      example:
        "En la vista diaria ves 30 velas diarias. La de mas a la izquierda cierra cerca de 0.118, las velas suben por el medio hasta unos 0.131 y luego las ultimas vuelven a bajar a 0.126. La conclusion es un mes que subio y luego devolvio parte de la ganancia, terminando algo mas arriba de donde empezo.",
    },
    {
      id: "c8-l2",
      title: "Que es una vela (candlestick)?",
      paragraphs: [
        "Una vela resume un periodo de tiempo usando cuatro precios: la apertura, el maximo, el minimo y el cierre. La parte gruesa, llamada cuerpo, se dibuja entre la apertura y el cierre. Las lineas finas de arriba y de abajo, llamadas mechas, llegan hasta el maximo y el minimo que se operaron durante ese periodo.",
        "El color te dice la direccion de un vistazo. Una vela verde o alcista cerro mas arriba de donde abrio, asi que la parte superior del cuerpo es el cierre. Una vela roja o bajista cerro mas abajo de donde abrio, asi que la parte superior del cuerpo es la apertura. Las mechas largas indican que el precio se alejo mucho de la apertura o del cierre antes de asentarse, lo que senala indecision o un movimiento rechazado.",
        "En esta app cada vela tambien lleva el volumen base operado y el numero de operaciones de ese periodo, asi que una vela no es solo forma sino actividad. Lee el cuerpo para ver el movimiento neto y las mechas para ver la pelea que lo produjo.",
      ],
      example:
        "Una sola vela diaria abre en 0.120, baja a un minimo de 0.117, sube hasta un maximo de 0.129 y cierra en 0.127. Se imprime verde porque el cierre supero a la apertura, con una mecha inferior corta hasta 0.117 y una mecha superior que llega a 0.129 por encima del cuerpo, cuya cima esta en 0.127.",
    },
    {
      id: "c8-l3",
      title: "Como usar el grafico por hora / dia / semana / ano en esta app",
      paragraphs: [
        "El grafico de detalle del token tiene un selector de marco temporal con cuatro ajustes, y cada uno reencuadra el mismo token en una ventana distinta. Por hora muestra 24 velas de una hora, asi que cubre aproximadamente el ultimo dia con mucho detalle. Por dia muestra 30 velas diarias, alrededor de un mes. Por semana muestra 52 velas semanales, cerca de un ano de semanas. Por ano muestra 365 velas diarias, mas o menos un ano completo dia a dia.",
        "Elige el marco temporal segun la pregunta. Para lo que esta pasando ahora mismo, usa el de por hora. Para la forma del ultimo mes, usa el diario. Para el recorrido mas largo, usa el semanal o el anual. Un movimiento que parece enorme en el grafico por hora puede ser un pequeno parpadeo cuando cambias al semanal, asi que siempre contrasta una senal de corto plazo con una de plazo mas largo.",
        "Como cada vela se construye a partir de las mismas agregaciones de operaciones de Horizon, las cuatro vistas son consistentes entre si; solo agrupan las operaciones en periodos mas largos o mas cortos. Cambiar de marco temporal nunca cambia los datos de fondo, solo el nivel de zoom con el que los lees.",
      ],
      example:
        "Detectas una caida brusca en el grafico por hora que parece alarmante a lo largo de sus 24 velas. Cambias al semanal, ves 52 velas semanales y notas que esa misma caida es una pequena vela roja dentro de un ano que tendio constantemente al alza. El susto era solo ruido intradia normal.",
    },
    {
      id: "c8-l4",
      title: "Que es un indicador de volumen?",
      paragraphs: [
        "El volumen es cuanto de un token se opero realmente durante un periodo. En esta app cada vela reporta su volumen base y su numero de operaciones, asi que puedes ver si un movimiento de precio ocurrio con mucha actividad o con apenas nada. El volumen responde una pregunta distinta a la del precio: no adonde fue, sino cuanta conviccion habia detras.",
        "La regla general es que el volumen confirma los movimientos. Un salto de precio con volumen al alza es mas fiable porque muchos participantes lo respaldaron. El mismo salto con volumen escaso es sospechoso, ya que una sola orden pequena puede mover un mercado tranquilo sin que eso signifique gran cosa.",
        "Esto le importa al bot directamente. Aplica un filtro de volumen minimo de 24h y rechaza los mercados muy delgados, porque un grafico que parece atractivo pero apenas se opera es una trampa: puede que no logres entrar ni salir al precio que ves. Siempre echa un vistazo al volumen antes de confiar en una vela.",
      ],
      example:
        "Dos tokens subieron ambos un 4 por ciento hoy. El Token A lo hizo con 90,000 de volumen base en 600 operaciones; el Token B lo hizo con 800 de volumen en 5 operaciones. El movimiento del Token A es creible y el bot lo consideraria; el del Token B es ruido en un mercado que el bot rechazaria por demasiado delgado.",
    },
    {
      id: "c8-l5",
      title: "Que es una tendencia de liquidez y por que seguirla?",
      paragraphs: [
        "La liquidez es lo facil que resulta operar un token sin mover su precio. El volumen de un solo dia es una foto fija; una tendencia de liquidez es la direccion hacia la que se dirige esa foto a lo largo del tiempo. El bot ejecuta un escaner de liquidez que ordena los tokens por su volumen de 24h y su numero de operaciones, y luego observa como cada token se mueve dentro de ese ranking.",
        "El escaner reporta dos tendencias por token. La tendencia de ranking puede estar mejorando, cayendo o estable, es decir, el token esta subiendo, resbalando o manteniendo su lugar en el ranking. La tendencia de volumen puede estar creciendo, encogiendo o estable, lo que describe la actividad en bruto en si. Juntas forman la tendencia de liquidez.",
        "Siguela porque la liquidez decide si una estrategia es siquiera ejecutable. Un token con volumen creciente y un ranking que mejora es cada vez mas facil de operar y mas seguro para tomar posicion. Uno que esta encogiendo y cayendo se esta secando, asi que incluso una buena senal de precio ahi es arriesgada porque podrias quedarte atrapado sosteniendolo.",
      ],
      example:
        "Un token esta en la zona media de la tabla pero su tarjeta de escaner muestra tendencia de volumen creciendo y tendencia de ranking mejorando en los escaneos recientes, subiendo del puesto 40 hacia el 25. Esa tendencia de liquidez al alza significa que una entrada hoy es mas facil de cerrar despues de lo que habria sido la misma operacion hace una semana.",
    },
  ],
  quiz: [
    {
      id: "c8-q1",
      prompt: "En un grafico de precio de esta app, que representa avanzar de izquierda a derecha?",
      options: [
        {
          text: "El paso del tiempo, del mas antiguo a la izquierda al mas reciente a la derecha.",
          explanation:
            "Correcto. El eje horizontal es el tiempo, asi que la vela de mas a la derecha es el periodo mas reciente.",
        },
        {
          text: "El precio subiendo, del mas barato a la izquierda al mas caro a la derecha.",
          explanation:
            "Incorrecto. El precio es el eje vertical; el horizontal es el tiempo.",
        },
        {
          text: "El volumen aumentando, del mas tranquilo a la izquierda al mas activo a la derecha.",
          explanation:
            "Incorrecto. El volumen se reporta por vela, no por posicion horizontal.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c8-q2",
      prompt:
        "Una vela abre en 0.120, cierra en 0.127, con un maximo de 0.129 y un minimo de 0.117. Que es cierto?",
      options: [
        {
          text: "Es una vela roja y 0.129 es el cierre.",
          explanation:
            "Incorrecto. El cierre (0.127) esta por encima de la apertura, asi que la vela es verde, y 0.129 es el maximo, no el cierre.",
        },
        {
          text: "Es una vela verde; el cuerpo va de 0.120 a 0.127 y las mechas llegan a 0.129 y 0.117.",
          explanation:
            "Correcto. Un cierre por encima de la apertura la hace verde; el cuerpo abarca de apertura a cierre y las mechas marcan el maximo y el minimo.",
        },
        {
          text: "El cuerpo abarca de 0.117 a 0.129 y no hay mechas.",
          explanation:
            "Incorrecto. El cuerpo va de apertura a cierre (0.120 a 0.127); 0.117 y 0.129 son los extremos de las mechas.",
        },
        {
          text: "Es verde porque el maximo supero a la apertura.",
          explanation:
            "Incorrecto. El color viene del cierre frente a la apertura, no del maximo frente a la apertura.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c8-q3",
      prompt:
        "Quieres evaluar el ultimo mes completo de movimiento de precio de un token. Que marco temporal encaja mejor?",
      options: [
        {
          text: "Por hora, que muestra 24 velas de una hora.",
          explanation:
            "Incorrecto. El de por hora solo cubre alrededor del ultimo dia, no un mes.",
        },
        {
          text: "Por dia, que muestra 30 velas diarias.",
          explanation:
            "Correcto. Treinta velas diarias cubren aproximadamente un mes, que es lo que pide la pregunta.",
        },
        {
          text: "Por ano, que muestra 365 velas diarias.",
          explanation:
            "Incorrecto. El anual cubre un ano completo, mucho mas que el mes por el que se pregunta.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c8-q4",
      prompt: "Por que el bot presta atencion al volumen y no solo al precio?",
      options: [
        {
          text: "Un volumen alto siempre significa que el precio va a seguir subiendo.",
          explanation:
            "Incorrecto. El volumen confirma la conviccion detras de un movimiento, pero no predice la direccion futura.",
        },
        {
          text: "El volumen define el color de cada vela.",
          explanation:
            "Incorrecto. El color de la vela viene del cierre frente a la apertura; el volumen es algo aparte.",
        },
        {
          text: "El volumen confirma si un movimiento es fiable, y los mercados muy delgados se rechazan con un filtro de volumen minimo de 24h.",
          explanation:
            "Correcto. Un movimiento con volumen alto es mas creible, y el bot rechaza los mercados demasiado delgados para entrar o salir de forma fiable.",
        },
        {
          text: "El volumen reemplaza al precio como lo principal que hay que leer en el grafico.",
          explanation:
            "Incorrecto. El volumen complementa al precio; lees ambos, no uno en lugar del otro.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c8-q5",
      prompt:
        "El escaner muestra un token con tendencia de volumen creciendo y tendencia de ranking mejorando. Que te dice esta tendencia de liquidez?",
      options: [
        {
          text: "El token es cada vez mas facil de operar y mas seguro para tomar posicion con el tiempo.",
          explanation:
            "Correcto. Volumen creciente mas un ranking que sube significan liquidez en mejora, asi que entrar y salir despues es cada vez mas facil.",
        },
        {
          text: "El precio del token tiene garantizado que va a subir.",
          explanation:
            "Incorrecto. La tendencia de liquidez describe la facilidad para operar, no la direccion futura del precio.",
        },
        {
          text: "El token se esta secando y conviene evitarlo.",
          explanation:
            "Incorrecto. Eso seria una tendencia de volumen encogiendo y una tendencia de ranking cayendo, lo contrario de este caso.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
