const mongoose = require('mongoose');

const pinCodeSchema = new mongoose.Schema({
  pinCode: { type: String, required: true, unique: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  isServiceable: { type: Boolean, required: true, default: false },
  codEligible: { type: Boolean, required: true, default: false },
  shippingFee: { type: Number, required: true, default: 0 },
});

module.exports = mongoose.model('PinCode', pinCodeSchema);
