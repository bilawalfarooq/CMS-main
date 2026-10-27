import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateWeightedScore, deriveLetterGrade } from '../src/utils/scoreCalculator.js';
import { generateStudentId, generateStudentEmail, allocateRollNumber } from '../src/utils/idGenerator.js';

describe('Backend Utility & Business Logic Integrity Tests', () => {
  it('1. Calculates weighted scores accurately with 15/35/20/30 weighting', () => {
    // 94*0.15 + 92*0.35 + 98*0.20 + 95*0.30 = 14.1 + 32.2 + 19.6 + 28.5 = 94.4
    const weighted = calculateWeightedScore({
      quiz1: 94,
      midterm: 92,
      project: 98,
      finalExam: 95,
    });
    assert.equal(weighted, 94.4);
  });

  it('2. Returns null when all assessment scores are missing', () => {
    const weighted = calculateWeightedScore({
      quiz1: null,
      midterm: null,
      project: null,
      finalExam: null,
    });
    assert.equal(weighted, null);
  });

  it('3. Derives correct letter grades across standard boundaries', () => {
    assert.equal(deriveLetterGrade(98), 'A+');
    assert.equal(deriveLetterGrade(93), 'A+');
    assert.equal(deriveLetterGrade(88), 'A');
    assert.equal(deriveLetterGrade(80), 'B');
    assert.equal(deriveLetterGrade(70), 'C');
    assert.equal(deriveLetterGrade(55), 'D');
    assert.equal(deriveLetterGrade(40), 'F');
    assert.equal(deriveLetterGrade(null), 'Pending');
  });

  it('4. Generates unique collision-resistant student IDs', () => {
    const existing = [
      { id: 'STU-2026-0101' },
      { id: 'STU-2026-0105' },
    ];
    const newId = generateStudentId(existing, 2026);
    assert.equal(newId, 'STU-2026-0106');
  });

  it('5. Generates deduplicated institutional emails', () => {
    const existing = [
      { email: 'aisha.m@student.educore.edu' },
    ];
    const email1 = generateStudentEmail('Aisha Mansoor', existing);
    assert.equal(email1, 'aisha.m2@student.educore.edu');

    const email2 = generateStudentEmail('Liam Vance', existing);
    assert.equal(email2, 'liam.v@student.educore.edu');
  });

  it('6. Allocates collision-free roll numbers within cohort', () => {
    const cohort = [
      { rollNo: '10A-01' },
      { rollNo: '10A-02' },
    ];
    const newRoll = allocateRollNumber('Grade 10', '10-A (Science)', cohort);
    assert.equal(newRoll, '10A-03');
  });
});
