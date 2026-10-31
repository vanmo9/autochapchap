require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const VerificationDocument = require('../models/VerificationDocument');
const Payment = require('../models/Payment');

const DEMO_PASSWORD = 'Demo12345';
const DOMAIN = '@demo.autochapchap.com';
const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (n) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return new Date(d.getTime() + n * DAY);
};

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  // remove earlier demo data only
  const old = await User.find({ email: new RegExp(DOMAIN.replace(/\./g, '\\.') + '$') }).select('_id');
  const oldIds = old.map((u) => u._id);
  await Payment.deleteMany({ $or: [{ customerId: { $in: ids } }, { hostId: { $in: ids } }] });
  await Booking.deleteMany({ $or: [{ customerId: { $in: oldIds } }, { hostId: { $in: oldIds } }] });
  await Vehicle.deleteMany({ hostId: { $in: oldIds } });
  await VerificationDocument.deleteMany({ userId: { $in: oldIds } });
  await User.deleteMany({ _id: { $in: oldIds } });

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const make = (fullName, key, phone, role, verificationStatus) => ({
    fullName, email: key + DOMAIN, phone, passwordHash, role, verificationStatus
  });

  const [grace, samuel, david, mary, brian] = await User.insertMany([
    make('Grace Wanjiru', 'grace', '0711000001', 'host', 'verified'),
    make('Samuel Otieno', 'samuel', '0711000002', 'host', 'verified'),
    make('David Kiprop', 'david', '0711000003', 'host', 'pending'),
    make('Mary Njeri', 'mary', '0722000001', 'customer', 'verified'),
    make('Brian Mutua', 'brian', '0722000002', 'customer', 'verified')
  ]);

  const car = (host, make, model, year, vehicleType, fuelType, seats, location, dailyPrice, description) =>
    ({ hostId: host._id, make, model, year, vehicleType, fuelType, seats, location, dailyPrice, description });

  const cars = await Vehicle.insertMany([
    car(grace, 'Toyota', 'Land Cruiser V8', 2017, 'suv', 'diesel', 7, 'Nairobi, Westlands', 12000, 'Powerful diesel V8, ideal for long trips and events.'),
    car(grace, 'Mazda', 'CX-5', 2019, 'suv', 'petrol', 5, 'Nairobi, Karen', 6500, 'Comfortable and fuel efficient, low mileage.'),
    car(grace, 'Toyota', 'Axio', 2016, 'sedan', 'petrol', 5, 'Nairobi, CBD', 3500, 'Reliable city car, easy to park.'),
    car(samuel, 'Subaru', 'Forester', 2017, 'suv', 'petrol', 5, 'Nairobi, Kilimani', 5500, 'All-wheel drive, great for upcountry roads.'),
    car(samuel, 'Toyota', 'Harrier', 2018, 'suv', 'petrol', 5, 'Nairobi, Lavington', 7000, 'Premium interior, smooth ride.'),
    car(samuel, 'Toyota', 'Hiace', 2015, 'van', 'diesel', 14, 'Mombasa, Nyali', 9000, '14-seater van for groups and tours.'),
    car(david, 'Nissan', 'X-Trail', 2016, 'suv', 'petrol', 5, 'Nairobi, Kileleshwa', 6000, 'Spacious family SUV.'),
    car(david, 'Toyota', 'Vitz', 2014, 'hatchback', 'petrol', 5, 'Nakuru, Milimani', 2500, 'Cheap and economical small car.')
  ]);

  const byModel = (m) => cars.find((c) => c.model === m);
  const booking = (customer, vehicle, from, to, status) => {
    const days = Math.round((daysFromNow(to) - daysFromNow(from)) / DAY);
    return {
      customerId: customer._id, vehicleId: vehicle._id, hostId: vehicle.hostId,
      startDate: daysFromNow(from), endDate: daysFromNow(to),
      days, totalPrice: days * vehicle.dailyPrice, status
    };
  };

  await Booking.insertMany([
    booking(brian, byModel('Forester'), 10, 13, 'confirmed'),
    booking(mary, byModel('CX-5'), 5, 7, 'requested'),
    booking(mary, byModel('Axio'), 20, 22, 'declined'),
    booking(mary, byModel('Harrier'), -10, -7, 'completed')
  ]);

  console.log('Demo data ready.');
  console.log(`Demo accounts (password ${DEMO_PASSWORD}):`);
  console.log('  Hosts:     grace / samuel / david' + DOMAIN);
  console.log('  Customers: mary / brian' + DOMAIN);
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err.message); process.exit(1); });