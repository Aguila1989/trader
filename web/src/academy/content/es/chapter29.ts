// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// Advanced chapter on Trading Strategies (day/swing/HODL, dollar-cost averaging,
// risk/reward ratio, position sizing, and the power of doing nothing). Authored
// to the exact same shape as content/en/chapter01.ts, with the per-chapter
// `whoFor` one-liner typed via a local intersection so the live Chapter
// interface stays untouched until integration. This chapter owns no new glossary
// terms; it naturally reuses vocabulary introduced in earlier chapters.
import type { Chapter } from "../../types";

export const chapter29: Chapter & { whoFor: string } = {
  id: "c29",
  number: 29,
  level: "ADVANCED",
  whoFor: "Para quienes eligen un estilo y un tamaño de posición que encaje con ellos",
  title: "Estrategias de trading",
  description:
    "Day trading frente a swing trading frente a HODL, promediar el costo (dollar-cost averaging), el ratio riesgo/beneficio, el tamaño de la posición y el subestimado poder de no hacer nada.",
  lessons: [
    {
      id: "c29-l1",
      title: "Day trading, swing trading o HODL: ¿cuál se adapta a ti?",
      paragraphs: [
        "Estos tres estilos se diferencian sobre todo en el horizonte temporal. Quien hace day trading abre y cierra posiciones en cuestión de horas, tratando de capturar pequeños movimientos intradía y rara vez mantiene una posición de un día para otro. Quien hace swing trading la mantiene durante días o semanas, aprovechando una única tendencia o un giro y aceptando que los precios dan saltos mientras duerme. Quien hace HODL compra y mantiene durante meses o años, ignora el ruido y apuesta por la tesis a largo plazo de un activo como XLM o de un token para el que ha abierto una trustline.",
        "El esfuerzo crece con la velocidad. El day trading exige horas de atención concentrada frente a la pantalla, ejecución rápida y una disciplina estricta con las comisiones y el deslizamiento; en Stellar cada ejecución cuesta una comisión de red diminuta más las comisiones del pool de AMM del 0,30 % o el diferencial del SDEX, y esos costos se acumulan cuando operas a menudo. El swing trading requiere una revisión diaria y paciencia para aguantar las caídas. El HODL apenas necesita atención diaria, pero exige la fortaleza emocional para aguantar caídas profundas sin vender presa del pánico.",
        "El temperamento es el verdadero factor decisivo. Si vigilar la pantalla constantemente te genera estrés, el day trading te desgastará por muy buenas que parezcan las oportunidades. Si no soportas ver una posición en rojo durante una semana, el swing trading te sacará antes de tiempo. Sé honesto sobre el tiempo del que dispones y la volatilidad que puedes tolerar, y elige después el estilo más lento que aun así encaje con tus objetivos: más lento suele significar menos errores forzados y un costo acumulado más bajo.",
      ],
      example:
        "Supón que tienes XLM y quieres más exposición a USDC. Quien hace day trading podría hacer cinco pequeños viajes de ida y vuelta XLM/USDC antes del almuerzo, pagando comisiones cada vez. Quien hace swing trading colocaría una única entrada en una caída y la mantendría una semana a la espera de un movimiento mayor. Quien hace HODL simplemente conservaría el XLM y revisaría de vez en cuando la pestaña de semana o de año de la página de detalle del token. El mismo activo, tres estilos de vida completamente distintos: el correcto es aquel que puedes sostener sin quemarte.",
    },
    {
      id: "c29-l2",
      title: "¿Qué es promediar el costo (DCA)?",
      paragraphs: [
        "Promediar el costo (DCA) significa comprar una cantidad fija de un activo con una periodicidad fija, sin importar el precio de ese día. En lugar de intentar acertar la entrada perfecta, te comprometes, por ejemplo, a 50 USDC de XLM cada semana o cada mes. Cuando el precio está bajo, tu cantidad fija compra más unidades; cuando está alto, compra menos. Con el tiempo, tu costo medio se suaviza y nunca metes por accidente todo tu capital en el peor momento posible.",
        "El objetivo del DCA es eliminar la emoción y el momento de la decisión. Como la compra es mecánica, el FOMO no puede empujarte a comprar de más en una subida y el miedo no puede impedirte comprar en una caída: la periodicidad ya decidió por ti. Renuncia a la posibilidad de una entrada única con el momento perfectamente calculado a cambio de constancia y de muchísimas menos noches sin dormir. Funciona mejor con activos en los que crees a largo plazo, no con monedas que no querrías mantener durante una bajada.",
        "En esta aplicación no hay un botón de compra recurrente automática, así que el DCA es una disciplina que aplicas tú mismo: un recordatorio de calendario que se repite para colocar la misma orden de TÚ VENDES USDC / TÚ COMPRAS XLM en cada intervalo. Ten en cuenta que, en la mayoría de las jurisdicciones, cada compra es un evento imponible independiente, así que lleva un registro; esto es orientación educativa, no asesoramiento fiscal, y las normas varían según el país.",
      ],
      example:
        "Piensa en un plan de ahorro en el que apartas 50 EUR cada mes sin importar lo que haga el mercado. No estudias gráficos antes de cada aporte; simplemente ingresas el dinero el día uno de cada mes durante años. Si los precios caen, tus 50 EUR compran más sin hacer ruido; si suben, compran menos. Hacer DCA en XLM es exactamente el mismo hábito: 50 USDC fijos cada mes, ignorando el precio, sin emoción.",
    },
    {
      id: "c29-l3",
      title: "¿Qué es un ratio riesgo/beneficio y cómo se calcula?",
      paragraphs: [
        "El ratio beneficio/riesgo compara cuánto puedes ganar frente a cuánto puedes perder en una sola operación. Se calcula como la distancia desde tu entrada hasta tu precio objetivo dividida entre la distancia desde tu entrada hasta tu stop-loss. Un ratio de 3:1 significa que tu beneficio potencial es tres veces tu riesgo potencial: arriesgas una unidad para intentar ganar tres.",
        "Este ratio importa más que tu tasa de aciertos. Con un beneficio/riesgo de 3:1 puedes equivocarte más veces de las que aciertas y aun así salir ganando, porque cada acierto paga varias pérdidas. Una operación que solo ofrece 1:1 o algo peor te obliga a acertar casi siempre solo para no perder, lo cual es una forma frágil de operar. Muchos traders fijan un mínimo, como rechazar cualquier oportunidad por debajo de 2:1, para que las matemáticas jueguen a su favor a lo largo de muchas operaciones.",
        "El capítulo sobre Precio objetivo y precio de invalidación, anterior en la Academia, muestra cómo colocar estos dos niveles en una operación real dentro de esta aplicación: el objetivo es donde tu tesis da frutos y la invalidación es el precio que demuestra que te equivocaste. El analista de IA usa la misma idea: el beneficio/riesgo implícito en esos niveles condiciona una propuesta, de modo que una operación con demasiado poco beneficio para su riesgo se descarta antes de llegar siquiera a tu umbral de confianza. Fija primero los niveles y deja luego que el ratio te diga si vale la pena entrar.",
      ],
      example:
        "Compras XLM a 0,12 USDC. Fijas un objetivo de 0,15 (una ganancia de 0,03) y un stop-loss en 0,11 (una pérdida de 0,01). Beneficio/riesgo = 0,03 / 0,01 = 3:1. Aunque solo 4 de cada 10 operaciones de este tipo alcancen el objetivo y 6 toquen el stop, obtendrías aproximadamente +12 − 6 = +6 unidades de riesgo a lo largo de diez operaciones: rentable a pesar de perder más veces de las que ganas. Ese es el poder silencioso de insistir en un ratio favorable.",
    },
    {
      id: "c29-l4",
      title: "¿Qué es el tamaño de la posición y por qué es crucial?",
      paragraphs: [
        "El tamaño de la posición consiste en decidir cuánto de tu cartera comprometes en una sola operación para que una pérdida no pueda hacerte un daño grave. La regla habitual es arriesgar solo un pequeño porcentaje —a menudo del 1 % al 2 %— de tu cartera total en cualquier posición. Y algo fundamental: dimensionas a partir del riesgo, no de la emoción; primero eliges tu stop-loss y luego calculas qué tamaño de posición hace que ese stop cueste únicamente el porcentaje elegido si llega a tocarse.",
        "Esto es lo que te mantiene en el juego. Quien arriesga un 2 % por operación puede perder diez seguidas y aún conservar la mayor parte de su cartera para recuperarse; quien apuesta fuerte por convicción puede quedar arruinado por una sola mala decisión. Un buen dimensionamiento convierte una racha de pérdidas de una catástrofe en una caída superable, y por eso los profesionales lo consideran más importante que acertar con los ganadores.",
        "En esta aplicación, el factor de riesgo Tamaño de posición de la IA gobierna exactamente esto. Ajustado en BAJO, propone porciones pequeñas y conservadoras de tu saldo por operación; MEDIO y ALTO permiten posiciones progresivamente mayores. Funciona junto con un tope de trading estricto y una barrera de pausa por drawdown, de modo que la IA nunca puede apostar todo tu monedero en una sola idea sin que te enteres. El capítulo Configuración de riesgo de la IA: control total cubre la mecánica precisa de los seis factores; aquí basta con saber que la palanca de Tamaño de posición es tu cinturón de seguridad.",
      ],
      example:
        "Tu cartera es de 1000 USDC y limitas el riesgo al 2 % (20 USDC) por operación. Quieres comprar XLM a 0,12 con un stop en 0,11: un riesgo de 0,01 por unidad. Dividiendo tu presupuesto de riesgo de 20 USDC entre el riesgo de 0,01 por unidad, obtienes una posición de 2000 XLM (240 USDC). Si el stop se activa, pierdes exactamente 20 USDC —el 2 %— y no una fortuna. Las mismas matemáticas tanto si dimensionas a mano en la pestaña Manual como si te apoyas en el factor Tamaño de posición en BAJO de la IA.",
    },
    {
      id: "c29-l5",
      title: "Cuándo no hacer nada: el poder de mantener stablecoins",
      paragraphs: [
        "El efectivo es una posición. Elegir quedarte en una stablecoin como USDC y no colocar ninguna operación es una decisión legítima, y a menudo ganadora, no una falta de acción. Cuando los mercados están agitados, sin dirección, o solo ofrecen oportunidades con un mal beneficio/riesgo, la operación con el mayor valor esperado suele ser ninguna operación. Quedarte en USDC mantiene tu capital seco y listo para una oportunidad verdaderamente buena, en lugar de desangrarlo en operaciones marginales.",
        "El peligro el resto del tiempo es operar en exceso. Cada operación innecesaria paga comisiones y diferencial, invita al deslizamiento y le da otra oportunidad a la emoción para llevarte a un error. Forzar la acción por aburrimiento o por FOMO es la manera en que los buenos saldos se van encogiendo poco a poco. En Stellar, no hacer nada casi no cuesta nada más allá de la oportunidad de un movimiento que dejaste pasar, y una ganancia que se escapa es mucho más barata que una pérdida forzada.",
        "En la práctica, esto significa sentirse cómodo manteniendo tu saldo en USDC durante temporadas, observando los gráficos de detalle del token y las propuestas de la IA, y desplegar capital solo cuando una oportunidad supere tu propio listón. La IA también respeta esto: su barrera de pausa por drawdown detiene deliberadamente el trading tras una pérdida definida, imponiendo un periodo de enfriamiento. La paciencia es una estrategia, y USDC es donde esperas.",
      ],
      example:
        "A lo largo de una semana plana y lateral, la IA saca a la luz tres propuestas, cada una con un beneficio/riesgo mediocre de alrededor de 1,2:1 y una confianza por debajo de tu umbral. Un trader inquieto acepta las tres, paga comisiones en cada una y termina la semana ligeramente en negativo. Tú no haces nada, mantienes tu saldo en USDC y te quedas plano. Cuando por fin aparece una oportunidad limpia de 3:1 la semana siguiente, tienes el saldo completo listo para dimensionar la posición: recompensado por haber esperado.",
    },
  ],
  quiz: [
    {
      id: "c29-q1",
      prompt: "Tienes un trabajo a tiempo completo exigente, te disgusta pasar el tiempo mirando gráficos y puedes mantener una posición con comodidad durante una semana difícil. ¿Qué estilo se adapta más probablemente a ti?",
      options: [
        {
          text: "Day trading, porque cerrar cada posición dentro del mismo día es el enfoque más seguro.",
          explanation:
            "El day trading exige horas de atención concentrada frente a la pantalla y ejecución rápida, y sus frecuentes ejecuciones acumulan costos de red, de pool y de diferencial. No encaja ni con tu horario ni con tu rechazo a mirar gráficos.",
        },
        {
          text: "Swing trading o HODL, porque ambos toleran un horario sin dedicación constante y mantener la posición durante caídas de corto plazo.",
          explanation:
            "Correcto. Ambos estilos solo necesitan revisiones ocasionales y premian el temperamento de aguantar las caídas sin pánico: un encaje mucho mejor para una persona ocupada que se siente cómoda manteniendo la posición durante una semana difícil.",
        },
        {
          text: "El estilo que tenga los rendimientos teóricos más altos, sin importar tu temperamento.",
          explanation:
            "Enfoque equivocado. Un estilo que no puedes sostener lleva a errores forzados y al agotamiento. El mejor encaje es el estilo más lento que aun así cumpla tus objetivos, elegido en torno a tu tiempo y tu tolerancia.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c29-q2",
      prompt: "¿Qué describe mejor promediar el costo (DCA)?",
      options: [
        {
          text: "Comprar una cantidad fija con una periodicidad fija sin importar el precio actual.",
          explanation:
            "Correcto. Igual que ingresar 50 EUR en un plan de ahorro cada mes, el DCA compra la misma cantidad en cada intervalo —más unidades cuando está barato, menos cuando está caro— eliminando el momento y la emoción de la decisión.",
        },
        {
          text: "Esperar al único precio más bajo del año y comprarlo entonces todo de golpe.",
          explanation:
            "Eso es cronometrar el mercado con una compra única, lo contrario del DCA. Nadie acierta de forma fiable el mínimo anual, y el DCA existe precisamente para no necesitar hacerlo.",
        },
        {
          text: "Vender una fracción fija de tus tenencias cada vez que el precio sube.",
          explanation:
            "Eso describe una regla de salida escalonada o de toma de beneficios, no el DCA. Promediar el costo se trata de comprar de forma constante y programada, no de vender activado por el precio.",
        },
        {
          text: "Duplicar el tamaño de tu compra después de cada semana de pérdidas para recuperarte más rápido.",
          explanation:
            "Eso es una apuesta de promediar a la baja al estilo martingala, que hace crecer el riesgo de forma peligrosa. El DCA mantiene la cantidad fija a propósito, precisamente para que nunca se dispare.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c29-q3",
      prompt: "Entras en XLM a 0,12 USDC, fijas un objetivo en 0,18 y un stop-loss en 0,10. ¿Cuál es el ratio beneficio/riesgo?",
      options: [
        {
          text: "1:1: la operación es un cara o cruz.",
          explanation:
            "Incorrecto. El beneficio (0,18 − 0,12 = 0,06) y el riesgo (0,12 − 0,10 = 0,02) no son iguales, así que está lejos de ser 1:1.",
        },
        {
          text: "3:1: un beneficio de 0,06 dividido entre un riesgo de 0,02.",
          explanation:
            "Correcto. La distancia hasta el objetivo es 0,06 y la distancia hasta el stop es 0,02, así que 0,06 / 0,02 = 3:1. Arriesgas una unidad para intentar ganar tres, y puedes equivocarte más veces de las que aciertas y aun así ser rentable.",
        },
        {
          text: "0,33:1: estás arriesgando tres para ganar uno.",
          explanation:
            "Eso invierte la fórmula. El beneficio/riesgo divide la distancia hasta el objetivo entre la distancia hasta el stop, dando 3:1; el 1:3 invertido sería una mala oportunidad que normalmente deberías rechazar.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c29-q4",
      prompt: "¿Por qué se considera tan crucial el tamaño de la posición y cómo ayuda el factor de riesgo Tamaño de posición de la aplicación?",
      options: [
        {
          text: "Garantiza que cada operación sea rentable al elegir solo entradas ganadoras.",
          explanation:
            "Ninguna regla de dimensionamiento puede garantizar un acierto. El tamaño de la posición controla cuánto te cuesta una pérdida, no si la operación gana.",
        },
        {
          text: "Limita cuánto puede perjudicarte cualquier pérdida individual; el factor Tamaño de posición ajustado en BAJO propone porciones pequeñas y conservadoras por operación.",
          explanation:
            "Correcto. Arriesgar solo un pequeño porcentaje por operación te permite sobrevivir a una racha de pérdidas. El factor Tamaño de posición de la IA (BAJO/MEDIO/ALTO) escala la fracción del saldo por operación, junto con un tope de trading estricto y una barrera de pausa por drawdown.",
        },
        {
          text: "Deja que la IA apueste todo tu monedero en su única idea de mayor confianza.",
          explanation:
            "Lo contrario de un buen dimensionamiento. Un tope de trading estricto y la barrera de drawdown existen precisamente para que la IA nunca pueda apostar el monedero entero a una sola decisión.",
        },
        {
          text: "Reemplaza por completo la necesidad de un stop-loss.",
          explanation:
            "Al revés: el dimensionamiento se deriva de tu stop-loss. Primero eliges el stop y luego dimensionas de modo que tocarlo cueste únicamente el pequeño porcentaje que elegiste.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c29-q5",
      prompt: "Los mercados están agitados y toda oportunidad disponible ofrece solo un beneficio/riesgo mediocre por debajo de tu listón. ¿Cuál suele ser la mejor jugada?",
      options: [
        {
          text: "Forzar unas cuantas operaciones de todos modos para que tu capital esté siempre trabajando.",
          explanation:
            "Esto es operar en exceso. Cada operación marginal paga comisiones y diferencial, invita al deslizamiento y le da otra oportunidad a la emoción para equivocarse: una forma fiable de desangrar un saldo.",
        },
        {
          text: "No hacer nada y mantener tu saldo en USDC hasta que aparezca una oportunidad verdaderamente buena.",
          explanation:
            "Correcto. El efectivo es una posición. Quedarte en una stablecoin mantiene tu capital seco y listo, evita operaciones malas forzadas y casi no cuesta nada más allá de un movimiento que dejaste pasar: mucho más barato que una pérdida forzada.",
        },
        {
          text: "Cambiar a day trading para exprimir beneficio de los pequeños movimientos.",
          explanation:
            "Operar más rápido en un mercado sin dirección multiplica los costos y los errores en lugar de reducirlos. Las condiciones agitadas y de baja calidad piden paciencia, no más actividad.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
