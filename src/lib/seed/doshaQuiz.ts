import type { Dosha } from "../types";

export interface QuizOption {
  label: string;
  dosha: Dosha;
}
export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
}

// A trimmed, meaningful 8-question version of the 15-question quiz.
export const DOSHA_QUIZ: QuizQuestion[] = [
  {
    id: "frame",
    prompt: "How would you describe your body frame?",
    options: [
      { label: "Thin, light, hard to gain weight", dosha: "vata" },
      { label: "Medium, athletic, well-proportioned", dosha: "pitta" },
      { label: "Broad, sturdy, gains weight easily", dosha: "kapha" },
    ],
  },
  {
    id: "skin",
    prompt: "Your skin tends to be…",
    options: [
      { label: "Dry, cool, rough", dosha: "vata" },
      { label: "Warm, oily, prone to redness", dosha: "pitta" },
      { label: "Thick, smooth, well-hydrated", dosha: "kapha" },
    ],
  },
  {
    id: "digestion",
    prompt: "How is your digestion?",
    options: [
      { label: "Irregular, gas-prone", dosha: "vata" },
      { label: "Strong, sharp, irritable if I miss a meal", dosha: "pitta" },
      { label: "Slow but steady", dosha: "kapha" },
    ],
  },
  {
    id: "sleep",
    prompt: "Your sleep is usually…",
    options: [
      { label: "Light and easily interrupted", dosha: "vata" },
      { label: "Moderate, I wake refreshed", dosha: "pitta" },
      { label: "Deep and heavy, hard to wake", dosha: "kapha" },
    ],
  },
  {
    id: "temperature",
    prompt: "Which temperature do you prefer?",
    options: [
      { label: "Warm — I feel the cold easily", dosha: "vata" },
      { label: "Cool — I run hot", dosha: "pitta" },
      { label: "I'm comfortable in most, dislike damp", dosha: "kapha" },
    ],
  },
  {
    id: "stress",
    prompt: "Under stress, you tend to feel…",
    options: [
      { label: "Anxious and worried", dosha: "vata" },
      { label: "Irritated and intense", dosha: "pitta" },
      { label: "Withdrawn and slow", dosha: "kapha" },
    ],
  },
  {
    id: "energy",
    prompt: "Your energy through the day is…",
    options: [
      { label: "Bursty and erratic", dosha: "vata" },
      { label: "Driven and focused", dosha: "pitta" },
      { label: "Steady, slow to start", dosha: "kapha" },
    ],
  },
  {
    id: "exercise",
    prompt: "The exercise you gravitate toward is…",
    options: [
      { label: "Light and varied", dosha: "vata" },
      { label: "Moderate and competitive", dosha: "pitta" },
      { label: "Slow, strong, endurance-based", dosha: "kapha" },
    ],
  },
];

export const DOSHA_INFO: Record<
  Dosha,
  { name: string; element: string; blurb: string; color: string }
> = {
  vata: {
    name: "Vata",
    element: "Air + Space",
    blurb: "Creative, quick, and light. You thrive on warmth, routine, and grounding practices.",
    color: "#9db4ff",
  },
  pitta: {
    name: "Pitta",
    element: "Fire + Water",
    blurb: "Sharp, driven, and focused. You do best with cooling, non-competitive, calming practices.",
    color: "#ffb347",
  },
  kapha: {
    name: "Kapha",
    element: "Earth + Water",
    blurb: "Calm, steady, and strong. You flourish with dynamic, stimulating, energizing movement.",
    color: "#73fd9c",
  },
};
