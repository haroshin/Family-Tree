import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    maidenName: { type: String, default: '' },
    relationToMe: { type: String, default: '' },
    gender: { type: String, default: 'other' },
    birthYear: { type: String, default: '' },
    birthPlace: { type: String, default: '' },
    deathYear: { type: String, default: '' },
    deathPlace: { type: String, default: '' },
    isDeceased: { type: Boolean, default: false },
    occupation: { type: String, default: '' },
    bio: { type: String, default: '' },
    notes: { type: String, default: '' },
    photo: { type: String, default: '' },
    fatherId: { type: String, default: null },
    motherId: { type: String, default: null },
    spouseId: { type: String, default: null },
    childrenIds: { type: [String], default: [] },
    siblingIds: { type: [String], default: [] },
    generation: { type: Number, default: 0 },
    location: { type: String, default: '' },
    tags: { type: [String], default: [] }
  },
  { _id: false }
);

const treeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      default: 'My Family Heritage Tree',
      trim: true
    },
    members: {
      type: [memberSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Tree', treeSchema);
