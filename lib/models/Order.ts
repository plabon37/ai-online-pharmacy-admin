import mongoose, {
  Document,
  Model,
  Schema,
  Types,
} from "mongoose";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

export interface IOrderItem {
  medicine: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface IShippingAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  area?: string;
  postalCode?: string;
}

export interface IOrder extends Document {
  user: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  shippingAddress: IShippingAddress;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    medicine: {
      type: Schema.Types.ObjectId,
      ref: "Medicine",
      required: [true, "Medicine is required"],
    },

    name: {
      type: String,
      required: [true, "Medicine name is required"],
      trim: true,
    },

    price: {
      type: Number,
      required: [true, "Medicine price is required"],
      min: [0, "Medicine price cannot be negative"],
    },

    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be a whole number",
      },
    },

    image: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  }
);

const shippingAddressSchema =
  new Schema<IShippingAddress>(
    {
      name: {
        type: String,
        required: [true, "Shipping name is required"],
        trim: true,
        maxlength: 100,
      },

      phone: {
        type: String,
        required: [true, "Phone number is required"],
        trim: true,
        maxlength: 30,
      },

      address: {
        type: String,
        required: [true, "Address is required"],
        trim: true,
        maxlength: 300,
      },

      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
        maxlength: 100,
      },

      area: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "",
      },

      postalCode: {
        type: String,
        trim: true,
        maxlength: 20,
        default: "",
      },
    },
    {
      _id: false,
    }
  );

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Order user is required"],
      index: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: IOrderItem[]) =>
          Array.isArray(items) && items.length > 0,
        message: "Order must contain at least one item",
      },
    },

    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: [true, "Shipping address is required"],
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
      ],
      default: "PENDING",
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: [
        "PENDING",
        "PAID",
        "FAILED",
        "REFUNDED",
      ],
      default: "PENDING",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({
  user: 1,
  createdAt: -1,
});

orderSchema.index({
  status: 1,
  createdAt: -1,
});

const Order: Model<IOrder> =
  mongoose.models.Order ||
  mongoose.model<IOrder>("Order", orderSchema);

export default Order;