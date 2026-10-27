import { ASSESSMENT_WEIGHTS } from '../config/constants.js';

export function calculateWeightedScore({ quiz1, midterm, project, finalExam }) {
  const scores = {
    quiz1: quiz1 !== undefined && quiz1 !== null ? Number(quiz1) : null,
    midterm: midterm !== undefined && midterm !== null ? Number(midterm) : null,
    project: project !== undefined && project !== null ? Number(project) : null,
    finalExam: finalExam !== undefined && finalExam !== null ? Number(finalExam) : null,
  };

  const hasAnyScore = Object.values(scores).some((val) => val !== null && !isNaN(val));
  if (!hasAnyScore) return null;

  let totalWeight = 0;
  let weightedSum = 0;

  for (const [key, weight] of Object.entries(ASSESSMENT_WEIGHTS)) {
    if (scores[key] !== null && !isNaN(scores[key])) {
      weightedSum += scores[key] * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) return null;
  return Number((weightedSum / totalWeight).toFixed(1));
}

export function deriveLetterGrade(weightedScore) {
  if (weightedScore === null || weightedScore === undefined || isNaN(weightedScore)) {
    return 'Pending';
  }
  const score = Number(weightedScore);
  if (score >= 93) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 65) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}
