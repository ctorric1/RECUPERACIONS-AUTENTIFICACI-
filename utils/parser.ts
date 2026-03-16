import { Student, SubjectStats } from '../types';

export const parseRawData = (rawData: string): { students: Student[]; subjectStats: SubjectStats[] } => {
  const lines = rawData.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const students: Student[] = [];
  const subjectMap: Record<string, Set<string>> = {};

  let currentHeaders: string[] | null = null;

  for (const line of lines) {
    // Basic CSV/TSV parsing
    const parts = line.split(/\t+/).map(p => p.trim());

    // Detect header line (contains subject names usually)
    // Heuristic: If it has "CATALÀ" or "ALUMNE" or "COLUMN", it's a header
    const upperLine = line.toUpperCase();
    if (upperLine.includes('CATALÀ') || upperLine.includes('CASTELLÀ')) {
      currentHeaders = parts;
      continue;
    }

    if (!currentHeaders) continue;

    // Check if it's a data line (starts with a number)
    const id = parts[0];
    if (!id || isNaN(parseInt(id))) continue; // Skip empty or non-numeric IDs

    const studentId = id;
    const studentSubjects: string[] = [];

    // Iterate columns (skipping index 0 which is ID)
    for (let i = 1; i < parts.length; i++) {
      if (i >= currentHeaders.length) break;
      
      const val = parts[i].toUpperCase();
      const subjectName = currentHeaders[i].toUpperCase();

      // Check for TRUE or non-empty indicator
      if (val === 'TRUE' || val === 'VERITAT' || val === '1' || val === 'SÍ') {
        studentSubjects.push(subjectName);
        
        if (!subjectMap[subjectName]) {
          subjectMap[subjectName] = new Set();
        }
        subjectMap[subjectName].add(studentId);
      }
    }

    if (studentSubjects.length > 0) {
      students.push({
        id: studentId,
        subjects: studentSubjects
      });
    }
  }

  // Convert map to array and sort by student count (descending) - hardest to schedule first
  const subjectStats: SubjectStats[] = Object.entries(subjectMap).map(([name, studentSet]) => ({
    name,
    count: studentSet.size,
    students: Array.from(studentSet)
  })).sort((a, b) => b.count - a.count);

  return { students, subjectStats };
};