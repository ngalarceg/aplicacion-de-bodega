const mongoose = require('mongoose');

const { Schema } = mongoose;

const assignmentSnapshotSchema = new Schema(
  {
    assignedTo: String,
    assignedToAdAccount: String,
    location: String,
    assignmentDate: Date,
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: {
      type: String,
      enum: ['PURCHASED', 'RENTAL'],
      required: true,
    },
    serialNumber: { type: String, required: true, trim: true },
    partNumber: { type: String, required: true, trim: true },
    inventoryNumber: { type: String, trim: true },
    rentalId: { type: String, trim: true },
    dispatchGuide: { type: Schema.Types.ObjectId, ref: 'DispatchGuide', required: true },
    status: {
      type: String,
      enum: ['AVAILABLE', 'ASSIGNED', 'DECOMMISSIONED'],
      default: 'AVAILABLE',
    },
    currentAssignment: assignmentSnapshotSchema,
    decommissionReason: { type: String, trim: true },
    decommissionedAt: { type: Date },
    decommissionedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

productSchema.index({ serialNumber: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);
