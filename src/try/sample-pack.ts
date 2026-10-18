/**
 * The try path's built-in questions (Show HN preview): a stranger opens the link and plays, with no
 * questions to write or paste. Numbers people can estimate, with answers that don't change.
 */
type SampleQuestion = { id: string; text: string; correctAnswer: number; questionType: "numeric" };

const LIST: SampleQuestion[] = [
  { id: "q1", text: "How many keys are on a standard piano?", correctAnswer: 88, questionType: "numeric" },
  { id: "q2", text: "How many bones are in an adult human body?", correctAnswer: 206, questionType: "numeric" },
  { id: "q3", text: "In what year did Apollo 11 land on the Moon?", correctAnswer: 1969, questionType: "numeric" },
  { id: "q4", text: "How many minutes are in a day?", correctAnswer: 1440, questionType: "numeric" },
  { id: "q5", text: "At what temperature in °F does water boil at sea level?", correctAnswer: 212, questionType: "numeric" },
  { id: "q6", text: "In what year was the first iPhone released?", correctAnswer: 2007, questionType: "numeric" },
  { id: "q7", text: "How many squares are on a chessboard?", correctAnswer: 64, questionType: "numeric" },
  { id: "q8", text: "How many floors does the Burj Khalifa have?", correctAnswer: 163, questionType: "numeric" },
];

export const SAMPLE_PACK: Record<string, SampleQuestion> = Object.fromEntries(LIST.map((q) => [q.id, q]));

/** What the try path's host (the laptop TV) sends once, in an empty lobby. */
export function samplePackEvent() {
  return { type: "QUESTIONS_PARSED" as const, questions: SAMPLE_PACK };
}
