import { Schema } from 'mongoose';
import { EDocumentType } from '../../../../domain/user/entity/enums/EDocumentType';
import { ECurrency } from '../../../../domain/user/entity/enums/ECurrency';
import type { IMUser } from '../models/user.model';

const DocumentSchema = new Schema(
  {
    type: {
      type: String,
      enum: Object.values(EDocumentType),
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const SalarySchema = new Schema(
  {
    amount: { type: Number, required: true },
    currency: {
      type: String,
      enum: Object.values(ECurrency),
      required: true,
    },
    paymentDay: { type: Number, min: 1, max: 31 },
    source: { type: String },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { _id: false },
);

export const UserSchema = new Schema<IMUser>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    passwordHash: {
      type: String,
      select: false,
    },
    document: {
      type: DocumentSchema,
    },
    salary: {
      type: SalarySchema,
    },
    age: {
      type: Number,
      min: 0,
      max: 150,
    },
  },
  { timestamps: true },
);

UserSchema.index({ 'document.value': 1 }, { unique: true, sparse: true });
