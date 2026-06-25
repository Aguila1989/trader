import type { Chapter } from "../../types";

export const chapter10: Chapter = {
  id: "c10",
  number: 10,
  level: "EXPERT",
  title: "Trading con IA a fondo",
  description: "Una mirada tecnica a como razona el analista, que contiene una propuesta, cuando aceptarla o rechazarla, como convive con el trading manual y como leer el registro de la IA.",
  lessons: [
    {
      id: "c10-l1",
      title: "Como genera la IA las propuestas de trading: los datos que usa y como razona",
      paragraphs: [
        "La IA de este bot se llama el analista, y es un modelo guiado por herramientas en lugar de un chat. Eliges un proveedor desde el menu desplegable (Anthropic Claude, OpenAI o DeepSeek), y solo se pueden seleccionar los proveedores que tienen una clave API configurada. El analista funciona con tres disparadores: Analizar un solo par, Escanear la cadena a lo largo del universo XLM curado mas algunos pares cruzados, o el temporizador de auto-escaneo si lo tienes activado. No transmite en continuo; cada ejecucion es una solicitud discreta que termina en cero o mas propuestas.",
        "El razonamiento ocurre a traves de llamadas a herramientas, no por adivinanza. El analista consulta get_account_balances para ver tus tenencias y tus ofertas en reposo, get_market para el mejor bid y ask del libro de ordenes mas la profundidad visible, y get_price_history para las velas OHLC junto con indicadores calculados en el servidor. Esos indicadores se calculan en el backend, no por el modelo, de modo que son consistentes entre ejecuciones: rsi14, ema8 frente a ema24, atrPct y realizedVolPct, efficiencyRatio, rangePos de 0 en el minimo a 1 en el maximo, volRatio, flowBuyPct, y una etiqueta de regimen de trending-up, trending-down, ranging o volatile.",
        "Algo crucial: el analista no carece de estado. Recibe un bloque de memoria de trading: el PnL realizado de hoy en XLM, el PnL no realizado de las posiciones abiertas, tus posiciones actuales, y las operaciones recientes cada una anotada con su movimiento porcentual ajustado por lado a mas-1h y a mas-24h. Esos resultados posteriores a la operacion le permiten calificar si las entradas recientes realmente funcionaron en lugar de volver a correr un grafico en el vacio. Tambien se le informa el perfil de riesgo activo y el limite efectivo de tamano por operacion para ese par exacto, asi que la cantidad que propone esta acotada antes incluso de que la politica la vea.",
        "Juntando todo, una sola ejecucion se lee mas o menos asi: obtener tenencias y ofertas, obtener el libro, obtener velas e indicadores, incorporar la memoria de como salieron las ultimas entradas, y luego decidir si el regimen actual y el libro justifican una entrada que la billetera realmente pueda financiar dentro del limite de tamano. Si nada supera ese umbral, el analista no devuelve ninguna propuesta para el par, lo cual es un resultado normal y frecuente.",
      ],
      example: "Una ejecucion de Escanear la cadena en XLM/USDC: get_market devuelve mejor bid 0.1176 y ask 0.1182, get_price_history devuelve regimen ranging con rangePos 0.18, rsi14 41, ema8 cruzando justo por encima de ema24, flowBuyPct 0.61. El bloque de memoria muestra que las ultimas dos compras de caida ganaron mas 0.3 por ciento a mas-1h. El limite por operacion es 50 XLM. El analista emite una propuesta de compra por 40 XLM.",
    },
    {
      id: "c10-l2",
      title: "Dentro de una propuesta de IA: confianza, razonamiento, instantanea de riesgo, precio",
      paragraphs: [
        "Cada propuesta se emite a traves de la herramienta propose_stellar_trade como un objeto estructurado, nunca texto libre, para que el backend pueda actuar sobre ella de forma determinista. El objeto lleva el lado (buy o sell), los activos base y cotizado, una cantidad, un limit_price, una bandera post_only, un max_slippage_bps, una razon escrita, una confianza numerica de 0 a 100, un target_price, un invalidation_price y un horizonte opcional expresado en horas, dias o semanas.",
        "El campo de confianza es un cambio reciente e importante: ahora es una puntuacion numerica de 0 a 100, no una etiqueta de baja, media o alta. Esa precision importa porque el Modo Experto compara la puntuacion directamente contra tu umbral exacto de minConfidence. Si la puntuacion se queda corta, la propuesta se retiene para revision y se escribe un evento, por ejemplo Proposal skipped: confidence 68 < threshold 70. Una confianza ausente o corrupta siempre falla de forma cerrada, asi que una puntuacion mal formada se trata como un rechazo en lugar de una aprobacion.",
        "La bandera post_only codifica la intencion de ir primero como maker. Cuando esta activada, la orden reposa en el toque para capturar el spread como maker en lugar de cruzar el libro y pagar el lado taker. Leida junto con max_slippage_bps, estos dos campos acotan la calidad de ejecucion: post_only busca ganar el spread, mientras que el limite de slippage limita cuanto puede desviarse un fill que cruza si el libro se mueve.",
        "La razon, el target_price y el invalidation_price forman la tesis y su mapa de salida. El backend deriva un ratio de recompensa frente a riesgo a partir de la distancia entre limit_price y target_price frente a limit_price e invalidation_price, y exige un ratio minimo (por defecto 1.2) antes de permitir la operacion. Junto a la propuesta, se registra la instantanea completa del perfil de riesgo para que las condiciones sean auditables: el registro de la IA anota un evento proposal y un evento risk_profile en cada ejecucion, capturando el perfil activo por factor y los limites efectivos vigentes en ese momento.",
      ],
      example: "Una carga de propose_stellar_trade: side sell, base XLM, quote USDC, amount 30, limit_price 0.1205, post_only true, max_slippage_bps 40, confidence 74, target_price 0.1232, invalidation_price 0.1188. La recompensa frente a riesgo es alrededor de 1.6, superando el minimo de 1.2, y 74 supera un minConfidence de 70, asi que la propuesta pasa el filtro y se registra con su instantanea risk_profile.",
    },
    {
      id: "c10-l3",
      title: "Cuando aceptar y cuando rechazar una propuesta de la IA",
      paragraphs: [
        "La aceptacion es un juicio sobre tres cosas que la propuesta te entrega: la razon, la puntuacion de confianza, y la recompensa frente a riesgo de target frente a invalidation. Una propuesta merece aceptacion cuando su razon escrita se conecta limpiamente con los indicadores y el libro que puedes verificar, cuando su confianza esta comodamente por encima de tu umbral en lugar de rozarlo, y cuando la distancia al target_price supera de forma significativa la distancia al invalidation_price. Si cualquiera de las tres es debil, estas ante una idea marginal aunque tecnicamente el backend la dejaria pasar.",
        "La financiabilidad es el filtro duro que la gente olvida. Para COMPRAR el activo base debes tener el activo cotizado, y para VENDER debes tener el base. La verificacion previa de saldo bloqueara una operacion no financiable, pero no debes apoyarte en ella; una billetera toda en XLM no puede financiar ninguna propuesta de compra por muy fuerte que sea la tesis, que es exactamente la trampa de posicionamiento de billetera que hace que un analista solido parezca inactivo. Si quieres que el analista actue comprando caidas, primero tienes que tener algo del activo cotizado. Por eso una billetera que es toda activo base acumulara propuestas de compra no financiables mientras cada venta financiable si se ejecuta: las oportunidades perdidas son perdidas de posicionamiento, no que el modelo sea demasiado cauteloso.",
        "Rechaza con decision cuando la tesis sea endeble, cuando la puntuacion numerica este por debajo o apenas en tu umbral, cuando el limit_price ya se haya alejado de donde se construyo la razon, o cuando aceptar te sobreconcentraria en un solo activo. En el modo aprobar-cada-operacion nada se envia hasta que pulses, asi que un rechazo no te cuesta nada y mantiene tu historial de decisiones limpio y significativo para una revision posterior.",
        "Recuerda que el backend sigue haciendo cumplir la politica sin importar tu lectura. Incluso una propuesta que te encante debe superar la lista blanca, el limite de tamano por operacion, los limites diarios de volumen, de operaciones y de perdidas, el limite de slippage, el ratio minimo de recompensa frente a riesgo, los limites de exposicion, la pausa por caida (drawdown) de 24h, y la verificacion previa de saldo. Tu aceptacion es una luz verde, no una anulacion; los filtros son la red de seguridad.",
      ],
      example: "El analista propone comprar 40 XLM a 0.1180, confianza 82, objetivo 0.1240, invalidacion 0.1160, recompensa frente a riesgo alrededor de 3.0, razon un ask que se adelgaza con flowBuyPct 0.66. La tesis, la puntuacion y la recompensa frente a riesgo se sostienen, pero tu billetera tiene 600 XLM y 0 USDC, asi que no es financiable; la verificacion previa de saldo la bloquearia y la jugada correcta es tener primero USDC si quieres que este lado de compra se ejecute.",
    },
    {
      id: "c10-l4",
      title: "Como interactuan la IA y el trading manual: precedencia, conflictos, coexistencia",
      paragraphs: [
        "Las operaciones manuales y de IA fluyen por un mismo motor de ejecucion y comparten los mismos filtros de seguridad, pero difieren en una sola cosa deliberada: una orden manual OMITE el limite de tamano por operacion de la IA. El limite de tamano existe para acotar lo que el analista dimensiona en tu nombre, asi que cuando colocas una orden a mano la dimensionas tu mismo y el limite no aplica. Todos los demas filtros si siguen aplicando, asi que una orden manual nunca puede saltarse la lista blanca, el slippage, los limites de perdidas, la pausa por drawdown o la verificacion previa de saldo.",
        "Las salidas que reducen riesgo tienen precedencia sobre la friccion de aprobacion. Un cierre por stop loss que reduce una posicion abierta se auto-ejecuta de inmediato incluso en el modo aprobar-cada-operacion, porque el bot no te hara quedarte sentado aprobando salir de una posicion perdedora. Las entradas y las ampliaciones esperan tu aprobacion cuando el modo lo requiere; las salidas protectoras no, y esta asimetria es intencional para que la proteccion nunca quede tras un clic que podrias perderte.",
        "Los stop loss de IA y manuales coexisten en lugar de pelear. Si has fijado un stop manual y el analista tambien lleva uno, el monitor hace cumplir el mas protector de los dos, es decir, gana el stop que sale antes ante un movimiento adverso. Nunca acabas con un stop de IA mas holgado anulando uno manual mas ajustado; la proteccion siempre se ajusta hacia la seguridad. La misma logica aplica si ajustas un stop manual despues de que el analista fijo el suyo: el monitor simplemente sigue el nivel que ahora este mas cerca, asi que la intervencion manual puede hacer la proteccion mas estricta pero nunca mas holgada.",
        "Como ambos flujos comparten tus saldos y limites reales, interactuan a traves de la propia billetera. Una compra manual consume activo cotizado y reduce el margen que queda bajo el limite de tamano para la siguiente idea del analista; una venta manual libera activo cotizado que luego puede financiar una compra de IA. La tabla de historial etiqueta cada fill como Manual o Bot para que puedas reconstruir quien hizo que, y el interruptor de emergencia esta por encima de ambos, bloqueando todo el trading sin importar la fuente.",
      ],
      example: "El modo es Live con aprobar-cada-operacion. Vendes manualmente 200 XLM por USDC, con un tamano por encima del limite por operacion del analista, lo cual se permite porque las ordenes manuales omiten ese unico limite. El precio luego cae dentro de tu posicion larga abierta y se dispara un cierre por stop loss; se auto-ejecuta sin esperar aprobacion porque reduce riesgo. El stop manual en 0.1170 y el stop de IA en 0.1165 coexisten, y el monitor hace cumplir 0.1170 como el mas protector.",
    },
    {
      id: "c10-l5",
      title: "Como leer el registro de la IA e interpretar el historial de decisiones",
      paragraphs: [
        "El Registro de IA vive bajo la pestana Registros en su propia sub-pestana Registro de IA. Esta paginado y se puede filtrar por tipo de evento, por token y por fecha, y cada fila muestra el razonamiento, la instantanea del perfil de riesgo, la confianza, la direccion y el precio de ese evento. Leerlo bien significa tratarlo como el rastro de razonamiento del analista, no solo como una lista de fills.",
        "Aprende el vocabulario de eventos, porque cada tipo cuenta una parte distinta de la historia. Un evento proposal es una idea que el analista emitio; accepted y rejected registran que paso con ella; risk_constraint marca una propuesta que un filtro de politica bloqueo, como un limite de tamano o un fallo de recompensa frente a riesgo; stop_loss registra una salida protectora; trail_update muestra un stop dinamico ajustandose; cooldown muestra que se impidio al analista volver a proponer el mismo par y lado demasiado pronto; y risk_profile captura el perfil activo y los limites efectivos al momento de la ejecucion.",
        "Las lecturas mas informativas emparejan eventos. Un proposal seguido de inmediato por un risk_constraint te dice que la idea era solida pero la politica la detuvo, lo cual es una senal de ajuste y no un fallo del modelo. Una ejecucion que no registra ninguna propuesta en absoluto, o una linea de propuesta omitida como confidence 68 < threshold 70, te dice que el analista miro y declino, que es exactamente lo que quieres ver la mayoria del tiempo. Una larga serie de compras no financiables sin ningun fill es la firma del posicionamiento de billetera, no de exceso de cautela.",
        "El LiveLogDrawer siempre activo complementa el registro completo mostrando los ultimos aproximadamente 20 eventos combinados con enlaces directos, para que puedas echar un vistazo a la actividad reciente sin abrir la pestana Registros y saltar directo a la entrada completa cuando algo parezca digno de investigar. Usa el panel para el monitoreo en vivo y la sub-pestana Registro de IA para una revision forense, filtrando por token y fecha cuando quieras reconstruir el historial de decisiones de un solo par de principio a fin.",
      ],
      example: "Filtrar el Registro de IA a XLM durante un dia muestra: un evento risk_profile capturando el perfil activo, luego un proposal de compra con confianza 74, luego un risk_constraint que indica recompensa frente a riesgo 1.05 por debajo del minimo 1.2, asi que no hay fill. Una hora despues un evento cooldown bloquea una compra casi identica. El rastro te dice que el analista estuvo activo y fue razonable, y que la politica, no el modelo, te mantuvo fuera del mercado.",
    },
  ],
  quiz: [
    {
      id: "c10-q1",
      prompt: "Que conjunto de entradas recibe realmente el analista en una ejecucion?",
      options: [
        { text: "Solo las velas OHLC en bruto, con todos los indicadores calculados por el propio modelo.", explanation: "Incorrecto. Los indicadores como rsi14, ema8 frente a ema24, atrPct, efficiencyRatio, rangePos, volRatio, flowBuyPct y la etiqueta de regimen se calculan en el servidor y se le entregan al analista, no los deriva el modelo." },
        { text: "Saldos y ofertas en reposo, el libro de ordenes y la profundidad, velas con indicadores calculados en el servidor, un bloque de memoria de trading con resultados posteriores a la operacion, y el limite de tamano por par.", explanation: "Correcto. El analista reune esto via get_account_balances, get_market y get_price_history, mas el bloque de memoria y el limite efectivo por operacion para el par." },
        { text: "Un flujo de precios continuo que observa tick a tick.", explanation: "Incorrecto. El analista no es un proceso en streaming; funciona con disparadores discretos (Analizar, Escanear la cadena, o el temporizador de auto-escaneo) y lee una instantanea cada vez." },
        { text: "La clave API de tu proveedor mas el grafico, y nada sobre tus posiciones existentes.", explanation: "Incorrecto. Al analista se le proporcionan tus posiciones, el PnL realizado y no realizado, y los resultados posteriores a la operacion recientes; la clave API en bruto nunca es una entrada de decision." },
      ],
      correctIndex: 1,
    },
    {
      id: "c10-q2",
      prompt: "En el Modo Experto, como se maneja el campo de confianza de la propuesta?",
      options: [
        { text: "Es una etiqueta de baja, media o alta que se asigna a un nivel de auto-ejecucion.", explanation: "Incorrecto. Ese es el filtro de etiqueta del modo basico; el campo ahora es una puntuacion numerica de 0 a 100, y el Modo Experto la compara con un umbral exacto." },
        { text: "Es una puntuacion numerica de 0 a 100 comparada contra tu minConfidence exacto; por debajo del umbral se retiene y registra, y un valor ausente o corrupto falla de forma cerrada.", explanation: "Correcto. El Modo Experto hace una comparacion numerica precisa, escribe una linea de omision como confidence 68 < threshold 70 cuando se queda corta, y trata una puntuacion mal formada como un rechazo." },
        { text: "Es una probabilidad de ganancia que el backend usa para dimensionar la orden.", explanation: "Incorrecto. La confianza es conviccion, no una probabilidad, y no dimensiona la orden; eso lo hacen el limite de tamano por operacion y tu cantidad." },
        { text: "Se ignora por completo una vez que pasa la recompensa frente a riesgo.", explanation: "Incorrecto. El filtro de confianza es independiente de la verificacion de recompensa frente a riesgo; ambos deben pasar, y la puntuacion se registra en cualquier caso." },
      ],
      correctIndex: 1,
    },
    {
      id: "c10-q3",
      prompt: "Una propuesta tiene una razon solida, confianza 82, y recompensa frente a riesgo cerca de 3.0, pero tu billetera solo tiene XLM y la propuesta es una compra de XLM con USDC. Que deberias concluir?",
      options: [
        { text: "No es financiable; la verificacion previa de saldo la bloqueara, y para actuar en el lado de compra primero debes tener algo de USDC.", explanation: "Correcto. Comprar requiere tener a mano el activo cotizado. Una billetera toda en XLM no puede financiar una compra cotizada en USDC, que es la trampa de posicionamiento de billetera, no exceso de cautela." },
        { text: "Aceptala; una puntuacion alta y una buena recompensa frente a riesgo anulan la necesidad de tener el activo cotizado.", explanation: "Incorrecto. Ninguna puntuacion anula la financiabilidad. Para comprar el base debes tener el activo cotizado, aqui USDC." },
        { text: "El backend convertira automaticamente tu XLM a USDC para financiar la compra.", explanation: "Incorrecto. No hay una auto-conversion silenciosa para satisfacer una propuesta; la verificacion previa de saldo simplemente bloquea una operacion no financiable." },
        { text: "Rechazala porque confianza 82 es demasiado alta para confiar en ella.", explanation: "Incorrecto. Una puntuacion alta no es razon para rechazar; el verdadero obstaculo aqui es la financiabilidad, no la fuerza de la tesis." },
      ],
      correctIndex: 0,
    },
    {
      id: "c10-q4",
      prompt: "En que se diferencian y como coexisten las ordenes manuales y las de IA en el motor de ejecucion?",
      options: [
        { text: "Las ordenes manuales se saltan todos los filtros de seguridad para que puedas actuar mas rapido.", explanation: "Incorrecto. Las ordenes manuales pasan los mismos filtros que las de IA; solo omiten el limite de tamano por operacion de la IA, nada mas." },
        { text: "Un cierre por stop loss siempre debe aprobarse manualmente, incluso en los modos automaticos.", explanation: "Incorrecto. Las salidas que reducen riesgo, incluidos los cierres por stop loss, se auto-ejecutan de inmediato incluso en el modo aprobar-cada-operacion." },
        { text: "Las ordenes manuales omiten el limite de tamano por operacion de la IA, las salidas que reducen riesgo se auto-ejecutan incluso en el modo aprobar-cada-operacion, y cuando ambas fijan stops el monitor hace cumplir el mas protector.", explanation: "Correcto. El dimensionamiento manual es tuyo asi que el limite de tamano de la IA no aplica, las salidas nunca esperan aprobacion, y los stops se ajustan hacia el nivel mas ajustado y protector." },
        { text: "Si existen un stop de IA y uno manual, gana el stop de IA mas holgado.", explanation: "Incorrecto. El monitor hace cumplir el stop mas protector, asi que gana el mas ajustado, nunca el mas holgado." },
      ],
      correctIndex: 2,
    },
    {
      id: "c10-q5",
      prompt: "En el Registro de IA ves un evento proposal seguido de inmediato por un evento risk_constraint que indica recompensa frente a riesgo 1.05 por debajo del minimo 1.2. Que te dice esto?",
      options: [
        { text: "El analista esta averiado y produjo una propuesta invalida.", explanation: "Incorrecto. La propuesta estaba bien formada; un filtro de politica, no un fallo del modelo, impidio que se ejecutara." },
        { text: "Una violacion de la lista blanca bloqueo la operacion.", explanation: "Incorrecto. La restriccion registrada es un deficit de recompensa frente a riesgo, no un rechazo por lista blanca; son filtros distintos y el registro nombra cual se disparo." },
        { text: "La operacion se ejecuto pero a un precio peor del previsto.", explanation: "Incorrecto. Un evento risk_constraint significa que la operacion se bloqueo antes de la ejecucion, asi que no hubo ningun fill." },
        { text: "La idea era solida pero la politica la bloqueo porque la recompensa frente a riesgo cayo por debajo del minimo de 1.2, asi que no hubo fill; es una senal de ajuste, no un fallo del modelo.", explanation: "Correcto. Emparejar el proposal con el risk_constraint muestra el cumplimiento de la politica, no exceso de cautela. El minimo de recompensa frente a riesgo te mantuvo fuera del mercado, y eso es visible y auditable en el registro." },
      ],
      correctIndex: 3,
    },
  ],
};
