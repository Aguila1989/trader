// PENDING — do not activate until green light.
import type { Chapter } from "../../../types";

export const chapter26: Chapter & { whoFor: string } = {
  id: "c26",
  number: 26,
  level: "BASIC",
  whoFor: "Para cualquiera que lea titulares sobre criptomonedas y se pregunte qué es real",
  title: "Cómo leer las noticias sobre criptomonedas con espíritu crítico",
  description:
    "Por qué las noticias sobre criptomonedas son diferentes, las tácticas de manipulación más comunes, como los esquemas de pump-and-dump y las alianzas falsas, cómo verificar una afirmación por ti mismo y en qué fuentes puedes confiar de verdad.",
  lessons: [
    {
      id: "c26-l1",
      title: "¿Por qué las noticias sobre criptomonedas son diferentes de las noticias normales?",
      paragraphs: [
        "En las noticias tradicionales, una historia suele pasar por editores y reporteros que se supone que comprueban los hechos antes de publicar. Las noticias sobre criptomonedas son diferentes porque cualquiera que tenga una cuenta puede publicar lo que sea, al instante, ante un público enorme. A menudo no hay ningún editor, ninguna verificación de datos y nadie que responda si la afirmación resulta ser falsa.",
        "Además, hay dinero de verdad en juego según el estado de ánimo. Cuando el precio de un token sube, quienes ya lo tienen se enriquecen, así que tienen un motivo poderoso para entusiasmar a todos los demás. Muchas de las voces más ruidosas en internet poseen justamente aquello de lo que hablan, y rara vez te lo dicen. Su objetivo puede ser mover un precio, no informarte.",
        "Esto no significa que cada publicación sea una mentira. Significa que deberías tratar una afirmación sobre criptomonedas como un dato sin verificar de un desconocido, no como un hecho confirmado. El resto de este capítulo te muestra los trucos más comunes y cómo comprobar las cosas por ti mismo.",
      ],
      example:
        "Piensa en la diferencia entre el artículo de un periódico y un folleto pegado a una farola. El periódico tiene un nombre detrás y puede rendir cuentas; el folleto podría haberlo impreso cualquiera, incluida una persona que se beneficia si tú te lo crees. La mayoría de las noticias sobre criptomonedas viven en la farola, así que léelas de esa manera.",
    },
    {
      id: "c26-l2",
      title: "¿Cuáles son las tácticas engañosas más comunes?",
      paragraphs: [
        "El truco más dañino es el pump-and-dump. Un grupo genera bombo alrededor de un token pequeño y barato por todas partes a la vez para que su precio se dispare. Los nuevos compradores se lanzan en medio del entusiasmo, y los promotores originales venden sus monedas en silencio aprovechando esa demanda. Después el precio se desploma, dejando a los que llegaron tarde con tokens que valen una fracción de lo que pagaron.",
        "Un pariente cercano es el shilling. Ocurre cuando alguien promociona un token a viva voz mientras oculta que lo posee y se beneficia si otros compran. La publicación parece un consejo amistoso e imparcial, pero quien la escribe tiene un interés económico que nunca menciona. Si un desconocido muestra un afán inusual por que compres algo, pregúntate qué gana él con ello.",
        "La tercera táctica es la alianza falsa. Es una afirmación inventada o exagerada de que un token está vinculado a una empresa famosa, usada para tomar prestada la confianza de esa empresa. Una captura de pantalla o un vago Estamos colaborando con un banco importante pueden disparar un precio antes de que nadie lo compruebe. Muy a menudo la gran empresa jamás ha oído hablar del token.",
      ],
      example:
        "Imagina un puesto ambulante en una plaza concurrida. Unos cuantos actores entre la gente anuncian a gritos que una pulsera corriente es una pieza rara de coleccionista y empiezan a pujar por ella al alza. Los curiosos, por no quedarse fuera, pagan precios altos. Luego los actores y el vendedor recogen y desaparecen, y la pulsera no es más que una pulsera. Ese entusiasmo montado es exactamente cómo funcionan juntos en internet un pump-and-dump, el shilling y una alianza falsa.",
    },
    {
      id: "c26-l3",
      title: "¿Cómo verificas una afirmación sobre un token?",
      paragraphs: [
        "Empieza por la fuente primaria. Si una publicación dice que un token lanzó una función nueva o firmó un acuerdo, busca el anuncio en el sitio web oficial del propio proyecto o en su cuenta verificada, no solo en la captura de pantalla que alguien volvió a compartir. Una afirmación que solo existe como una imagen reenviada, sin un original que puedas rastrear, es una señal de advertencia.",
        "Para un token de Stellar, puedes revisar los propios metadatos del emisor. Todo emisor serio publica un archivo stellar.toml, un pequeño archivo de texto que indica quiénes son y cómo contactarlos. Su ausencia es una señal de alarma. Las sugerencias semanales de trustlines de Atrium, que son solo de observación, ya leen este archivo y puntúan los tokens usando datos on-chain como la actividad de trading, la profundidad del libro de órdenes y cuántas cuentas tienen una trustline, lo cual es una medida de la adopción real. Puedes revisar tú mismo esas puntuaciones en lugar de fiarte de una publicación llena de bombo.",
        "Por último, si una afirmación menciona a un socio, ve y compruébalo con ese socio. Una alianza real suele confirmarse por ambas partes. Los datos on-chain son públicos, así que también puedes verificar que una billetera o una transacción de la que alguien presume existe realmente. Si la historia solo se sostiene en un único sitio y nadie independiente la confirma, trátala como no demostrada.",
      ],
      example:
        "Supón que un mensaje dice Un exchange famoso acaba de añadir CoinX. Antes de actuar, abres el propio sitio oficial de ese exchange y buscas CoinX. Si no está listado ahí, la afirmación no supera una comprobación básica, por mucha gente que la esté repitiendo. Un minuto mirando la fuente primaria vale más que una hora desplazándote por comentarios entusiasmados.",
    },
    {
      id: "c26-l4",
      title: "¿Qué fuentes son fiables?",
      paragraphs: [
        "La fuente más fiable es la primaria: el sitio web oficial del proyecto, sus cuentas verificadas y su archivo stellar.toml. Después vienen los exploradores de bloques, herramientas públicas que permiten a cualquiera consultar transacciones y saldos reales en la red. Como los exploradores de bloques leen directamente de la blockchain, muestran lo que ocurrió de verdad, no lo que alguien afirma que ocurrió.",
        "Los medios de noticias consolidados que emplean periodistas de verdad y corrigen sus errores son más de fiar que una cuenta anónima, aunque incluso los buenos medios pueden equivocarse con las historias sobre criptomonedas, así que contrasta cualquier cosa que te lleve a mover dinero. Desconfía especialmente de las cuentas anónimas, recién creadas, o que solo publican motivos para comprar. La confianza a gritos no es una prueba.",
        "Nada de esto es asesoramiento financiero, y las normas varían según el país, así que trátalo como hábitos para pensar con claridad y no como instrucciones sobre qué comprar. El capítulo sobre psicología del trading explica por qué el miedo y el entusiasmo nos hacen saltarnos estas comprobaciones justo cuando más las necesitamos.",
      ],
      example:
        "Trata una afirmación sobre criptomonedas como un comprador cuidadoso trata una reseña en internet. Una única reseña entusiasta de cinco estrellas de una cuenta recién creada no te dice casi nada. Un patrón de reseñas detalladas en varios sitios independientes y consolidados, respaldado por un recibo que puedas verificar, te dice mucho. Inclina tu confianza hacia las fuentes que se pueden comprobar y aléjala de la voz anónima más ruidosa.",
    },
  ],
  quiz: [
    {
      id: "c26-q1",
      prompt: "¿Por qué deberías tratar una afirmación sobre criptomonedas publicada en internet con más cautela que una historia en un periódico consolidado?",
      options: [
        {
          text: "Porque cualquiera puede publicar al instante sin editor ni verificación de datos, y quienes publican a menudo se benefician si te lo crees.",
          explanation:
            "Correcto. Las publicaciones sobre criptomonedas suelen saltarse la edición y la rendición de cuentas de las noticias tradicionales, y muchas voces ruidosas poseen el token que promocionan, así que su objetivo puede ser mover un precio en lugar de informarte.",
        },
        {
          text: "Porque las noticias sobre criptomonedas siempre las escriben periodistas profesionales que verifican cada dato.",
          explanation:
            "Es lo contrario. La mayoría de las afirmaciones sobre criptomonedas provienen de cuentas sin rendición de cuentas y sin verificación de datos, que es justamente por lo que hace falta una cautela extra.",
        },
        {
          text: "Porque los periódicos nunca se equivocan y los sitios de criptomonedas siempre sí.",
          explanation:
            "No. Ambos pueden equivocarse. La verdadera diferencia son la rendición de cuentas y los incentivos: quien publica sobre criptomonedas a menudo se beneficia directamente si actúas según su afirmación.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c26-q2",
      prompt: "De repente se genera bombo por todas partes alrededor de un token minúsculo y barato, su precio se dispara y luego se desploma justo después de que se amontonen nuevos compradores. ¿Cómo se llama este patrón?",
      options: [
        {
          text: "Un archivo stellar.toml.",
          explanation:
            "No. Un stellar.toml son metadatos del emisor que te ayudan a verificar quién está detrás de un token; es una herramienta de comprobación, no un patrón de estafa.",
        },
        {
          text: "Un explorador de bloques.",
          explanation:
            "No. Un explorador de bloques es una herramienta pública para consultar transacciones reales en la blockchain, no un esquema de manipulación.",
        },
        {
          text: "Un pump-and-dump.",
          explanation:
            "Correcto. Los promotores generan bombo alrededor del token para empujar el precio al alza, luego venden aprovechando a los nuevos compradores y dejan que se desplome, dejando a los que llegaron tarde con tokens que apenas valen nada.",
        },
        {
          text: "Una trustline.",
          explanation:
            "No. Una trustline es la aceptación que añades antes de tener un token no nativo; no tiene nada que ver con el patrón de bombo y desplome.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c26-q3",
      prompt: "Una publicación afirma que un token de Stellar acaba de aliarse con un banco famoso. ¿Cuál es la mejor manera de verificarlo?",
      options: [
        {
          text: "Comprar rápido antes de que el precio suba más, ya que una gran alianza es una noticia estupenda.",
          explanation:
            "No. Actuar antes de comprobar es justamente el reflejo en el que se apoya una alianza falsa. El entusiasmo no es una prueba.",
        },
        {
          text: "Revisar las fuentes primarias: el anuncio oficial del proyecto, el stellar.toml del emisor, los datos on-chain y si el socio nombrado también lo confirma.",
          explanation:
            "Correcto. Las alianzas reales suelen confirmarse por ambas partes, y los datos on-chain junto con el stellar.toml del emisor te permiten verificar la afirmación por ti mismo en lugar de fiarte de una captura de pantalla.",
        },
        {
          text: "Contar cuánta gente está volviendo a compartir la afirmación y confiar en ella si el número es alto.",
          explanation:
            "No. Que mucha gente repita una afirmación sin verificar no la hace cierta; puede significar simplemente que el bombo funcionó. Rastréala hasta una fuente primaria en su lugar.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
