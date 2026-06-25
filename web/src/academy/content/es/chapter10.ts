import type { Chapter } from "../../types";

export const chapter10: Chapter = {
  id: "c10",
  number: 10,
  level: "EXPERT",
  title: "Trading con IA",
  description: "Como el analista genera propuestas, los datos detras de ellas, y como leerlas, aceptarlas, rechazarlas y combinarlas con operaciones manuales.",
  lessons: [
    {
      id: "c10-l1",
      title: "Como genera la IA las propuestas de trading?",
      paragraphs: [
        "El bot llama a un modelo de IA al que llamamos el analista. Eliges un proveedor desde un menu desplegable, como Anthropic Claude, OpenAI o DeepSeek, y solo se pueden seleccionar los proveedores que tienen una clave configurada. El analista no se ejecuta de forma continua. Se ejecuta cuando pulsas Escanear la cadena, cuando Analizas un solo par, o segun el temporizador de auto-escaneo si lo tienes activado.",
        "En cada ejecucion, al analista se le entrega una instantanea del mercado y de tu cuenta, y devuelve cero o mas propuestas. Cada propuesta es un objeto estructurado, no texto libre, para que la app pueda actuar sobre ella. Lleva un lado de compra o venta, los activos base y cotizado, una cantidad, un precio limite, un slippage maximo, una razon escrita y una confianza de baja, media o alta. Tambien puede anadir un precio objetivo, un precio de invalidacion y una pista sobre el horizonte de tenencia.",
        "Un periodo de enfriamiento impide que el analista vuelva a proponer el mismo par y lado demasiado rapido, para que no te inunde con la misma idea. Si el analista no ve nada que valga la pena hacer, simplemente no devuelve ninguna propuesta para ese par.",
      ],
      example: "Pulsas Escanear la cadena. El analista revisa XLM/USDC y devuelve una propuesta: lado compra, cantidad 40 XLM, precio limite 0.1180 USDC, slippage maximo 0.5 por ciento, confianza media, razon que el ask se ha adelgazado y las ultimas tres caidas se recompraron en cuestion de minutos.",
    },
    {
      id: "c10-l2",
      title: "Que datos usa la IA para tomar decisiones?",
      paragraphs: [
        "El analista solo conoce lo que la app le proporciona. Ve el order book en vivo, es decir el mejor bid y ask mas la profundidad visible, junto con el volumen de 24h y las velas OHLC recientes del par. Eso le dice donde esta el precio, que tan ajustado esta el spread y cuanto tamano puede absorber el libro.",
        "Tambien ve tu situacion: tus tenencias actuales, tus ofertas abiertas, el resultado realizado de hoy (PnL) y el resultado no realizado de cualquier posicion abierta. Asi que una propuesta se moldea segun lo que ya posees, no solo segun el grafico.",
        "Por ultimo ve las operaciones recientes y, algo importante, como se movio el precio despues de cada una, ademas del limite efectivo de tamano por operacion. Los resultados posteriores a la operacion le permiten juzgar si las entradas recientes realmente funcionaron, y el limite de tamano mantiene la cantidad propuesta dentro de lo que la politica permite.",
      ],
      example: "Entradas para una ejecucion de XLM/USDC: mejor bid 0.1176, mejor ask 0.1182, volumen de 24h 92,000 XLM, tenencias 600 XLM y 0 USDC, sin ofertas abiertas, PnL realizado de hoy mas 1.20 USDC, las ultimas dos compras ganaron cada una alrededor de 0.3 por ciento despues, limite por operacion 50 XLM. El analista propone una cantidad de 40 XLM, comodamente por debajo del limite.",
    },
    {
      id: "c10-l3",
      title: "Como interpretar una propuesta de la IA",
      paragraphs: [
        "Lee primero el lado. Compra significa que el analista quiere adquirir el activo base gastando el cotizado; venta significa lo contrario. El precio limite es el peor precio que aceptara, y el slippage maximo limita cuanto puede desviarse el fill, asi que juntos acotan que tan mala puede ser la ejecucion.",
        "Lee la razon a continuacion. Una buena razon se conecta con los datos que viste en la leccion anterior, por ejemplo un ask que se adelgaza, una caida recomprada o un volumen creciente. Una razon vaga es en si misma una senal de alerta. Los precios opcionales de objetivo e invalidacion te dicen donde espera el analista tomar ganancias y donde la idea esta equivocada, lo cual es tu mapa de salida.",
        "La confianza es la propia conviccion del analista, no una probabilidad. Trata la confianza baja como una idea tentativa, la media como una senal normal y la alta como una senal fuerte. La confianza nunca anula la politica: el backend sigue haciendo cumplir los limites, el slippage y el saldo antes de enviar cualquier cosa.",
      ],
      example: "Una propuesta de venta dice: vender 30 XLM, limite 0.1205 USDC, slippage maximo 0.4 por ciento, objetivo 0.1205, invalidacion 0.1240, confianza alta, razon que la resistencia aguanto dos veces en 0.1208 con volumen decreciente. Puedes ver el plan: tomar ganancias cerca de 0.1205, abandonar la idea si el precio recupera 0.1240.",
    },
    {
      id: "c10-l4",
      title: "Cuando aceptar y cuando rechazar una propuesta",
      paragraphs: [
        "Tus dos modos de aprobacion de trading se comportan de forma distinta. En el modo aprobar-cada-operacion, cada propuesta espera a que pulses Aprobar o Rechazar, sin importar la confianza. En el modo auto-trade, solo las propuestas de confianza media y alta se ejecutan automaticamente; una confianza baja o ausente sigue esperando tu aprobacion manual.",
        "Hay una excepcion constante en ambos modos. Las salidas que reducen riesgo, como un cierre por stop que reduce una posicion abierta, se ejecutan de inmediato. La app no te hara quedarte sentado aprobando salir de una operacion perdedora.",
        "Cuando si te toca decidir, juzga la razon frente a los datos, verifica que el precio limite y el slippage sean razonables, y confirma que realmente tienes el saldo que la operacion necesita. Rechaza cuando la razon sea endeble, cuando el precio limite ya se haya escapado, o cuando la propuesta te concentraria en exceso en un solo activo. El backend bloqueara de todos modos una operacion imposible, pero rechazar temprano mantiene tu historial limpio.",
      ],
      example: "En modo auto-trade el analista propone comprar 40 XLM a 0.1180, confianza alta. Como es confianza alta, se auto-ejecuta a traves de los controles de seguridad. Momentos despues propone vender 20 XLM a 0.1240, confianza baja; esa se pausa y espera en la cola a que la Apruebes o Rechaces.",
    },
    {
      id: "c10-l5",
      title: "Como funcionan juntos el trading con IA y el manual",
      paragraphs: [
        "El analista solo propone. El backend es lo que hace cumplir la politica y actua: verifica el limite por operacion, el slippage maximo, tu saldo y el interruptor de emergencia, luego firma y envia la orden. Cualquier operacion manual que coloques a mano pasa por exactamente los mismos controles de seguridad, asi que una orden manual nunca puede saltarse una verificacion que una orden de IA si respeta.",
        "El modo de trading aplica por igual a ambas fuentes. En Solo lectura la app observa y propone pero nunca opera, en Paper simula los fills, y en Live envia ordenes reales en la cadena. El interruptor de emergencia esta por encima de todo y bloquea todo el trading, tanto de IA como manual.",
        "Como ambos flujos pasan por un mismo motor, la tabla de historial etiqueta cada fill como Manual o Bot para que puedas distinguirlos despues. Puedes ejecutar una operacion manual mientras el analista esta activo; comparten tus saldos y limites, asi que una compra manual reduce el margen que queda bajo tu limite de tamano para la siguiente idea del analista.",
      ],
      example: "El modo es Live, la aprobacion es auto-trade. Vendes manualmente 100 XLM por USDC. El analista luego propone una compra de confianza media; se auto-ejecuta pero solo despues de que la verificacion previa de saldo confirme que el USDC que acabas de recibir la cubre. La tabla de historial muestra tu venta etiquetada como Manual y la compra etiquetada como Bot.",
    },
  ],
  quiz: [
    {
      id: "c10-q1",
      prompt: "Cuando se ejecuta realmente el analista y produce propuestas?",
      options: [
        { text: "De forma continua en segundo plano con cada tick de precio.", explanation: "Incorrecto. El analista no es un proceso en streaming; se ejecuta solo con disparadores especificos, no en cada tick." },
        { text: "Cuando Escaneas la cadena, Analizas un par, o segun el temporizador de auto-escaneo.", explanation: "Correcto. Esos son los tres disparadores que invocan al analista." },
        { text: "Solo una vez al inicio, y luego cachea un plan fijo para el dia.", explanation: "Incorrecto. No hay un plan diario de una sola vez; cada ejecucion produce propuestas frescas a partir de una instantanea actual." },
      ],
      correctIndex: 1,
    },
    {
      id: "c10-q2",
      prompt: "Cual de estos NO recibe el analista como entrada?",
      options: [
        { text: "El order book en vivo, el volumen de 24h y las velas OHLC.", explanation: "Incorrecto. Estas entradas de mercado forman parte de la instantanea que ve." },
        { text: "Tus tenencias, ofertas abiertas y el PnL realizado y no realizado de hoy.", explanation: "Incorrecto. El estado de tu cuenta se le proporciona para que las propuestas encajen con lo que tienes." },
        { text: "El valor de la clave API de tu proveedor para poder cobrarse a si mismo.", explanation: "Correcto. La clave en bruto nunca forma parte de las entradas de decision del analista; solo se usa para autenticar la llamada al proveedor." },
        { text: "Las operaciones recientes, como se movio el precio despues de ellas y el limite de tamano por operacion.", explanation: "Incorrecto. Estas son entradas; los resultados posteriores a la operacion y el limite moldean su juicio y dimensionamiento." },
      ],
      correctIndex: 2,
    },
    {
      id: "c10-q3",
      prompt: "En una propuesta, que representa el campo de confianza de baja, media o alta?",
      options: [
        { text: "Una probabilidad de ganancia garantizada que el backend usa para dimensionar la orden.", explanation: "Incorrecto. No es una probabilidad y no fija el tamano; eso lo hace el limite por operacion." },
        { text: "La propia conviccion del analista en la idea, que nunca anula los controles de la politica.", explanation: "Correcto. Indica con que fuerza cree el analista en la idea, pero los limites, el slippage y el saldo se siguen haciendo cumplir." },
        { text: "Que tan rapido se llenara la orden en la cadena.", explanation: "Incorrecto. La velocidad del fill depende de la liquidez y el precio, no de la etiqueta de confianza." },
      ],
      correctIndex: 1,
    },
    {
      id: "c10-q4",
      prompt: "En el modo auto-trade, que propuestas se ejecutan por si solas?",
      options: [
        { text: "Cada propuesta, sin importar la confianza.", explanation: "Incorrecto. Eso describe el modo aprobar-cada-operacion, no auto-trade." },
        { text: "Solo las propuestas de confianza baja, ya que son las menos arriesgadas.", explanation: "Incorrecto. Es al reves; la confianza baja o ausente espera tu aprobacion." },
        { text: "Las propuestas de confianza media y alta, mientras que la confianza baja o ausente espera aprobacion.", explanation: "Correcto. El auto-trade ejecuta automaticamente media y alta; la confianza baja o ausente se pausa para ti. Las salidas que reducen riesgo siempre se ejecutan de inmediato." },
        { text: "Ninguna; el auto-trade solo redacta ordenes y nunca las envia.", explanation: "Incorrecto. El auto-trade si envia las propuestas que califican; ese es su proposito." },
      ],
      correctIndex: 2,
    },
    {
      id: "c10-q5",
      prompt: "Como coexisten las propuestas de IA y las operaciones manuales en la app?",
      options: [
        { text: "Ambas pasan por los mismos controles de seguridad del backend y se etiquetan como Manual o Bot en el historial.", explanation: "Correcto. Un mismo motor hace cumplir los limites, el slippage, el saldo y el interruptor de emergencia para ambas, y el historial etiqueta cada fill por su fuente." },
        { text: "Las operaciones manuales se saltan los controles de seguridad para que puedas actuar mas rapido.", explanation: "Incorrecto. Las ordenes manuales pasan por exactamente las mismas verificaciones que las ordenes de IA; nada las salta." },
        { text: "El interruptor de emergencia bloquea las operaciones de IA pero deja pasar las manuales.", explanation: "Incorrecto. El interruptor de emergencia bloquea todo el trading, tanto de IA como manual." },
        { text: "Las operaciones de IA y manuales usan saldos separados que nunca se afectan entre si.", explanation: "Incorrecto. Comparten tus saldos y limites, asi que una operacion manual reduce el margen que queda para la siguiente orden del analista." },
      ],
      correctIndex: 0,
    },
  ],
};
