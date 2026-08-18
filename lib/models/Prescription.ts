import mongoose, {
  Document,
  Model,
  Schema,
  Types,
} from "mongoose";

/* ============================================================
   PRESCRIPTION STATUS
============================================================ */

export type PrescriptionStatus =
  | "PENDING"
  | "REVIEWING"
  | "APPROVED"
  | "REJECTED";

/* ============================================================
   AI STATUS
============================================================ */

export type PrescriptionAIStatus =
  | "PENDING"
  | "OCR_PROCESSING"
  | "OCR_COMPLETED"
  | "AI_PROCESSING"
  | "COMPLETED"
  | "FAILED";

/* ============================================================
   FILE TYPE
============================================================ */

export type PrescriptionFileType =
  | "IMAGE"
  | "PDF";

/* ============================================================
   PRESCRIPTION MEDICINE
============================================================ */

export interface IPrescriptionMedicine {
  name: string;

  strength: string;

  dosage: string;

  frequency: string;

  duration: string;

  matchedMedicineId?: Types.ObjectId | null;

  confidence: number;

  needsReview: boolean;
}

/* ============================================================
   PRESCRIPTION TEST
============================================================ */

export interface IPrescriptionTest {
  name: string;

  category: string;

  notes: string;

  confidence: number;

  needsReview: boolean;
}

/* ============================================================
   MAIN PRESCRIPTION
============================================================ */

export interface IPrescription
  extends Document {
  user: Types.ObjectId;

  patientName: string;

  image: string;

  fileType: PrescriptionFileType;

  originalFileName: string;

  note: string;

  adminNote: string;

  extractedText: string;

  cleanedText: string;

  medicines: IPrescriptionMedicine[];

  tests: IPrescriptionTest[];

  aiStatus: PrescriptionAIStatus;

  status: PrescriptionStatus;

  reviewedBy: Types.ObjectId | null;

  reviewedAt: Date | null;

  createdAt: Date;

  updatedAt: Date;
}

/* ============================================================
   MEDICINE SCHEMA
============================================================ */

const prescriptionMedicineSchema =
  new Schema<IPrescriptionMedicine>(
    {
      name: {
        type: String,

        required: [
          true,
          "Medicine name is required",
        ],

        trim: true,

        maxlength: [
          200,
          "Medicine name cannot exceed 200 characters",
        ],
      },

      strength: {
        type: String,

        trim: true,

        default: "",
      },

      dosage: {
        type: String,

        trim: true,

        default: "",
      },

      frequency: {
        type: String,

        trim: true,

        default: "",
      },

      duration: {
        type: String,

        trim: true,

        default: "",
      },

      matchedMedicineId: {
        type:
          Schema.Types.ObjectId,

        ref: "Medicine",

        default: null,
      },

      confidence: {
        type: Number,

        min: 0,

        max: 1,

        default: 0,
      },

      needsReview: {
        type: Boolean,

        default: true,
      },
    },
    {
      _id: true,
    }
  );

/* ============================================================
   TEST SCHEMA
============================================================ */

const prescriptionTestSchema =
  new Schema<IPrescriptionTest>(
    {
      name: {
        type: String,

        required: [
          true,
          "Test name is required",
        ],

        trim: true,

        maxlength: [
          200,
          "Test name cannot exceed 200 characters",
        ],
      },

      category: {
        type: String,

        trim: true,

        default: "",
      },

      notes: {
        type: String,

        trim: true,

        maxlength: [
          500,
          "Test notes cannot exceed 500 characters",
        ],

        default: "",
      },

      confidence: {
        type: Number,

        min: 0,

        max: 1,

        default: 0,
      },

      needsReview: {
        type: Boolean,

        default: true,
      },
    },
    {
      _id: true,
    }
  );

/* ============================================================
   MAIN SCHEMA
============================================================ */

const prescriptionSchema =
  new Schema<IPrescription>(
    {
      /* ======================================================
         CUSTOMER
      ====================================================== */

      user: {
        type:
          Schema.Types.ObjectId,

        ref: "User",

        required: [
          true,
          "Prescription user is required",
        ],

        index: true,
      },

      /* ======================================================
         PATIENT
      ====================================================== */

      patientName: {
        type: String,

        required: [
          true,
          "Patient name is required",
        ],

        trim: true,

        minlength: [
          2,
          "Patient name must be at least 2 characters long",
        ],

        maxlength: [
          100,
          "Patient name cannot exceed 100 characters",
        ],
      },

      /* ======================================================
         FILE URL
      ====================================================== */

      image: {
        type: String,

        required: [
          true,
          "Prescription file is required",
        ],

        trim: true,
      },

      /* ======================================================
         FILE TYPE
      ====================================================== */

      fileType: {
        type: String,

        enum: [
          "IMAGE",
          "PDF",
        ],

        required: true,

        default: "IMAGE",
      },

      /* ======================================================
         ORIGINAL FILE NAME
      ====================================================== */

      originalFileName: {
        type: String,

        trim: true,

        maxlength: [
          255,
          "Original file name cannot exceed 255 characters",
        ],

        default: "",
      },

      /* ======================================================
         CUSTOMER NOTE
      ====================================================== */

      note: {
        type: String,

        trim: true,

        maxlength: [
          1000,
          "Prescription note cannot exceed 1000 characters",
        ],

        default: "",
      },

      /* ======================================================
         ADMIN NOTE
      ====================================================== */

      adminNote: {
        type: String,

        trim: true,

        maxlength: [
          1000,
          "Admin note cannot exceed 1000 characters",
        ],

        default: "",
      },

      /* ======================================================
         RAW OCR TEXT
      ====================================================== */

      extractedText: {
        type: String,

        trim: true,

        default: "",
      },

      /* ======================================================
         CLEANED TEXT
      ====================================================== */

      cleanedText: {
        type: String,

        trim: true,

        default: "",
      },

      /* ======================================================
         MEDICINES
      ====================================================== */

      medicines: {
        type: [
          prescriptionMedicineSchema,
        ],

        default: [],
      },

      /* ======================================================
         TESTS
      ====================================================== */

      tests: {
        type: [
          prescriptionTestSchema,
        ],

        default: [],
      },

      /* ======================================================
         AI STATUS
      ====================================================== */

      aiStatus: {
        type: String,

        enum: [
          "PENDING",
          "OCR_PROCESSING",
          "OCR_COMPLETED",
          "AI_PROCESSING",
          "COMPLETED",
          "FAILED",
        ],

        default: "PENDING",

        index: true,
      },

      /* ======================================================
         REVIEW STATUS
      ====================================================== */

      status: {
        type: String,

        enum: [
          "PENDING",
          "REVIEWING",
          "APPROVED",
          "REJECTED",
        ],

        default: "PENDING",

        index: true,
      },

      /* ======================================================
         REVIEWED BY
      ====================================================== */

      reviewedBy: {
        type:
          Schema.Types.ObjectId,

        ref: "User",

        default: null,
      },

      /* ======================================================
         REVIEWED AT
      ====================================================== */

      reviewedAt: {
        type: Date,

        default: null,
      },
    },

    {
      timestamps: true,

      strict: true,
    }
  );

/* ============================================================
   INDEXES
============================================================ */

prescriptionSchema.index({
  user: 1,
  createdAt: -1,
});

prescriptionSchema.index({
  status: 1,
  createdAt: -1,
});

prescriptionSchema.index({
  aiStatus: 1,
  createdAt: -1,
});

prescriptionSchema.index({
  user: 1,
  status: 1,
  createdAt: -1,
});

/* ============================================================
   MODEL CACHE FIX
============================================================ */

/*
 * During Next.js development, Mongoose may keep an older
 * Prescription model in memory.
 *
 * If the cached model does not contain the new AI fields,
 * remove that cached model so the updated schema is compiled.
 */

const existingPrescriptionModel =
  mongoose.models
    .Prescription as
    | Model<IPrescription>
    | undefined;

if (
  existingPrescriptionModel
) {
  const paths =
    existingPrescriptionModel
      .schema
      .paths;

  const hasAIFields =
    Boolean(
      paths.extractedText &&
        paths.cleanedText &&
        paths.medicines &&
        paths.tests &&
        paths.aiStatus &&
        paths.fileType
    );

  if (!hasAIFields) {
    delete mongoose.models
      .Prescription;
  }
}

/* ============================================================
   MODEL
============================================================ */

const Prescription: Model<IPrescription> =
  mongoose.models.Prescription ||
  mongoose.model<IPrescription>(
    "Prescription",
    prescriptionSchema
  );

export default Prescription;