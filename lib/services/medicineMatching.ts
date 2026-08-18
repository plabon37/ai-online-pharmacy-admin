import mongoose from "mongoose";

import Medicine from "@/lib/models/Medicine";

/* ============================================================
   TYPES
============================================================ */

export type PrescriptionMedicineInput = {
  name: string;
  strength?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  confidence?: number;
  needsReview?: boolean;
  matchedMedicineId?: string | null;
};

export type MatchedPrescriptionMedicine = {
  name: string;

  strength: string;

  dosage: string;

  frequency: string;

  duration: string;

  matchedMedicineId:
    | mongoose.Types.ObjectId
    | null;

  matchedMedicineName: string;

  matchedGenericName: string;

  matchType:
    | "EXACT_NAME"
    | "NORMALIZED_NAME"
    | "GENERIC_NAME"
    | "FUZZY_NAME"
    | "NO_MATCH";

  matchConfidence: number;

  confidence: number;

  needsReview: boolean;
};

/* ============================================================
   NORMALIZE TEXT
============================================================ */

function normalizeMedicineText(
  value: string
) {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(
      /[()[\]{}.,/\\|_+\-:;'"`]/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

/* ============================================================
   REMOVE COMMON MEDICAL NOISE
============================================================ */

function normalizeMedicineForComparison(
  value: string
) {
  return normalizeMedicineText(
    value
  )
    .replace(
      /\b\d+(\.\d+)?\s*(mg|mcg|g|ml|iu|%|tablet|tablets|tab|capsule|capsules|cap)\b/gi,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

/* ============================================================
   TOKENS
============================================================ */

function getTokens(
  value: string
) {
  return new Set(
    normalizeMedicineForComparison(
      value
    )
      .split(" ")
      .filter(
        Boolean
      )
  );
}

/* ============================================================
   TOKEN SIMILARITY
============================================================ */

function calculateTokenSimilarity(
  first: string,
  second: string
) {
  const firstTokens =
    getTokens(first);

  const secondTokens =
    getTokens(second);

  if (
    firstTokens.size ===
      0 ||
    secondTokens.size ===
      0
  ) {
    return 0;
  }

  let intersection =
    0;

  for (
    const token of firstTokens
  ) {
    if (
      secondTokens.has(
        token
      )
    ) {
      intersection +=
        1;
    }
  }

  const unionSize =
    new Set([
      ...firstTokens,
      ...secondTokens,
    ]).size;

  if (
    unionSize === 0
  ) {
    return 0;
  }

  return (
    intersection /
    unionSize
  );
}

/* ============================================================
   CHARACTER SIMILARITY
============================================================ */

function calculateCharacterSimilarity(
  first: string,
  second: string
) {
  const a =
    normalizeMedicineForComparison(
      first
    );

  const b =
    normalizeMedicineForComparison(
      second
    );

  if (!a || !b) {
    return 0;
  }

  const rows =
    a.length + 1;

  const columns =
    b.length + 1;

  const matrix: number[][] =
    Array.from(
      {
        length: rows,
      },
      () =>
        Array(columns).fill(
          0
        )
    );

  for (
    let row = 0;
    row < rows;
    row += 1
  ) {
    matrix[row][0] =
      row;
  }

  for (
    let column = 0;
    column <
    columns;
    column += 1
  ) {
    matrix[0][column] =
      column;
  }

  for (
    let row = 1;
    row < rows;
    row += 1
  ) {
    for (
      let column = 1;
      column <
      columns;
      column += 1
    ) {
      const cost =
        a[row - 1] ===
        b[column - 1]
          ? 0
          : 1;

      matrix[row][column] =
        Math.min(
          matrix[row - 1][
            column
          ] + 1,

          matrix[row][
            column - 1
          ] + 1,

          matrix[row - 1][
            column - 1
          ] + cost
        );
    }
  }

  const distance =
    matrix[rows - 1][
      columns - 1
    ];

  const maximumLength =
    Math.max(
      a.length,
      b.length
    );

  if (
    maximumLength === 0
  ) {
    return 1;
  }

  return (
    1 -
    distance /
      maximumLength
  );
}

/* ============================================================
   COMBINED SIMILARITY
============================================================ */

function calculateSimilarity(
  first: string,
  second: string
) {
  const tokenSimilarity =
    calculateTokenSimilarity(
      first,
      second
    );

  const characterSimilarity =
    calculateCharacterSimilarity(
      first,
      second
    );

  return (
    tokenSimilarity * 0.55 +
    characterSimilarity * 0.45
  );
}

/* ============================================================
   CLAMP
============================================================ */

function clamp(
  value: number,
  minimum = 0,
  maximum = 1
) {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value
    )
  );
}

/* ============================================================
   GET SAFE STRING
============================================================ */

function safeString(
  value: unknown
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

/* ============================================================
   MATCH ONE MEDICINE
============================================================ */

export async function matchPrescriptionMedicine(
  medicine:
    PrescriptionMedicineInput
): Promise<MatchedPrescriptionMedicine> {
  const inputName =
    safeString(
      medicine.name
    );

  const inputStrength =
    safeString(
      medicine.strength
    );

  const inputDosage =
    safeString(
      medicine.dosage
    );

  const inputFrequency =
    safeString(
      medicine.frequency
    );

  const inputDuration =
    safeString(
      medicine.duration
    );

  if (!inputName) {
    return {
      name: "",

      strength:
        inputStrength,

      dosage:
        inputDosage,

      frequency:
        inputFrequency,

      duration:
        inputDuration,

      matchedMedicineId:
        null,

      matchedMedicineName:
        "",

      matchedGenericName:
        "",

      matchType:
        "NO_MATCH",

      matchConfidence:
        0,

      confidence:
        clamp(
          Number(
            medicine.confidence
          ) || 0
        ),

      needsReview:
        true,
    };
  }

  /* ==========================================================
     FETCH ACTIVE MEDICINES
  ========================================================== */

  const databaseMedicines =
    await Medicine.find({
      isActive: true,
    })
      .select(
        "_id name genericName"
      )
      .lean();

  if (
    databaseMedicines.length ===
    0
  ) {
    return {
      name: inputName,

      strength:
        inputStrength,

      dosage:
        inputDosage,

      frequency:
        inputFrequency,

      duration:
        inputDuration,

      matchedMedicineId:
        null,

      matchedMedicineName:
        "",

      matchedGenericName:
        "",

      matchType:
        "NO_MATCH",

      matchConfidence:
        0,

      confidence:
        clamp(
          Number(
            medicine.confidence
          ) || 0
        ),

      needsReview:
        true,
    };
  }

  /* ==========================================================
     NORMALIZED INPUT
  ========================================================== */

  const normalizedInput =
    normalizeMedicineForComparison(
      inputName
    );

  const directInput =
    normalizeMedicineText(
      inputName
    );

  /* ==========================================================
     LEVEL 1 — EXACT NAME
  ========================================================== */

  const exactNameMatch =
    databaseMedicines.find(
      (databaseMedicine) => {
        const databaseName =
          normalizeMedicineText(
            databaseMedicine.name ||
              ""
          );

        return (
          databaseName ===
            directInput
        );
      }
    );

  if (
    exactNameMatch
  ) {
    return {
      name: inputName,

      strength:
        inputStrength,

      dosage:
        inputDosage,

      frequency:
        inputFrequency,

      duration:
        inputDuration,

      matchedMedicineId:
        exactNameMatch._id,

      matchedMedicineName:
        exactNameMatch.name,

      matchedGenericName:
        exactNameMatch.genericName ||
        "",

      matchType:
        "EXACT_NAME",

      matchConfidence:
        1,

      confidence:
        clamp(
          Number(
            medicine.confidence
          ) || 0
        ),

      needsReview:
        Boolean(
          medicine.needsReview
        ),
    };
  }

  /* ==========================================================
     LEVEL 2 — NORMALIZED NAME
     
     Removes:
     - strength
     - common dosage terms
     - punctuation
  ========================================================== */

  const normalizedNameMatch =
    databaseMedicines.find(
      (databaseMedicine) => {
        const databaseName =
          normalizeMedicineForComparison(
            databaseMedicine.name ||
              ""
          );

        return (
          databaseName ===
          normalizedInput
        );
      }
    );

  if (
    normalizedNameMatch
  ) {
    return {
      name: inputName,

      strength:
        inputStrength,

      dosage:
        inputDosage,

      frequency:
        inputFrequency,

      duration:
        inputDuration,

      matchedMedicineId:
        normalizedNameMatch._id,

      matchedMedicineName:
        normalizedNameMatch.name,

      matchedGenericName:
        normalizedNameMatch.genericName ||
        "",

      matchType:
        "NORMALIZED_NAME",

      matchConfidence:
        0.98,

      confidence:
        clamp(
          Number(
            medicine.confidence
          ) || 0
        ),

      /*
       * Normalized matching is strong, but still keep
       * review available because AI extracted the input.
       */
      needsReview:
        true,
    };
  }

  /* ==========================================================
     LEVEL 3 — GENERIC NAME
  ========================================================== */

  const genericMatches =
    databaseMedicines.filter(
      (databaseMedicine) => {
        const genericName =
          normalizeMedicineForComparison(
            databaseMedicine.genericName ||
              ""
          );

        return (
          genericName &&
          (
            genericName ===
              normalizedInput ||
            genericName.includes(
              normalizedInput
            ) ||
            normalizedInput.includes(
              genericName
            )
          )
        );
      }
    );

  if (
    genericMatches.length ===
    1
  ) {
    const genericMatch =
      genericMatches[0];

    return {
      name: inputName,

      strength:
        inputStrength,

      dosage:
        inputDosage,

      frequency:
        inputFrequency,

      duration:
        inputDuration,

      matchedMedicineId:
        genericMatch._id,

      matchedMedicineName:
        genericMatch.name,

      matchedGenericName:
        genericMatch.genericName ||
        "",

      matchType:
        "GENERIC_NAME",

      matchConfidence:
        0.9,

      confidence:
        clamp(
          Number(
            medicine.confidence
          ) || 0
        ),

      needsReview:
        true,
    };
  }

  /* ==========================================================
     FUZZY CANDIDATE
     
     IMPORTANT:
     This is ONLY a suggestion.
     It is never treated as a final safe match.
  ========================================================== */

  let bestCandidate:
    | {
        medicine: (typeof databaseMedicines)[number];

        score: number;
      }
    | null = null;

  for (
    const databaseMedicine of
      databaseMedicines
  ) {
    const name =
      safeString(
        databaseMedicine.name
      );

    const genericName =
      safeString(
        databaseMedicine.genericName
      );

    const nameScore =
      calculateSimilarity(
        inputName,
        name
      );

    const genericScore =
      genericName
        ? calculateSimilarity(
            inputName,
            genericName
          )
        : 0;

    const score =
      Math.max(
        nameScore,
        genericScore
      );

    if (
      !bestCandidate ||
      score >
        bestCandidate.score
    ) {
      bestCandidate = {
        medicine:
          databaseMedicine,

        score,
      };
    }
  }

  if (
    bestCandidate &&
    bestCandidate.score >=
      0.85
  ) {
    return {
      name: inputName,

      strength:
        inputStrength,

      dosage:
        inputDosage,

      frequency:
        inputFrequency,

      duration:
        inputDuration,

      matchedMedicineId:
        bestCandidate
          .medicine._id,

      matchedMedicineName:
        bestCandidate
          .medicine.name,

      matchedGenericName:
        bestCandidate
          .medicine.genericName ||
        "",

      matchType:
        "FUZZY_NAME",

      matchConfidence:
        Number(
          bestCandidate.score.toFixed(
            2
          )
        ),

      confidence:
        clamp(
          Number(
            medicine.confidence
          ) || 0
        ),

      /*
       * NEVER silently trust fuzzy medicine matching.
       */
      needsReview:
        true,
    };
  }

  /* ==========================================================
     NO MATCH
  ========================================================== */

  return {
    name: inputName,

    strength:
      inputStrength,

    dosage:
      inputDosage,

    frequency:
      inputFrequency,

    duration:
      inputDuration,

    matchedMedicineId:
      null,

    matchedMedicineName:
      "",

    matchedGenericName:
      "",

    matchType:
      "NO_MATCH",

    matchConfidence:
      0,

    confidence:
      clamp(
        Number(
          medicine.confidence
        ) || 0
      ),

    needsReview:
      true,
  };
}

/* ============================================================
   MATCH ALL PRESCRIPTION MEDICINES
============================================================ */

export async function matchPrescriptionMedicines(
  medicines:
    PrescriptionMedicineInput[]
) {
  if (
    !Array.isArray(
      medicines
    ) ||
    medicines.length ===
      0
  ) {
    return [];
  }

  /* ==========================================================
     LOAD DATABASE ONCE
     
     This avoids making one DB query for every medicine.
  ========================================================== */

  const databaseMedicines =
    await Medicine.find({
      isActive: true,
    })
      .select(
        "_id name genericName"
      )
      .lean();

  if (
    databaseMedicines.length ===
    0
  ) {
    return medicines.map(
      (medicine) => ({
        name:
          safeString(
            medicine.name
          ),

        strength:
          safeString(
            medicine.strength
          ),

        dosage:
          safeString(
            medicine.dosage
          ),

        frequency:
          safeString(
            medicine.frequency
          ),

        duration:
          safeString(
            medicine.duration
          ),

        matchedMedicineId:
          null,

        matchedMedicineName:
          "",

        matchedGenericName:
          "",

        matchType:
          "NO_MATCH" as const,

        matchConfidence:
          0,

        confidence:
          clamp(
            Number(
              medicine.confidence
            ) || 0
          ),

        needsReview:
          true,
      })
    );
  }

  return medicines.map(
    (
      medicine
    ) => {
      const inputName =
        safeString(
          medicine.name
        );

      const inputStrength =
        safeString(
          medicine.strength
        );

      const inputDosage =
        safeString(
          medicine.dosage
        );

      const inputFrequency =
        safeString(
          medicine.frequency
        );

      const inputDuration =
        safeString(
          medicine.duration
        );

      if (!inputName) {
        return {
          name: "",

          strength:
            inputStrength,

          dosage:
            inputDosage,

          frequency:
            inputFrequency,

          duration:
            inputDuration,

          matchedMedicineId:
            null,

          matchedMedicineName:
            "",

          matchedGenericName:
            "",

          matchType:
            "NO_MATCH" as const,

          matchConfidence:
            0,

          confidence:
            clamp(
              Number(
                medicine.confidence
              ) || 0
            ),

          needsReview:
            true,
        };
      }

      const directInput =
        normalizeMedicineText(
          inputName
        );

      const normalizedInput =
        normalizeMedicineForComparison(
          inputName
        );

      /* ======================================================
         EXACT NAME
      ====================================================== */

      const exactMatch =
        databaseMedicines.find(
          (databaseMedicine) => {
            return (
              normalizeMedicineText(
                databaseMedicine.name ||
                  ""
              ) ===
              directInput
            );
          }
        );

      if (exactMatch) {
        return {
          name:
            inputName,

          strength:
            inputStrength,

          dosage:
            inputDosage,

          frequency:
            inputFrequency,

          duration:
            inputDuration,

          matchedMedicineId:
            exactMatch._id,

          matchedMedicineName:
            exactMatch.name,

          matchedGenericName:
            exactMatch.genericName ||
            "",

          matchType:
            "EXACT_NAME" as const,

          matchConfidence:
            1,

          confidence:
            clamp(
              Number(
                medicine.confidence
              ) || 0
            ),

          needsReview:
            Boolean(
              medicine.needsReview
            ),
        };
      }

      /* ======================================================
         NORMALIZED NAME
      ====================================================== */

      const normalizedMatch =
        databaseMedicines.find(
          (databaseMedicine) => {
            return (
              normalizeMedicineForComparison(
                databaseMedicine.name ||
                  ""
              ) ===
              normalizedInput
            );
          }
        );

      if (
        normalizedMatch
      ) {
        return {
          name:
            inputName,

          strength:
            inputStrength,

          dosage:
            inputDosage,

          frequency:
            inputFrequency,

          duration:
            inputDuration,

          matchedMedicineId:
            normalizedMatch._id,

          matchedMedicineName:
            normalizedMatch.name,

          matchedGenericName:
            normalizedMatch.genericName ||
            "",

          matchType:
            "NORMALIZED_NAME" as const,

          matchConfidence:
            0.98,

          confidence:
            clamp(
              Number(
                medicine.confidence
              ) || 0
            ),

          needsReview:
            true,
        };
      }

      /* ======================================================
         GENERIC NAME
      ====================================================== */

      const genericMatches =
        databaseMedicines.filter(
          (databaseMedicine) => {
            const genericName =
              normalizeMedicineForComparison(
                databaseMedicine.genericName ||
                  ""
              );

            return (
              genericName &&
              (
                genericName ===
                  normalizedInput ||
                genericName.includes(
                  normalizedInput
                ) ||
                normalizedInput.includes(
                  genericName
                )
              )
            );
          }
        );

      if (
        genericMatches.length ===
        1
      ) {
        const genericMatch =
          genericMatches[0];

        return {
          name:
            inputName,

          strength:
            inputStrength,

          dosage:
            inputDosage,

          frequency:
            inputFrequency,

          duration:
            inputDuration,

          matchedMedicineId:
            genericMatch._id,

          matchedMedicineName:
            genericMatch.name,

          matchedGenericName:
            genericMatch.genericName ||
            "",

          matchType:
            "GENERIC_NAME" as const,

          matchConfidence:
            0.9,

          confidence:
            clamp(
              Number(
                medicine.confidence
              ) || 0
            ),

          needsReview:
            true,
        };
      }

      /* ======================================================
         FUZZY
      ====================================================== */

      let bestCandidate:
        | {
            medicine:
              (typeof databaseMedicines)[number];

            score: number;
          }
        | null = null;

      for (
        const databaseMedicine of
          databaseMedicines
      ) {
        const databaseName =
          safeString(
            databaseMedicine.name
          );

        const databaseGeneric =
          safeString(
            databaseMedicine.genericName
          );

        const nameScore =
          calculateSimilarity(
            inputName,
            databaseName
          );

        const genericScore =
          databaseGeneric
            ? calculateSimilarity(
                inputName,
                databaseGeneric
              )
            : 0;

        const score =
          Math.max(
            nameScore,
            genericScore
          );

        if (
          !bestCandidate ||
          score >
            bestCandidate.score
        ) {
          bestCandidate = {
            medicine:
              databaseMedicine,

            score,
          };
        }
      }

      if (
        bestCandidate &&
        bestCandidate.score >=
          0.85
      ) {
        return {
          name:
            inputName,

          strength:
            inputStrength,

          dosage:
            inputDosage,

          frequency:
            inputFrequency,

          duration:
            inputDuration,

          matchedMedicineId:
            bestCandidate
              .medicine._id,

          matchedMedicineName:
            bestCandidate
              .medicine.name,

          matchedGenericName:
            bestCandidate
              .medicine.genericName ||
            "",

          matchType:
            "FUZZY_NAME" as const,

          matchConfidence:
            Number(
              bestCandidate.score.toFixed(
                2
              )
            ),

          confidence:
            clamp(
              Number(
                medicine.confidence
              ) || 0
            ),

          needsReview:
            true,
        };
      }

      /* ======================================================
         NO MATCH
      ====================================================== */

      return {
        name:
          inputName,

        strength:
          inputStrength,

        dosage:
          inputDosage,

        frequency:
          inputFrequency,

        duration:
          inputDuration,

        matchedMedicineId:
          null,

        matchedMedicineName:
          "",

        matchedGenericName:
          "",

        matchType:
          "NO_MATCH" as const,

        matchConfidence:
          0,

        confidence:
          clamp(
            Number(
              medicine.confidence
            ) || 0
          ),

        needsReview:
          true,
      };
    }
  );
}