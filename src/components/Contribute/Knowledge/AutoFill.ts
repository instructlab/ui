import { KnowledgeFormData, KnowledgeSeedExample, QuestionAndAnswerPair } from '@/types';
import { ValidatedOptions } from '@patternfly/react-core/dist/esm/helpers/constants';

const questionAndAnswerPairs1: QuestionAndAnswerPair[] = [
  {
    immutable: false,
    question: 'What is the brightest star in the Phoenix constellation called?',
    isQuestionValid: ValidatedOptions.success,
    answer: 'Alpha Phoenicis or Ankaa is the brightest star in the Phoenix Constellation.',
    isAnswerValid: ValidatedOptions.success
  },
  {
    immutable: false,
    question: 'Where did the Phoenix constellation first appear?',
    isQuestionValid: ValidatedOptions.success,
    answer:
      'The Phoenix constellation first appeared on a 35-cm diameter celestial globe published in 1597 (or 1598) in Amsterdam by Plancius with Jodocus Hondius.',
    isAnswerValid: ValidatedOptions.success
  },
  {
    immutable: false,
    question: "What does 'The Bird Phoenix' symbolize?",
    isQuestionValid: ValidatedOptions.success,
    answer: "'The Bird Phoenix' symbolizes the phoenix of classical mythology.",
    isAnswerValid: ValidatedOptions.success
  }
];

const questionAndAnswerPairs2: QuestionAndAnswerPair[] = [
  {
    immutable: false,
    question: 'What are the characteristics of the Phoenix constellation?',
    isQuestionValid: ValidatedOptions.success,
    answer:
      'Phoenix is a small constellation bordered by Fornax and Sculptor to the north, Grus to the west, Tucana to the south, touching on the corner of Hydrus to the south, and Eridanus to the east and southeast. The bright star Achernar is nearby.',
    isAnswerValid: ValidatedOptions.success
  },
  {
    immutable: false,
    question: 'When is the phoenix constellation most visible?',
    isQuestionValid: ValidatedOptions.success,
    answer: 'Phoenix is most visible from locations such as Australia and South Africa during late Southern Hemisphere spring.',
    isAnswerValid: ValidatedOptions.success
  },
  {
    immutable: false,
    question: 'What are the Phoenix Constellation boundaries?',
    isQuestionValid: ValidatedOptions.success,
    answer:
      'The official constellation boundaries for Phoenix, as set by Belgian astronomer Eugène Delporte in 1930, are defined by a polygon of 10 segments.',
    isAnswerValid: ValidatedOptions.success
  }
];

const questionAndAnswerPairs3: QuestionAndAnswerPair[] = [
  {
    immutable: false,
    question: 'In the Phoenix constellation, how many stars have planets?',
    isQuestionValid: ValidatedOptions.success,
    answer:
      'In the Phoenix constellation, ten stars have been found to have planets to date, and four planetary systems have been discovered with the SuperWASP project.',
    isAnswerValid: ValidatedOptions.success
  },
  {
    immutable: false,
    question: 'What is HD 142?',
    isQuestionValid: ValidatedOptions.success,
    answer:
      'HD 142 is a yellow giant that has an apparent magnitude of 5.7, and has a planet (HD 142 b) 1.36 times the mass of Jupiter which orbits every 328 days.',
    isAnswerValid: ValidatedOptions.success
  },
  {
    immutable: false,
    question: 'Are WASP-4 and WASP-5 solar-type yellow stars?',
    isQuestionValid: ValidatedOptions.success,
    answer:
      'Yes, WASP-4 and WASP-5 are solar-type yellow stars around 1000 light years distant and of 13th magnitude, each with a single planet larger than Jupiter.',
    isAnswerValid: ValidatedOptions.success
  }
];

const questionAndAnswerPairs4: QuestionAndAnswerPair[] = [
  {
    immutable: false,
    question: 'Is the Phoenix Constellation part of the Milky Way?',
    isQuestionValid: ValidatedOptions.success,
    answer: 'The Phoenix constellation does not lie on the galactic plane of the Milky Way, and there are no prominent star clusters.',
    isAnswerValid: ValidatedOptions.success
  },
  {
    immutable: false,
    question: 'How many light years away is NGC 625?',
    isQuestionValid: ValidatedOptions.success,
    answer: 'NGC 625 is 24000 light years in diameter and is an outlying member of the Sculptor Group.',
    isAnswerValid: ValidatedOptions.success
  },
  {
    immutable: false,
    question: "What is Robert's Quartet composed of?",
    isQuestionValid: ValidatedOptions.success,
    answer: "Robert's Quartet is composed of the irregular galaxy NGC 87, and three spiral galaxies NGC 88, NGC 89 and NGC 92.",
    isAnswerValid: ValidatedOptions.success
  }
];

const questionAndAnswerPairs5: QuestionAndAnswerPair[] = [
  {
    immutable: false,
    question: 'Do meteor showers originate from the Pheonix constellation?',
    isQuestionValid: ValidatedOptions.success,
    answer: 'Phoenix is the radiant of two annual meteor showers.',
    isAnswerValid: ValidatedOptions.success
  },
  {
    immutable: false,
    question: 'When were the first Phoenicids?',
    isQuestionValid: ValidatedOptions.success,
    answer: 'The Phoenicids, also known as the December Phoenicids, were first observed on 3 December 1887.',
    isAnswerValid: ValidatedOptions.success
  },
  {
    immutable: false,
    question: 'When does the intensity of the Phoenicids peak?',
    isQuestionValid: ValidatedOptions.success,
    answer: 'It peaks around 4–5 December, though is not seen every year.',
    isAnswerValid: ValidatedOptions.success
  }
];

const seedExamples: KnowledgeSeedExample[] = [
  {
    immutable: true,
    isExpanded: true,
    context: `**Phoenix** is a minor [constellation](constellation "wikilink") in the
      [southern sky](southern_sky "wikilink"). Named after the mythical
      [phoenix](Phoenix_(mythology) "wikilink"), it was first depicted on a
      celestial atlas by [Johann Bayer](Johann_Bayer "wikilink") in his 1603
      *[Uranometria](Uranometria "wikilink")*. The French explorer and
      astronomer [Nicolas Louis de
      Lacaille](Nicolas_Louis_de_Lacaille "wikilink") charted the brighter
      stars and gave their [Bayer designations](Bayer_designation "wikilink")
      in 1756. The constellation stretches from roughly −39 degrees to −57 degrees
      [declination](declination "wikilink"), and from 23.5h to 2.5h of [right
      ascension](right_ascension "wikilink"). The constellations Phoenix,
      [Grus](Grus_(constellation) "wikilink"),
      [Pavo](Pavo_(constellation) "wikilink") and [Tucana](Tucana "wikilink"),
      are known as the Southern Birds.`,
    isContextValid: ValidatedOptions.success,
    questionAndAnswers: questionAndAnswerPairs1
  },
  {
    immutable: true,
    isExpanded: true,
    context: `Phoenix is a small constellation bordered by [Fornax](Fornax "wikilink")
      and Sculptor to the north, Grus to the west, Tucana to the south,
      touching on the corner of [Hydrus](Hydrus "wikilink") to the south, and
      [Eridanus](Eridanus_(constellation) "wikilink") to the east and
      southeast. The bright star [Achernar](Achernar "wikilink") is
      nearby. The three-letter abbreviation for the constellation, as
      adopted by the [International Astronomical
      Union](International_Astronomical_Union "wikilink") in 1922, is
      "Phe". The official constellation boundaries, as set by Belgian
      astronomer [Eugène Delporte](Eugène_Joseph_Delporte "wikilink") in 1930,
      are defined by a polygon of 10 segments. In the [equatorial coordinate
      system](equatorial_coordinate_system "wikilink"), the [right
      ascension](right_ascension "wikilink") coordinates of these borders lie
      between 23<sup>h</sup> 26.5<sup>m</sup> and 02<sup>h</sup> 25.0<sup>m</sup>,
      while the [declination](declination "wikilink")
      coordinates are between −39.31° and −57.84°. This means it remains
      below the horizon to anyone living north of the [40th
      parallel](40th_parallel_north "wikilink") in the [Northern
      Hemisphere](Northern_Hemisphere "wikilink"), and remains low in the sky
      for anyone living north of the [equator](equator "wikilink"). It is most
      visible from locations such as Australia and South Africa during late
      [Southern Hemisphere](Southern_Hemisphere "wikilink") spring. Most
      of the constellation lies within, and can be located by, forming a
      triangle of the bright stars Achernar, [Fomalhaut](Fomalhaut "wikilink")
      and [Beta Ceti](Beta_Ceti "wikilink")—Ankaa lies roughly in the centre
      of this.`,
    isContextValid: ValidatedOptions.success,
    questionAndAnswers: questionAndAnswerPairs2
  },
  {
    immutable: true,
    isExpanded: true,
    context: `Ten stars have been found to have planets to date, and four planetary
      systems have been discovered with the [SuperWASP](SuperWASP "wikilink")
      project. [HD 142](HD_142 "wikilink") is a yellow giant that has an
      apparent magnitude of 5.7, and has a planet ([HD 142b](HD_142_b
      "wikilink")) 1.36 times the mass of Jupiter which orbits every 328 days.
      [HD 2039](HD_2039 "wikilink") is a yellow subgiant with an apparent
      magnitude of 9.0 around 330 light years away which has a planet ([HD 2039
      b](HD_2039_b "wikilink")) six times the mass of Jupiter. [WASP-18](WASP-18
      "wikilink") is a star of magnitude 9.29 which was discovered to have a hot
      Jupiter-like planet ([WASP-18b](WASP-18b "wikilink")) taking less than a
      day to orbit the star. The planet is suspected to be causing WASP-18 to
      appear older than it really is. [WASP-4](WASP-4 "wikilink") and
      [WASP-5](WASP-5 "wikilink") are solar-type yellow stars around 1000
      light years distant and of 13th magnitude, each with a single planet
      larger than Jupiter. [WASP-29](WASP-29 "wikilink") is an orange
      dwarf of spectral type K4V and visual magnitude 11.3, which has a
      planetary companion of similar size and mass to Saturn. The planet
      completes an orbit every 3.9 days.`,
    isContextValid: ValidatedOptions.success,
    questionAndAnswers: questionAndAnswerPairs3
  },
  {
    immutable: true,
    isExpanded: true,
    context: `The constellation does not lie on the
      [galactic plane](galactic_plane "wikilink") of the Milky Way, and there
      are no prominent star clusters. [NGC 625](NGC_625 "wikilink") is a dwarf
      [irregular galaxy](irregular_galaxy "wikilink") of apparent magnitude 11.0
      and lying some 12.7 million light years distant. Only 24000 light years in
      diameter, it is an outlying member of the [Sculptor Group](Sculptor_Group
      "wikilink"). NGC 625 is thought to have been involved in a collision and
      is experiencing a burst of [active star formation](Active_galactic_nucleus
      "wikilink"). [NGC 37](NGC_37 "wikilink") is a
      [lenticular galaxy](lenticular_galaxy "wikilink") of apparent magnitude
      14.66. It is approximately 42 [kiloparsecs](kiloparsecs "wikilink")
      (137,000 [light-years](light-years "wikilink")) in diameter and about
      12.9 billion years old. [Robert's Quartet](Robert's_Quartet "wikilink")
      (composed of the irregular galaxy [NGC 87](NGC_87 "wikilink"), and three
      spiral galaxies [NGC 88](NGC_88 "wikilink"), [NGC 89](NGC_89 "wikilink")
      and [NGC 92](NGC_92 "wikilink")) is a group of four galaxies located
      around 160 million light-years away which are in the process of colliding
      and merging. They are within a circle of radius of 1.6 arcmin,
      corresponding to about 75,000 light-years. Located in the galaxy ESO
      243-49 is [HLX-1](HLX-1 "wikilink"), an
      [intermediate-mass black hole](intermediate-mass_black_hole
      "wikilink")—the first one of its kind identified. It is thought to be a
      remnant of a dwarf galaxy that was absorbed in a
      [collision](Interacting_galaxy "wikilink") with ESO 243-49. Before its
      discovery, this class of black hole was only hypothesized.`,
    isContextValid: ValidatedOptions.success,
    questionAndAnswers: questionAndAnswerPairs4
  },
  {
    immutable: true,
    isExpanded: true,
    context: `Phoenix is the radiant of two annual meteor showers. The Phoenicids,
    also known as the December Phoenicids, were first observed on 3 December 1887.
    The shower was particularly intense in December 1956, and is thought related
    to the breakup of the short-period comet 289P/Blanpain. It peaks around 4–5
    December, though is not seen every year.[58] A very minor meteor shower peaks
    around July 14 with around one meteor an hour, though meteors can be seen
    anytime from July 3 to 18; this shower is referred to as the July Phoenicids.[59]`,
    isContextValid: ValidatedOptions.success,
    questionAndAnswers: questionAndAnswerPairs5
  }
];

export const autoFillKnowledgeFields: KnowledgeFormData = {
  email: 'helloworld@instructlab.com',
  name: 'juliadenham',
  submissionSummary: 'Information about the Phoenix Constellation.',
  domain: 'astronomy',
  documentOutline:
    'Information about the Phoenix Constellation including the history, characteristics, and features of the stars in the constellation.',
  filePath: 'science/physics/astrophysics/stars',
  seedExamples: seedExamples,
  knowledgeDocumentRepositoryUrl: 'https://github.com/juliadenham/Summit_knowledge',
  knowledgeDocumentCommit: '0a1f2672b9b90582e6115333e3ed62fd628f1c0f',
  documentName: 'phoenix_constellation.md',
  titleWork: 'Phoenix (constellation)',
  linkWork: 'https://en.wikipedia.org/wiki/Phoenix_(constellation)',
  revision: 'https://en.wikipedia.org/w/index.php?title=Phoenix_(constellation)&oldid=1237187773',
  licenseWork: 'CC-BY-SA-4.0',
  creators: 'Wikipedia Authors'
};
