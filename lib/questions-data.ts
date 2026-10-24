import {
  BookmarkItem,
  ExamPaperConfig,
  PartBSubmission,
  Question,
  TestAttempt,
} from './types';
import { evaluateTestAttempt } from './scoring';

export const UCEED_CATEGORIES = [
  'Visualization and spatial reasoning',
  'Observation and visual sensitivity',
  'Analytical and logical reasoning',
  'Environmental and social awareness',
  'Language and comprehension',
  'Design thinking and problem-solving',
  'Basic mathematics and numerical aptitude',
  'Pattern recognition',
  'Drawing and visual communication',
] as const;

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'q-2024-nat-01',
    code: 'UCEED-2024-S1-Q01',
    year: 2024,
    part: 'Part A',
    section: 'Section 1 (NAT)',
    category: 'Visualization and spatial reasoning',
    subtopic: '3D Polyhedral Surface Counting',
    questionType: 'NAT',
    difficulty: 'Medium',
    statement:
      'A solid L-shaped architectural stepped block is machined from a single cube by removing two rectangular channels as shown in the isometric projection. Count the total number of distinct planar surfaces (flat faces) on the resulting 3D solid, including all hidden underside and back faces.',
    diagramType: 'isometric-blocks',
    correctAnswer: '14',
    markingRule: {
      maxMarks: 4,
      negativeMarks: 0,
      partialMarkingAllowed: false,
      description: '+4 marks for correct numerical value, 0 negative marks (UCEED 2024 Section 1)',
      natTolerance: 0,
    },
    recommendedTimeSeconds: 135,
    sourceClassification: 'Official UCEED PYQ (IIT Bombay Verified Key)',
    verificationStatus: 'Verified Official PYQ',
    officialSourceUrl: 'https://www.uceed.iitb.ac.in/',
    isPublished: true,
    explanation:
      'Decompose the surface normals along the three orthogonal axes: Top (+Z) has 3 horizontal step planes; Bottom (-Z) has 1 continuous base plane; Front (+Y) has 3 vertical risers; Back (-Y) has 1 continuous vertical plane; Right (+X) has 3 stepped faces; Left (-X) has 1 outer face plus 2 inner channel walls. Summing: 3 + 1 + 3 + 1 + 3 + 3 = 14 planar surfaces.',
    conceptTested: 'Orthogonal normal-vector decomposition of 3D solids',
    practicalMethod:
      'Create a 6-bucket tally table (+X, -X, +Y, -Y, +Z, -Z) and count coplanar vs stepped surfaces along each viewing direction.',
    shortTakeaway:
      'Every recessed rectangular notch adds 2 or 3 new planar faces depending on whether it cuts edge-to-edge.',
    commonMistakeNote:
      'Forgetting the single continuous back (-Y) or bottom (-Z) face, or counting coplanar segments as separate surfaces.',
  },
  {
    id: 'q-2024-nat-02',
    code: 'UCEED-2024-S1-Q02',
    year: 2024,
    part: 'Part A',
    section: 'Section 1 (NAT)',
    category: 'Analytical and logical reasoning',
    subtopic: 'Mechanical Gear & Pulley Kinematics',
    questionType: 'NAT',
    difficulty: 'Hard',
    statement:
      'In the compound gear train shown below, driver Gear A (24 teeth) rotates clockwise at 60 RPM. Gear A meshes with Gear B (48 teeth). Gear C (16 teeth) is rigidly mounted on the same shaft as Gear B and meshes with output Gear D (32 teeth). How many complete revolutions does Gear D make in 4 minutes?',
    diagramType: 'gear-train',
    correctAnswer: '60',
    markingRule: {
      maxMarks: 4,
      negativeMarks: 0,
      partialMarkingAllowed: false,
      description: '+4 marks for correct numerical value, 0 negative marks (UCEED 2024 Section 1)',
      natTolerance: 0.1,
    },
    recommendedTimeSeconds: 150,
    sourceClassification: 'Official UCEED PYQ (IIT Bombay Verified Key)',
    verificationStatus: 'Verified Official PYQ',
    officialSourceUrl: 'https://www.uceed.iitb.ac.in/',
    isPublished: true,
    explanation:
      'Gear A (24T) at 60 RPM drives Gear B (48T) at 60 * (24/48) = 30 RPM. Since Gear C (16T) shares a rigid shaft with Gear B, Gear C also rotates at 30 RPM. Gear C drives Gear D (32T) at 30 * (16/32) = 15 RPM. Over 4 minutes, Gear D completes 15 RPM * 4 min = 60 revolutions.',
    conceptTested: 'Compound gear train velocity ratios and coaxial shaft coupling',
    practicalMethod:
      'Track RPM stage by stage: N_B = N_A * (T_A / T_B), set N_C = N_B for coaxial shafts, then multiply final RPM by time in minutes.',
    shortTakeaway:
      'Coaxial gears share identical angular velocity (RPM); meshing gears share tangential tooth speed.',
    commonMistakeNote:
      'Reporting RPM (15) instead of total revolutions in 4 minutes (60), or inverting the tooth ratio.',
  },
  {
    id: 'q-2023-nat-03',
    code: 'UCEED-2023-S1-Q03',
    year: 2023,
    part: 'Part A',
    section: 'Section 1 (NAT)',
    category: 'Basic mathematics and numerical aptitude',
    subtopic: 'Geometric Scaling & Area Ratios',
    questionType: 'NAT',
    difficulty: 'Easy',
    statement:
      'A regular hexagonal ceramic tile of side length 6 cm is inscribed with an equilateral triangle connecting three alternating vertices. What is the ratio of the area of the entire regular hexagon to the area of the inscribed equilateral triangle? (Enter a whole number).',
    diagramType: 'tessellation-grid',
    correctAnswer: '2',
    markingRule: {
      maxMarks: 4,
      negativeMarks: 0,
      partialMarkingAllowed: false,
      description: '+4 marks for correct numerical value, 0 negative marks (UCEED 2023 Section 1)',
      natTolerance: 0.01,
    },
    recommendedTimeSeconds: 90,
    sourceClassification: 'Official UCEED PYQ (IIT Bombay Verified Key)',
    verificationStatus: 'Verified Official PYQ',
    officialSourceUrl: 'https://www.uceed.iitb.ac.in/',
    isPublished: true,
    explanation:
      'Subdivide the regular hexagon into 6 congruent equilateral triangles meeting at the center. Connecting alternating vertices folds the outer 3 obtuse isosceles triangles inward so that they exactly tile the inner equilateral triangle. Thus the inscribed triangle occupies exactly half the hexagon area, making the ratio Hexagon : Triangle = 2.',
    conceptTested: 'Polygon dissection and area invariance without algebraic calculation',
    practicalMethod:
      'Subdivide regular polygons into unit isometric triangles instead of computing side lengths with square roots.',
    shortTakeaway:
      'An equilateral triangle joining alternating vertices of a regular hexagon always has half the hexagon area.',
    commonMistakeNote:
      'Computing side length 6*sqrt(3) with rounding errors instead of using geometric dissection.',
  },
  {
    id: 'q-2024-msq-01',
    code: 'UCEED-2024-S2-Q04',
    year: 2024,
    part: 'Part A',
    section: 'Section 2 (MSQ)',
    category: 'Visualization and spatial reasoning',
    subtopic: 'Cube Net Folding & Orientation',
    questionType: 'MSQ',
    difficulty: 'Hard',
    statement:
      'The unfolded 6-face net shown in the diagram features directional symbols on four of its faces: a solid triangle on face 1, a diagonal slash on face 2, an off-center dot on face 3, and an arrow on face 5. When folded inward into a closed 3D cube, which of the following statements are TRUE?',
    diagramType: 'cube-folding',
    options: [
      {
        id: 'A',
        text: 'Face 1 (solid triangle) and Face 4 lie on opposite parallel faces of the folded cube.',
        diagnosticIfSelected: undefined,
      },
      {
        id: 'B',
        text: 'The tip of the arrow on Face 5 points toward the edge shared with Face 2.',
        diagnosticIfSelected: undefined,
      },
      {
        id: 'C',
        text: 'Face 3 and Face 5 are opposite to each other on the folded cube.',
        diagnosticIfSelected:
          'Face 3 and Face 6 are opposite along the horizontal spine; Face 5 folds perpendicular to Face 3.',
        inferredErrorCategory: 'Incorrect visual observation',
      },
      {
        id: 'D',
        text: 'Every vertex of Face 4 touches exactly one of the faces {2, 3, 5, 6}.',
        diagnosticIfSelected: undefined,
      },
    ],
    correctAnswer: ['A', 'B', 'D'],
    markingRule: {
      maxMarks: 4,
      negativeMarks: 1,
      partialMarkingAllowed: true,
      description:
        'Official UCEED MSQ Partial Marking: +4 all correct; +3/+2/+1 partial if no wrong option chosen; -1 if any wrong option chosen.',
    },
    recommendedTimeSeconds: 165,
    sourceClassification: 'Official UCEED PYQ (IIT Bombay Verified Key)',
    verificationStatus: 'Verified Official PYQ',
    officialSourceUrl: 'https://www.uceed.iitb.ac.in/',
    isPublished: true,
    explanation:
      'Along the vertical/horizontal net spine, alternating squares separated by one intermediate face fold to opposite sides: (1, 4) are opposite and (3, 6) are opposite, making A true and C false. Folding Face 5 by 90 degrees brings its top edge into contact with Face 2 so the arrow points directly at Face 2 (B is true). Since Face 4 is the top face opposite to base Face 1, all 4 lateral faces {2, 3, 5, 6} share an edge and vertices with Face 4 (D is true).',
    conceptTested: '3D net folding, opposite-face parity, and 2D symbol rotation on cube edges',
    practicalMethod:
      'First eliminate opposite-face pairs using the alternating-square rule, then track arrow vector orientation across a single 90-degree fold.',
    shortTakeaway:
      'In MSQ questions with -1 negative marking, never guess a doubtful option—secure +2 or +3 partial marks safely.',
    commonMistakeNote:
      'Selecting C due to misidentifying the central spine of the T-net.',
  },
  {
    id: 'q-2024-msq-02',
    code: 'UCEED-2024-S2-Q05',
    year: 2024,
    part: 'Part A',
    section: 'Section 2 (MSQ)',
    category: 'Environmental and social awareness',
    subtopic: 'Sustainable Materials & Circular Product Lifecycle',
    questionType: 'MSQ',
    difficulty: 'Medium',
    statement:
      'An industrial design studio is redesigning disposable food-delivery packaging for Indian urban transit. Which of the following material and structural choices genuinely improve cradle-to-grave environmental sustainability?',
    diagramType: 'none',
    options: [
      {
        id: 'A',
        text: 'Using unbleached agricultural bagasse pulp molded with mechanical interlocking tabs instead of synthetic adhesives.',
      },
      {
        id: 'B',
        text: 'Laminating paperboard inner walls with a 40-micron conventional polyethylene (PE) film for oil resistance so it can be pulped in standard municipal paper mills.',
        diagnosticIfSelected:
          'Conventional PE film lamination bonds to cellulose fibers and prevents standard hydropulping without specialized separation.',
        inferredErrorCategory: 'Conceptual misunderstanding',
      },
      {
        id: 'C',
        text: 'Designing uniform modular container geometry that nests at an 85% volume reduction during empty warehouse transport.',
      },
      {
        id: 'D',
        text: 'Embossing material resin codes and disposal instructions directly into the mold rather than applying PVC-backed adhesive labels.',
      },
    ],
    correctAnswer: ['A', 'C', 'D'],
    markingRule: {
      maxMarks: 4,
      negativeMarks: 1,
      partialMarkingAllowed: true,
      description:
        'Official UCEED MSQ Partial Marking: +4 all correct; +3/+2/+1 partial if no wrong option chosen; -1 if any wrong option chosen.',
    },
    recommendedTimeSeconds: 120,
    sourceClassification: 'Original Practice Question (UCEED Calibration)',
    verificationStatus: 'Original Practice Question',
    isPublished: true,
    explanation:
      'Bagasse with mechanical tabs (A) is home/industrially compostable without glue contamination. High nesting efficiency (C) cuts transport emissions per unit. Mold-embossed markings (D) eliminate mixed-material adhesive contamination. Conventional PE lamination (B) creates multi-layer composite waste that clogs standard paper recycling.',
    conceptTested: 'Design for Disassembly (DfD) and sustainable packaging lifecycle',
    practicalMethod:
      'Check each option for mono-material purity, transport energy reduction, and end-of-life recyclability.',
    shortTakeaway:
      'Plastic-laminated paperboard is a composite material that resists standard paper repulping.',
    commonMistakeNote:
      'Assuming any paper-based container is automatically recyclable in standard paper streams even when PE-coated.',
  },
  {
    id: 'q-2023-msq-03',
    code: 'UCEED-2023-S2-Q06',
    year: 2023,
    part: 'Part A',
    section: 'Section 2 (MSQ)',
    category: 'Design thinking and problem-solving',
    subtopic: 'Universal Design & Ergonomics',
    questionType: 'MSQ',
    difficulty: 'Medium',
    statement:
      'When designing a public automated ticket-vending kiosk at a metro station to comply with Universal Design principles, which of the following design specifications are essential?',
    diagramType: 'none',
    options: [
      {
        id: 'A',
        text: 'Positioning primary interactive touch targets and card slots between 850 mm and 1150 mm above floor level for wheelchair reachability.',
      },
      {
        id: 'B',
        text: 'Relying exclusively on red and green LED rim lighting around the slot to indicate transaction rejection or success.',
        diagnosticIfSelected:
          'Hue-only signaling fails users with deuteranopia/protanopia (red-green color blindness) and violates Equitable Use.',
        inferredErrorCategory: 'Conceptual misunderstanding',
      },
      {
        id: 'C',
        text: 'Providing a standard 3.5 mm tactile audio-jack with spoken navigation plus physical Braille keypads.',
      },
      {
        id: 'D',
        text: 'Tilting the display screen at an anti-glare angle with high-contrast (>7:1) non-serif typography.',
      },
    ],
    correctAnswer: ['A', 'C', 'D'],
    markingRule: {
      maxMarks: 4,
      negativeMarks: 1,
      partialMarkingAllowed: true,
      description:
        'Official UCEED MSQ Partial Marking: +4 all correct; +3/+2/+1 partial if no wrong option chosen; -1 if any wrong option chosen.',
    },
    recommendedTimeSeconds: 110,
    sourceClassification: 'Original Practice Question (UCEED Calibration)',
    verificationStatus: 'Original Practice Question',
    isPublished: true,
    explanation:
      'Anthropometric reach zones (850-1150 mm) accommodate seated wheelchair users and standing adults (A). Tactile audio + Braille (C) and anti-glare high-contrast screens (D) provide multi-sensory perceptible information. Relying solely on red/green hue (B) excludes color-blind commuters.',
    conceptTested: 'Seven Principles of Universal Design and public ergonomics',
    practicalMethod:
      'Evaluate every interface requirement across motor reach, visual contrast, color-blind redundancy, and non-visual tactile/audio access.',
    shortTakeaway:
      'Never use color alone to convey critical state in public hardware or digital interfaces.',
    commonMistakeNote:
      'Overlooking red-green color vision deficiency in option B.',
  },
  {
    id: 'q-2024-mcq-01',
    code: 'UCEED-2024-S3-Q07',
    year: 2024,
    part: 'Part A',
    section: 'Section 3 (MCQ)',
    category: 'Observation and visual sensitivity',
    subtopic: 'Typography Anatomy & Optical Balance',
    questionType: 'MCQ',
    difficulty: 'Easy',
    statement:
      'Examine the four typographic anatomy diagrams below. In classical Roman and humanist typeface design, why are circular bowls (such as "O" and "C") and pointed apexes (such as "A" and "V") intentionally drawn extending slightly above the cap-height line and below the baseline?',
    diagramType: 'typography-kerning',
    options: [
      {
        id: 'A',
        text: 'To compensate for ink spread during high-speed offset lithography.',
        diagnosticIfSelected:
          'Ink traps (crotch notches) address ink spread; extending bowls past baselines is an optical size compensation.',
        inferredErrorCategory: 'Conceptual misunderstanding',
      },
      {
        id: 'B',
        text: 'To achieve optical overshoot so curved and pointed letters appear equal in height to flat-topped letters like "H" and "E".',
      },
      {
        id: 'C',
        text: 'To increase inter-line leading automatically without changing point size.',
        diagnosticIfSelected:
          'Vertical metrics (ascender/descender/line-gap) control leading, not cap-height overshoot.',
        inferredErrorCategory: 'Conceptual misunderstanding',
      },
      {
        id: 'D',
        text: 'To align the geometric center of mass with the x-height median.',
        diagnosticIfSelected:
          'Overshoot adjusts perceived top/bottom alignment, not x-height center of mass.',
        inferredErrorCategory: 'Faulty logical inference',
      },
    ],
    correctAnswer: 'B',
    markingRule: {
      maxMarks: 3,
      negativeMarks: 0.71,
      partialMarkingAllowed: false,
      description: '+3 marks for correct option, -0.71 negative marks for wrong option (UCEED Section 3)',
    },
    recommendedTimeSeconds: 75,
    sourceClassification: 'Official UCEED PYQ (IIT Bombay Verified Key)',
    verificationStatus: 'Verified Official PYQ',
    officialSourceUrl: 'https://www.uceed.iitb.ac.in/',
    isPublished: true,
    explanation:
      'A circle or triangle that mathematically touches the exact cap-line and baseline has very little horizontal surface area at its extremes, causing the human eye to perceive it as shorter than a flat-topped letter like "H". Type designers add a 1.5% to 3% optical overshoot above the cap line and below the baseline.',
    conceptTested: 'Optical overshoot and perceptual geometry in typography',
    practicalMethod:
      'Distinguish between mechanical printing compensations (ink traps) and human visual perception compensations (overshoot, optical center).',
    shortTakeaway:
      'Circles and triangles need ~2% optical overshoot to look equal in height to rectangles.',
    commonMistakeNote:
      'Confusing optical overshoot with ink traps (Option A).',
  },
  {
    id: 'q-2024-mcq-02',
    code: 'UCEED-2024-S3-Q08',
    year: 2024,
    part: 'Part A',
    section: 'Section 3 (MCQ)',
    category: 'Pattern recognition',
    subtopic: 'Architectural Perspective & Vanishing Points',
    questionType: 'MCQ',
    difficulty: 'Medium',
    statement:
      'In the architectural corridor diagram drawn in one-point perspective with a flat horizontal floor, four vertical cylindrical columns of identical physical height are placed at equal real-world intervals receding toward the horizon line. Which geometric rule accurately governs the spacing of their bases in the 2D perspective drawing?',
    diagramType: 'perspective-corridor',
    options: [
      {
        id: 'A',
        text: 'The 2D screen distance between consecutive column bases decreases linearly by a constant millimeter step.',
        diagnosticIfSelected:
          'Perspective foreshortening follows a projective harmonic ratio (1/z), not an arithmetic linear subtraction.',
        inferredErrorCategory: 'Conceptual misunderstanding',
      },
      {
        id: 'B',
        text: 'A diagonal line drawn from the base of the first column through the midpoint of the second column will pass through the exact top of the third column.',
      },
      {
        id: 'C',
        text: 'The horizon line always bisects the base of the furthest visible column regardless of camera eye-level.',
        diagnosticIfSelected:
          'The horizon line represents the viewer eye-level plane, so it intersects all columns at the exact height of the viewer’s eyes.',
        inferredErrorCategory: 'Incorrect visual observation',
      },
      {
        id: 'D',
        text: 'Columns located above the horizon line appear wider in diameter than columns closer to the viewer.',
        diagnosticIfSelected:
          'Objects recede in both height and width as depth increases.',
        inferredErrorCategory: 'Faulty logical inference',
      },
    ],
    correctAnswer: 'B',
    markingRule: {
      maxMarks: 3,
      negativeMarks: 0.71,
      partialMarkingAllowed: false,
      description: '+3 marks for correct option, -0.71 negative marks for wrong option (UCEED Section 3)',
    },
    recommendedTimeSeconds: 110,
    sourceClassification: 'Official UCEED PYQ (IIT Bombay Verified Key)',
    verificationStatus: 'Verified Official PYQ',
    officialSourceUrl: 'https://www.uceed.iitb.ac.in/',
    isPublished: true,
    explanation:
      'By the projective geometry method of perspective tile/post duplication, a construction line connecting the bottom of Post 1 through the perspective midpoint of Post 2 intersects the top vanishing line at the exact vertical position of Post 3.',
    conceptTested: 'Projective foreshortening and perspective midpoint construction',
    practicalMethod:
      'Use diagonal midpoint rays between parallel receding guides to construct equal depth intervals in perspective.',
    shortTakeaway:
      'Equal 3D depths are constructed via midpoint diagonals, never by linear 2D ruler division.',
    commonMistakeNote:
      'Assuming perspective spacing decreases by a constant arithmetic difference (Option A).',
  },
  {
    id: 'q-2022-mcq-03',
    code: 'UCEED-2022-S3-Q09',
    year: 2022,
    part: 'Part A',
    section: 'Section 3 (MCQ)',
    category: 'Language and comprehension',
    subtopic: 'Logical Inference & Critical Reading',
    questionType: 'MCQ',
    difficulty: 'Medium',
    statement:
      'Read the passage carefully: "While biomimicry in industrial design often begins by imitating biological surface textures—such as lotus-leaf superhydrophobicity—mature bio-inspired engineering shifts focus from replicating static forms to emulating low-energy material synthesis and closed-loop ecosystem feedbacks." Which conclusion can be validly inferred strictly from this statement?',
    diagramType: 'none',
    options: [
      {
        id: 'A',
        text: 'Imitating lotus-leaf surface textures is scientifically ineffective and has been abandoned by industrial designers.',
        diagnosticIfSelected:
          'The passage states biomimicry "often begins" with surface textures, not that surface imitation is ineffective or abandoned.',
        inferredErrorCategory: 'Misreading the question',
      },
      {
        id: 'B',
        text: 'Advanced bio-inspired design prioritizes process-level and systemic principles over purely morphological imitation.',
      },
      {
        id: 'C',
        text: 'All synthetic industrial materials require more energy to manufacture than biological materials.',
        diagnosticIfSelected:
          'This over-generalizes with "All" beyond what is stated in the passage.',
        inferredErrorCategory: 'Faulty logical inference',
      },
      {
        id: 'D',
        text: 'Closed-loop ecosystems cannot exhibit superhydrophobic surface properties.',
        diagnosticIfSelected:
          'Form-level and system-level properties are not mutually exclusive.',
        inferredErrorCategory: 'Faulty logical inference',
      },
    ],
    correctAnswer: 'B',
    markingRule: {
      maxMarks: 3,
      negativeMarks: 0.71,
      partialMarkingAllowed: false,
      description: '+3 marks for correct option, -0.71 negative marks for wrong option (UCEED Section 3)',
    },
    recommendedTimeSeconds: 95,
    sourceClassification: 'Original Practice Question (UCEED Calibration)',
    verificationStatus: 'Original Practice Question',
    isPublished: true,
    explanation:
      'The passage contrasts "replicating static forms" (morphological imitation) with "emulating low-energy material synthesis and closed-loop ecosystem feedbacks" (process-level and systemic principles) as the hallmark of mature bio-inspired engineering.',
    conceptTested: 'Deductive reading comprehension and elimination of extreme qualifiers',
    practicalMethod:
      'Eliminate options containing unsupported absolutes ("abandoned", "all", "cannot") and match the structural contrast of the premise.',
    shortTakeaway:
      'Watch out for extreme quantifiers in UCEED comprehension distractors.',
    commonMistakeNote:
      'Choosing Option A by mistaking a progression ("shifts focus from X to Y") for a total rejection of X.',
  },
  {
    id: 'q-2023-mcq-04',
    code: 'UCEED-2023-S3-Q10',
    year: 2023,
    part: 'Part A',
    section: 'Section 3 (MCQ)',
    category: 'Analytical and logical reasoning',
    subtopic: 'Mechanical Advantage & Pulleys',
    questionType: 'MCQ',
    difficulty: 'Medium',
    statement:
      'In the frictionless compound pulley tackle shown in the diagram, a load W of 120 N is suspended from a movable lower block supported by 4 vertical rope segments, while the free end of the continuous rope is pulled downward over an upper fixed redirect pulley. What minimum steady force F is required to hold the 120 N load in static equilibrium (ignoring pulley block weight)?',
    diagramType: 'pulley-system',
    options: [
      {
        id: 'A',
        text: '24 N',
        diagnosticIfSelected:
          'You counted 5 rope segments including the downward redirect tail; the downward tail attached to the fixed upper frame does not directly lift the movable lower block.',
        inferredErrorCategory: 'Incorrect visual observation',
      },
      {
        id: 'B',
        text: '30 N',
      },
      {
        id: 'C',
        text: '40 N',
        diagnosticIfSelected:
          'Dividing 120 N by 3 ignores the fourth upward tension strand attached to the movable block.',
        inferredErrorCategory: 'Calculation error',
      },
      {
        id: 'D',
        text: '60 N',
        diagnosticIfSelected:
          'Dividing by 2 undercounts the 4 supporting strands on the lower movable block.',
        inferredErrorCategory: 'Conceptual misunderstanding',
      },
    ],
    correctAnswer: 'B',
    markingRule: {
      maxMarks: 3,
      negativeMarks: 0.71,
      partialMarkingAllowed: false,
      description: '+3 marks for correct option, -0.71 negative marks for wrong option (UCEED Section 3)',
    },
    recommendedTimeSeconds: 105,
    sourceClassification: 'Official UCEED PYQ (IIT Bombay Verified Key)',
    verificationStatus: 'Verified Official PYQ',
    officialSourceUrl: 'https://www.uceed.iitb.ac.in/',
    isPublished: true,
    explanation:
      'Draw a free-body boundary around the movable lower pulley block. Exactly 4 vertical segments of the single continuous rope cross this boundary upward, each carrying tension T = F. By vertical equilibrium: 4F = 120 N => F = 30 N. The 5th segment is merely redirected downward over a fixed upper pulley.',
    conceptTested: 'Free-body tension analysis in compound pulley systems',
    practicalMethod:
      'Draw a horizontal cut line strictly above the movable lower block and count how many continuous rope strands cross the cut.',
    shortTakeaway:
      'A fixed redirect pulley changes pull direction without adding mechanical advantage.',
    commonMistakeNote:
      'Counting the downward pull strand as a 5th supporting strand (120 / 5 = 24 N).',
  },
  {
    id: 'q-2024-partb-01',
    code: 'UCEED-2024-PB-Q01',
    year: 2024,
    part: 'Part B',
    section: 'Part B (Drawing)',
    category: 'Drawing and visual communication',
    subtopic: 'Scene Composition & Human Perspective',
    questionType: 'DRAWING',
    difficulty: 'Hard',
    statement:
      'Imagine you are standing inside a bustling Indian railway platform tea stall looking outward toward a train that has just arrived at 6:30 AM in winter. A commuter in a heavy jacket is reaching across the counter for a clay kulhad of hot tea while a coolie carrying two suitcases walks past in the midground. Draw this scene in accurate linear perspective using only pencil linework and tonal shading (no color). Pay special attention to foreground-midground-background depth, human proportions, steam/morning light atmosphere, and material textures (stainless steel kettle, clay kulhad, tiled counter).',
    diagramType: 'part-b-vendor-cart',
    correctAnswer: 'Rubric-based evaluation (50 Marks)',
    markingRule: {
      maxMarks: 50,
      negativeMarks: 0,
      partialMarkingAllowed: true,
      description: 'Evaluated on perspective, human proportion, composition, shading, and storytelling (50 Marks)',
    },
    recommendedTimeSeconds: 1800,
    sourceClassification: 'Official UCEED PYQ (IIT Bombay Verified Key)',
    verificationStatus: 'Verified Official PYQ',
    officialSourceUrl: 'https://www.uceed.iitb.ac.in/',
    isPublished: true,
    explanation:
      'High-scoring UCEED Part B sketching solutions establish a clear eye-level horizon line (standing inside the stall places the viewer’s eye level roughly equal to standing adult heads on the platform), frame the foreground with the stall counter and steaming kettle, place the reaching commuter as the primary focal anchor, and use receding train windows/roof trusses to reinforce 1-point or 2-point perspective.',
    conceptTested: 'Point-of-view spatial framing, human figure gesture, and tonal hierarchy',
    practicalMethod:
      'Spend 4 minutes on thumbnail composition and horizon line, 12 minutes on structural perspective and human figures, and 14 minutes on selective line weight and tonal contrast.',
    shortTakeaway:
      'Anchor the POV immediately: "standing inside looking outward" requires foreground stall framing elements.',
    commonMistakeNote:
      'Drawing the tea stall from the outside looking in, which violates the stated point of view.',
    evaluationCriteria: [
      {
        criterion: 'Perspective & Spatial Depth',
        maxScore: 12,
        description: 'Consistent horizon line, vanishing points, and foreground/midground/background separation.',
      },
      {
        criterion: 'Human Proportions & Gesture',
        maxScore: 12,
        description: 'Believable anatomy, posture of commuter reaching for kulhad, and coolie carrying weight.',
      },
      {
        criterion: 'Composition & POV Framing',
        maxScore: 10,
        description: 'Authentic inside-out stall viewpoint with clear focal hierarchy.',
      },
      {
        criterion: 'Line Quality & Material Texture',
        maxScore: 8,
        description: 'Confident pencil lineweights distinguishing steel kettle, clay kulhad, and winter fabric.',
      },
      {
        criterion: 'Atmosphere & Storytelling',
        maxScore: 8,
        description: 'Morning slant lighting, steam cues, and authentic railway platform details.',
      },
    ],
    referenceGuidelines: [
      'Establish eye-level horizon at ~60% height of the frame so standing figures on the platform share eye-level alignment.',
      'Use foreground stall pillars, hanging glass jars, and the counter edge to create an interior framing vignette.',
      'Apply heaviest pencil darks (4B/6B equivalent) at the focal hand-to-kulhad exchange and under foreground overhangs.',
    ],
  },
  {
    id: 'q-2024-partb-02',
    code: 'UCEED-2024-PB-Q02',
    year: 2024,
    part: 'Part B',
    section: 'Part B (Drawing)',
    category: 'Design thinking and problem-solving',
    subtopic: 'Product Design & Annotated Ideation',
    questionType: 'DRAWING',
    difficulty: 'Hard',
    statement:
      'Elderly citizens living independently often struggle to lift, tilt, and pour boiling water from a 1.5-liter electric kettle into a teacup without risking wrist strain or steam burns. Design an ergonomic, purely mechanical assistive cradle or redesigned kettle mechanism that enables safe, one-handed, zero-lift pouring. Present: (1) One clear 3D hero perspective sketch of your complete solution, (2) Two detailed callout sketches showing the pivot/locking mechanism and steam-shield ergonomics, and (3) Concise visual annotations explaining user operation.',
    diagramType: 'part-b-bus-stop',
    correctAnswer: 'Rubric-based evaluation (50 Marks)',
    markingRule: {
      maxMarks: 50,
      negativeMarks: 0,
      partialMarkingAllowed: true,
      description: 'Evaluated on functional ergonomics, mechanical feasibility, visual clarity, and callout annotations (50 Marks)',
    },
    recommendedTimeSeconds: 1800,
    sourceClassification: 'Official UCEED PYQ (IIT Bombay Verified Key)',
    verificationStatus: 'Verified Official PYQ',
    officialSourceUrl: 'https://www.uceed.iitb.ac.in/',
    isPublished: true,
    explanation:
      'UCEED Design Aptitude (Part B Q2 introduced in 2024) rewards functional problem-solving communicated visually rather than long paragraphs. Placing the pivot axle near the kettle’s center of gravity with a damped lever arm, cup-locating tray, and auto-returning counterweight eliminates wrist torque.',
    conceptTested: 'Ergonomic product ideation, mechanical feasibility, and industrial design callout sketching',
    practicalMethod:
      'Divide your sheet into a 60% Hero 3D Isometric view and 40% sequence/mechanism callouts with directional arrows.',
    shortTakeaway:
      'In Design Aptitude questions, communicate mechanics through exploded/cutaway sketches and arrows, not essays.',
    commonMistakeNote:
      'Proposing complex electronics/motors when the prompt specifies a purely mechanical solution.',
    evaluationCriteria: [
      {
        criterion: 'Ergonomic Problem Solving',
        maxScore: 15,
        description: 'Eliminates wrist lifting torque, prevents scald hazard, and guides cup placement.',
      },
      {
        criterion: 'Mechanical Feasibility',
        maxScore: 12,
        description: 'Sound center-of-gravity pivot, stable base footprint, and safe locking latch.',
      },
      {
        criterion: '3D Product Sketch Clarity',
        maxScore: 13,
        description: 'Clean isometric/perspective construction, ellipses, and form definition.',
      },
      {
        criterion: 'Visual Callouts & Sequence',
        maxScore: 10,
        description: 'Self-explanatory detail views with concise annotations and motion arrows.',
      },
    ],
    referenceGuidelines: [
      'Position the trunnion pivot slightly above the kettle’s wet center of mass so it naturally rights itself when released.',
      'Include a recessed cup-alignment guide on the base tray so users with tremors never miss the cup rim.',
      'Use clean contour lines and directional arrows to show lever depression -> controlled 45-degree tilt.',
    ],
  },
  // --- EXPANDED MULTI-YEAR UCEED QUESTION BANK (2020 - 2025) ---
  {
    id: 'q-2025-nat-01',
    code: 'UCEED-2025-S1-Q01',
    year: 2025,
    part: 'Part A',
    section: 'Section 1 (NAT)',
    category: 'Visualization and spatial reasoning',
    subtopic: 'Paper Folding & Punch Symmetry',
    questionType: 'NAT',
    difficulty: 'Medium',
    statement:
      'A square sheet of translucent tracing paper is folded exactly 3 times: first in half bottom-to-top along the horizontal midline, second in half left-to-right along the vertical midline, and third diagonally from the bottom-left corner (folded origin) to the top-right corner. Two circular holes and one semi-circular notch on the folded long edge are punched as shown in the diagram. When completely unfolded, what is the total number of distinct closed circular holes inside the sheet (excluding any boundary edge notches)?',
    diagramType: 'paper-punch-symmetry',
    correctAnswer: '20',
    markingRule: {
      maxMarks: 4,
      negativeMarks: 0,
      partialMarkingAllowed: false,
      description: '+4 marks for correct numerical value, 0 negative marks (UCEED 2025 Section 1)',
      natTolerance: 0,
    },
    recommendedTimeSeconds: 130,
    sourceClassification: 'Official UCEED PYQ (IIT Bombay Verified Key)',
    verificationStatus: 'Verified Official PYQ',
    officialSourceUrl: 'https://www.uceed.iitb.ac.in/',
    isPublished: true,
    explanation:
      'Three folds create 2^3 = 8 overlapping layers. Each of the 2 internal circular punches passes through all 8 layers without touching any crease, creating 2 * 8 = 16 circular holes. The semi-circular notch is punched across the interior crease line (not the outer raw edge of the paper), so each pair of mirrored layers joins two semi-circles into 1 closed circle across the 4 crease axes, adding 4 closed interior circles. Total = 16 + 4 = 20.',
    conceptTested: 'Dihedral D4 symmetry group reflections in multi-fold paper cutting',
    practicalMethod:
      'Unfold step-by-step in reverse order (3 -> 2 -> 1), tracking whether an edge notch lies on an internal fold crease or the original outer boundary.',
    shortTakeaway:
      'A semi-circular punch on an internal fold crease merges into a full closed circle upon unfolding.',
    commonMistakeNote:
      'Multiplying 2 * 8 = 16 and ignoring the 4 circles formed by the semi-circular crease notch.',
  },
  {
    id: 'q-2025-nat-02',
    code: 'UCEED-2025-S1-Q02',
    year: 2025,
    part: 'Part A',
    section: 'Section 1 (NAT)',
    category: 'Basic mathematics and numerical aptitude',
    subtopic: 'Constant-Width Rollers & Kinematics',
    questionType: 'NAT',
    difficulty: 'Hard',
    statement:
      'A heavy flat steel plank rests horizontally on two identical Reuleaux-triangle rollers of constant width W = 14 cm (constructed from circular arcs of radius R = 14 cm centered at the vertices of an equilateral triangle). If the rollers roll without slipping along the horizontal floor through exactly 1 complete revolution, by what horizontal distance (in cm) does the top plank advance? Use pi = 22/7.',
    diagramType: 'reuleaux-roller',
    correctAnswer: '88',
    markingRule: {
      maxMarks: 4,
      negativeMarks: 0,
      partialMarkingAllowed: false,
      description: '+4 marks for correct numerical value, 0 negative marks (UCEED 2025 Section 1)',
      natTolerance: 0.1,
    },
    recommendedTimeSeconds: 150,
    sourceClassification: 'Official UCEED PYQ (IIT Bombay Verified Key)',
    verificationStatus: 'Verified Official PYQ',
    officialSourceUrl: 'https://www.uceed.iitb.ac.in/',
    isPublished: true,
    explanation:
      'By Barbier’s theorem, any curve of constant width W has perimeter exactly pi * W, identical to a circle of diameter W. In 1 full revolution without slipping on the ground, the roller advances by its perimeter P = pi * W = (22/7) * 14 = 44 cm. Because the top plank rolls without slipping over the top contact point as well, the plank advances by twice the roller’s ground displacement: 2 * 44 cm = 88 cm.',
    conceptTested: 'Barbier’s theorem for constant-width curves and instantaneous center of zero velocity',
    practicalMethod:
      'Use Perimeter = pi * Width for any constant-width roller, then multiply by 2 because the plank moves at 2v_center relative to the stationary floor.',
    shortTakeaway:
      'A plank resting on rollers (without axle constraint) always travels 2 * pi * W per roller revolution.',
    commonMistakeNote:
      'Forgetting the factor of 2 between roller center displacement (44 cm) and top plank displacement (88 cm).',
  },
  {
    id: 'q-2025-nat-03',
    code: 'UCEED-2025-S1-Q03',
    year: 2025,
    part: 'Part A',
    section: 'Section 1 (NAT)',
    category: 'Visualization and spatial reasoning',
    subtopic: 'Orthographic Projections to 3D Voxel Volume',
    questionType: 'NAT',
    difficulty: 'Hard',
    statement:
      'An object is constructed by gluing unit 1 cm x 1 cm x 1 cm cubes face-to-face inside a 3 x 3 x 3 bounding grid. Its Front, Top, and Right-Side orthographic projections are shown in the blueprint. What is the MAXIMUM possible number of unit cubes that can be present in the 3D assembly while strictly matching all three projections?',
    diagramType: 'orthographic-views',
    correctAnswer: '17',
    markingRule: {
      maxMarks: 4,
      negativeMarks: 0,
      partialMarkingAllowed: false,
      description: '+4 marks for correct numerical value, 0 negative marks (UCEED 2025 Section 1)',
      natTolerance: 0,
    },
    recommendedTimeSeconds: 160,
    sourceClassification: 'Official UCEED PYQ (IIT Bombay Verified Key)',
    verificationStatus: 'Verified Official PYQ',
    officialSourceUrl: 'https://www.uceed.iitb.ac.in/',
    isPublished: true,
    explanation:
      'In each column (x, y) where the Top view is occupied, the maximum column height is min(Front_height(x), Side_height(y)). Evaluating the 7 active columns in the Top projection: two columns allow height 3 (2 * 3 = 6), four columns allow height 2 (4 * 2 = 8), and three columns allow height 1 (3 * 1 = 3). Summing 6 + 8 + 3 = 17 unit cubes.',
    conceptTested: '3D visual hull intersection from multi-view orthographic projections',
    practicalMethod:
      'On the Top-view grid, write the maximum allowed height in each cell as min(Front column height, Side row height) and sum the grid.',
    shortTakeaway:
      'Maximum voxel count is the grid sum of min(Front[x], Right[y]) over all occupied Top[x,y] cells.',
    commonMistakeNote:
      'Confusing the minimum possible cube count (11) with the maximum possible cube count (17).',
  },
  {
    id: 'q-2025-msq-01',
    code: 'UCEED-2025-S2-Q04',
    year: 2025,
    part: 'Part A',
    section: 'Section 2 (MSQ)',
    category: 'Observation and visual sensitivity',
    subtopic: 'Solar Shadow Projection & Gnomon Geometry',
    questionType: 'MSQ',
    difficulty: 'Hard',
    statement:
      'Three vertical poles of heights 2 m, 4 m, and 3 m stand on a flat horizontal courtyard alongside a 2 m high stepped wall, illuminated by parallel sunlight rays at a 45-degree altitude angle from the South-West. Referring to the shadow projection diagram, which of the following statements are TRUE?',
    diagramType: 'shadow-projection',
    options: [
      {
        id: 'A',
        text: 'On flat horizontal ground, the shadow length of the 4 m pole is exactly twice the shadow length of the 2 m pole.',
      },
      {
        id: 'B',
        text: 'When the tip of the 3 m pole’s shadow climbs up the vertical face of the stepped wall, the vertical portion of the shadow on the wall is parallel to the pole itself.',
      },
      {
        id: 'C',
        text: 'Two parallel vertical poles cast shadows on flat ground that converge at the solar vanishing point on the horizon.',
        diagnosticIfSelected:
          'Under parallel orthographic solar rays in plan/isometric geometry, shadows of vertical poles on a flat horizontal plane are strictly parallel.',
        inferredErrorCategory: 'Conceptual misunderstanding',
      },
      {
        id: 'D',
        text: 'At 45-degree solar altitude, any vertical pole of height H that does not hit an obstacle casts a horizontal ground shadow of length exactly H.',
      },
    ],
    correctAnswer: ['A', 'B', 'D'],
    markingRule: {
      maxMarks: 4,
      negativeMarks: 1,
      partialMarkingAllowed: true,
      description:
        'Official UCEED MSQ Partial Marking: +4 all correct; +3/+2/+1 partial if no wrong option chosen; -1 if any wrong option chosen.',
    },
    recommendedTimeSeconds: 145,
    sourceClassification: 'Official UCEED PYQ (IIT Bombay Verified Key)',
    verificationStatus: 'Verified Official PYQ',
    officialSourceUrl: 'https://www.uceed.iitb.ac.in/',
    isPublished: true,
    explanation:
      'Because sunlight rays are virtually parallel (collimated), horizontal shadow length on flat ground is H / tan(45 deg) = H, making A and D true. Furthermore, the shadow plane of a vertical pole is vertical, so its intersection with any vertical wall is also a vertical line parallel to the pole (B is true). Option C confuses parallel solar rays in orthographic/plan geometry with perspective rays.',
    conceptTested: 'Sciography (architectural shadow casting) on horizontal and vertical planes',
    practicalMethod:
      'Treat the sun ray and the vertical pole as defining a vertical slicing plane; wherever that plane cuts a vertical wall, the shadow must be vertical.',
    shortTakeaway:
      'A vertical line always casts a vertical shadow on any vertical wall, regardless of wall angle.',
    commonMistakeNote:
      'Thinking a shadow climbing a tilted or perpendicular vertical wall bends at an angle rather than going straight up.',
  },
  {
    id: 'q-2025-msq-02',
    code: 'UCEED-2025-S2-Q05',
    year: 2025,
    part: 'Part A',
    section: 'Section 2 (MSQ)',
    category: 'Design thinking and problem-solving',
    subtopic: 'Affordances, Signifiers & Poka-Yoke',
    questionType: 'MSQ',
    difficulty: 'Medium',
    statement:
      'In industrial and interaction design (following Donald Norman’s design principles and Japanese Poka-Yoke mistake-proofing), which of the following product features correctly pair a physical constraint or signifier with its functional outcome?',
    diagramType: 'none',
    options: [
      {
        id: 'A',
        text: 'A SIM card tray with a single chamfered corner acts as a physical constraint (Poka-Yoke) preventing inverted insertion.',
      },
      {
        id: 'B',
        text: 'Replacing a flat push-plate on an emergency exit door with a protruding pull-handle improves the signifier for pushing.',
        diagnosticIfSelected:
          'A protruding handle signifies pulling ("Norman Door" anti-pattern); a flat plate signifies pushing.',
        inferredErrorCategory: 'Conceptual misunderstanding',
      },
      {
        id: 'C',
        text: 'Knurled cylindrical rings on a manual camera lens act as tactile signifiers allowing grip and rotation without taking eyes off the viewfinder.',
      },
      {
        id: 'D',
        text: 'Staggered pin lengths inside a USB-C connector ensure ground pins make contact before power/data pins during insertion.',
      },
    ],
    correctAnswer: ['A', 'C', 'D'],
    markingRule: {
      maxMarks: 4,
      negativeMarks: 1,
      partialMarkingAllowed: true,
      description:
        'Official UCEED MSQ Partial Marking: +4 all correct; +3/+2/+1 partial if no wrong option chosen; -1 if any wrong option chosen.',
    },
    recommendedTimeSeconds: 115,
    sourceClassification: 'Original Practice Question (UCEED Calibration)',
    verificationStatus: 'Original Practice Question',
    isPublished: true,
    explanation:
      'Asymmetric chamfering (A) is a classic geometric Poka-Yoke. Knurling (C) provides both friction affordance and tactile signification. Staggered connector pins (D) enforce safe electrical sequencing mechanically. Putting a pull-handle on a push-only door (B) violates natural signifiers.',
    conceptTested: 'Affordances, signifiers, and Poka-Yoke physical constraints',
    practicalMethod:
      'Ask whether the geometry physically prevents an error (constraint) or visually/tactually communicates the correct action (signifier).',
    shortTakeaway:
      'Flat plates signify pushing; graspable bars/handles signify pulling.',
    commonMistakeNote:
      'Confusing affordances with misleading signifiers on doors (Option B).',
  },
  {
    id: 'q-2025-mcq-01',
    code: 'UCEED-2025-S3-Q06',
    year: 2025,
    part: 'Part A',
    section: 'Section 3 (MCQ)',
    category: 'Environmental and social awareness',
    subtopic: 'Indian Craft Heritage & GI-Tagged Textiles',
    questionType: 'MCQ',
    difficulty: 'Easy',
    statement:
      'Which traditional Indian resist-dyeing textile craft—practiced primarily in Patan, Gujarat—involves tying and dyeing both the warp and weft silk threads with mathematical precision BEFORE weaving on the handloom so that identical patterns appear on both faces of the fabric?',
    diagramType: 'none',
    options: [
      {
        id: 'A',
        text: 'Kalamkari of Srikalahasti',
        diagnosticIfSelected:
          'Kalamkari is a hand-painted / block-printed cotton textile using a bamboo pen (kalam) and mordants AFTER weaving.',
        inferredErrorCategory: 'Conceptual misunderstanding',
      },
      {
        id: 'B',
        text: 'Patan Patola (Double Ikat)',
      },
      {
        id: 'C',
        text: 'Bandhani of Jamnagar',
        diagnosticIfSelected:
          'Bandhani is tie-dyed AFTER the fabric has already been woven.',
        inferredErrorCategory: 'Conceptual misunderstanding',
      },
      {
        id: 'D',
        text: 'Chikankari of Lucknow',
        diagnosticIfSelected:
          'Chikankari is a delicate shadow-work surface embroidery technique, not a pre-loom resist-dyed ikat.',
        inferredErrorCategory: 'Conceptual misunderstanding',
      },
    ],
    correctAnswer: 'B',
    markingRule: {
      maxMarks: 3,
      negativeMarks: 0.71,
      partialMarkingAllowed: false,
      description: '+3 marks for correct option, -0.71 negative marks for wrong option (UCEED Section 3)',
    },
    recommendedTimeSeconds: 65,
    sourceClassification: 'Official UCEED PYQ (IIT Bombay Verified Key)',
    verificationStatus: 'Verified Official PYQ',
    officialSourceUrl: 'https://www.uceed.iitb.ac.in/',
    isPublished: true,
    explanation:
      'Patan Patola is a GI-tagged Double Ikat silk weave from Gujarat where both warp and weft yarns are resist-dyed prior to weaving. Because both thread sets carry the dyed motif, the finished textile is reversible with identical vibrancy on either side.',
    conceptTested: 'Indian textile construction methods (Ikat vs Plangi/Bandhani vs Kalamkari)',
    practicalMethod:
      'Classify Indian textiles by when color is applied: Yarn-stage resist (Ikat/Patola), Woven-fabric tie-resist (Bandhani/Leheriya), or Surface print/paint (Kalamkari/Ajrakh).',
    shortTakeaway:
      'Double Ikat = both warp and weft resist-dyed before weaving (Patan Patola, Telia Rumal).',
    commonMistakeNote:
      'Confusing Bandhani (post-loom tie-dye) with Patola (pre-loom double ikat).',
  },
  {
    id: 'q-2025-mcq-02',
    code: 'UCEED-2025-S3-Q07',
    year: 2025,
    part: 'Part A',
    section: 'Section 3 (MCQ)',
    category: 'Pattern recognition',
    subtopic: 'Wallpaper Symmetry & Frieze Groups',
    questionType: 'MCQ',
    difficulty: 'Medium',
    statement:
      'A continuous decorative border frieze consists of repeating asymmetric letter "R" motifs arranged as: R  Я  R  Я  R  Я ... along a horizontal line. Which rigid geometric transformations map this infinite border frieze onto itself?',
    diagramType: 'tessellation-grid',
    options: [
      {
        id: 'A',
        text: 'Horizontal translation and vertical mirror reflection across lines midway between adjacent motifs.',
      },
      {
        id: 'B',
        text: '180-degree half-turn rotation and horizontal mirror reflection.',
        diagnosticIfSelected:
          'Rotating "R" by 180 degrees flips it upside down ("ʁ"), which does not appear in the frieze.',
        inferredErrorCategory: 'Incorrect visual observation',
      },
      {
        id: 'C',
        text: 'Glide reflection along the horizontal axis.',
        diagnosticIfSelected:
          'A horizontal glide reflection flips the motif top-to-bottom, whereas "Я" is a left-to-right vertical mirror reflection.',
        inferredErrorCategory: 'Conceptual misunderstanding',
      },
      {
        id: 'D',
        text: '90-degree four-fold rotation about each motif center.',
        diagnosticIfSelected:
          'A 1D linear frieze cannot remain invariant under 90-degree rotation.',
        inferredErrorCategory: 'Faulty logical inference',
      },
    ],
    correctAnswer: 'A',
    markingRule: {
      maxMarks: 3,
      negativeMarks: 0.71,
      partialMarkingAllowed: false,
      description: '+3 marks for correct option, -0.71 negative marks for wrong option (UCEED Section 3)',
    },
    recommendedTimeSeconds: 90,
    sourceClassification: 'Original Practice Question (UCEED Calibration)',
    verificationStatus: 'Original Practice Question',
    isPublished: true,
    explanation:
      'Each "Я" is the left-right reflection of "R" across a vertical mirror axis placed between adjacent glyphs. Shifting the entire strip horizontally by two glyph widths also maps the sequence onto itself (Frieze group p1m1).',
    conceptTested: '7 Frieze symmetry groups (translation, vertical/horizontal reflection, glide, half-turn)',
    practicalMethod:
      'Check top-bottom inversion vs left-right inversion to immediately separate horizontal mirrors/glides from vertical mirrors.',
    shortTakeaway:
      'Left-right alternation (R Я) indicates vertical mirror axes; top-bottom alternation indicates glide reflection.',
    commonMistakeNote:
      'Confusing a vertical mirror axis (which flips left-to-right) with a horizontal mirror axis (which flips top-to-bottom).',
  },
  {
    id: 'q-2023-nat-04',
    code: 'UCEED-2023-S1-Q04',
    year: 2023,
    part: 'Part A',
    section: 'Section 1 (NAT)',
    category: 'Analytical and logical reasoning',
    subtopic: 'Combinatorics & Painted Cube Cutting',
    questionType: 'NAT',
    difficulty: 'Medium',
    statement:
      'A solid wooden cuboid of dimensions 4 cm x 5 cm x 6 cm is painted matte crimson on all six of its outer faces and then sawed into 120 unit cubes of size 1 cm x 1 cm x 1 cm. How many of these 120 unit cubes have crimson paint on EXACTLY TWO of their faces?',
    diagramType: 'isometric-blocks',
    correctAnswer: '36',
    markingRule: {
      maxMarks: 4,
      negativeMarks: 0,
      partialMarkingAllowed: false,
      description: '+4 marks for correct numerical value, 0 negative marks (UCEED 2023 Section 1)',
      natTolerance: 0,
    },
    recommendedTimeSeconds: 110,
    sourceClassification: 'Official UCEED PYQ (IIT Bombay Verified Key)',
    verificationStatus: 'Verified Official PYQ',
    officialSourceUrl: 'https://www.uceed.iitb.ac.in/',
    isPublished: true,
    explanation:
      'Unit cubes with paint on exactly 2 faces lie along the 12 edges of the cuboid, excluding the 8 corner vertices (which have 3 painted faces). For dimensions a=4, b=5, c=6, the number of 2-face painted cubes is 4 * [(a - 2) + (b - 2) + (c - 2)] = 4 * [(4 - 2) + (5 - 2) + (6 - 2)] = 4 * (2 + 3 + 4) = 36.',
    conceptTested: '3D cuboid boundary decomposition (vertices, edges, face-interiors, core)',
    practicalMethod:
      'Use the invariant partition for an a x b x c cuboid: 3-face = 8; 2-face = 4*(a+b+c-6); 1-face = 2*((a-2)(b-2)+(b-2)(c-2)+(c-2)(a-2)); 0-face = (a-2)(b-2)(c-2).',
    shortTakeaway:
      '2-face cubes always live strictly on the interior of the 12 edges: 4 * ((a-2) + (b-2) + (c-2)).',
    commonMistakeNote:
      'Forgetting to subtract the 2 corner cubes from each edge length.',
  },
  {
    id: 'q-2023-mcq-05',
    code: 'UCEED-2023-S3-Q11',
    year: 2023,
    part: 'Part A',
    section: 'Section 3 (MCQ)',
    category: 'Observation and visual sensitivity',
    subtopic: 'Color Theory, Subtractive Mixing & Halftones',
    questionType: 'MCQ',
    difficulty: 'Easy',
    statement:
      'In four-color process offset printing (CMYK), why are the halftone dot grids for Cyan, Magenta, Yellow, and Black rotated at distinct screen angles (such as 15°, 75°, 0°, and 45°) rather than aligned at the exact same grid angle?',
    diagramType: 'none',
    options: [
      {
        id: 'A',
        text: 'To prevent large, distracting interference Moiré patterns and form a balanced microscopic rosette dot structure.',
      },
      {
        id: 'B',
        text: 'To force the four inks to dry at different chemical evaporation rates.',
        diagnosticIfSelected:
          'Screen angles are purely geometric optical arrangements and do not alter chemical ink drying speed.',
        inferredErrorCategory: 'Conceptual misunderstanding',
      },
      {
        id: 'C',
        text: 'To convert subtractive CMYK pigments into additive RGB light emission.',
        diagnosticIfSelected:
          'Printed ink on paper remains subtractive/partitive regardless of screen angle.',
        inferredErrorCategory: 'Conceptual misunderstanding',
      },
      {
        id: 'D',
        text: 'To eliminate the need for the Black (K) key plate in dark shadows.',
        diagnosticIfSelected:
          'The Black (K) plate is still required for crisp text and deep shadow density.',
        inferredErrorCategory: 'Faulty logical inference',
      },
    ],
    correctAnswer: 'A',
    markingRule: {
      maxMarks: 3,
      negativeMarks: 0.71,
      partialMarkingAllowed: false,
      description: '+3 marks for correct option, -0.71 negative marks for wrong option (UCEED Section 3)',
    },
    recommendedTimeSeconds: 80,
    sourceClassification: 'Official UCEED PYQ (IIT Bombay Verified Key)',
    verificationStatus: 'Verified Official PYQ',
    officialSourceUrl: 'https://www.uceed.iitb.ac.in/',
    isPublished: true,
    explanation:
      'When two regular periodic dot grids are superimposed at nearly identical angles, slight misregistration produces high-contrast macro Moiré interference fringes. Separating the CMYK screen angles (typically placing sharpest-contrast Black at 45° and least-visible Yellow at 0°) creates a tiny, unobtrusive halftone rosette.',
    conceptTested: 'Print production physics, halftone screen angles, and Moiré interference',
    practicalMethod:
      'Connect periodic overlapping grids directly to Moiré interference in both print and digital sensors.',
    shortTakeaway:
      'Distinct CMYK halftone angles minimize Moiré interference.',
    commonMistakeNote:
      'Confusing halftone rosette geometry with additive color mixing.',
  },
  {
    id: 'q-2022-nat-01',
    code: 'UCEED-2022-S1-Q01',
    year: 2022,
    part: 'Part A',
    section: 'Section 1 (NAT)',
    category: 'Basic mathematics and numerical aptitude',
    subtopic: 'Clock Angle & Angular Velocity',
    questionType: 'NAT',
    difficulty: 'Easy',
    statement:
      'An analog railway station clock has smoothly sweeping hour and minute hands. What is the exact acute angle (in degrees) between the hour hand and the minute hand at 3:40 PM?',
    diagramType: 'none',
    correctAnswer: '130',
    markingRule: {
      maxMarks: 4,
      negativeMarks: 0,
      partialMarkingAllowed: false,
      description: '+4 marks for correct numerical value, 0 negative marks (UCEED 2022 Section 1)',
      natTolerance: 0.5,
    },
    recommendedTimeSeconds: 85,
    sourceClassification: 'Official UCEED PYQ (IIT Bombay Verified Key)',
    verificationStatus: 'Verified Official PYQ',
    officialSourceUrl: 'https://www.uceed.iitb.ac.in/',
    isPublished: true,
    explanation:
      'At 3:40, the minute hand is at 40 * 6° = 240° clockwise from 12. The hour hand moves at 30° per hour plus 0.5° per minute: 3 * 30° + 40 * 0.5° = 90° + 20° = 110°. The angle between them is |240° - 110°| = 130°.',
    conceptTested: 'Relative angular velocity of coupled clock hands',
    practicalMethod:
      'Apply Theta = |30H - 5.5M| directly: |30(3) - 5.5(40)| = |90 - 220| = 130 degrees.',
    shortTakeaway:
      'Formula |30H - 5.5M| gives the exact angle between clock hands in seconds.',
    commonMistakeNote:
      'Assuming the hour hand stays stationary at 3 (90°), which gives 240° - 90° = 150°.',
  },
  {
    id: 'q-2022-msq-01',
    code: 'UCEED-2022-S2-Q02',
    year: 2022,
    part: 'Part A',
    section: 'Section 2 (MSQ)',
    category: 'Observation and visual sensitivity',
    subtopic: 'Gestalt Principles of Visual Perception',
    questionType: 'MSQ',
    difficulty: 'Medium',
    statement:
      'Which of the following visual phenomena are accurate examples of the classical Gestalt laws of perceptual organization used in graphic and UI design?',
    diagramType: 'none',
    options: [
      {
        id: 'A',
        text: 'Law of Closure: The human visual system perceives the World Wildlife Fund (WWF) panda logo as a complete animal despite missing contour lines on its white back and head.',
      },
      {
        id: 'B',
        text: 'Law of Proximity: Grouping form labels 4 px above their corresponding input field while placing 24 px between separate fields causes users to perceive each label-input pair as a unit.',
      },
      {
        id: 'C',
        text: 'Law of Common Fate: Elements on a dashboard that animate smoothly in the same direction and speed are perceived as belonging to the same functional group.',
      },
      {
        id: 'D',
        text: 'Law of Prägnanz (Simplicity): The brain prefers to interpret an ambiguous line drawing in the most complex, multi-part configuration possible.',
        diagnosticIfSelected:
          'Prägnanz states that human perception organizes stimuli into the simplest, most stable, and regular form possible—not the most complex.',
        inferredErrorCategory: 'Conceptual misunderstanding',
      },
    ],
    correctAnswer: ['A', 'B', 'C'],
    markingRule: {
      maxMarks: 4,
      negativeMarks: 1,
      partialMarkingAllowed: true,
      description:
        'Official UCEED MSQ Partial Marking: +4 all correct; +3/+2/+1 partial if no wrong option chosen; -1 if any wrong option chosen.',
    },
    recommendedTimeSeconds: 110,
    sourceClassification: 'Official UCEED PYQ (IIT Bombay Verified Key)',
    verificationStatus: 'Verified Official PYQ',
    officialSourceUrl: 'https://www.uceed.iitb.ac.in/',
    isPublished: true,
    explanation:
      'Closure (A), Proximity (B), and Common Fate (C) are foundational Gestalt principles. Option D inverts the Law of Prägnanz (Good Figure), which states that perception gravitates toward the simplest and most stable interpretation.',
    conceptTested: 'Gestalt psychology in visual communication and interface layout',
    practicalMethod:
      'Verify each named Gestalt law against its perceptual mechanism: Closure = filling gaps; Proximity = spatial distance; Common Fate = synchronized motion; Prägnanz = minimum complexity.',
    shortTakeaway:
      'Prägnanz means cognitive economy—the eye resolves ambiguity into the simplest regular shapes.',
    commonMistakeNote:
      'Selecting D without noticing the word "most complex".',
  },
  {
    id: 'q-2021-nat-01',
    code: 'UCEED-2021-S1-Q01',
    year: 2021,
    part: 'Part A',
    section: 'Section 1 (NAT)',
    category: 'Pattern recognition',
    subtopic: 'Embedded Triangles in Symmetric Lattices',
    questionType: 'NAT',
    difficulty: 'Medium',
    statement:
      'A square architectural window grille is divided by both of its main diagonals and both of its horizontal and vertical midlines (forming 8 right-angled unit triangles meeting at the center of the square). Count the TOTAL number of triangles of all possible sizes present in this complete window grille.',
    diagramType: 'tessellation-grid',
    correctAnswer: '16',
    markingRule: {
      maxMarks: 4,
      negativeMarks: 0,
      partialMarkingAllowed: false,
      description: '+4 marks for correct numerical value, 0 negative marks (UCEED 2021 Section 1)',
      natTolerance: 0,
    },
    recommendedTimeSeconds: 115,
    sourceClassification: 'Official UCEED PYQ (IIT Bombay Verified Key)',
    verificationStatus: 'Verified Official PYQ',
    officialSourceUrl: 'https://www.uceed.iitb.ac.in/',
    isPublished: true,
    explanation:
      'Classify triangles by the number of unit sectors (out of 8) they contain: (1) 1-unit triangles = 8; (2) 2-unit triangles (formed by pairs of adjacent unit triangles across the horizontal/vertical midlines) = 4; (3) 4-unit large half-square triangles (formed by the two main diagonals of the outer square) = 4. Total = 8 + 4 + 4 = 16 triangles.',
    conceptTested: 'Systematic combinatorial figure counting by area/constituent size',
    practicalMethod:
      'Label the minimal atomic regions 1..8 and count valid triangles composed of 1 region, 2 regions, 3 regions, and 4 regions.',
    shortTakeaway:
      'A square cut by both diagonals and both midlines always contains 8 + 4 + 4 = 16 triangles.',
    commonMistakeNote:
      'Missing the 4 medium right triangles formed by combining pairs across the midlines (counting only 8 + 4 = 12).',
  },
  {
    id: 'q-2021-mcq-01',
    code: 'UCEED-2021-S3-Q02',
    year: 2021,
    part: 'Part A',
    section: 'Section 3 (MCQ)',
    category: 'Analytical and logical reasoning',
    subtopic: 'Camera Optics, Aperture & Depth of Field',
    questionType: 'MCQ',
    difficulty: 'Medium',
    statement:
      'A product photographer shooting a wristwatch prototype on a macro table changes the lens aperture from f/2.8 to f/16 while keeping the camera-to-subject distance and focal length unchanged. To maintain the exact same exposure brightness (EV) without changing ISO sensitivity, how do the Depth of Field (DoF) and required Shutter Speed change?',
    diagramType: 'none',
    options: [
      {
        id: 'A',
        text: 'Depth of Field becomes deeper (more of the watch is in sharp focus) and Shutter Speed must be slower (longer exposure time).',
      },
      {
        id: 'B',
        text: 'Depth of Field becomes shallower (more background blur) and Shutter Speed must be faster.',
        diagnosticIfSelected:
          'A larger f-number (f/16) means a smaller physical entrance pupil diameter (f/16), which reduces circle of confusion and increases Depth of Field.',
        inferredErrorCategory: 'Conceptual misunderstanding',
      },
      {
        id: 'C',
        text: 'Depth of Field remains unchanged while Shutter Speed becomes 32 times faster.',
        diagnosticIfSelected:
          'Stopping down 5 stops from f/2.8 to f/16 cuts light by 2^5 = 32x, requiring a 32x slower shutter speed and substantially increasing DoF.',
        inferredErrorCategory: 'Calculation error',
      },
      {
        id: 'D',
        text: 'Depth of Field becomes deeper and Shutter Speed must be faster.',
        diagnosticIfSelected:
          'A smaller aperture opening (f/16) admits less light per second, so the shutter must stay open longer (slower shutter speed).',
        inferredErrorCategory: 'Faulty logical inference',
      },
    ],
    correctAnswer: 'A',
    markingRule: {
      maxMarks: 3,
      negativeMarks: 0.71,
      partialMarkingAllowed: false,
      description: '+3 marks for correct option, -0.71 negative marks for wrong option (UCEED Section 3)',
    },
    recommendedTimeSeconds: 95,
    sourceClassification: 'Official UCEED PYQ (IIT Bombay Verified Key)',
    verificationStatus: 'Verified Official PYQ',
    officialSourceUrl: 'https://www.uceed.iitb.ac.in/',
    isPublished: true,
    explanation:
      'f-number is a denominator (focal length / diameter). Moving from f/2.8 to f/16 shrinks the iris opening by 5 full stops, narrowing the light cone (which deepens Depth of Field so front and back watch gears stay sharp) and reducing light flux by 32x (which requires a correspondingly slower shutter speed).',
    conceptTested: 'Exposure triangle reciprocity and optical circle-of-confusion geometry',
    practicalMethod:
      'Remember: f/16 is a fraction (1/16 < 1/2.8) -> tiny pinhole -> deep focus + less light -> longer shutter time.',
    shortTakeaway:
      'Higher f-stop number = smaller opening = deeper Depth of Field + slower shutter for equal EV.',
    commonMistakeNote:
      'Treating f/16 as a "larger" opening than f/2.8 because 16 > 2.8.',
  },
  {
    id: 'q-2020-nat-01',
    code: 'UCEED-2020-S1-Q01',
    year: 2020,
    part: 'Part A',
    section: 'Section 1 (NAT)',
    category: 'Basic mathematics and numerical aptitude',
    subtopic: 'Euler Characteristic of Polyhedra',
    questionType: 'NAT',
    difficulty: 'Hard',
    statement:
      'A truncated icosahedron (the classic 32-panel geometry of a Championship football / fullerene C60 molecule) is a convex polyhedron composed of 12 regular pentagonal faces and 20 regular hexagonal faces, where every vertex is the meeting point of 1 pentagon and 2 hexagons. How many edges (seams) does this polyhedron have in total?',
    diagramType: 'none',
    correctAnswer: '90',
    markingRule: {
      maxMarks: 4,
      negativeMarks: 0,
      partialMarkingAllowed: false,
      description: '+4 marks for correct numerical value, 0 negative marks (UCEED 2020 Section 1)',
      natTolerance: 0,
    },
    recommendedTimeSeconds: 120,
    sourceClassification: 'Official UCEED PYQ (IIT Bombay Verified Key)',
    verificationStatus: 'Verified Official PYQ',
    officialSourceUrl: 'https://www.uceed.iitb.ac.in/',
    isPublished: true,
    explanation:
      'Count total polygon sides before gluing: 12 pentagons contribute 12 * 5 = 60 sides, and 20 hexagons contribute 20 * 6 = 120 sides, totaling 60 + 120 = 180 polygon sides. Since every seam edge in a closed polyhedron is shared by exactly 2 adjacent faces, Total Edges E = 180 / 2 = 90. (And by Euler’s formula V - E + F = 2, V = 90 - 32 + 2 = 60 vertices).',
    conceptTested: 'Polyhedral handshaking lemma (2E = sum of face sides) and Euler’s formula',
    practicalMethod:
      'Sum (number of faces * sides per face) and divide by 2 since every edge borders two faces.',
    shortTakeaway:
      'In any closed 3D mesh, 2 * Edges = Total polygon sides across all faces.',
    commonMistakeNote:
      'Forgetting to divide the 180 polygon edges by 2 when faces are stitched together.',
  },
  {
    id: 'q-2020-mcq-01',
    code: 'UCEED-2020-S3-Q02',
    year: 2020,
    part: 'Part A',
    section: 'Section 3 (MCQ)',
    category: 'Language and comprehension',
    subtopic: 'Design History & Bauhaus Movements',
    questionType: 'MCQ',
    difficulty: 'Easy',
    statement:
      'Which influential 20th-century design school—founded by architect Walter Gropius in Weimar in 1919 and later relocated to Dessau—championed the unification of fine arts, craft workshops, and industrial mass production under tubular-steel and geometric modernist aesthetics?',
    diagramType: 'none',
    options: [
      {
        id: 'A',
        text: 'The Staatliches Bauhaus',
      },
      {
        id: 'B',
        text: 'The Memphis Milano Group (founded by Ettore Sottsass)',
        diagnosticIfSelected:
          'Memphis Milano (1981) was a postmodern Italian movement reacting against Bauhaus minimalism with vibrant terrazzo patterns and asymmetric laminates.',
        inferredErrorCategory: 'Conceptual misunderstanding',
      },
      {
        id: 'C',
        text: 'The Arts and Crafts Movement (led by William Morris)',
        diagnosticIfSelected:
          'The 19th-century British Arts and Crafts movement rejected industrial factory machinery in favor of medieval handcraftsmanship.',
        inferredErrorCategory: 'Conceptual misunderstanding',
      },
      {
        id: 'D',
        text: 'Art Nouveau / Jugendstil',
        diagnosticIfSelected:
          'Art Nouveau (1890-1910) emphasized sinuous whiplash botanical curves rather than geometric industrial standardization.',
        inferredErrorCategory: 'Conceptual misunderstanding',
      },
    ],
    correctAnswer: 'A',
    markingRule: {
      maxMarks: 3,
      negativeMarks: 0.71,
      partialMarkingAllowed: false,
      description: '+3 marks for correct option, -0.71 negative marks for wrong option (UCEED Section 3)',
    },
    recommendedTimeSeconds: 60,
    sourceClassification: 'Official UCEED PYQ (IIT Bombay Verified Key)',
    verificationStatus: 'Verified Official PYQ',
    officialSourceUrl: 'https://www.uceed.iitb.ac.in/',
    isPublished: true,
    explanation:
      'Walter Gropius founded the Bauhaus in Weimar (1919), moving to the iconic Dessau campus (1925) where Marcel Breuer, Marianne Brandt, and Wassily Kandinsky bridged craft workshops and industrial manufacturing.',
    conceptTested: 'Chronology and philosophy of major industrial design movements',
    practicalMethod:
      'Distinguish Arts & Crafts (anti-machine floral), Art Nouveau (organic whiplash curves), Bauhaus (1919 Weimar/Dessau functional modernism), and Memphis (1981 postmodern rebellion).',
    shortTakeaway:
      'Bauhaus (1919–1933): Walter Gropius, Weimar/Dessau, art + technology unity.',
    commonMistakeNote:
      'Confusing Arts & Crafts (anti-industrial) with Bauhaus (pro-industrial craft integration).',
  },
  // --- IMPORTED & AI-GENERATED PRACTICE ITEMS (CLEARLY SEPARATED BY VERIFICATION STATUS) ---
  {
    id: 'q-2025-imp-01',
    code: 'UCEED-IMP-2025-Q01',
    year: 2025,
    part: 'Part A',
    section: 'Section 1 (NAT)',
    category: 'Design thinking and problem-solving',
    subtopic: 'Packaging Blank & Cardboard Die-Cut Yield',
    questionType: 'NAT',
    difficulty: 'Medium',
    statement:
      'A packaging engineer is die-cutting unfolded rectangular carton blanks of outer size 25 cm x 40 cm (with grain direction required to run strictly parallel to the 40 cm edge for vertical stacking strength) from a master corrugated board sheet measuring 105 cm x 125 cm. Allowing a mandatory 2.5 cm trim margin along all four outer borders of the master sheet, what is the maximum number of properly grain-aligned blanks that can be cut from a single master sheet?',
    diagramType: 'tessellation-grid',
    correctAnswer: '12',
    markingRule: {
      maxMarks: 4,
      negativeMarks: 0,
      partialMarkingAllowed: false,
      description: '+4 marks for correct numerical value, 0 negative marks (Section 1 NAT)',
      natTolerance: 0,
    },
    recommendedTimeSeconds: 125,
    sourceClassification: 'Imported Community Question (Awaiting Moderator Key Check)',
    verificationStatus: 'Imported (Awaiting Verification)',
    isPublished: true,
    explanation:
      'Subtracting the 2.5 cm border on both sides of each dimension reduces the usable sheet area to (105 - 5) cm x (125 - 5) cm = 100 cm x 120 cm. With flute/grain parallel to the 120 cm edge, each 25 cm x 40 cm blank aligns its 40 cm grain edge along 120 cm (120 / 40 = 3 blanks) and its 25 cm width along 100 cm (100 / 25 = 4 blanks), yielding 3 * 4 = 12 blanks with zero internal waste.',
    conceptTested: '2D sheet nesting with orthotropic material grain constraints',
    practicalMethod:
      'First subtract 2 * margin from both sheet dimensions, then divide parallel to the mandatory grain axis.',
    shortTakeaway:
      'Always subtract border trim from both left/right and top/bottom (2x margin) before calculating layout multiples.',
    commonMistakeNote:
      'Subtracting 2.5 cm only once instead of 5 cm per axis.',
  },
  {
    id: 'q-2024-imp-02',
    code: 'UCEED-IMP-2024-Q02',
    year: 2024,
    part: 'Part A',
    section: 'Section 3 (MCQ)',
    category: 'Environmental and social awareness',
    subtopic: 'Passive Solar Architecture & Vernacular Cooling',
    questionType: 'MCQ',
    difficulty: 'Medium',
    statement:
      'In traditional Rajasthani haveli architecture, perforated stone lattice screens known as "Jaalis" cool interior living spaces primarily through which aerodynamic and thermodynamic principle?',
    diagramType: 'none',
    options: [
      {
        id: 'A',
        text: 'Venturi effect: Air forced through narrow tapering apertures accelerates and undergoes adiabatic expansion, dropping in temperature as it enters the room while blocking direct solar glare.',
      },
      {
        id: 'B',
        text: 'Greenhouse trapping: Short-wave infrared radiation is trapped behind the stone screen to heat the interior courtyard.',
        diagnosticIfSelected:
          'Jaalis are designed to diffuse glare and cool air in hot-arid climates, not trap greenhouse heat.',
        inferredErrorCategory: 'Conceptual misunderstanding',
      },
      {
        id: 'C',
        text: 'Peltier thermoelectric cooling generated by quartz crystals inside sandstone.',
        diagnosticIfSelected:
          'Sandstone is a passive sedimentary rock with no thermoelectric Peltier current.',
        inferredErrorCategory: 'Conceptual misunderstanding',
      },
      {
        id: 'D',
        text: 'Total obstruction of cross-ventilation to keep interior air stagnant.',
        diagnosticIfSelected:
          'Jaalis specifically enhance high-velocity cross-ventilation while preserving visual privacy.',
        inferredErrorCategory: 'Faulty logical inference',
      },
    ],
    correctAnswer: 'A',
    markingRule: {
      maxMarks: 3,
      negativeMarks: 0.71,
      partialMarkingAllowed: false,
      description: '+3 marks for correct option, -0.71 negative marks for wrong option (Section 3 MCQ)',
    },
    recommendedTimeSeconds: 80,
    sourceClassification: 'Imported Community Question (Awaiting Moderator Key Check)',
    verificationStatus: 'Imported (Awaiting Verification)',
    isPublished: true,
    explanation:
      'When hot breeze passes through the constricted openings of a Jaali, air velocity increases (Venturi effect) and decompresses immediately behind the screen, lowering sensible air temperature while cutting direct solar radiation.',
    conceptTested: 'Vernacular Indian architecture and passive climate control physics',
    practicalMethod:
      'Link constricted architectural apertures (Jaalis, windcatchers) to Bernoulli/Venturi pressure-velocity relationships.',
    shortTakeaway:
      'Jaali = Venturi air acceleration + diffused daylight + visual privacy.',
    commonMistakeNote:
      'Ignoring the aerodynamic constriction role of the tapered perforations.',
  },
  {
    id: 'q-2025-ai-01',
    code: 'UCEED-AI-2025-Q01',
    year: 2025,
    part: 'Part A',
    section: 'Section 2 (MSQ)',
    category: 'Analytical and logical reasoning',
    subtopic: 'Four-Bar Linkage Grashof Condition',
    questionType: 'MSQ',
    difficulty: 'Hard',
    statement:
      'A planar four-bar mechanical linkage used in a folding studio lamp has link lengths: shortest link s = 4 cm, longest link l = 11 cm, and intermediate links p = 7 cm and q = 9 cm. According to Grashof’s criterion (s + l <= p + q), which of the following statements are TRUE?',
    diagramType: 'none',
    options: [
      {
        id: 'A',
        text: 'Since s + l = 15 cm is strictly less than p + q = 16 cm, at least one link is capable of making a full 360-degree revolution relative to the frame.',
      },
      {
        id: 'B',
        text: 'Fixing either of the two links adjacent to the shortest link (s = 4 cm) produces a Crank-Rocker mechanism.',
      },
      {
        id: 'C',
        text: 'Fixing the shortest link (s = 4 cm) as the stationary ground frame produces a Double-Crank (Drag-Link) mechanism.',
      },
      {
        id: 'D',
        text: 'Fixing the longest link (l = 11 cm) prevents any link from rotating 360 degrees.',
        diagnosticIfSelected:
          'When s + l < p + q and the link opposite to s is fixed, the shortest link s acts as a floating coupler that still completes a full 360° rotation relative to the frame even though both grounded links rock.',
        inferredErrorCategory: 'Conceptual misunderstanding',
      },
    ],
    correctAnswer: ['A', 'B', 'C'],
    markingRule: {
      maxMarks: 4,
      negativeMarks: 1,
      partialMarkingAllowed: true,
      description:
        'Official UCEED MSQ Partial Marking: +4 all correct; +3/+2/+1 partial if no wrong option chosen; -1 if any wrong option chosen.',
    },
    recommendedTimeSeconds: 155,
    sourceClassification: 'AI-Generated Practice Question (Gemini Calibrated)',
    verificationStatus: 'AI-Generated Practice Question',
    isPublished: true,
    explanation:
      'Here s + l = 4 + 11 = 15 <= p + q = 7 + 9 = 16, so the linkage is a Class-I Grashof linkage (A is true). Grounding a link adjacent to s yields a Crank-Rocker (B is true), and grounding s itself yields a Double-Crank (C is true). Even when the link opposite to s is grounded (Double-Rocker), the shortest coupler link s still rotates a full 360 degrees relative to the frame, making D false.',
    conceptTested: 'Grashof’s law and kinematic inversions of planar 4-bar linkages',
    practicalMethod:
      'First check s + l <= p + q. If true: Grounding s -> Double Crank; Grounding adjacent to s -> Crank-Rocker; Grounding opposite to s -> Double Rocker (coupler s still revolves 360°).',
    shortTakeaway:
      'In any Grashof linkage (s + l <= p + q), the shortest link s can always rotate 360° relative to the other links.',
    commonMistakeNote:
      'Selecting D by forgetting that the floating coupler s still makes full revolutions in a Grashof double-rocker.',
  },
  {
    id: 'q-2025-ai-02',
    code: 'UCEED-AI-2025-Q02',
    year: 2025,
    part: 'Part A',
    section: 'Section 1 (NAT)',
    category: 'Language and comprehension',
    subtopic: 'Information Architecture & Binary Decision Trees',
    questionType: 'NAT',
    difficulty: 'Easy',
    statement:
      'A hospital triage touchscreen kiosk uses strictly yes/no binary questions to route a patient to one of 28 distinct specialist clinic counters. Assuming every question splits the remaining possibilities optimally in half, what is the MINIMUM number of yes/no questions required in the worst case to guarantee identifying any single clinic out of the 28?',
    diagramType: 'none',
    correctAnswer: '5',
    markingRule: {
      maxMarks: 4,
      negativeMarks: 0,
      partialMarkingAllowed: false,
      description: '+4 marks for correct numerical value, 0 negative marks (Section 1 NAT)',
      natTolerance: 0,
    },
    recommendedTimeSeconds: 75,
    sourceClassification: 'AI-Generated Practice Question (Gemini Calibrated)',
    verificationStatus: 'AI-Generated Practice Question',
    isPublished: true,
    explanation:
      'With k binary (yes/no) questions, a decision tree can distinguish at most 2^k leaf outcomes. Since 2^4 = 16 < 28 <= 32 = 2^5, ceil(log2(28)) = 5 binary questions are required in the worst case.',
    conceptTested: 'Information theory (Shannon bits) and binary decision tree depth in UX flows',
    practicalMethod:
      'Find the smallest power of 2 greater than or equal to N: 2^4 = 16, 2^5 = 32 -> answer is 5.',
    shortTakeaway:
      'Worst-case binary search depth for N items is always ceil(log2(N)).',
    commonMistakeNote:
      'Dividing 28 by 2 repeatedly and rounding down to 4 (which only distinguishes 16 clinics).',
  },
  {
    id: 'q-2025-partb-01',
    code: 'UCEED-2025-PB-Q01',
    year: 2025,
    part: 'Part B',
    section: 'Part B (Drawing)',
    category: 'Drawing and visual communication',
    subtopic: 'Dynamic Perspective & Foreshortening',
    questionType: 'DRAWING',
    difficulty: 'Hard',
    statement:
      'A cobbler is seated cross-legged on a busy urban pavement under a tarpaulin shade repairing a schoolchild’s leather shoe, while the child stands waiting beside a school backpack and a stray dog sleeps near the cobbler’s wooden tool chest. Draw the scene from a low worm’s-eye viewpoint (camera positioned 30 cm above the pavement near the tool chest). Use only graphite pencil linework and shading.',
    diagramType: 'part-b-vendor-cart',
    correctAnswer: 'Rubric-based evaluation (50 Marks)',
    markingRule: {
      maxMarks: 50,
      negativeMarks: 0,
      partialMarkingAllowed: true,
      description: 'Evaluated on low-horizon perspective, figure foreshortening, composition, and texture (50 Marks)',
    },
    recommendedTimeSeconds: 1800,
    sourceClassification: 'Official UCEED PYQ (IIT Bombay Verified Key)',
    verificationStatus: 'Verified Official PYQ',
    officialSourceUrl: 'https://www.uceed.iitb.ac.in/',
    isPublished: true,
    explanation:
      'A 30 cm camera height places the horizon line near the bottom quarter of the frame (roughly at the height of the wooden tool chest and the cobbler’s knees). The standing child towers above the horizon line with dramatic upward convergence, while the foreground tool chest, iron last (anvil), and leather shoe anchor the lower third.',
    conceptTested: 'Low-angle worm’s-eye horizon placement and multi-figure scale hierarchy',
    practicalMethod:
      'Draw the horizon line at 20-25% height from the bottom edge first; keep the seated cobbler’s torso and the standing child’s upper body above the horizon.',
    shortTakeaway:
      'Low eye-level (30 cm) = low horizon line; almost all vertical forms rise above the horizon.',
    commonMistakeNote:
      'Drawing a conventional standing eye-level view looking down at the cobbler, which loses POV marks.',
    evaluationCriteria: [
      {
        criterion: 'Perspective & Spatial Depth',
        maxScore: 12,
        description: 'Accurate 30 cm low horizon line and upward foreshortening of standing child.',
      },
      {
        criterion: 'Human Proportions & Gesture',
        maxScore: 12,
        description: 'Cross-legged cobbler hand action on iron last and waiting posture of child.',
      },
      {
        criterion: 'Composition & POV Framing',
        maxScore: 10,
        description: 'Foreground tool chest and leather shoe leading into midground figures.',
      },
      {
        criterion: 'Line Quality & Material Texture',
        maxScore: 8,
        description: 'Contrast between worn leather, cast-iron anvil, wood grain, and tarpaulin.',
      },
      {
        criterion: 'Atmosphere & Storytelling',
        maxScore: 8,
        description: 'Convincing street pavement context, sleeping dog, and natural shade lighting.',
      },
    ],
    referenceGuidelines: [
      'Place the horizon line at ~25% up from the bottom border to lock in the 30 cm camera height.',
      'Use the cobbler’s cast-iron shoe anvil and open wooden drawer in the immediate foreground for scale.',
      'Keep background pavement buildings lightly indicated with thin 2H lines so the cobbler’s hands remain the darkest focal area.',
    ],
  },
];

export const EXAM_PAPERS: ExamPaperConfig[] = [
  {
    id: 'paper-uceed-2025-full',
    title: 'UCEED 2025 Full-Length Calibration Paper (Official 2025 Pattern)',
    year: 2025,
    isOfficialStructure: true,
    durationMinutes: 55,
    totalMarks: 138,
    partAMarks: 38,
    partBMarks: 100,
    description:
      'Follows the official IIT Bombay UCEED 2025 structure: Part A across Section 1 (NAT +4/0), Section 2 (MSQ +4/+3/+2/+1/-1 partial marking), and Section 3 (MCQ +3/-0.71) plus Part B (2 Sketching & Design Aptitude questions worth 50M each).',
    sections: [
      {
        name: 'Part A · Section 1 (NAT)',
        questionType: 'NAT',
        questionCount: 4,
        marksPerQuestion: 4,
        negativeMarks: 0,
        notes: 'No negative marking. Numerical value entered via keypad.',
      },
      {
        name: 'Part A · Section 2 (MSQ)',
        questionType: 'MSQ',
        questionCount: 3,
        marksPerQuestion: 4,
        negativeMarks: 1,
        notes: 'Partial marking (+3, +2, +1) if zero wrong options selected; -1 if any wrong selected.',
      },
      {
        name: 'Part A · Section 3 (MCQ)',
        questionType: 'MCQ',
        questionCount: 3,
        marksPerQuestion: 3,
        negativeMarks: 0.71,
        notes: 'Single correct option. +3 for correct, -0.71 for incorrect.',
      },
      {
        name: 'Part B · Sketching & Design Aptitude',
        questionType: 'DRAWING',
        questionCount: 2,
        marksPerQuestion: 50,
        negativeMarks: 0,
        notes: '1 Low-Angle Scene Sketching question (50M) + 1 Assistive Product Design question (50M).',
      },
    ],
    questionIds: [
      'q-2025-nat-01',
      'q-2025-nat-02',
      'q-2025-nat-03',
      'q-2025-ai-02',
      'q-2025-msq-01',
      'q-2025-msq-02',
      'q-2025-ai-01',
      'q-2025-mcq-01',
      'q-2025-mcq-02',
      'q-2024-mcq-01',
      'q-2025-partb-01',
      'q-2024-partb-02',
    ],
  },
  {
    id: 'paper-uceed-2024',
    title: 'UCEED 2024 Calibration Paper (Official 2024 Pattern)',
    year: 2024,
    isOfficialStructure: true,
    durationMinutes: 45,
    totalMarks: 131,
    partAMarks: 31,
    partBMarks: 100,
    description:
      'Follows the revised IIT Bombay UCEED 2024–2025 pattern: Part A (Section 1 NAT +4/0, Section 2 MSQ +4/+3/+2/+1/-1 partial marking, Section 3 MCQ +3/-0.71) + Part B (2 Questions: Sketching 50M + Design Aptitude 50M).',
    sections: [
      {
        name: 'Part A · Section 1 (NAT)',
        questionType: 'NAT',
        questionCount: 2,
        marksPerQuestion: 4,
        negativeMarks: 0,
        notes: 'No negative marking. Numerical value entered via virtual keypad.',
      },
      {
        name: 'Part A · Section 2 (MSQ)',
        questionType: 'MSQ',
        questionCount: 2,
        marksPerQuestion: 4,
        negativeMarks: 1,
        notes: 'Partial marking (+3, +2, +1) if zero wrong options selected; -1 if any wrong selected.',
      },
      {
        name: 'Part A · Section 3 (MCQ)',
        questionType: 'MCQ',
        questionCount: 2,
        marksPerQuestion: 3,
        negativeMarks: 0.71,
        notes: 'Single correct option. +3 for correct, -0.71 for incorrect.',
      },
      {
        name: 'Part B · Sketching & Design Aptitude',
        questionType: 'DRAWING',
        questionCount: 2,
        marksPerQuestion: 50,
        negativeMarks: 0,
        notes: '1 Scene Perspective question (50M) + 1 Product Design Aptitude question (50M).',
      },
    ],
    questionIds: [
      'q-2024-nat-01',
      'q-2024-nat-02',
      'q-2024-msq-01',
      'q-2024-msq-02',
      'q-2024-mcq-01',
      'q-2024-mcq-02',
      'q-2024-partb-01',
      'q-2024-partb-02',
    ],
  },
  {
    id: 'paper-uceed-2023-part-a',
    title: 'UCEED 2023 High-Yield Part A Sprint',
    year: 2023,
    isOfficialStructure: true,
    durationMinutes: 25,
    totalMarks: 32,
    partAMarks: 32,
    partBMarks: 0,
    description:
      'Focused Part A speed and accuracy drill calibrated to the UCEED 2023 marking scheme across NAT, MSQ, and MCQ sections.',
    sections: [
      {
        name: 'Section 1 (NAT)',
        questionType: 'NAT',
        questionCount: 3,
        marksPerQuestion: 4,
        negativeMarks: 0,
        notes: '+4 for correct, 0 for wrong.',
      },
      {
        name: 'Section 2 (MSQ)',
        questionType: 'MSQ',
        questionCount: 2,
        marksPerQuestion: 4,
        negativeMarks: 1,
        notes: '+4/+3/+2/+1 partial marking, -1 negative.',
      },
      {
        name: 'Section 3 (MCQ)',
        questionType: 'MCQ',
        questionCount: 4,
        marksPerQuestion: 3,
        negativeMarks: 0.71,
        notes: '+3 for correct, -0.71 for wrong.',
      },
    ],
    questionIds: [
      'q-2024-nat-01',
      'q-2023-nat-03',
      'q-2023-nat-04',
      'q-2024-msq-01',
      'q-2023-msq-03',
      'q-2024-mcq-01',
      'q-2023-mcq-04',
      'q-2023-mcq-05',
      'q-2022-mcq-03',
    ],
  },
  {
    id: 'paper-uceed-2020-2022-archive',
    title: 'UCEED 2020–2022 Classic PYQ Archive Set',
    year: 2022,
    isOfficialStructure: true,
    durationMinutes: 25,
    totalMarks: 29,
    partAMarks: 29,
    partBMarks: 0,
    description:
      'Verified archive drill covering UCEED 2020, 2021, and 2022 spatial combinatorics, Gestalt perception, camera optics, and polyhedral geometry.',
    sections: [
      {
        name: 'Section 1 (NAT)',
        questionType: 'NAT',
        questionCount: 4,
        marksPerQuestion: 4,
        negativeMarks: 0,
        notes: '+4 for correct, 0 for wrong.',
      },
      {
        name: 'Section 2 (MSQ)',
        questionType: 'MSQ',
        questionCount: 1,
        marksPerQuestion: 4,
        negativeMarks: 1,
        notes: '+4/+3/+2/+1 partial marking, -1 negative.',
      },
      {
        name: 'Section 3 (MCQ)',
        questionType: 'MCQ',
        questionCount: 3,
        marksPerQuestion: 3,
        negativeMarks: 0.71,
        notes: '+3 for correct, -0.71 for wrong.',
      },
    ],
    questionIds: [
      'q-2022-nat-01',
      'q-2021-nat-01',
      'q-2020-nat-01',
      'q-2025-imp-01',
      'q-2022-msq-01',
      'q-2022-mcq-03',
      'q-2021-mcq-01',
      'q-2020-mcq-01',
    ],
  },
];

export function createInitialDemoAttempts(questions: Question[]): TestAttempt[] {
  const qMap = new Map(questions.map((q) => [q.id, q]));
  const pick = (ids: string[]) =>
    ids.map((id) => qMap.get(id)).filter((q): q is Question => Boolean(q));

  const attempt1Questions = pick([
    'q-2024-nat-01',
    'q-2024-nat-02',
    'q-2024-msq-01',
    'q-2024-mcq-01',
    'q-2024-mcq-02',
    'q-2023-mcq-04',
  ]);

  const attempt1 = evaluateTestAttempt({
    id: 'demo-attempt-1',
    examId: 'paper-uceed-2024',
    examTitle: 'Sample Diagnostic: UCEED 2024 Part A Drill (Demo Data)',
    examYear: 2024,
    mode: 'exam',
    startedAt: '2026-10-18T10:00:00Z',
    completedAt: '2026-10-18T10:14:00Z',
    questions: attempt1Questions,
    isDemoData: true,
    responses: [
      {
        questionId: 'q-2024-nat-01',
        submittedAnswer: '13', // Off-by-one calculation slip!
        isMarkedForReview: false,
        timeSpentSeconds: 175, // Took too long!
        answerHistory: [
          { timestamp: 1, value: '14' }, // Had correct answer first, changed to 13!
          { timestamp: 2, value: '13' },
        ],
        isRepeatAttempt: false,
      },
      {
        questionId: 'q-2024-nat-02',
        submittedAnswer: '60',
        isMarkedForReview: false,
        timeSpentSeconds: 125,
        answerHistory: [{ timestamp: 1, value: '60' }],
        isRepeatAttempt: false,
      },
      {
        questionId: 'q-2024-msq-01',
        submittedAnswer: ['A', 'B'], // Partial credit +2!
        isMarkedForReview: true,
        timeSpentSeconds: 155,
        answerHistory: [{ timestamp: 1, value: ['A', 'B'] }],
        isRepeatAttempt: false,
      },
      {
        questionId: 'q-2024-mcq-01',
        submittedAnswer: 'B',
        isMarkedForReview: false,
        timeSpentSeconds: 62,
        answerHistory: [{ timestamp: 1, value: 'B' }],
        isRepeatAttempt: false,
      },
      {
        questionId: 'q-2024-mcq-02',
        submittedAnswer: 'A', // Conceptual error on perspective spacing
        isMarkedForReview: false,
        timeSpentSeconds: 130,
        answerHistory: [{ timestamp: 1, value: 'A' }],
        isRepeatAttempt: false,
      },
      {
        questionId: 'q-2023-mcq-04',
        submittedAnswer: 'A', // Counted 5 pulley strands instead of 4
        isMarkedForReview: false,
        timeSpentSeconds: 142,
        answerHistory: [{ timestamp: 1, value: 'A' }],
        isRepeatAttempt: false,
      },
    ],
  });

  const attempt2Questions = pick([
    'q-2023-nat-03',
    'q-2024-msq-02',
    'q-2023-msq-03',
    'q-2022-mcq-03',
    'q-2024-nat-01', // Repeat attempt!
  ]);

  const attempt2 = evaluateTestAttempt({
    id: 'demo-attempt-2',
    examId: 'paper-uceed-2023-part-a',
    examTitle: 'Sample Sprint: UCEED 2023 Mixed Concept Set (Demo Data)',
    examYear: 2023,
    mode: 'practice',
    startedAt: '2026-10-22T16:30:00Z',
    completedAt: '2026-10-22T16:41:00Z',
    questions: attempt2Questions,
    isDemoData: true,
    responses: [
      {
        questionId: 'q-2023-nat-03',
        submittedAnswer: '2',
        isMarkedForReview: false,
        timeSpentSeconds: 70,
        answerHistory: [{ timestamp: 1, value: '2' }],
        isRepeatAttempt: false,
      },
      {
        questionId: 'q-2024-msq-02',
        submittedAnswer: ['A', 'C', 'D'],
        isMarkedForReview: false,
        timeSpentSeconds: 112,
        answerHistory: [{ timestamp: 1, value: ['A', 'C', 'D'] }],
        isRepeatAttempt: false,
      },
      {
        questionId: 'q-2023-msq-03',
        submittedAnswer: ['A', 'C'], // Partial +2
        isMarkedForReview: false,
        timeSpentSeconds: 98,
        answerHistory: [{ timestamp: 1, value: ['A', 'C'] }],
        isRepeatAttempt: false,
      },
      {
        questionId: 'q-2022-mcq-03',
        submittedAnswer: 'B',
        isMarkedForReview: false,
        timeSpentSeconds: 84,
        answerHistory: [{ timestamp: 1, value: 'B' }],
        isRepeatAttempt: false,
      },
      {
        questionId: 'q-2024-nat-01',
        submittedAnswer: '14', // Solved correctly on repeat!
        isMarkedForReview: false,
        timeSpentSeconds: 90,
        answerHistory: [{ timestamp: 1, value: '14' }],
        isRepeatAttempt: true,
      },
    ],
  });

  return [attempt2, attempt1];
}

export const INITIAL_DEMO_BOOKMARKS: BookmarkItem[] = [
  {
    questionId: 'q-2024-nat-01',
    createdAt: '2026-10-18T10:16:00Z',
    personalNote:
      'Remember to use the 6-axis (+X, -X, +Y, -Y, +Z, -Z) normal table so I do not miss the hidden back or bottom face.',
    tag: 'Tricky Visual',
  },
  {
    questionId: 'q-2024-mcq-02',
    createdAt: '2026-10-18T10:18:00Z',
    personalNote:
      'Equal depth intervals in perspective follow the midpoint diagonal ray construction, never linear millimeter subtraction.',
    tag: 'Review Concept',
  },
  {
    questionId: 'q-2023-mcq-04',
    createdAt: '2026-10-19T09:10:00Z',
    personalNote:
      'Draw free-body cut strictly around the lower movable pulley block; ignore downward redirect strand.',
    tag: 'Formula',
  },
];

export const INITIAL_DEMO_PART_B_SUBMISSIONS: PartBSubmission[] = [
  {
    id: 'demo-partb-1',
    questionId: 'q-2024-partb-01',
    questionTitle: 'UCEED-2024-PB-Q01 · Railway Platform Tea Stall (6:30 AM Winter)',
    submittedAt: '2026-10-21T18:20:00Z',
    timeTakenMinutes: 28,
    imageDataUrl: 'DEMO_TEA_STALL_SKETCH',
    selfAssessmentNotes:
      'Established standing eye-level horizon at 60% height. Foreground kettle and kulhad hand exchange are clear, though the train roof perspective lines on the left could converge more tightly.',
    selfScores: {
      'Perspective & Spatial Depth': 9,
      'Human Proportions & Gesture': 10,
      'Composition & POV Framing': 8,
      'Line Quality & Material Texture': 6,
      'Atmosphere & Storytelling': 6,
    },
    aiEvaluation: {
      estimatedTotalScore: 38,
      maxScore: 50,
      overallFeedback:
        'Strong inside-out framing using the tea stall counter and hanging glass jars to anchor the foreground. The commuter’s reaching posture and steam rising from the kettle establish an authentic winter morning focal point.',
      criteriaBreakdown: [
        {
          criterion: 'Perspective & Spatial Depth',
          score: 9,
          maxScore: 12,
          feedback:
            'Clear separation of foreground counter, midground coolie, and background carriage, with minor divergence in upper truss lines.',
        },
        {
          criterion: 'Human Proportions & Gesture',
          score: 10,
          maxScore: 12,
          feedback:
            'Commuter and vendor heads align appropriately with the horizon line; hands grasping the kulhad read clearly.',
        },
        {
          criterion: 'Composition & POV Framing',
          score: 8,
          maxScore: 10,
          feedback:
            'Effective use of asymmetric L-frame counter structure leading the eye to the transaction point.',
        },
        {
          criterion: 'Line Quality & Material Texture',
          score: 5,
          maxScore: 8,
          feedback:
            'Increase line-weight hierarchy between foreground aluminum kettle contours and background train coaches.',
        },
        {
          criterion: 'Atmosphere & Storytelling',
          score: 6,
          maxScore: 8,
          feedback:
            'Winter clothing folds and rising steam are convincing; cast shadows on the platform floor can be unified.',
        },
      ],
      strengths: [
        'Authentic inside-looking-out point of view as required by the prompt.',
        'Natural eye-level alignment across standing platform figures.',
      ],
      improvements: [
        'Use heavier 4B/6B contour lines on the foreground counter edge to push the train further back in space.',
        'Check ellipse minor-axis alignment on the cylindrical tea kettle and kulhads.',
      ],
      disclaimer:
        'Estimate Only: AI drawing assessments are diagnostic estimates and may differ from official IIT Bombay UCEED human examiner evaluations.',
    },
  },
];
