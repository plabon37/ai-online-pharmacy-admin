import mongoose, {
  Document,
  Model,
  Schema,
  Types,
} from "mongoose";

export interface IMedicine extends Document {
  name: string;
  genericName?: string;
  category: Types.ObjectId;
  description?: string;
  price: number;
  stock: number;
  image: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const medicineSchema = new Schema<IMedicine>(
  {
    name: {
      type: String,
      required: [true, "Medicine name is required"],
      trim: true,
      minlength: [
        2,
        "Medicine name must be at least 2 characters long",
      ],
      maxlength: [
        150,
        "Medicine name cannot exceed 150 characters",
      ],
      index: true,
    },

    genericName: {
      type: String,
      trim: true,
      maxlength: [
        150,
        "Generic name cannot exceed 150 characters",
      ],
      default: "",
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Medicine category is required"],
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [
        1000,
        "Description cannot exceed 1000 characters",
      ],
      default: "",
    },

    price: {
      type: Number,
      required: [true, "Medicine price is required"],
      min: [0, "Medicine price cannot be negative"],
    },

    stock: {
      type: Number,
      required: [true, "Medicine stock is required"],
      min: [0, "Medicine stock cannot be negative"],
      default: 0,
    },

    image: {
      type: String,
      trim: true,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Compound index for common medicine listing/search operations.
 */
medicineSchema.index({
  name: 1,
  category: 1,
});

medicineSchema.index({
  category: 1,
  isActive: 1,
});

const Medicine: Model<IMedicine> =
  mongoose.models.Medicine ||
  mongoose.model<IMedicine>(
    "Medicine",
    medicineSchema
  );

export default Medicine;