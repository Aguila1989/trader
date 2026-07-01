// PENDING — do not activate until green light.
import type { Chapter } from "../../../types";

export const chapter25: Chapter & { whoFor: string } = {
  id: "c25",
  number: 25,
  level: "BASIC",
  whoFor: "Para quienes operan y quieren quedar bien con el fisco",
  title: "Las criptomonedas y los impuestos",
  description:
    "Si tienes que declarar tus criptomonedas, qué cuenta como hecho imponible, cómo llevar un registro limpio con esta aplicación y qué significa MiCA para ti como usuario.",
  lessons: [
    {
      id: "c25-l1",
      title: "¿Tienes que declarar tus criptomonedas ante las autoridades fiscales?",
      paragraphs: [
        "En la mayoría de los países la respuesta honesta es sí. Las autoridades fiscales tratan cada vez más las criptomonedas como cualquier otro activo, de modo que las ganancias, los ingresos y ciertos intercambios pueden tener que declararse en tu declaración de impuestos. Las reglas concretas difieren mucho de un país a otro, y cambian a menudo, así que este capítulo es educación general y no asesoramiento fiscal.",
        "Qué cuenta, cuándo cuenta y cuánto debes dependen todos del lugar donde vivas. Algunos sitios gravan cada ganancia, otros solo gravan las ganancias por encima de un umbral, y unos pocos apenas gravan las criptomonedas personales. Como los detalles varían tanto, el único hábito seguro es consultar las reglas de tu propio país o preguntarle a un contador cualificado antes de dar nada por hecho.",
        "La buena noticia es que declarar criptomonedas suele ser sencillo una vez que llevas un registro decente. Quienes se meten en problemas rara vez son quienes declararon con cuidado; son quienes supusieron que nadie los estaba vigilando y no guardaron ningún historial.",
      ],
      example:
        "Piensa en las criptomonedas como pensarías en un ingreso extra por alquilar una habitación que te sobra. Puede que lo sientas pequeño y privado, pero por lo general la oficina de impuestos aún quiere saber de ello. Ignorarlo no hace que desaparezca; solo convierte un formulario sencillo en un problema más adelante. Ante la duda, una breve charla con un contador cuesta mucho menos que una factura de impuestos inesperada.",
    },
    {
      id: "c25-l2",
      title: "¿Qué es un hecho imponible en las criptomonedas?",
      paragraphs: [
        "Un hecho imponible es cualquier momento que las autoridades fiscales pueden tratar como sujeto a impuestos. En las criptomonedas los más habituales son vender un token por dinero corriente, intercambiar un token por otro y recibir criptomonedas como pago por un trabajo o un servicio. Cada uno de ellos puede generar algo que declarar, incluso el intercambio en el que ningún efectivo ordinario llega a tocar tu cuenta bancaria.",
        "Simplemente tener un token no suele ser un hecho imponible. Si compras XLM o USDC y solo lo guardas en tu billetera, la mayoría de los sistemas fiscales te dejan en paz hasta que realmente lo vendes, lo intercambias o lo gastas. El impuesto a menudo se aplica a tus ganancias de capital, es decir, la diferencia entre lo que pagaste y lo que obtuviste cuando finalmente dispusiste del activo.",
        "Por eso un intercambio puede sorprender a la gente. Cambiar un token por otro se siente como mover cosas dentro de tu propia billetera, pero muchas autoridades fiscales lo ven como vender el primer activo y comprar el segundo, de modo que una ganancia sobre el primer token puede contar justo en ese momento. Las reglas varían según el país, así que trata esto como un motivo para llevar registros, no como un veredicto final para tu situación.",
      ],
      example:
        "Imagina que compraste un sello raro por 50 USDC y más tarde lo intercambiaste directamente por una moneda que valía 90 USDC. Nunca recibiste efectivo, y sin embargo claramente te desprendiste de algo que valía más de lo que pagaste. Muchos sistemas fiscales ven un intercambio de criptomonedas de la misma manera: los 40 USDC de ganancia son reales aunque ningún dinero haya llegado a tu cuenta, y ese momento es el hecho imponible.",
    },
    {
      id: "c25-l3",
      title: "Cómo llevar el control de tus transacciones para los impuestos",
      paragraphs: [
        "Un buen registro lo es todo. Para cada operación por lo general quieres tener la fecha, qué tokens intervinieron, las cantidades, el precio en ese momento y cualquier comisión de red que hayas pagado. Con esa información tu contador, o tu programa de impuestos, puede calcular tus ganancias sin adivinar nada. Intentar reconstruirlo meses después de memoria es doloroso y propenso a errores.",
        "Esta aplicación te lo pone más fácil que la mayoría. La pestaña de Registros tiene una subpestaña de Historial de operaciones que registra tu actividad, y su botón de exportar a CSV te permite descargar ese historial como una hoja de cálculo que puedes entregarle a un contador o importar a herramientas fiscales. Exportar un CSV limpio una vez al año, o incluso una vez por trimestre, es uno de los hábitos más sencillos que puedes adoptar.",
        "Como los tokens en Stellar pueden moverse por el libro de órdenes del SDEX y por los pools de liquidez de los AMM, y como los pagos por ruta saltan entre mercados de forma automática, tu rastro puede implicar varios pasos pequeños. Conservar los registros exportados te permite mostrar exactamente qué ocurrió sin tener que explicar la fontanería interna.",
      ],
      example:
        "Imagina una caja de zapatos donde dejas caer cada recibo en el momento en que lo recibes. A la hora de los impuestos la vuelcas y todo ya está ahí, fechado y completo. La pestaña de Registros es tu caja de zapatos: en lugar de garabatear operaciones en trozos de papel, pulsas exportar a CSV y obtienes un archivo ordenado y fechado de cada transacción, listo para entregar.",
    },
    {
      id: "c25-l4",
      title: "¿Qué es MiCA y qué significa para ti como usuario?",
      paragraphs: [
        "MiCA son las siglas de Markets in Crypto-Assets, el reglamento de la Unión Europea para los servicios de criptomonedas y las stablecoins. Es una ley que fija normas comunes en todos los países de la UE, de modo que las empresas de criptomonedas, sobre todo las que emiten stablecoins como USDC o gestionan exchanges, tengan que seguir reglas más claras en lugar de operar en una zona gris.",
        "Para ti como usuario cotidiano, MiCA se manifiesta sobre todo como más protección al consumidor y más transparencia. Las empresas cubiertas por ella se enfrentan a requisitos más claros sobre cómo operan, qué deben divulgar y cómo protegen tus fondos. El objetivo es que los servicios que usas sean un poco más seguros y un poco menos un salvaje oeste, no que tu trading personal se complique más.",
        "MiCA trata de cómo se regulan los negocios de criptomonedas, lo cual no es exactamente lo mismo que cómo se gravan tus ganancias personales; esas reglas fiscales siguen viniendo de tu propio país. Esta lección mantiene las cosas ligeras a propósito, y nada de ello es asesoramiento legal. Si quieres el detalle más profundo sobre la regulación, el capítulo de Regulación de nivel Experto profundiza mucho más.",
      ],
      example:
        "Piensa en MiCA como en las normas de seguridad y etiquetado de los alimentos en un supermercado. Tú no lees las regulaciones por tu cuenta, pero como existen, los productos en el estante deben cumplir estándares básicos y decirte qué contienen. De la misma manera, MiCA funciona en segundo plano para que los servicios de criptomonedas que usas tengan que cumplir reglas comunes, dándote un poco más de confianza en lo que estás comprando.",
    },
  ],
  quiz: [
    {
      id: "c25-q1",
      prompt: "En la mayoría de los países, ¿por lo general tienes que declarar tu actividad con criptomonedas ante las autoridades fiscales?",
      options: [
        {
          text: "No, las criptomonedas son completamente privadas y ningún país pregunta nunca por ellas.",
          explanation:
            "No es cierto. La mayoría de las autoridades fiscales ahora tratan las criptomonedas como otros activos y esperan que se declaren las ganancias o los ingresos. Suponer que nadie está vigilando es justo la forma en que la gente se mete en problemas.",
        },
        {
          text: "Sí, en la mayoría de los países, aunque las reglas concretas varían, así que conviene consultar las reglas locales o preguntarle a un contador.",
          explanation:
            "Correcto. Declarar criptomonedas suele ser obligatorio, pero los detalles difieren según el país y cambian a menudo, así que consultar tus propias reglas o preguntarle a un contador cualificado es el hábito seguro.",
        },
        {
          text: "Solo si obtienes más de un millón de ganancia.",
          explanation:
            "No. Algunos países sí tienen umbrales, pero varían mucho y suelen ser muy inferiores a eso. No existe un único límite global, y por eso consultas tus reglas locales.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c25-q2",
      prompt: "¿Cuál de estos es más probable que cuente como un hecho imponible?",
      options: [
        {
          text: "Intercambiar un token por otro, como cambiar XLM por USDC.",
          explanation:
            "Correcto. Muchas autoridades fiscales tratan un intercambio como vender el primer activo y comprar el segundo, de modo que una ganancia sobre el primer token puede gravarse justo en ese momento, aunque no haya intervenido efectivo ordinario.",
        },
        {
          text: "Simplemente tener un token en tu billetera sin venderlo ni intercambiarlo.",
          explanation:
            "Por lo general no. El solo hecho de tenerlo suele quedar en paz hasta que realmente vendes, intercambias o gastas el activo. El impuesto normalmente se aplica cuando dispones de él, no mientras lo conservas.",
        },
        {
          text: "Abrir la aplicación para mirar un gráfico de precios.",
          explanation:
            "No. Mirar precios o gráficos no mueve ningún activo y no genera nada que declarar. Un hecho imponible necesita una disposición, un pago o un ingreso reales.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c25-q3",
      prompt: "¿Cuál es la forma más fácil de sacar tu historial de transacciones de esta aplicación para tus registros fiscales?",
      options: [
        {
          text: "Intentar recordar cada operación al final del año.",
          explanation:
            "Reconstruir operaciones de memoria es doloroso y propenso a errores. Las fechas, las cantidades y los precios son difíciles de recordar con exactitud, que es justo el error que evita un buen registro.",
        },
        {
          text: "Hacer una captura de pantalla del gráfico de precios.",
          explanation:
            "Una captura de pantalla de un gráfico muestra un precio, no tus operaciones reales. No tiene ninguna de las fechas, cantidades ni comisiones que un contador necesita para calcular tus ganancias.",
        },
        {
          text: "Usar la subpestaña de Historial de operaciones de la pestaña de Registros y su exportación a CSV para descargar un archivo fechado de tus transacciones.",
          explanation:
            "Correcto. La pestaña de Registros anota tu actividad, y la exportación a CSV te da una hoja de cálculo ordenada y fechada que puedes entregarle a un contador o importar a herramientas fiscales, como volcar una caja de zapatos de recibos que ya está ordenada.",
        },
      ],
      correctIndex: 2,
    },
  ],
};
