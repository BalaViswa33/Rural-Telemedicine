// AI-powered prescription parser using simple NLP rules

export const parsePrescription = (freeText) => {
  if (!freeText || freeText.trim().length === 0) {
    return [];
  }

  const medicines = [];
  
  // Split by common delimiters (newlines, numbers, bullet points)
  const lines = freeText
    .split(/\n|(?:\d+\.)|(?:•)|(?:-\s)/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  lines.forEach(line => {
    const medicine = extractMedicineInfo(line);
    if (medicine) {
      medicines.push(medicine);
    }
  });

  return medicines;
};

const extractMedicineInfo = (text) => {
  // Common medicine name patterns
  const medicineNameMatch = text.match(/^([A-Za-z\s]+?)(?:\s+(?:\d+|tablet|capsule|syrup|ml|mg))/i);
  
  if (!medicineNameMatch) {
    // Try to extract just the first word/phrase as medicine name
    const words = text.split(/\s+/);
    if (words.length === 0) return null;
  }

  const medicineName = medicineNameMatch ? medicineNameMatch[1].trim() : text.split(/\s+/).slice(0, 2).join(' ');

  // Extract dosage
  const dosage = extractDosage(text);

  // Extract frequency
  const frequency = extractFrequency(text);

  // Extract duration
  const duration = extractDuration(text);

  // Extract timing
  const timing = extractTiming(text);

  return {
    id: Math.random().toString(36).substr(2, 9),
    name: medicineName,
    dosage: dosage || '1 unit',
    frequency: frequency || 'As needed',
    duration: duration || '5 days',
    timing: timing.length > 0 ? timing : ['Morning'],
    originalText: text
  };
};

const extractDosage = (text) => {
  // Look for patterns like "500mg", "1 tablet", "10ml", "2 capsules"
  const dosagePatterns = [
    /(\d+\s*(?:mg|ml|g|mcg|iu|units?))/i,
    /(\d+\s*(?:tablet|capsule|pill|spoon|drop)s?)/i,
  ];

  for (const pattern of dosagePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
};

const extractFrequency = (text) => {
  const lowerText = text.toLowerCase();

  // Specific frequency patterns
  if (lowerText.match(/once\s+(?:a\s+)?day|1\s*x\s*day|od|daily/)) {
    return 'Once daily';
  }
  if (lowerText.match(/twice\s+(?:a\s+)?day|2\s*x\s*day|bd|bid/)) {
    return 'Twice daily';
  }
  if (lowerText.match(/thrice\s+(?:a\s+)?day|three\s+times\s+(?:a\s+)?day|3\s*x\s*day|tid/)) {
    return 'Three times daily';
  }
  if (lowerText.match(/four\s+times\s+(?:a\s+)?day|4\s*x\s*day|qid/)) {
    return 'Four times daily';
  }
  if (lowerText.match(/every\s+\d+\s+hours?/)) {
    const match = lowerText.match(/every\s+(\d+)\s+hours?/);
    return `Every ${match[1]} hours`;
  }
  if (lowerText.match(/as\s+needed|prn|when\s+required/)) {
    return 'As needed';
  }

  return null;
};

const extractDuration = (text) => {
  const lowerText = text.toLowerCase();

  // Look for duration patterns
  const durationMatch = lowerText.match(/for\s+(\d+)\s+(day|week|month)s?/);
  if (durationMatch) {
    return `${durationMatch[1]} ${durationMatch[2]}${durationMatch[1] > 1 ? 's' : ''}`;
  }

  // Look for X days pattern
  const daysMatch = lowerText.match(/(\d+)\s+days?/);
  if (daysMatch) {
    return `${daysMatch[1]} days`;
  }

  const weeksMatch = lowerText.match(/(\d+)\s+weeks?/);
  if (weeksMatch) {
    return `${weeksMatch[1]} weeks`;
  }

  const monthsMatch = lowerText.match(/(\d+)\s+months?/);
  if (monthsMatch) {
    return `${monthsMatch[1]} months`;
  }

  return null;
};

const extractTiming = (text) => {
  const lowerText = text.toLowerCase();
  const timings = [];

  if (lowerText.match(/morning|breakfast|am/)) {
    timings.push('Morning');
  }
  if (lowerText.match(/afternoon|lunch|noon/)) {
    timings.push('Afternoon');
  }
  if (lowerText.match(/evening|dinner/)) {
    timings.push('Evening');
  }
  if (lowerText.match(/night|bedtime|bed time|sleep/)) {
    timings.push('Night');
  }

  // If frequency suggests timing but none specified, infer
  if (timings.length === 0) {
    if (lowerText.match(/once/)) {
      timings.push('Morning');
    } else if (lowerText.match(/twice/)) {
      timings.push('Morning', 'Evening');
    } else if (lowerText.match(/thrice|three/)) {
      timings.push('Morning', 'Afternoon', 'Evening');
    } else if (lowerText.match(/four/)) {
      timings.push('Morning', 'Afternoon', 'Evening', 'Night');
    }
  }

  return timings;
};

// Example usage and test
export const testParser = () => {
  const examples = [
    "Paracetamol 500mg twice daily for 5 days",
    "Amoxicillin 250mg three times a day with meals for 7 days",
    "Cough syrup 10ml at night for 3 days",
    "Aspirin 75mg once daily in the morning",
    "Ibuprofen 400mg every 6 hours as needed"
  ];

  console.log('Testing Prescription Parser:');
  examples.forEach(example => {
    console.log('\nInput:', example);
    console.log('Parsed:', parsePrescription(example));
  });
};
