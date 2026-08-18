import mongoose, {
  Document,
  Model,
  Schema,
  Types,
} from "mongoose";

/* ============================================================
   ORDER STATUS
============================================================ */

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

/* ============================================================
   PAYMENT STATUS
============================================================ */

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

/* ============================================================
   PAYMENT METHOD
============================================================ */

export type PaymentMethod =
  | "COD"
  | "ONLINE";

/* ============================================================
   ORDER ITEM
============================================================ */

export interface IOrderItem {
  medicine: Types.ObjectId;

  name: string;

  price: number;

  quantity: number;

  image?: string;
}

/* ============================================================
   SHIPPING ADDRESS
============================================================ */

export interface IShippingAddress {
  name: string;

  phone: string;

  address: string;

  city: string;

  area?: string;

  postalCode?: string;
}

/* ============================================================
   ORDER
============================================================ */

export interface IOrder
  extends Document {
  user: Types.ObjectId;

  items: IOrderItem[];

  totalAmount: number;

  shippingAddress:
    IShippingAddress;

  paymentMethod:
    PaymentMethod;

  paymentStatus:
    PaymentStatus;

  status: OrderStatus;

  createdAt: Date;

  updatedAt: Date;
}

/* ============================================================
   ORDER ITEM SCHEMA
============================================================ */

const orderItemSchema =
  new Schema<IOrderItem>(
    {
      medicine: {
        type: Schema.Types.ObjectId,

        ref: "Medicine",

        required: [
          true,
          "Medicine is required",
        ],
      },

      name: {
        type: String,

        required: [
          true,
          "Medicine name is required",
        ],

        trim: true,
      },

      price: {
        type: Number,

        required: [
          true,
          "Medicine price is required",
        ],

        min: [
          0,
          "Medicine price cannot be negative",
        ],
      },

      quantity: {
        type: Number,

        required: [
          true,
          "Quantity is required",
        ],

        min: [
          1,
          "Quantity must be at least 1",
        ],

        validate: {
          validator:
            Number.isInteger,

          message:
            "Quantity must be a whole number",
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

/* ============================================================
   SHIPPING ADDRESS SCHEMA
============================================================ */

const shippingAddressSchema =
  new Schema<IShippingAddress>(
    {
      name: {
        type: String,

        required: [
          true,
          "Shipping name is required",
        ],

        trim: true,

        maxlength: [
          100,
          "Shipping name cannot exceed 100 characters",
        ],
      },

      phone: {
        type: String,

        required: [
          true,
          "Phone number is required",
        ],

        trim: true,

        maxlength: [
          30,
          "Phone number cannot exceed 30 characters",
        ],
      },

      address: {
        type: String,

        required: [
          true,
          "Address is required",
        ],

        trim: true,

        maxlength: [
          300,
          "Address cannot exceed 300 characters",
        ],
      },

      city: {
        type: String,

        required: [
          true,
          "City is required",
        ],

        trim: true,

        maxlength: [
          100,
          "City cannot exceed 100 characters",
        ],
      },

      area: {
        type: String,

        trim: true,

        maxlength: [
          100,
          "Area cannot exceed 100 characters",
        ],

        default: "",
      },

      postalCode: {
        type: String,

        trim: true,

        maxlength: [
          20,
          "Postal code cannot exceed 20 characters",
        ],

        default: "",
      },
    },
    {
      _id: false,
    }
  );

/* ============================================================
   ORDER SCHEMA
============================================================ */

const orderSchema =
  new Schema<IOrder>(
    {
      /* ======================================================
         CUSTOMER
      ====================================================== */

      user: {
        type: Schema.Types.ObjectId,

        ref: "User",

        required: [
          true,
          "Order user is required",
        ],

        index: true,
      },

      /* ======================================================
         ITEMS
      ====================================================== */

      items: {
        type: [
          orderItemSchema,
        ],

        required: true,

        validate: {
          validator:
            (
              items: IOrderItem[]
            ) =>
              Array.isArray(
                items
              ) &&
              items.length > 0,

          message:
            "Order must contain at least one item",
        },
      },

      /* ======================================================
         TOTAL
      ====================================================== */

      totalAmount: {
        type: Number,

        required: [
          true,
          "Total amount is required",
        ],

        min: [
          0,
          "Total amount cannot be negative",
        ],
      },

      /* ======================================================
         SHIPPING
      ====================================================== */

      shippingAddress: {
        type:
          shippingAddressSchema,

        required: [
          true,
          "Shipping address is required",
        ],
      },

      /* ======================================================
         ORDER STATUS
      ====================================================== */

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

      /* ======================================================
         PAYMENT METHOD
      ====================================================== */

      paymentMethod: {
        type: String,

        enum: [
          "COD",
          "ONLINE",
        ],

        required: [
          true,
          "Payment method is required",
        ],

        default: "COD",

        index: true,
      },

      /* ======================================================
         PAYMENT STATUS
         
         Prototype:
         COD    → PENDING
         ONLINE → PAID
      ====================================================== */

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

/* ============================================================
   INDEXES
============================================================ */

orderSchema.index({
  user: 1,
  createdAt: -1,
});

orderSchema.index({
  status: 1,
  createdAt: -1,
});

orderSchema.index({
  paymentStatus: 1,
  createdAt: -1,
});

orderSchema.index({
  paymentMethod: 1,
  createdAt: -1,
});

/* ============================================================
   MODEL
============================================================ */

const Order: Model<IOrder> =
  mongoose.models.Order ||
  mongoose.model<IOrder>(
    "Order",
    orderSchema
  );

export default Order;