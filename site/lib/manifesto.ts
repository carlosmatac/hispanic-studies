import { DISCORD } from './content';

/* Beltrán's manifesto (issue #116), in his three languages, verbatim from the
   source of record: docs/research/manifesto/IHS-Manifesto-English-Spanish-Portuguese.pdf
   (EN pp. 1-5, ES pp. 6-11, PT pp. 12-17). His words: never edit, shorten or
   "improve" them; a new version comes as a new PDF and replaces this table.
   The Mission page (/en/mission, /es/mision) shows the whole text; the home's
   Mission section shows the excerpt and the button he wrote for it.

   Inline marks, read by components/Manifesto.tsx: **bold** and *italic* as in
   the PDF, and [text](href) for the only two links we added (the Discord
   invite and the mailto: of the address he gives). The newsletter sentence
   stays text: the provider behind it is still parked. */

export const MANIFESTO_LANGS = ['en', 'es', 'pt'] as const;
export type ManifestoLang = (typeof MANIFESTO_LANGS)[number];

export type ManifestoSection = { n: number; title: string; body: string[] };
export type Manifesto = {
  title: string;
  intro: string[];
  sections: ManifestoSection[];
  /** his "Homepage mission excerpt" and its button, for the home only */
  excerpt: string;
  button: string;
};

const MAIL = 'hispanostudies@gmail.com';

export const MANIFESTO: Record<ManifestoLang, Manifesto> = {
  en: {
    title: 'Our Manifesto',
    intro: [
      'The Institute for Hispano Studies exists to recover, study, and transmit the intellectual inheritance of Hispanic civilization, embracing both the Spanish-speaking and Portuguese-speaking worlds. Through research, audiovisual production, translation, and publishing, we seek to give that inheritance a renewed capacity for common action.',
      'We are Hispanist, Social-Catholic, and communitarian. We believe that the peoples formed through this shared history have something worth defending—and a future worth building together.',
    ],
    sections: [
      { n: 1, title: 'Against the Black Legend of Spanish and American History', body: [
        'We oppose the Black Legend: the tradition of polemic that presents Spain and its civilization as uniquely cruel, backward, and incapable of contributing to human flourishing. Its consequences reach far beyond Spain. It teaches the peoples of the Americas to despise parts of their own inheritance and leaves Americans, including citizens of the United States, with an impoverished understanding of their history.',
        'The United States has Hispanic foundations. St. Augustine was founded in 1565; Santa Fe in 1610. In 1781, Bernardo de Gálvez’s victory at Pensacola helped the struggle for American independence. Florida, Louisiana, Texas, New Mexico, and California belong within the American story. So do the Indigenous, European, African, and mixed communities that built their Hispanic societies.',
        'American history is often told through the Pilgrims, Plymouth, Jamestown, westward expansion, and Ellis Island. But there is another American tradition: one whose roots reach back through the Atlantic crossing to Covadonga and Roman Hispania. One that discovers a New World, circumnavigates the globe, and transforms humanity’s knowledge of the planet. One that gives birth to human rights through its arguments about human dignity, legitimate authority, and the rights of peoples. One that evangelizes a continent. This is the Hispanic American tradition we are here to reclaim.',
        'We challenge accounts that erase this history, whether they appear in nationalist narratives, popular entertainment, or contemporary decolonial arguments. Our work begins with sources and holds its conclusions accountable to them. Historical wrongs require honest examination; inherited guilt offers no substitute for understanding.',
        'Americans of every ancestry have a stake in recovering this history.',
      ] },
      { n: 2, title: 'In Defense of the Catholic Church and the Evangelization of America', body: [
        'We defend the Catholic Church and the evangelization of the Americas as formative achievements of our civilization. The Christian conviction that every person possesses a dignity beyond the claims of worldly power gave Hispanic society a standard by which power itself could be judged.',
        'That conviction had intellectual and institutional consequences. In his 1539 lectures on the peoples of the Indies, Francisco de Vitoria defended Indigenous ownership and political authority against claims that unbelief deprived people of their rights. The School of Salamanca belongs to the Catholic tradition through which we understand the obligations of rulers and the rights of communities.',
        'We honor Our Lady of Guadalupe, Patroness of the Americas, whose place in the evangelization of the continent expresses the encounter between the Catholic faith and its American peoples.',
        'Catholicism has formed our moral imagination and our understanding of the human person. It lives in family obligations, public festivals, mourning, charity, and the language through which we recognize suffering and justice. Its influence reaches into the psychological and cultural lives of people who no longer practice the faith.',
        'The devout Catholic and the secular heir of this civilization inhabit a world profoundly shaped by the Church. To make hatred of Catholicism a condition of cultural emancipation is to demand that our peoples sever themselves from that inheritance.',
        '**Anti-Catholicism is a civilizational amputation.**',
      ] },
      { n: 3, title: 'In Defense of Mestizaje', body: [
        'We defend *mestizaje* in both its biological and cultural reality: the formation of families across ancestral lines and the creation of shared ways of life through the encounter of peoples.',
        'European, Indigenous, African, and Asian contributions belong to Hispanic history. Their encounters produced new communities, forms of expression, and ways of belonging. We claim this history in its fullness, including the struggles through which people built lives together within unequal societies.',
        'We use *Hispanic* in its broad civilizational sense, embracing those who inherit the political, cultural, linguistic, and spiritual world forged through the great imperial histories of Hispania: Spain and Portugal. This understanding includes Brazil and the wider Portuguese inheritance.',
        'Belonging extends across differences of ancestry and appearance. It carries a responsibility to understand what we have received and to transmit it. Mestizaje gives that responsibility a human face in our own families.',
      ] },
      { n: 4, title: 'In Defense of Spanish, Portuguese, and Iberofonía', body: [
        'Spanish and Portuguese connect peoples across the Americas, Europe, Africa, and Asia. Together, they sustain the worldwide community we call *Iberofonía*.',
        'We regard the cultural vitality of this world as unrivaled among the heirs of Christian civilization. Its literature, religious life, music, and ordinary speech continue to give new expression to a shared inheritance.',
        'These languages give our peoples the means to think together, exchange knowledge, and undertake common projects. Their defense requires serious writing, translation, teaching, and publishing. It requires the confidence to produce ideas in our own languages and expect them to matter.',
        'The Institute will bring Spanish-speaking and Portuguese-speaking intellectual life into closer conversation. English will carry that work to the many heirs of Hispanic civilization who now encounter their history through it, and to readers beyond our communities.',
      ] },
      { n: 5, title: 'Heirs to a Tradition of Reunification', body: [
        'We inherit a long argument about how the peoples of our civilization can recover the capacity to act together. Its overlapping currents have carried many names: Hispanism, Panhispanism, Iberianism, Paniberianism, and projects of the *Patria Grande*.',
        'The problem of fragmentation was already evident during the independence era. Bolívar’s Congress of Panama in 1826 sought an association of the new American republics. Later projects pursued different forms of unity, including renewed relations with Spain and Portugal.',
        'Modern Hispanism developed through the nineteenth century and gained urgency in confrontation with expanding United States power. The Monroe Doctrine of 1823 and later versions of U.S.-led Pan-Americanism formed part of that setting. We reject the claim that hemispheric solidarity requires political subordination to Washington. Under that claim, “America for the Americans” becomes America for Anglo-American power.',
        'The Spanish-American War of 1898 brought the question of civilizational survival into sharp focus. Spain’s defeat extended U.S. power into the Caribbean and the Pacific. Writers on both sides of the Atlantic reconsidered their relationship to one another; the Philippines also belonged to the world whose future was being contested.',
        'We understand this crisis as a confrontation with an ascendant imperial order whose Anglo-Protestant assumptions repeatedly devalued the foundations of Hispanic unity: Spanish and Portuguese, the Catholic inheritance, and a civilization formed through mestizaje.',
        'Our immediate task is to rebuild the intellectual, cultural, and institutional connections through which our peoples can undertake common projects. The political forms that a renewed unity might take remain a question for serious study and debate.',
      ] },
      { n: 6, title: 'Many Hispanisms, a Shared Civilizational Question', body: [
        'Since 1898, these debates have developed through an intercontinental exchange that crosses the boundaries of modern political ideologies. Monarchists, republicans, liberals, socialists, Marxists, Catholic traditionalists, and Falangists have advanced different conceptions of Hispanic unity. Portuguese and Brazilian thinkers have contributed their own accounts of the Iberian inheritance and its future.',
        'These traditions disagree about authority, economics, religion, and the political form that unity should take. Those disagreements belong in the record. Every current must be read in context and its arguments examined on their merits.',
        'Publishing a thinker makes their work available for examination; it does not commit the Institute to every doctrine or political undertaking associated with them.',
        'No single party owns this inheritance. The familiar division between left and right cannot adequately describe the range of people who have sought civilizational unity across differences of nationality, ancestry, and political allegiance.',
        'Our own position is Hispanist, Social-Catholic, and communitarian. From that position, we will study the different Hispanisms seriously and pursue cooperation wherever a commitment to civilizational unity makes it possible.',
      ] },
      { n: 7, title: 'Our Task: Five Centuries of Thought and a Community to Carry It Forward', body: [
        'The principal goal of the Institute for Hispano Studies is to recover, organize, and make accessible five centuries of Hispanic theology, political theory, and philosophy across the Spanish- and Portuguese-speaking worlds. We will bring this intellectual inheritance to readers in English, Spanish, and Portuguese.',
        'Much has been said about Hispanic fiction, from *Don Quixote* to magical realism. Far less attention has gone to the nonfiction: the political thought, cultural criticism, theology, and legal debates of the Spanish- and Portuguese-speaking worlds. Global readers have had fewer opportunities to encounter this tradition on its own terms. **We’re here to change that.**',
        'Our scope extends from the theologians and jurists who debated conquest, sovereignty, and natural law to the thinkers who confronted independence, national identity, economic dependence, and the possibilities of civilizational renewal. Within this wider undertaking, the consolidation of more than a century and a half of thought on Hispanic reunification into a systematic theoretical canon remains a central commitment.',
        'English, Spanish, and Portuguese are our three working languages in América. Through them, we will connect readers and collaborators whose access to this tradition has been divided by language, national education, and the availability of books.',
        'We will pursue this work through three commitments.',
        '**First, audiovisual production.** We will produce short-form and long-form videos, interviews, and podcasts that bring a Hispanic voice into contemporary cultural debates. We will challenge the Black Legend, introduce the thinkers of our tradition, explain their arguments, and give viewers the sources they need to continue studying.',
        '**Second, translation and publishing.** Through De Indiis Editions, we will translate, publish, and republish works of theology, philosophy, political theory, cultural criticism, and legal thought. The writings of the School of Salamanca belong in this undertaking alongside Argentina’s Manuel Ugarte, Mexico’s José Vasconcelos, Brazil’s Gilberto Freyre, Spain’s Gustavo Bueno, and the debates of the present. Through new translations, recovered texts, and introductory studies, readers will be able to encounter these authors directly, understand their disagreements, and enter the tradition through the questions closest to their own experience.',
        '**Third, the formation of an intercontinental, trilingual legion of warrior-scholars:** people whose discipline is serious study and whose commitment takes practical form in the work they undertake together. A Pan-Iberian vision of civilizational regeneration needs academics, translators, language teachers, content creators, graphic designers, documentarians, programmers, entrepreneurs, writers, clergy, and students.',
        'The Institute is an invitation to put those abilities to work.',
        '**Subscribe to our newsletter and receive a free PDF of *Hispanic Reunification: 200 Years of Theory and Praxis*, published by De Indiis Editions.**',
        `[Join our Discord server](${DISCORD.url}) to meet fellow readers and collaborators. Write to [${MAIL}](mailto:${MAIL}) with a question, a collaboration, or a project you want to develop.`,
        '**We want to hear from you.**',
      ] },
    ],
    excerpt: 'The Institute for Hispano Studies recovers and transmits five centuries of theology, philosophy, and political thought from the Spanish- and Portuguese-speaking worlds. Our position is Hispanist, Social-Catholic, and communitarian. Through audiovisual production, translation, and publishing, we challenge the Black Legend and make this intellectual inheritance accessible in English, Spanish, and Portuguese. The tradition of Hispanic reunification stands at the heart of our work. We bring readers and collaborators together to study these ideas and build common projects.',
    button: 'Read Our Manifesto',
  },
  es: {
    title: 'Nuestro manifiesto',
    intro: [
      'El Instituto de Estudios Hispanos existe para recuperar, estudiar y transmitir el legado intelectual de la civilización hispánica, que comprende tanto el mundo de habla española como el de habla portuguesa. A través de la investigación, la producción audiovisual, la traducción y la edición, buscamos renovar la capacidad de nuestros pueblos para actuar conjuntamente sobre la base de ese legado.',
      'Somos hispanistas, socialcatólicos y comunitaristas. Creemos que los pueblos formados a través de esta historia compartida tienen algo que merece ser defendido y un futuro que merece ser construido en común.',
    ],
    sections: [
      { n: 1, title: 'Contra la Leyenda Negra de la historia española y americana', body: [
        'Nos oponemos a la Leyenda Negra: la tradición polémica que presenta a España y a su civilización como excepcionalmente crueles, atrasadas e incapaces de contribuir al desarrollo humano. Sus consecuencias trascienden ampliamente las fronteras españolas. Enseña a los pueblos de América a despreciar parte de su propia herencia y deja a los americanos, incluidos los ciudadanos de Estados Unidos, con una comprensión empobrecida de su historia.',
        'Estados Unidos tiene fundamentos hispánicos. San Agustín fue fundado en 1565; Santa Fe, en 1610. En 1781, la victoria de Bernardo de Gálvez en Pensacola contribuyó a la lucha por la independencia estadounidense. Florida, Luisiana, Texas, Nuevo México y California forman parte de la historia americana. También las comunidades indígenas, europeas, africanas y mestizas que construyeron sus sociedades hispánicas.',
        'La historia de Estados Unidos suele contarse a través de los Padres Peregrinos, Plymouth, Jamestown, la expansión hacia el oeste y Ellis Island. Pero existe otra tradición americana: una cuyas raíces se remontan, a través de la travesía atlántica, hasta Covadonga y la Hispania romana. Una que descubre un Nuevo Mundo, circunnavega el globo y transforma el conocimiento de la humanidad sobre el planeta. Una que da origen a los derechos humanos mediante sus argumentos sobre la dignidad humana, la autoridad legítima y los derechos de los pueblos. Una que evangeliza un continente. Esta es la tradición hispanoamericana que venimos a reivindicar.',
        'Cuestionamos los relatos que borran esta historia, ya aparezcan en narrativas nacionalistas, en el entretenimiento popular o en los argumentos decoloniales contemporáneos. Nuestro trabajo parte de las fuentes y somete sus conclusiones a ellas. Las injusticias históricas exigen un examen honesto; la culpa heredada no sustituye a la comprensión.',
        'Los americanos de cualquier ascendencia tienen motivos para recuperar esta historia.',
      ] },
      { n: 2, title: 'En defensa de la Iglesia católica y de la evangelización de América', body: [
        'Defendemos a la Iglesia católica y la evangelización de América como realizaciones constitutivas de nuestra civilización. La convicción cristiana de que toda persona posee una dignidad que trasciende las pretensiones del poder terrenal proporcionó a la sociedad hispánica un criterio desde el cual juzgar al propio poder.',
        'Esta convicción tuvo consecuencias intelectuales e institucionales. En sus lecciones de 1539 sobre los pueblos de las Indias, Francisco de Vitoria defendió la propiedad y la autoridad política indígenas frente a quienes sostenían que la falta de fe cristiana privaba a esos pueblos de sus derechos. La Escuela de Salamanca pertenece a la tradición católica desde la cual comprendemos las obligaciones de los gobernantes y los derechos de las comunidades.',
        'Honramos a Nuestra Señora de Guadalupe, Patrona de las Américas, cuyo lugar en la evangelización del continente expresa el encuentro entre la fe católica y los pueblos americanos.',
        'El catolicismo ha formado nuestra sensibilidad moral y nuestra concepción de la persona humana. Está presente en las obligaciones familiares, las fiestas populares, el duelo, la caridad y el lenguaje mediante el cual reconocemos el sufrimiento y la justicia. Su influencia alcanza la vida psicológica y cultural de quienes ya no practican la fe.',
        'El católico devoto y el heredero secular de esta civilización habitan un mundo profundamente configurado por la Iglesia. Convertir el odio al catolicismo en una condición de emancipación cultural equivale a exigir que nuestros pueblos se separen de esa herencia.',
        '**El anticatolicismo es una amputación civilizatoria.**',
      ] },
      { n: 3, title: 'En defensa del mestizaje', body: [
        'Defendemos el *mestizaje* en su realidad tanto biológica como cultural: la formación de familias entre personas de distintas ascendencias y la creación de formas de vida compartidas mediante el encuentro entre pueblos.',
        'Las aportaciones europeas, indígenas, africanas y asiáticas forman parte de la historia hispánica. Sus encuentros produjeron nuevas comunidades, formas de expresión y vínculos de pertenencia. Reivindicamos esta historia en toda su amplitud, incluidas las luchas mediante las cuales las personas construyeron vidas en común dentro de sociedades desiguales.',
        'Utilizamos el término *hispánico* en su sentido civilizatorio amplio, que comprende a quienes heredan el mundo político, cultural, lingüístico y espiritual forjado a través de las grandes trayectorias imperiales de Hispania: España y Portugal. Esta concepción incluye a Brasil y al conjunto de la herencia portuguesa.',
        'La pertenencia a esta civilización trasciende las diferencias de ascendencia y apariencia. Implica la responsabilidad de comprender lo que hemos recibido y transmitirlo. El mestizaje da a esa responsabilidad un rostro humano en nuestras propias familias.',
      ] },
      { n: 4, title: 'En defensa del español, del portugués y de la Iberofonía', body: [
        'El español y el portugués conectan a pueblos de América, Europa, África y Asia. Juntos sostienen la comunidad mundial que llamamos *Iberofonía*.',
        'Consideramos que la vitalidad cultural de este mundo no tiene parangón entre los herederos de la civilización cristiana. Su literatura, su vida religiosa, su música y su habla cotidiana siguen dando nuevas expresiones a una herencia compartida.',
        'Estas lenguas proporcionan a nuestros pueblos los medios para pensar juntos, intercambiar conocimientos y emprender proyectos comunes. Su defensa exige un trabajo riguroso de escritura, traducción, enseñanza y edición. Exige la confianza necesaria para producir ideas en nuestras propias lenguas y esperar que tengan relevancia.',
        'El Instituto estrechará el diálogo entre la vida intelectual de habla española y la de habla portuguesa. El inglés llevará este trabajo a los numerosos herederos de la civilización hispánica que hoy se acercan a su historia a través de esa lengua, así como a lectores de otras comunidades.',
      ] },
      { n: 5, title: 'Herederos de una tradición de reunificación', body: [
        'Heredamos un largo debate sobre cómo los pueblos de nuestra civilización pueden recuperar la capacidad de actuar conjuntamente. Sus corrientes, a menudo entrelazadas, han recibido muchos nombres: hispanismo, panhispanismo, iberismo, paniberismo y proyectos de la *Patria Grande*.',
        'El problema de la fragmentación ya era evidente durante la época de las independencias. El Congreso de Panamá convocado por Bolívar en 1826 buscó una asociación entre las nuevas repúblicas americanas. Proyectos posteriores persiguieron distintas formas de unidad, incluida la renovación de los vínculos con España y Portugal.',
        'El hispanismo moderno se desarrolló a lo largo del siglo XIX y adquirió mayor urgencia ante la expansión del poder estadounidense. La Doctrina Monroe de 1823 y las posteriores versiones del panamericanismo dirigido por Estados Unidos formaron parte de ese contexto. Rechazamos que la solidaridad hemisférica exija la subordinación política a Washington. Bajo esa premisa, «América para los americanos» se convierte en América para el poder angloamericano.',
        'La guerra hispano-estadounidense de 1898 situó en primer plano la cuestión de la supervivencia civilizatoria. La derrota de España extendió el poder estadounidense por el Caribe y el Pacífico. Escritores de ambos lados del Atlántico reconsideraron sus relaciones mutuas; Filipinas también formaba parte de aquel mundo cuyo futuro estaba en disputa.',
        'Entendemos esta crisis como una confrontación con un orden imperial ascendente cuyos presupuestos angloprotestantes desvalorizaron repetidamente los fundamentos de la unidad hispánica: el español y el portugués, la herencia católica y una civilización formada mediante el mestizaje.',
        'Nuestra tarea inmediata es reconstruir los vínculos intelectuales, culturales e institucionales mediante los cuales nuestros pueblos puedan emprender proyectos comunes. Las formas políticas que pudiera adoptar una unidad renovada siguen siendo una cuestión abierta al estudio y al debate rigurosos.',
      ] },
      { n: 6, title: 'Muchos hispanismos, una cuestión civilizatoria compartida', body: [
        'Desde 1898, estos debates se han desarrollado mediante un intercambio intercontinental que atraviesa las fronteras de las ideologías políticas modernas. Monárquicos, republicanos, liberales, socialistas, marxistas, tradicionalistas católicos y falangistas han planteado distintas concepciones de la unidad hispánica. Los pensadores portugueses y brasileños han aportado sus propias interpretaciones de la herencia ibérica y de su futuro.',
        'Estas tradiciones discrepan sobre la autoridad, la economía, la religión y la forma política que debería adoptar la unidad. Esas discrepancias forman parte de su historia. Cada corriente debe leerse en su contexto y sus argumentos deben examinarse por sus propios méritos.',
        'Publicar a un pensador permite que su obra sea estudiada; no compromete al Instituto con todas las doctrinas o iniciativas políticas asociadas a él.',
        'Ningún partido posee esta herencia en su totalidad. La división habitual entre izquierda y derecha no describe adecuadamente la diversidad de quienes han buscado la unidad civilizatoria por encima de las diferencias de nacionalidad, ascendencia y adscripción política.',
        'Nuestra propia posición es hispanista, socialcatólica y comunitarista. Desde ella estudiaremos seriamente los distintos hispanismos y buscaremos la cooperación allí donde el compromiso con la unidad civilizatoria la haga posible.',
      ] },
      { n: 7, title: 'Nuestra tarea: cinco siglos de pensamiento y una comunidad que les dé continuidad', body: [
        'El objetivo principal del Instituto de Estudios Hispanos es recuperar, organizar y hacer accesibles cinco siglos de teología, teoría política y filosofía hispánicas del mundo de habla española y portuguesa. Acercaremos este legado intelectual a los lectores en inglés, español y portugués.',
        'Mucho se ha dicho sobre la ficción hispánica, desde *Don Quijote* hasta el realismo mágico. Mucha menos atención ha recibido la no ficción: el pensamiento político, la crítica cultural, la teología y los debates jurídicos de los mundos de habla española y portuguesa. Los lectores de todo el mundo han tenido menos oportunidades de conocer esta tradición en sus propios términos. **Estamos aquí para cambiar eso.**',
        'Nuestro ámbito de trabajo abarca desde los teólogos y juristas que debatieron sobre la conquista, la soberanía y el derecho natural hasta los pensadores que abordaron la independencia, la identidad nacional, la dependencia económica y las posibilidades de renovación civilizatoria. Dentro de esta tarea más amplia, sigue siendo un compromiso central consolidar más de siglo y medio de pensamiento sobre la reunificación hispánica en un canon teórico sistemático.',
        'El inglés, el español y el portugués son nuestras tres lenguas de trabajo en América. A través de ellas conectaremos a lectores y colaboradores cuyo acceso a esta tradición ha estado condicionado por las barreras lingüísticas, los sistemas educativos nacionales y la disponibilidad de libros.',
        'Llevaremos a cabo esta labor mediante tres compromisos.',
        '**Primero, la producción audiovisual.** Produciremos vídeos breves y de larga duración, entrevistas y pódcast que aporten una voz hispánica a los debates culturales contemporáneos. Combatiremos la Leyenda Negra, presentaremos a los pensadores de nuestra tradición, explicaremos sus argumentos y proporcionaremos a los espectadores las fuentes necesarias para seguir estudiando.',
        '**Segundo, la traducción y la edición.** A través de De Indiis Editions traduciremos, publicaremos y reeditaremos obras de teología, filosofía, teoría política, crítica cultural y pensamiento jurídico. Los escritos de la Escuela de Salamanca tienen cabida en este proyecto junto a los del argentino Manuel Ugarte, el mexicano José Vasconcelos, el brasileño Gilberto Freyre, el español Gustavo Bueno y los debates del presente. Mediante nuevas traducciones, textos recuperados y estudios introductorios, los lectores podrán conocer directamente a estos autores, comprender sus desacuerdos y adentrarse en la tradición a través de las cuestiones más cercanas a su propia experiencia.',
        '**Tercero, la formación de una legión intercontinental y trilingüe de guerreros intelectuales:** personas cuya disciplina sea el estudio riguroso y cuyo compromiso se traduzca en el trabajo que emprendan juntas. Una visión panibérica de regeneración civilizatoria necesita académicos, traductores, profesores de idiomas, creadores de contenido, diseñadores gráficos, documentalistas, programadores, empresarios, escritores, clérigos y estudiantes.',
        'El Instituto es una invitación a poner esas capacidades al servicio de una tarea común.',
        '**Suscríbete a nuestro boletín y recibe gratuitamente un PDF de *Reunificación hispánica: 200 años de teoría y praxis*, publicado por De Indiis Editions.**',
        `[Únete a nuestro servidor de Discord](${DISCORD.url}) para conocer a otros lectores y colaboradores. Escríbenos a [${MAIL}](mailto:${MAIL}) con una pregunta, una propuesta de colaboración o un proyecto que quieras desarrollar.`,
        '**Queremos escucharte.**',
      ] },
    ],
    excerpt: 'El Instituto de Estudios Hispanos recupera y transmite cinco siglos de teología, filosofía y pensamiento político de los mundos de habla española y portuguesa. Nuestra posición es hispanista, socialcatólica y comunitarista. Mediante la producción audiovisual, la traducción y la edición, combatimos la Leyenda Negra y hacemos accesible este legado intelectual en inglés, español y portugués. La tradición de reunificación hispánica ocupa un lugar central en nuestra labor. Reunimos a lectores y colaboradores para estudiar estas ideas y construir proyectos comunes.',
    button: 'Lee nuestro manifiesto',
  },
  pt: {
    title: 'Nosso Manifesto',
    intro: [
      'O Instituto de Estudos Hispanos existe para recuperar, estudar e transmitir o legado intelectual da civilização hispânica, que abrange tanto o mundo de língua espanhola como o de língua portuguesa. Por meio da investigação, da produção audiovisual, da tradução e da edição, procuramos renovar a capacidade dos nossos povos de agir em conjunto com base nesse legado.',
      'Somos hispanistas, social-católicos e comunitaristas. Acreditamos que os povos formados por essa história partilhada têm algo que merece ser defendido e um futuro que merece ser construído em comum.',
    ],
    sections: [
      { n: 1, title: 'Contra a Lenda Negra da História Espanhola e Americana', body: [
        'Opomo-nos à Lenda Negra: a tradição polémica que apresenta a Espanha e a sua civilização como excecionalmente cruéis, atrasadas e incapazes de contribuir para o florescimento humano. As suas consequências ultrapassam amplamente as fronteiras espanholas. Ensina os povos das Américas a desprezar partes da sua própria herança e deixa os americanos, incluindo os cidadãos dos Estados Unidos, com uma compreensão empobrecida da sua história.',
        'Os Estados Unidos têm fundamentos hispânicos. Santo Agostinho foi fundado em 1565; Santa Fé, em 1610. Em 1781, a vitória de Bernardo de Gálvez em Pensacola contribuiu para a luta pela independência norte-americana. A Flórida, a Luisiana, o Texas, o Novo México e a Califórnia fazem parte da história americana. Também fazem parte dela as comunidades indígenas, europeias, africanas e mestiças que construíram as suas sociedades hispânicas.',
        'A história dos Estados Unidos é frequentemente contada através dos Pais Peregrinos, de Plymouth, de Jamestown, da expansão para o Oeste e de Ellis Island. Mas existe outra tradição americana: uma cujas raízes remontam, através da travessia atlântica, a Covadonga e à Hispânia romana. Uma que descobre um Novo Mundo, circum-navega o globo e transforma o conhecimento da humanidade sobre o planeta. Uma que dá origem aos direitos humanos por meio dos seus argumentos sobre a dignidade humana, a autoridade legítima e os direitos dos povos. Uma que evangeliza um continente. Esta é a tradição hispano-americana que estamos aqui para reivindicar.',
        'Questionamos os relatos que apagam essa história, quer apareçam em narrativas nacionalistas, no entretenimento popular ou nos argumentos decoloniais contemporâneos. O nosso trabalho parte das fontes e submete as suas conclusões ao escrutínio dessas mesmas fontes. As injustiças históricas exigem um exame honesto; a culpa herdada não substitui a compreensão.',
        'Os americanos de qualquer ascendência têm motivos para recuperar essa história.',
      ] },
      { n: 2, title: 'Em Defesa da Igreja Católica e da Evangelização das Américas', body: [
        'Defendemos a Igreja Católica e a evangelização das Américas como realizações constitutivas da nossa civilização. A convicção cristã de que toda a pessoa possui uma dignidade que transcende as pretensões do poder terreno proporcionou à sociedade hispânica um critério a partir do qual o próprio poder podia ser julgado.',
        'Essa convicção teve consequências intelectuais e institucionais. Nas suas lições de 1539 sobre os povos das Índias, Francisco de Vitoria defendeu a propriedade e a autoridade política indígenas contra aqueles que sustentavam que a ausência da fé cristã privava esses povos dos seus direitos. A Escola de Salamanca pertence à tradição católica a partir da qual compreendemos as obrigações dos governantes e os direitos das comunidades.',
        'Honramos Nossa Senhora de Guadalupe, Padroeira das Américas, cujo lugar na evangelização do continente expressa o encontro entre a fé católica e os povos americanos.',
        'O catolicismo formou a nossa sensibilidade moral e a nossa conceção da pessoa humana. Está presente nas obrigações familiares, nas festas populares, no luto, na caridade e na linguagem através da qual reconhecemos o sofrimento e a justiça. A sua influência alcança a vida psicológica e cultural de quem já não pratica a fé.',
        'O católico devoto e o herdeiro secular desta civilização habitam um mundo profundamente moldado pela Igreja. Transformar o ódio ao catolicismo numa condição de emancipação cultural equivale a exigir que os nossos povos se separem dessa herança.',
        '**O anticatolicismo é uma amputação civilizacional.**',
      ] },
      { n: 3, title: 'Em Defesa da Mestiçagem', body: [
        'Defendemos a *mestiçagem* na sua realidade tanto biológica como cultural: a formação de famílias entre pessoas de diferentes ascendências e a criação de formas de vida partilhadas por meio do encontro entre povos.',
        'As contribuições europeias, indígenas, africanas e asiáticas fazem parte da história hispânica. Os seus encontros produziram novas comunidades, formas de expressão e vínculos de pertença. Reivindicamos essa história em toda a sua amplitude, incluindo as lutas através das quais as pessoas construíram vidas em comum dentro de sociedades desiguais.',
        'Utilizamos o termo *hispânico* no seu sentido civilizacional amplo, abrangendo aqueles que herdam o mundo político, cultural, linguístico e espiritual forjado pelas grandes trajetórias imperiais da Hispânia: Espanha e Portugal. Esta conceção inclui o Brasil e o conjunto da herança portuguesa.',
        'A pertença a esta civilização transcende as diferenças de ascendência e aparência. Implica a responsabilidade de compreender aquilo que recebemos e de o transmitir. A mestiçagem dá a essa responsabilidade um rosto humano nas nossas próprias famílias.',
      ] },
      { n: 4, title: 'Em Defesa do Espanhol, do Português e da Iberofonia', body: [
        'O espanhol e o português ligam povos das Américas, da Europa, de África e da Ásia. Juntos, sustentam a comunidade mundial a que chamamos *Iberofonia*.',
        'Consideramos que a vitalidade cultural deste mundo não tem paralelo entre os herdeiros da civilização cristã. A sua literatura, a sua vida religiosa, a sua música e a sua fala quotidiana continuam a dar novas expressões a uma herança partilhada.',
        'Estas línguas proporcionam aos nossos povos os meios para pensar em conjunto, trocar conhecimentos e empreender projetos comuns. A sua defesa exige um trabalho rigoroso de escrita, tradução, ensino e edição. Exige a confiança necessária para produzir ideias nas nossas próprias línguas e esperar que tenham relevância.',
        'O Instituto estreitará o diálogo entre a vida intelectual de língua espanhola e a de língua portuguesa. O inglês levará este trabalho aos numerosos herdeiros da civilização hispânica que hoje se aproximam da sua história através dessa língua, assim como a leitores de outras comunidades.',
      ] },
      { n: 5, title: 'Herdeiros de uma Tradição de Reunificação', body: [
        'Herdamos um longo debate sobre como os povos da nossa civilização podem recuperar a capacidade de agir em conjunto. As suas correntes, frequentemente entrelaçadas, receberam muitos nomes: hispanismo, pan-hispanismo, iberismo, pan-iberismo e projetos da *Pátria Grande*.',
        'O problema da fragmentação já era evidente durante a época das independências. O Congresso do Panamá, convocado por Bolívar em 1826, procurou estabelecer uma associação entre as novas repúblicas americanas. Projetos posteriores procuraram diferentes formas de unidade, incluindo a renovação dos vínculos com Espanha e Portugal.',
        'O hispanismo moderno desenvolveu-se ao longo do século XIX e adquiriu maior urgência perante a expansão do poder dos Estados Unidos. A Doutrina Monroe de 1823 e as versões posteriores do pan-americanismo dirigido pelos Estados Unidos fizeram parte desse contexto. Rejeitamos a ideia de que a solidariedade hemisférica exige a subordinação política a Washington. Sob essa premissa, «A América para os americanos» transforma-se em América para o poder anglo-americano.',
        'A Guerra Hispano-Americana de 1898 colocou em primeiro plano a questão da sobrevivência civilizacional. A derrota de Espanha estendeu o poder dos Estados Unidos pelas Caraíbas e pelo Pacífico. Escritores de ambos os lados do Atlântico reconsideraram as suas relações mútuas; as Filipinas também faziam parte daquele mundo cujo futuro estava em disputa.',
        'Entendemos esta crise como um confronto com uma ordem imperial ascendente cujos pressupostos anglo-protestantes desvalorizaram repetidamente os fundamentos da unidade hispânica: o espanhol e o português, a herança católica e uma civilização formada pela mestiçagem.',
        'A nossa tarefa imediata é reconstruir os vínculos intelectuais, culturais e institucionais através dos quais os nossos povos possam empreender projetos comuns. As formas políticas que uma unidade renovada poderá assumir continuam a ser uma questão aberta ao estudo e ao debate rigorosos.',
      ] },
      { n: 6, title: 'Muitos Hispanismos, uma Questão Civilizacional Partilhada', body: [
        'Desde 1898, estes debates desenvolveram-se por meio de um intercâmbio intercontinental que atravessa as fronteiras das ideologias políticas modernas. Monárquicos, republicanos, liberais, socialistas, marxistas, tradicionalistas católicos e falangistas propuseram diferentes conceções da unidade hispânica. Os pensadores portugueses e brasileiros contribuíram com as suas próprias interpretações da herança ibérica e do seu futuro.',
        'Estas tradições divergem quanto à autoridade, à economia, à religião e à forma política que a unidade deve assumir. Essas divergências fazem parte da sua história. Cada corrente deve ser lida no seu contexto, e os seus argumentos devem ser examinados pelos seus próprios méritos.',
        'Publicar um pensador permite que a sua obra seja estudada; não compromete o Instituto com todas as doutrinas ou iniciativas políticas a ele associadas.',
        'Nenhum partido possui esta herança na sua totalidade. A divisão habitual entre esquerda e direita não descreve adequadamente a diversidade daqueles que procuraram a unidade civilizacional para além das diferenças de nacionalidade, ascendência e filiação política.',
        'A nossa própria posição é hispanista, social-católica e comunitarista. A partir dela, estudaremos seriamente os diferentes hispanismos e procuraremos a cooperação onde o compromisso com a unidade civilizacional a tornar possível.',
      ] },
      { n: 7, title: 'A Nossa Tarefa: Cinco Séculos de Pensamento e uma Comunidade que Lhes Dê Continuidade', body: [
        'O principal objetivo do Instituto de Estudos Hispanos é recuperar, organizar e tornar acessíveis cinco séculos de teologia, teoria política e filosofia hispânicas dos mundos de língua espanhola e portuguesa. Levaremos este legado intelectual aos leitores em inglês, espanhol e português.',
        'Muito se tem dito sobre a ficção hispânica, de *Dom Quixote* ao realismo mágico. Muito menos atenção tem sido dedicada à não ficção: ao pensamento político, à crítica cultural, à teologia e aos debates jurídicos dos mundos de língua espanhola e portuguesa. Os leitores de todo o mundo tiveram menos oportunidades de conhecer esta tradição nos seus próprios termos. **Estamos aqui para mudar isso.**',
        'O nosso âmbito de trabalho estende-se dos teólogos e juristas que debateram a conquista, a soberania e o direito natural aos pensadores que abordaram a independência, a identidade nacional, a dependência económica e as possibilidades de renovação civilizacional. Dentro desta tarefa mais ampla, continua a ser um compromisso central consolidar mais de um século e meio de pensamento sobre a reunificação hispânica num cânone teórico sistemático.',
        'O inglês, o espanhol e o português são as nossas três línguas de trabalho na América. Através delas, ligaremos leitores e colaboradores cujo acesso a esta tradição tem sido condicionado pelas barreiras linguísticas, pelos sistemas educativos nacionais e pela disponibilidade de livros.',
        'Realizaremos este trabalho por meio de três compromissos.',
        '**Primeiro, a produção audiovisual.** Produziremos vídeos curtos e de longa duração, entrevistas e podcasts que tragam uma voz hispânica aos debates culturais contemporâneos. Combateremos a Lenda Negra, apresentaremos os pensadores da nossa tradição, explicaremos os seus argumentos e proporcionaremos aos espectadores as fontes necessárias para continuar a estudar.',
        '**Segundo, a tradução e a edição.** Através da De Indiis Editions, traduziremos, publicaremos e reeditaremos obras de teologia, filosofia, teoria política, crítica cultural e pensamento jurídico. Os escritos da Escola de Salamanca têm lugar neste projeto ao lado dos do argentino Manuel Ugarte, do mexicano José Vasconcelos, do brasileiro Gilberto Freyre, do espanhol Gustavo Bueno e dos debates do presente. Por meio de novas traduções, textos recuperados e estudos introdutórios, os leitores poderão conhecer diretamente estes autores, compreender as suas divergências e entrar na tradição através das questões mais próximas da sua própria experiência.',
        '**Terceiro, a formação de uma legião intercontinental e trilingue de guerreiros intelectuais:** pessoas cuja disciplina seja o estudo rigoroso e cujo compromisso se traduza no trabalho que empreendam em conjunto. Uma visão pan-ibérica de regeneração civilizacional precisa de académicos, tradutores, professores de línguas, criadores de conteúdo, designers gráficos, documentaristas, programadores, empresários, escritores, clérigos e estudantes.',
        'O Instituto é um convite a colocar essas capacidades ao serviço de uma tarefa comum.',
        '**Subscreva a nossa newsletter e receba gratuitamente um PDF de *Reunificação Hispânica: 200 Anos de Teoria e Práxis*, publicado pela De Indiis Editions.**',
        `[Junte-se ao nosso servidor do Discord](${DISCORD.url}) para conhecer outros leitores e colaboradores. Escreva-nos para [${MAIL}](mailto:${MAIL}) com uma pergunta, uma proposta de colaboração ou um projeto que queira desenvolver.`,
        '**Queremos ouvir a sua voz.**',
      ] },
    ],
    excerpt: 'O Instituto de Estudos Hispanos recupera e transmite cinco séculos de teologia, filosofia e pensamento político dos mundos de língua espanhola e portuguesa. A nossa posição é hispanista, social-católica e comunitarista. Por meio da produção audiovisual, da tradução e da edição, combatemos a Lenda Negra e tornamos este legado intelectual acessível em inglês, espanhol e português. A tradição de reunificação hispânica ocupa um lugar central no nosso trabalho. Reunimos leitores e colaboradores para estudar estas ideias e construir projetos comuns.',
    button: 'Leia o nosso manifesto',
  },
};
