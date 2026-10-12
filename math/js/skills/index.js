/* The K-12 skill map: every skill, the grade bands and the strands they belong to. */
import early from './early.js';
import middle from './middle.js';
import upper from './upper.js';
import high from './high.js';
import { TRICK_SKILLS } from '../vedic.js';

export const GRADES = [
  { id: 'K', pro: 'Kindergarten', kid: 'Kindergarten', band: 'Counting and shapes' },
  { id: 1, pro: 'Grade 1', kid: 'Grade 1', band: 'Make ten, tens and ones' },
  { id: 2, pro: 'Grade 2', kid: 'Grade 2', band: 'Place value to 1,000' },
  { id: 3, pro: 'Grade 3', kid: 'Grade 3', band: 'Times tables and fractions' },
  { id: 4, pro: 'Grade 4', kid: 'Grade 4', band: 'Multi-digit and equivalence' },
  { id: 5, pro: 'Grade 5', kid: 'Grade 5', band: 'Fraction operations, volume' },
  { id: 6, pro: 'Grade 6', kid: 'Grade 6', band: 'Ratios, integers, equations' },
  { id: 7, pro: 'Grade 7', kid: 'Grade 7', band: 'Proportions and probability' },
  { id: 8, pro: 'Grade 8', kid: 'Grade 8', band: 'Linear functions, Pythagoras' },
  { id: 9, pro: 'Algebra 1', kid: 'Grade 9', band: 'Quadratics and functions' },
  { id: 10, pro: 'Geometry', kid: 'Grade 10', band: 'Proof-ready geometry, trig' },
  { id: 11, pro: 'Algebra 2', kid: 'Grade 11', band: 'Logs, complex numbers, counting' },
  { id: 12, pro: 'Precalculus and calculus', kid: 'Grade 12', band: 'Limits, derivatives, integrals' },
  { id: 'V', pro: 'Speed tricks', kid: 'Speed tricks', band: 'Vedic mental math' }
];

export const STRANDS = {
  number: { pro: 'Number sense', kid: 'Numbers', color: 'sun' },
  add: { pro: 'Addition and subtraction', kid: 'Adding and taking away', color: 'coral' },
  mult: { pro: 'Multiplication and division', kid: 'Times and sharing', color: 'sky' },
  frac: { pro: 'Fractions and decimals', kid: 'Parts of a whole', color: 'plum' },
  ratio: { pro: 'Ratios and percents', kid: 'Ratios and percents', color: 'teal' },
  alg: { pro: 'Expressions and equations', kid: 'Number puzzles', color: 'coral' },
  func: { pro: 'Functions and graphs', kid: 'Graphs', color: 'sky' },
  geo: { pro: 'Geometry and measurement', kid: 'Shapes and measuring', color: 'teal' },
  data: { pro: 'Data and probability', kid: 'Data and chance', color: 'sun' },
  trig: { pro: 'Trigonometry', kid: 'Triangles and circles', color: 'plum' },
  calc: { pro: 'Calculus', kid: 'Change and area', color: 'coral' },
  tricks: { pro: 'Vedic speed tricks', kid: 'Speed tricks', color: 'plum' }
};

export const SKILLS = [...early, ...middle, ...upper, ...high, ...TRICK_SKILLS];
export const byId = Object.fromEntries(SKILLS.map(s => [s.id, s]));
export const skillsFor = g => SKILLS.filter(s => String(s.grade) === String(g));
export const gradeOf = g => GRADES.find(x => String(x.id) === String(g));
