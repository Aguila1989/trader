import type { Chapter } from "../../types";

export const chapter03: Chapter = {
  id: "c3",
  number: 3,
  level: "BASIC",
  title: "Tu primera operacion",
  description: "Haz tu primera operacion manual: aprende a leer el formulario VENDES / COMPRAS, elige entre orden de mercado o limitada, entiende las comisiones y envia tokens de forma segura.",
  lessons: [
    {
      id: "c3-l1",
      title: "Que significa comprar y vender un token?",
      paragraphs: [
        "Toda operacion es en realidad un intercambio. Entregas un token que ya tienes y recibes a cambio otro token distinto. No hay una cuenta de efectivo aparte funcionando por detras, asi que para comprar algo tienes que gastar otra cosa que ya posees.",
        "En esta app el intercambio siempre se plantea como una venta. Eliges un token en VENDES y luego eliges el token que quieres en COMPRAS. Por dentro, el bot lo trata como vender el activo de VENDES a cambio del activo de COMPRAS, aunque sientas que simplemente estas comprando.",
        "Como solo puedes entregar lo que tienes, el desplegable VENDES solo muestra los tokens que ya estan en tu billetera. Si un token no aparece, es que no tienes nada de el para gastar, asi que primero intercambia hacia el partiendo de algo que si tengas.",
      ],
      example: "Tienes 500 XLM y quieres algo de USDC. Pones VENDES en XLM y COMPRAS en USDC, gastando 100 XLM. El bot vende 100 XLM por USDC al precio del momento. Para volver luego a XLM, harias el intercambio al reves: VENDES USDC, COMPRAS XLM.",
    },
    {
      id: "c3-l2",
      title: "Cual es la diferencia entre una orden de mercado y una orden limitada?",
      paragraphs: [
        "El formulario tiene un selector entre Limitada y Mercado. La app las describe asi: la limitada queda en reposo al precio que fijas y solo se ejecuta a ese precio o mejor. La de mercado se ejecuta de inmediato contra el mejor precio actual del libro.",
        "Una orden de mercado es rapida y sencilla. Toma el mejor precio que haya en ese momento, asi que casi siempre se ejecuta, pero no puedes controlar el precio exacto que obtienes. Una orden limitada te deja fijar tu precio y esperar, pero solo se ejecuta si el mercado llega a ese precio, y puede que no se ejecute nunca.",
        "Cuando eliges Limitada tienes que escribir un precio. Cuando eliges Mercado el bot usa por ti el mejor precio de compra en vivo, asi que no hace falta indicar ninguno. Quienes empiezan suelen arrancar con ordenes de mercado pequenas para aprender, y luego pasan a las limitadas para ganar paciencia y control.",
      ],
      example: "USDC cotiza a alrededor de 0.085 XLM cada uno. Una orden de mercado para vender XLM se ejecuta al instante cerca de 0.085. Una orden limitada puesta para comprar USDC solo cuando el XLM por USDC baje a 0.080 queda en reposo en el libro y solo se ejecuta si el precio cae hasta ahi; si nunca lo hace, no pasa nada.",
    },
    {
      id: "c3-l3",
      title: "Como leer la interfaz VENDES / COMPRAS en esta app",
      paragraphs: [
        "El formulario se lee de arriba a abajo. VENDES es el token que entregas, elegido en un desplegable de los tokens que tienes. COMPRAS es el token que recibes, elegido del universo completo de tokens seleccionados. Un resumen en vivo lo replantea como Vendes X, compras Y para que no haya confusion.",
        "El campo Precio muestra la cantidad de COMPRAS por cada unidad de VENDES. El saldo disponible te dice cuanto del token de VENDES puedes gastar. La tolerancia de slippage, en porcentaje, es cuanto puede moverse el precio antes de que la orden se cancele para protegerte.",
        "Una seccion Avanzado anade un Precio objetivo y un Precio de invalidacion opcionales. Son recordatorios para tu propio plan y son opcionales. Cada orden tambien pasa por una comprobacion previa de saldo antes de firmar, asi que el bot se niega a enviar una operacion que en realidad no puedes financiar.",
      ],
      example: "Pones VENDES en XLM, COMPRAS en USDC, Precio 0.085 y Slippage 1 por ciento. El saldo disponible marca 500 XLM. Introduces 100 XLM. El resumen dice Vendes 100 XLM, compras unos 8.5 USDC. Si el precio se mueve mas de 1 por ciento antes de ejecutarse, la orden se cancela en vez de darte un peor trato.",
    },
    {
      id: "c3-l4",
      title: "Que es una comision de trading y cuanto cobra Stellar?",
      paragraphs: [
        "En muchos exchanges pagas una comision en porcentaje en cada operacion, a veces uno o dos por ciento. Stellar funciona distinto. El SDEX, el exchange descentralizado donde opera este bot, no cobra ninguna comision de trading en porcentaje. Solo pagas una pequena comision de red mas el spread.",
        "La comision de red se paga en XLM y se cobra por operacion. La comision base actual es de 100 stroops, que son 0.00001 XLM por operacion, una fraccion de un centimo de dolar. Un stroop es la unidad mas pequena de XLM, una diezmillonesima parte de un solo XLM.",
        "El coste real que hay que vigilar es el spread, la diferencia entre el mejor precio de compra y el de venta. Cruzar un spread amplio cuesta mucho mas que la comision de red. Asi que dimensiona tus operaciones en torno al spread, no en torno a la comision de red, que es casi insignificante.",
      ],
      example: "Lanzas una orden de mercado para vender XLM por USDC. La comision de red es de 100 stroops, o 0.00001 XLM, muy por debajo de un centimo. No hay ningun recorte en porcentaje encima. Si el spread entre los precios de compra y venta es del 0.3 por ciento, ese spread, y no la comision, es tu principal coste de trading en el intercambio.",
    },
    {
      id: "c3-l5",
      title: "Como enviar tokens a otra billetera de forma segura",
      paragraphs: [
        "Ademas del trading, la billetera tiene una funcion de Enviar y Pagar para mover tokens a otra direccion. Introduces una clave publica de destino, que empieza por la letra G, luego eliges el activo, el importe y un memo opcional. Algunos exchanges exigen ese memo para acreditar tu deposito, asi que no lo omitas cuando te lo pidan.",
        "Los pagos en Stellar son irreversibles. Si escribes la direccion equivocada no hay deshacer ni un servicio de soporte que recupere los fondos. Por eso, revisa la direccion de destino caracter por caracter y nunca pegues una direccion que no hayas confirmado desde una fuente de confianza.",
        "Para cualquier activo no nativo, como USDC, el destinatario ya debe tener una trustline para ese activo, de lo contrario el pago falla. El habito seguro es siempre el mismo: envia primero una cantidad de prueba minima, confirma que llega y luego envia el resto.",
      ],
      example: "Quieres enviar 200 USDC a un amigo cuya direccion empieza por GBXY y termina en 7QWP. Primero envias 1 USDC como prueba. Llega, lo que confirma tanto la direccion como que su billetera tiene una trustline de USDC. Solo entonces envias los 199 USDC restantes, anadiendo el memo que pidio su exchange.",
    },
  ],
  quiz: [
    {
      id: "c3-q1",
      prompt: "En esta app, que esta ocurriendo realmente cuando rellenas VENDES XLM y COMPRAS USDC?",
      options: [
        { text: "Estas vendiendo XLM a cambio de USDC.", explanation: "Correcto. Toda operacion es un intercambio, y la app siempre lo plantea como vender el activo de VENDES por el de COMPRAS." },
        { text: "Estas depositando XLM en una cuenta de efectivo aparte.", explanation: "Incorrecto. No hay ninguna cuenta de efectivo aparte; una operacion intercambia un token directamente por otro." },
        { text: "Estas pidiendo prestado USDC con tus XLM como garantia.", explanation: "Incorrecto. No hay ningun prestamo. Simplemente entregas XLM y recibes USDC." },
      ],
      correctIndex: 0,
    },
    {
      id: "c3-q2",
      prompt: "Segun la app, que hace una orden de Mercado?",
      options: [
        { text: "Queda en reposo hasta que el precio alcanza un nivel que escribiste.", explanation: "Incorrecto. Eso describe una orden limitada, que solo se ejecuta a tu precio fijado o mejor." },
        { text: "Se ejecuta de inmediato contra el mejor precio actual del libro.", explanation: "Correcto. Una orden de mercado toma el mejor precio en vivo al momento, asi que casi siempre se ejecuta." },
        { text: "Cancela la operacion si se aplica cualquier comision.", explanation: "Incorrecto. El tipo de orden no tiene nada que ver con cancelar por comisiones." },
        { text: "Garantiza el precio exacto que querias.", explanation: "Incorrecto. Una orden de mercado da rapidez, no control del precio; el precio puede moverse mientras se ejecuta." },
      ],
      correctIndex: 1,
    },
    {
      id: "c3-q3",
      prompt: "Por que el desplegable VENDES solo muestra ciertos tokens?",
      options: [
        { text: "Solo muestra los tokens que el bot recomienda comprar.", explanation: "Incorrecto. VENDES trata de lo que entregas, no de recomendaciones." },
        { text: "Solo muestra los tokens sin comision de red.", explanation: "Incorrecto. La comision de red se aplica a las operaciones sin importar que token vendas." },
        { text: "Solo lista los tokens que ya tienes, porque solo puedes gastar lo que posees.", explanation: "Correcto. Solo puedes vender tokens que estan en tu billetera, asi que el desplegable se limita a los activos que tienes." },
      ],
      correctIndex: 2,
    },
    {
      id: "c3-q4",
      prompt: "Cuanto cobra el SDEX de Stellar en comisiones de trading?",
      options: [
        { text: "Un uno por ciento fijo de cada operacion.", explanation: "Incorrecto. El SDEX no cobra ninguna comision de trading en porcentaje." },
        { text: "Ninguna comision de trading en porcentaje; solo una pequena comision de red por operacion de 100 stroops mas el spread.", explanation: "Correcto. La comision base es de 100 stroops, o 0.00001 XLM por operacion, y el coste real a vigilar es el spread." },
        { text: "Una comision del dos por ciento pagada en USDC.", explanation: "Incorrecto. No hay ningun recorte en porcentaje, y la comision de red se paga en XLM, no en USDC." },
        { text: "Nada en absoluto, ni siquiera una comision de red.", explanation: "Incorrecto. Sigue habiendo una pequena comision de red de 100 stroops por operacion, aunque no haya comision de trading en porcentaje." },
      ],
      correctIndex: 1,
    },
    {
      id: "c3-q5",
      prompt: "Cual es el primer paso mas seguro antes de enviar una gran cantidad de USDC a otra billetera?",
      options: [
        { text: "Enviar primero una cantidad de prueba minima para confirmar la direccion y la trustline.", explanation: "Correcto. Los pagos son irreversibles, asi que una prueba pequena confirma que la direccion es correcta y que el destinatario tiene una trustline de USDC antes de enviar el resto." },
        { text: "Enviar el importe completo de inmediato para que no pueda ser interceptado.", explanation: "Incorrecto. Los pagos en Stellar son irreversibles; una direccion equivocada no se puede deshacer, asi que apresurarse es arriesgado." },
        { text: "Omitir el memo para mantener la transferencia privada.", explanation: "Incorrecto. Algunos exchanges necesitan el memo para acreditar tu deposito, asi que omitirlo puede hacer que pierdas los fondos." },
        { text: "Usar una direccion que encontraste sin confirmar su fuente.", explanation: "Incorrecto. Confirma siempre el destino desde una fuente de confianza, ya que una direccion equivocada significa una perdida permanente." },
      ],
      correctIndex: 0,
    },
  ],
};
