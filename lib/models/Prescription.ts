import mongoose, {
  Document,
  Model,
  Schema,
  Types,
} from "mongoose";

export type PrescriptionStatus =
  | "PENDING"
  | "REVIEWING"
  | "APPROVED"
  | "REJECTED";

export interface IPrescription extends Document {
  user: Types.ObjectId;

  patientName: string;

  image: string;

  note?: string;

  adminNote?: string;

  status: PrescriptionStatus;

  reviewedBy?: Types.ObjectId | null;

  reviewedAt?: Date | null;

  createdAt: Date;

  updatedAt: Date;
}

const prescriptionSchema =
  new Schema<IPrescription>(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [
          true,
          "Prescription user is required",
        ],
        index: true,
      },

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

      image: {
        type: String,
        required: [
          true,
          "Prescription image is required",
        ],
        trim: true,
      },

      note: {
        type: String,
        trim: true,
        maxlength: [
          1000,
          "Prescription note cannot exceed 1000 characters",
        ],
        default: "",
      },

      adminNote: {
        type: String,
        trim: true,
        maxlength: [
          1000,
          "Admin note cannot exceed 1000 characters",
        ],
        default: "",
      },

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

      reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      reviewedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

prescriptionSchema.index({
  user: 1,
  createdAt: -1,
});

prescriptionSchema.index({
  status: 1,
  createdAt: -1,
});

const Prescription: Model<IPrescription> =
  mongoose.models.Prescription ||
  mongoose.model<IPrescription>(
    "Prescription",
    prescriptionSchema
  );

export default Prescription;