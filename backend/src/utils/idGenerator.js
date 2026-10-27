export function generateStudentId(existingStudents = [], targetYear = new Date().getFullYear()) {
  const prefix = `STU-${targetYear}-`;
  let maxNum = 100;

  for (const s of existingStudents) {
    if (s.id && s.id.startsWith(prefix)) {
      const part = s.id.replace(prefix, '');
      const parsed = parseInt(part, 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  }

  return `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
}

export function generateStudentEmail(name, existingStudents = [], domain = 'student.educore.edu') {
  if (!name || typeof name !== 'string') return `student.${Date.now()}@${domain}`;

  const parts = name.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let baseUsername = 'student';
  if (parts.length === 1) {
    baseUsername = parts[0].replace(/[^a-z0-9]/g, '');
  } else if (parts.length >= 2) {
    const first = parts[0].replace(/[^a-z0-9]/g, '');
    const last = parts[parts.length - 1].replace(/[^a-z0-9]/g, '');
    baseUsername = `${first}.${last.charAt(0)}`;
  }

  const existingEmails = new Set(
    existingStudents
      .map((s) => (s.email || '').toLowerCase())
      .filter(Boolean)
  );

  let candidate = `${baseUsername}@${domain}`;
  let counter = 2;
  while (existingEmails.has(candidate)) {
    candidate = `${baseUsername}${counter}@${domain}`;
    counter++;
  }

  return candidate;
}

export function allocateRollNumber(grade, section, cohortStudents = []) {
  let prefix = 'ROLL-';
  const gradeMatch = (grade || '').match(/\d+/);
  const gradeNum = gradeMatch ? gradeMatch[0] : '10';

  if (section) {
    if (section.includes('10-A')) prefix = '10A-';
    else if (section.includes('10-B')) prefix = '10B-';
    else if (section.includes('10-C')) prefix = '10C-';
    else if (section.includes('11-ComputerScience')) prefix = '11CS-';
    else if (section.includes('11-PreMed')) prefix = '11PM-';
    else if (section.includes('11-PreEng')) prefix = '11PE-';
    else if (section.includes('12-PreMed')) prefix = '12PM-';
    else if (section.includes('12-PreEng')) prefix = '12PE-';
    else if (section.includes('12-Arts')) prefix = '12AR-';
    else if (section.includes('9-A')) prefix = '9A-';
    else if (section.includes('9-B')) prefix = '9B-';
    else {
      const secLetter = section.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();
      prefix = `${gradeNum}${secLetter}-`;
    }
  } else {
    prefix = `${gradeNum}-`;
  }

  let maxSeq = 0;
  for (const s of cohortStudents) {
    const r = (s.rollNo || '').trim();
    if (r.startsWith(prefix)) {
      const numPart = parseInt(r.slice(prefix.length), 10);
      if (!isNaN(numPart) && numPart > maxSeq) {
        maxSeq = numPart;
      }
    }
  }

  return `${prefix}${String(maxSeq + 1).padStart(2, '0')}`;
}
