import type { Chapter } from "../../types";

export const chapter11: Chapter = {
  id: "c11",
  number: 11,
  level: "EXPERT",
  title: "Ajustes de riesgo de la IA: control total",
  description: "Inmersion profunda en los seis factores de riesgo independientes, el modo Basico frente al Modo Experto, y como los umbrales numericos exactos moldean cada propuesta de la IA.",
  lessons: [
    {
      id: "c11-l1",
      title: "Que son los factores de riesgo y por que estan separados?",
      paragraphs: [
        "El panel de Ajustes de riesgo vive en la pestana de Trading con Bot y expone seis factores de riesgo independientes: Tamano de posicion, Distancia del stop loss, Frecuencia de operaciones, Tolerancia a la volatilidad del activo, Tolerancia al drawdown y Tolerancia al slippage. Cada uno gobierna un punto distinto del ciclo de vida de la operacion, desde que mercados considera siquiera el escaneo de la cadena, pasando por que tan confiada debe estar la IA, hasta que tan grande puede ser la orden que envia y que tan lejos se situa el stop de proteccion. Son politica, no estrategia: nunca le dicen a la IA que comprar, solo las condiciones bajo las cuales tiene permitido actuar.",
        "La razon de que sean seis diales separados en lugar de un unico control global de riesgo es que un solo nivel de riesgo resulta demasiado tosco para expresar como piensan los traders reales. El apetito de riesgo no es unidimensional. Un trader podria querer stops muy ajustados porque la ventaja reciente es fragil, y aun asi querer una alta frecuencia de operaciones porque la estrategia depende de atrapar muchas pequenas oportunidades de captura de spread. Un unico control forzaria a que los stops ajustados y la baja frecuencia se movieran juntos, que es exactamente el acoplamiento equivocado. Dividir los factores te permite mezclar un ajuste conservador en un eje con uno agresivo en otro, de modo que el bot exprese tu tesis real en lugar de un compromiso.",
        "Cada factor se lee en vivo en el momento de la propuesta, nunca en cache. Cuando cambias un valor, surte efecto en la siguiente propuesta que genere el orquestador, sin reinicio y sin necesidad de esperar a un limite de sesion. Esto importa porque las condiciones del mercado cambian mas rapido de lo que puedes redesplegar, y quieres poder apretar la pausa por drawdown o aflojar el techo de volatilidad a mitad de sesion y que muerda de inmediato.",
        "Cada valor numerico tambien se escribe en el prompt de la IA, y la instantanea numerica completa se registra junto a la propuesta que produjo. Eso te da un historial auditable: para cualquier propuesta historica puedes reconstruir exactamente que seis umbrales estaban en vigor cuando se genero, lo cual es esencial cuando intentas atribuir una operacion omitida o ejecutada a un ajuste concreto en lugar de adivinar.",
      ],
      example: "Crees en la ventaja de captura de spread pero desconfias del seguimiento de tendencia, asi que pones la Frecuencia de operaciones agresiva (confianza minima baja) mientras mantienes la Distancia del stop loss ajustada en 2 por ciento. Un unico control global no podria expresar esa combinacion; seis factores independientes si, y la siguiente propuesta honra ambos a la vez.",
    },
    {
      id: "c11-l2",
      title: "Tamano de posicion: mecanica exacta",
      paragraphs: [
        "En modo Basico el Tamano de posicion es una eleccion de tres pasos LOW, MEDIUM, HIGH. LOW reproduce exactamente el comportamiento conservador actual de la app y es el valor por defecto retrocompatible. Internamente, el modo Basico escala el tope de tamano por orden como un multiplo del tope configurado: LOW es por uno, MEDIUM es por tres y HIGH es por seis. MEDIUM y HIGH solo escalan el riesgo hacia arriba respecto a LOW; no hay forma de que el modo Basico dimensione mas pequeno que la base conservadora.",
        "Activar el interruptor de Modo Experto, etiquetado configurar umbrales numericos exactos, reemplaza los tres pasos con un unico control preciso: Tamano maximo de posicion como porcentaje del saldo disponible. El rango es de 1 a 100 por ciento. Los presets de fabrica son LOW 5, MEDIUM 15 y HIGH 30, pero en Modo Experto escribes cualquier entero dentro del rango. La semantica es porcentaje del saldo disponible, no una cantidad fija de tokens, asi que el tamano absoluto de la orden sigue automaticamente a tu billetera a medida que crece o se reduce. Un ajuste del 10 por ciento sobre un saldo de 400 XLM autoriza una orden de aproximadamente 40 XLM; ese mismo 10 por ciento sobre un saldo de 800 XLM autoriza aproximadamente 80.",
        "El panel muestra una vista previa en vivo para que nunca tengas que hacer esa aritmetica en tu cabeza. Lee tu saldo disponible actual y muestra una linea de la forma: con X XLM disponibles, la orden maxima es de aproximadamente Y XLM. A medida que arrastras o escribes el porcentaje, la vista previa se recalcula al instante, lo que deja claro cuando un porcentaje aparentemente modesto se traduce en una posicion absoluta incomodamente grande sobre un saldo grande.",
        "El Tamano de posicion no actua solo. Hay un tope por operacion de la IA aparte que el orquestador tambien aplica. Si el porcentaje que eliges autorizara una orden mayor que ese tope por operacion, el panel muestra una advertencia para que entiendas que el tamano efectivo se recortara al tope en lugar de a tu porcentaje. En otras palabras, gana el menor de los dos limites, y la advertencia existe para que el recorte nunca sea una sorpresa silenciosa. Lee la vista previa junto con la advertencia: la vista previa te dice lo que pide tu porcentaje, la advertencia te dice cuando el tope de la IA lo anulara.",
      ],
      example: "Pones el Tamano de posicion Experto en 25 por ciento con 600 XLM disponibles. La vista previa en vivo marca aproximadamente 150 XLM. Si el tope por operacion de la IA es 100 XLM, el panel advierte que tu porcentaje supera el tope, y la orden maxima real se recorta a 100 XLM, no 150.",
    },
    {
      id: "c11-l3",
      title: "Distancia del stop loss y Tolerancia al drawdown: mecanica exacta",
      paragraphs: [
        "La Distancia del stop loss define que tan por debajo de la entrada se situa la salida de proteccion. En modo Basico la distancia del stop por defecto se ensancha con el nivel: LOW, MEDIUM y HIGH multiplican el porcentaje de stop configurado por uno, por uno y medio y por dos y medio respectivamente, y en MEDIUM o HIGH tambien se instruye a la IA a preferir un stop dinamico (trailing) en lugar de uno fijo. En Modo Experto eliges el stop directamente de una de dos formas: un porcentaje fijo desde la entrada, con un rango de 0.5 a 20 por ciento y presets 2, 5 y 10; o una cantidad fija desde la entrada expresada en XLM. La opcion de cantidad fija es util cuando razonas en terminos absolutos en lugar de porcentajes.",
        "El panel advierte activamente cuando tu distancia de stop es muy ajustada, porque un stop fijado dentro del spread normal entre compra y venta se disparara solo por ruido. Si colocas un stop del 0.5 por ciento en un mercado cuyo spread de ida y vuelta ya ronda esa anchura, te sacaran de la posicion por el spread antes de que la operacion tenga oportunidad de funcionar. La advertencia esta ahi para evitar que conviertas una herramienta de proteccion en una pequena perdida garantizada.",
        "La Tolerancia al drawdown es un interruptor de seguridad a nivel de cartera, no un control por operacion. En modo Basico LOW pausa el trading de la IA tras una caida del 5 por ciento, MEDIUM tras el 10 por ciento, y HIGH nunca pausa por drawdown. En Modo Experto el control dice: pausar el trading de la IA si la cartera cae X por ciento en 24 horas, con un rango de 1 a 50 por ciento y presets 5, 10 y 25. Tambien hay una casilla Nunca pausar por drawdown, que equivale exactamente a Basico HIGH y desactiva el interruptor por completo.",
        "El detalle de comportamiento crucial es lo que significa pausar. Cuando se rompe el umbral de drawdown de 24 horas, solo se pausan las nuevas entradas de la IA. Las salidas que reducen el riesgo siguen permitidas siempre. Esto es deliberado: un interruptor de seguridad que congelara todo el bot podria atraparte en una posicion perdedora justo cuando las condiciones se deterioran. Al detener nueva exposicion mientras deja abierta la puerta de salida, el interruptor frena el riesgo nuevo sin impedir que el bot te saque de operaciones en las que ya estas.",
      ],
      example: "Pones un stop Experto de porcentaje fijo del 0.6 por ciento en un mercado cuyo spread ronda el 0.5 por ciento. El panel advierte que el stop es muy ajustado. Por separado, con la Tolerancia al drawdown en 10 por ciento, una perdida temprana lleva el cambio de la cartera en 24 horas a menos 11 por ciento: las nuevas entradas se pausan, pero una propuesta para cerrar una posicion perdedora existente aun se ejecuta.",
    },
    {
      id: "c11-l4",
      title: "Frecuencia de operaciones y Tolerancia a la volatilidad del activo: mecanica exacta",
      paragraphs: [
        "La Frecuencia de operaciones se implementa como una compuerta de confianza, porque la forma mas limpia de hacer que el bot opere mas o menos a menudo es cambiar que tan seguro debe estar antes de actuar. La IA califica cada propuesta de 0 a 100. En modo Basico LOW y MEDIUM exigen confianza media o mejor para autoejecutar, HIGH ademas deja pasar propuestas de confianza baja, y el periodo de espera entre entradas tambien se acorta a mayor frecuencia. En Modo Experto el control es explicito: puntuacion minima de confianza de la IA para operar, un numero de 50 a 99 con presets 85, 70 y 55. Fijate en la inversion que confunde a la gente: un umbral mas bajo significa una mayor frecuencia de operaciones, porque mas propuestas superan el liston.",
        "Solo las propuestas en o por encima del umbral se autoejecutan. Cualquiera por debajo no se descarta; se retiene para revision manual, y el motivo se escribe en el registro de forma explicita y atribuible, como por ejemplo: propuesta omitida, confianza 68 menor que el umbral 70. Ese fallo de dos puntos es informacion recuperable. Si ves una racha de omisiones por poco agrupadas justo debajo de tu umbral, tienes evidencia directa de que bajar el umbral unos puntos habria admitido operaciones reales, y el registro te permite tomar esa decision con datos en lugar de con intuicion.",
        "La Tolerancia a la volatilidad del activo filtra que mercados considerara siquiera el escaneo de la cadena, antes de que exista cualquier propuesta. En modo Basico MEDIUM y HIGH relajan las compuertas de liquidez de volumen de 24 horas y de spread de entrada para que los mercados mas finos se vuelvan elegibles. En Modo Experto el control es un techo rigido: oscilacion de precio maxima aceptada en 24 horas por ciento, con rango de 1 a 50 y presets 5, 15 y 30. Cualquier token cuyo cambio de precio absoluto en 24 horas supere el techo es omitido por el escaneo y nombrado en el registro de mercados excluidos, para que puedas ver exactamente que candidatos se filtraron y por que.",
        "Estos dos factores operan en etapas distintas y se componen de forma limpia. La Tolerancia a la volatilidad del activo es una compuerta aguas arriba sobre el universo de mercados operables; la Frecuencia de operaciones es una compuerta aguas abajo sobre la confianza de las propuestas dentro de los mercados que sobrevivieron. Un techo de volatilidad bajo puede dejar sin candidatos a un ajuste de alta frecuencia de confianza, porque simplemente hay menos que calificar. Cuando el bot esta mas tranquilo de lo que esperas, revisa primero el registro de mercados excluidos para ver si el techo de volatilidad, y no el umbral de confianza, es la restriccion que ata.",
      ],
      example: "Pones la Frecuencia de operaciones Experta en una confianza minima de 70 y la Tolerancia a la volatilidad del activo en 5 por ciento. Un token que oscila 8 por ciento en 24 horas nunca llega a la etapa de calificacion y aparece en el registro de mercados excluidos. Una propuesta distinta si se califica en 68 y se retiene, registrada como propuesta omitida, confianza 68 menor que el umbral 70.",
    },
    {
      id: "c11-l5",
      title: "Tolerancia al slippage y combinar factores: estrategia avanzada",
      paragraphs: [
        "La Tolerancia al slippage es la ultima compuerta antes de la ejecucion y protege la calidad de la ejecucion. En Modo Experto el control es slippage maximo aceptado por ciento, con rango de 0.1 a 10 y presets 0.5, 1.5 y 3. Una propuesta cuyo slippage esperado supere el techo se bloquea sin mas. Este es el factor que mas directamente defiende la tesis de captura de spread: si tu ventaja es de solo unos pocos puntos basicos, una ejecucion que cede mas que eso en slippage convierte una configuracion ganadora en una perdedora. Pon esto demasiado holgado en libros finos y pagas la misma ventaja que la estrategia intenta cosechar; ponlo demasiado ajustado y las buenas propuestas en pares liquidos aun seran bloqueadas de vez en cuando por un ensanchamiento momentaneo.",
        "Los seis factores comparten dos conceptos rectores. Primero, los presets: Conservador significa operaciones pequenas, stops ajustados, solo alta confianza; Equilibrado significa exposicion moderada en todos los factores; Agresivo significa operaciones mas grandes, stops mas amplios, opera mas a menudo. Seleccionar un preset carga un conjunto coherente de numeros en todos los factores a la vez, y cualquier factor que luego edites a mano cambia el cargador a Personalizado. Segundo, aparece un banner de advertencia HIGH siempre que un solo valor sea mas agresivo que el preset Agresivo, de modo que empujar un dial mas alla del perfil agrupado mas agresivo siempre sea visible en lugar de silencioso.",
        "El sentido de la independencia es la combinacion deliberada, y las combinaciones interactuan de formas que vale la pena razonar. Para operar a menudo pero pequeno y seguro, pon la Frecuencia de operaciones agresiva con un umbral de confianza minima bajo, el Tamano de posicion bajo en un porcentaje pequeno del saldo, y la Distancia del stop loss ajustada. Para cazar unos pocos movimientos de alta conviccion, haz lo inverso: un umbral de confianza alto, un porcentaje de posicion mayor, y un stop mas amplio para que la posicion mas grande no la saque el ruido. Recuerda que las etapas se componen: el techo de volatilidad decide el universo, el umbral de confianza decide que propuestas sobreviven, el tamano de posicion y el slippage deciden la orden final, y la tolerancia al drawdown puede pausar nuevas entradas por encima de todo ello.",
        "Por ultimo, todo el sistema es retrocompatible. Con el interruptor de Modo Experto apagado, cada factor se comporta exactamente como lo hacian antes los niveles Basicos LOW, MEDIUM, HIGH, y LOW sigue siendo la base conservadora que reproduce el comportamiento original de la app. El Modo Experto es precision puramente aditiva: te permite nombrar umbrales exactos, ver vistas previas y advertencias en vivo, y que la instantanea numerica completa se registre con cada propuesta, sin cambiar los valores por defecto seguros a los que vuelves cuando el interruptor esta apagado. Cambia un factor a la vez y lee los registros para que puedas atribuir cada cambio de comportamiento al dial que moviste.",
      ],
      example: "Quieres operaciones frecuentes, pequenas y con stops ajustados. Pones la Frecuencia de operaciones en una confianza minima de 55, el Tamano de posicion en 5 por ciento del saldo, la Distancia del stop loss en 2 por ciento, y dejas la Tolerancia al slippage en 0.5 por ciento. El bot propone a menudo, dimensiona cada orden con modestia, sale rapido cuando se equivoca, y bloquea cualquier ejecucion que cederia mas de medio por ciento.",
    },
  ],
  quiz: [
    {
      id: "c11-q1",
      prompt: "Por que hay seis factores de riesgo independientes en lugar de un unico control global de riesgo?",
      options: [
        { text: "Un solo nivel de riesgo es demasiado tosco; los factores independientes te permiten mezclar ajustes, como stops ajustados con alta frecuencia de operaciones, que un control global forzaria a moverse juntos.", explanation: "Correcto. El apetito de riesgo no es unidimensional, asi que dividir los factores deja que un eje sea conservador mientras otro es agresivo, expresando tu tesis real." },
        { text: "Se requieren seis diales solo porque la IA no puede leer un unico numero del prompt.", explanation: "Incorrecto. La IA recibe cada valor numerico en el prompt sin importar la cantidad; la separacion es por expresividad, no por una limitacion del prompt." },
        { text: "Cada factor controla una app totalmente ajena, y solo coinciden en compartir un panel.", explanation: "Incorrecto. Los seis gobiernan el mismo ciclo de vida de la operacion para este bot; son diales separados en un solo sistema, no apps separadas." },
      ],
      correctIndex: 0,
    },
    {
      id: "c11-q2",
      prompt: "En Modo Experto, que controla realmente el factor Tamano de posicion, y como interactua con el tope por operacion de la IA?",
      options: [
        { text: "Fija una cantidad fija de tokens por orden que siempre anula el tope por operacion de la IA.", explanation: "Incorrecto. El Tamano de posicion Experto es un porcentaje del saldo, no una cantidad fija, y no anula el tope; gana el limite menor." },
        { text: "Fija la puntuacion maxima de confianza, y el tope se ignora.", explanation: "Incorrecto. La confianza es el factor de Frecuencia de operaciones; el Tamano de posicion gobierna el tamano de la orden como porcentaje del saldo disponible." },
        { text: "Fija el tamano maximo de posicion como porcentaje del saldo disponible; si ese porcentaje superara el tope por operacion de la IA, el panel advierte y la orden se recorta al tope.", explanation: "Correcto. El porcentaje sigue tu saldo via la vista previa en vivo, y el menor entre el tamano derivado del porcentaje y el tope por operacion es lo que realmente se ejecuta." },
        { text: "Solo cambia el color del boton de orden y no tiene efecto en el tamano.", explanation: "Incorrecto. Determina directamente el tamano de orden autorizado como porcentaje del saldo, mostrado en la vista previa en vivo." },
      ],
      correctIndex: 2,
    },
    {
      id: "c11-q3",
      prompt: "Pones la Frecuencia de operaciones en Modo Experto en una confianza minima de 70. La IA califica una propuesta en 68. Que ocurre?",
      options: [
        { text: "La propuesta se autoejecuta porque 68 esta bastante cerca de 70.", explanation: "Incorrecto. El umbral es una compuerta rigida; solo las propuestas en o por encima de 70 se autoejecutan, y 68 esta por debajo." },
        { text: "La propuesta se elimina permanentemente y nunca se registra.", explanation: "Incorrecto. Las propuestas por debajo del umbral se retienen para revision manual y el motivo se registra explicitamente, no se eliminan." },
        { text: "La propuesta se retiene para revision manual y el registro anota algo como propuesta omitida, confianza 68 menor que el umbral 70.", explanation: "Correcto. Las propuestas por debajo del umbral se retienen, no se descartan, y la linea de omision atribuible te deja ver los fallos por poco agrupados justo debajo de tu umbral." },
        { text: "Todo el bot se pausa durante 24 horas.", explanation: "Incorrecto. Ese es el interruptor de la Tolerancia al drawdown, no la compuerta de confianza; una sola propuesta por debajo del umbral solo hace que esa propuesta se retenga." },
      ],
      correctIndex: 2,
    },
    {
      id: "c11-q4",
      prompt: "Quieres que la IA opere a menudo pero con posiciones pequenas y stops loss ajustados. Que ajustes Expertos encajan?",
      options: [
        { text: "Alta Frecuencia de operaciones via un umbral de confianza minima bajo, un porcentaje de Tamano de posicion bajo, y una Distancia del stop loss pequena.", explanation: "Correcto. Un umbral de confianza bajo admite mas propuestas (mayor frecuencia), un porcentaje bajo mantiene pequena cada orden, y un stop ajustado limita la perdida por operacion." },
        { text: "Un umbral de confianza minima alto, un porcentaje de Tamano de posicion alto, y una Distancia del stop loss amplia.", explanation: "Incorrecto. Ese es el perfil de alta conviccion: operaciones menos frecuentes, mas grandes y con stops mas amplios, lo opuesto a a menudo, pequenas y ajustadas." },
        { text: "Nunca pausar por drawdown, slippage maximo, y un stop de cantidad fija grande.", explanation: "Incorrecto. Ninguno de estos controla la frecuencia de operaciones ni mantiene pequenas las posiciones; abordan el drawdown, la calidad de ejecucion y la colocacion del stop en la direccion equivocada." },
        { text: "Solo un techo de Volatilidad del activo bajo, dejando todos los demas factores en su valor por defecto.", explanation: "Incorrecto. Un techo de volatilidad bajo encoge el universo de candidatos en lugar de aumentar la frecuencia, y no hace nada por mantener pequenas las posiciones ni ajustados los stops." },
      ],
      correctIndex: 0,
    },
    {
      id: "c11-q5",
      prompt: "Como se comporta el interruptor de Tolerancia al drawdown una vez que se rompe el umbral de 24 horas, y como se relaciona la opcion de nunca pausar con el modo Basico?",
      options: [
        { text: "Congela todo el bot, bloqueando tanto las nuevas entradas como las salidas hasta el dia siguiente.", explanation: "Incorrecto. Las salidas nunca se bloquean; congelar todo podria atraparte en una posicion perdedora, algo que el diseno evita especificamente." },
        { text: "Pausa solo las nuevas entradas de la IA mientras las salidas que reducen el riesgo siguen permitidas siempre, y la casilla Nunca pausar por drawdown equivale a Basico HIGH.", explanation: "Correcto. El interruptor frena la exposicion nueva sin impedir las salidas, y marcar nunca pausar equivale al nivel Basico HIGH que desactiva el interruptor." },
        { text: "Duplica el tamano de posicion para recuperar el drawdown mas rapido.", explanation: "Incorrecto. Eso es comportamiento martingala; el interruptor reduce el riesgo nuevo en lugar de aumentarlo." },
        { text: "Afloja el techo de slippage para que se ejecuten mas operaciones.", explanation: "Incorrecto. La Tolerancia al drawdown pausa las nuevas entradas; no toca la Tolerancia al slippage, que es un factor aparte." },
      ],
      correctIndex: 1,
    },
  ],
};
