/**
 * Seed script: populate the PinCode collection with J&K and major Indian cities.
 * Run with: node server/src/scripts/seedPinCodes.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const PinCode = require('../models/PinCode');

const PIN_CODES = [
  // ── Jammu & Kashmir ──────────────────────────────────────────────────────
  { pinCode: '190001', city: 'Srinagar',    state: 'Jammu & Kashmir', isServiceable: true,  codEligible: true,  shippingFee: 0    },
  { pinCode: '190002', city: 'Srinagar',    state: 'Jammu & Kashmir', isServiceable: true,  codEligible: true,  shippingFee: 0    },
  { pinCode: '190003', city: 'Srinagar',    state: 'Jammu & Kashmir', isServiceable: true,  codEligible: true,  shippingFee: 0    },
  { pinCode: '190005', city: 'Srinagar',    state: 'Jammu & Kashmir', isServiceable: true,  codEligible: true,  shippingFee: 0    },
  { pinCode: '190006', city: 'Srinagar',    state: 'Jammu & Kashmir', isServiceable: true,  codEligible: true,  shippingFee: 0    },
  { pinCode: '190010', city: 'Srinagar',    state: 'Jammu & Kashmir', isServiceable: true,  codEligible: true,  shippingFee: 0    },
  { pinCode: '190011', city: 'Srinagar',    state: 'Jammu & Kashmir', isServiceable: true,  codEligible: true,  shippingFee: 0    },
  { pinCode: '190017', city: 'Srinagar',    state: 'Jammu & Kashmir', isServiceable: true,  codEligible: true,  shippingFee: 0    },
  { pinCode: '190019', city: 'Srinagar',    state: 'Jammu & Kashmir', isServiceable: true,  codEligible: true,  shippingFee: 0    },
  { pinCode: '191001', city: 'Srinagar',    state: 'Jammu & Kashmir', isServiceable: true,  codEligible: true,  shippingFee: 0    },
  { pinCode: '191111', city: 'Budgam',      state: 'Jammu & Kashmir', isServiceable: true,  codEligible: false, shippingFee: 50   },
  { pinCode: '192101', city: 'Anantnag',    state: 'Jammu & Kashmir', isServiceable: true,  codEligible: false, shippingFee: 80   },
  { pinCode: '193101', city: 'Baramulla',   state: 'Jammu & Kashmir', isServiceable: true,  codEligible: false, shippingFee: 80   },
  { pinCode: '180001', city: 'Jammu',       state: 'Jammu & Kashmir', isServiceable: true,  codEligible: true,  shippingFee: 60   },
  { pinCode: '180002', city: 'Jammu',       state: 'Jammu & Kashmir', isServiceable: true,  codEligible: true,  shippingFee: 60   },
  { pinCode: '180004', city: 'Jammu',       state: 'Jammu & Kashmir', isServiceable: true,  codEligible: true,  shippingFee: 60   },
  { pinCode: '182101', city: 'Udhampur',    state: 'Jammu & Kashmir', isServiceable: true,  codEligible: false, shippingFee: 100  },
  { pinCode: '185101', city: 'Poonch',      state: 'Jammu & Kashmir', isServiceable: false, codEligible: false, shippingFee: 0    },
  { pinCode: '194101', city: 'Leh',         state: 'Ladakh',          isServiceable: false, codEligible: false, shippingFee: 0    },

  // ── Delhi / NCR ──────────────────────────────────────────────────────────
  { pinCode: '110001', city: 'New Delhi',   state: 'Delhi',           isServiceable: true,  codEligible: true,  shippingFee: 99   },
  { pinCode: '110002', city: 'New Delhi',   state: 'Delhi',           isServiceable: true,  codEligible: true,  shippingFee: 99   },
  { pinCode: '110011', city: 'New Delhi',   state: 'Delhi',           isServiceable: true,  codEligible: true,  shippingFee: 99   },
  { pinCode: '110020', city: 'New Delhi',   state: 'Delhi',           isServiceable: true,  codEligible: true,  shippingFee: 99   },
  { pinCode: '110092', city: 'Delhi',       state: 'Delhi',           isServiceable: true,  codEligible: true,  shippingFee: 99   },

  // ── Mumbai ───────────────────────────────────────────────────────────────
  { pinCode: '400001', city: 'Mumbai',      state: 'Maharashtra',     isServiceable: true,  codEligible: true,  shippingFee: 99   },
  { pinCode: '400051', city: 'Mumbai',      state: 'Maharashtra',     isServiceable: true,  codEligible: true,  shippingFee: 99   },
  { pinCode: '400076', city: 'Mumbai',      state: 'Maharashtra',     isServiceable: true,  codEligible: true,  shippingFee: 99   },

  // ── Bangalore ────────────────────────────────────────────────────────────
  { pinCode: '560001', city: 'Bangalore',   state: 'Karnataka',       isServiceable: true,  codEligible: true,  shippingFee: 99   },
  { pinCode: '560034', city: 'Bangalore',   state: 'Karnataka',       isServiceable: true,  codEligible: true,  shippingFee: 99   },
  { pinCode: '560100', city: 'Bangalore',   state: 'Karnataka',       isServiceable: true,  codEligible: true,  shippingFee: 99   },

  // ── Chennai ──────────────────────────────────────────────────────────────
  { pinCode: '600001', city: 'Chennai',     state: 'Tamil Nadu',      isServiceable: true,  codEligible: true,  shippingFee: 99   },
  { pinCode: '600020', city: 'Chennai',     state: 'Tamil Nadu',      isServiceable: true,  codEligible: true,  shippingFee: 99   },

  // ── Kolkata ──────────────────────────────────────────────────────────────
  { pinCode: '700001', city: 'Kolkata',     state: 'West Bengal',     isServiceable: true,  codEligible: true,  shippingFee: 99   },
  { pinCode: '700019', city: 'Kolkata',     state: 'West Bengal',     isServiceable: true,  codEligible: true,  shippingFee: 99   },

  // ── Hyderabad ────────────────────────────────────────────────────────────
  { pinCode: '500001', city: 'Hyderabad',   state: 'Telangana',       isServiceable: true,  codEligible: true,  shippingFee: 99   },
  { pinCode: '500032', city: 'Hyderabad',   state: 'Telangana',       isServiceable: true,  codEligible: true,  shippingFee: 99   },

  // ── Pune ─────────────────────────────────────────────────────────────────
  { pinCode: '411001', city: 'Pune',        state: 'Maharashtra',     isServiceable: true,  codEligible: true,  shippingFee: 99   },
  { pinCode: '411045', city: 'Pune',        state: 'Maharashtra',     isServiceable: true,  codEligible: true,  shippingFee: 99   },

  // ── Ahmedabad ────────────────────────────────────────────────────────────
  { pinCode: '380001', city: 'Ahmedabad',   state: 'Gujarat',         isServiceable: true,  codEligible: true,  shippingFee: 99   },
  { pinCode: '380015', city: 'Ahmedabad',   state: 'Gujarat',         isServiceable: true,  codEligible: true,  shippingFee: 99   },
];

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/muzab';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  let inserted = 0;
  let skipped = 0;

  for (const entry of PIN_CODES) {
    try {
      await PinCode.updateOne(
        { pinCode: entry.pinCode },
        { $setOnInsert: entry },
        { upsert: true }
      );
      inserted++;
    } catch (err) {
      console.error(`Failed to upsert ${entry.pinCode}:`, err.message);
      skipped++;
    }
  }

  console.log(`Done — ${inserted} upserted, ${skipped} failed`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
