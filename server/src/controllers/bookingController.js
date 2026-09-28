import { Booking } from '../models/Booking.js';
import Joi from 'joi';


const objectIdValidator = Joi.string().hex().length(24);

const createSchema = Joi.object({
  roomNumber: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required().messages({
    'date.greater': 'endDate must be strictly after startDate'
  }),
  purpose: Joi.string().allow(''),
  bookedBy: objectIdValidator.optional()
});

const updateSchema = Joi.object({
  roomNumber: Joi.string(),
  startDate: Joi.date(),
  endDate: Joi.date(),
  purpose: Joi.string().allow(''),
  bookedBy: objectIdValidator.optional()
});

// TODO: per README.md section 4, you will need a way to detect whether a
async function hasConflict(roomNumber, startDate, endDate, excludeId = null) {
  const query = {
    roomNumber: roomNumber,
    startDate: { $lt: new Date(endDate) },
    endDate: { $gt: new Date(startDate) }
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const conflict = await Booking.findOne(query);
  return !!conflict;
}

// GET /api/bookings
// TODO: implement per README.md section 3.
export async function getAllBookings(req, res, next) {
  try {
    const bookings = await Booking.find().populate('bookedBy', 'name email').sort({ createdAt: -1 });
    res.json({ bookings: bookings.map(publicBooking) });
  } catch (err) { next(err); }
}

// GET /api/bookings/:id
// TODO: implement per README.md sections 3 and 5.
// GET /api/bookings/:id
export async function getBooking(req, res, next) {
  try {
    const booking = await Booking.findById(req.params.id).populate('bookedBy', 'name email');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json({ booking: publicBooking(booking) });
  } catch (err) { next(err); }
}

// POST /api/bookings
// TODO: implement per README.md sections 3 and 4.
export async function createBooking(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: error.message });

    const conflict = await hasConflict(value.roomNumber, value.startDate, value.endDate);
    if (conflict) {
      return res.status(409).json({ message: 'This room is already booked during the requested time range' });
    }

    const booking = await Booking.create({
      roomNumber: value.roomNumber,
      startDate: value.startDate,
      endDate: value.endDate,
      purpose: value.purpose,
      bookedBy: value.bookedBy
    });

    res.status(201).json({ booking: publicBooking(booking) });
  } catch (err) { next(err); }
}
// PATCH /api/bookings/:id
// TODO: implement per README.md sections 3, 4, and 5.
export async function updateBooking(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const existingBooking = await Booking.findById(req.params.id);
    if (!existingBooking) return res.status(404).json({ message: 'Booking not found' });

    const roomNumber = value.roomNumber || existingBooking.roomNumber;
    const startDate = value.startDate || existingBooking.startDate;
    const endDate = value.endDate || existingBooking.endDate;

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: 'endDate must be strictly after startDate' });
    }

    const conflict = await hasConflict(roomNumber, startDate, endDate, req.params.id);
    if (conflict) {
      return res.status(409).json({ message: 'This room is already booked during the requested time range' });
    }

    const updated = await Booking.findByIdAndUpdate(
      req.params.id, 
      { $set: value }, 
      { new: true, runValidators: true }
    ).populate('bookedBy', 'name email');

    res.json({ booking: publicBooking(updated) });
  } catch (err) { next(err); }
}
// DELETE /api/bookings/:id
// TODO: implement per README.md sections 3 and 5.
export async function deleteBooking(req, res, next) {
  try {
   const doc = await Booking.findByIdAndDelete(req.params.id);
       if (!doc) return res.status(404).json({ message: 'Booking not found' });
       res.json({ ok: true });
  } catch (err) { next(err); }
}

function publicBooking(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj.__v;
  return obj;
}
