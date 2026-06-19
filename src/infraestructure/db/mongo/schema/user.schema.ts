import { Schema } from 'mongoose';
import { EDocumentType } from '../../../../domain/user/entity/enums/EDocumentType';
import { ECurrency } from '../../../../domain/user/entity/enums/ECurrency';
import { EInvestmentProfile } from '../../../../domain/user/entity/enums/EInvestmentProfile';
import { ELivingSituation } from '../../../../domain/user/entity/enums/ELivingSituation';
import { EUserVerificationStatus } from '../../../../domain/user/entity/enums/EUserVerificationStatus';
import { IUserProfile } from '../../../../domain/user/entity/interfaces/user-profile.interface';
import {
  resolveVerificationStatus,
  validateProfileForVerificationStatus,
} from '../../../../domain/user/utils/user-verification-state.utils';
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

const AddressSchema = new Schema(
  {
    zipCode: { type: String, required: true },
    street: { type: String, required: true },
    neighborhood: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    number: { type: String, required: true },
    complement: { type: String },
  },
  { _id: false },
);

const UserProfileSchema = new Schema(
  {
    occupationArea: { type: String, maxlength: 120 },
    investmentProfile: {
      type: String,
      enum: Object.values(EInvestmentProfile),
    },
    livingSituation: {
      type: String,
      enum: Object.values(ELivingSituation),
    },
    address: { type: AddressSchema },
    onboardingCompletedAt: { type: Date },
    verificationStatus: {
      type: String,
      enum: Object.values(EUserVerificationStatus),
      default: EUserVerificationStatus.PENDING_ADDRESS,
    },
  },
  { _id: false },
);

UserProfileSchema.pre('validate', function (next) {
  try {
    const profile = this.toObject() as IUserProfile;
    const status = resolveVerificationStatus(profile);
    validateProfileForVerificationStatus({
      ...profile,
      verificationStatus: status,
    });
    next();
  } catch (error) {
    next(error instanceof Error ? error : new Error(String(error)));
  }
});

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
    profile: {
      type: UserProfileSchema,
    },
  },
  { timestamps: true },
);

UserSchema.index({ 'document.value': 1 }, { unique: true, sparse: true });
