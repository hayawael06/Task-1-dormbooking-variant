import { Router } from 'express';
import {
  getAllBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking
} from '../controllers/bookingController.js';

const router = Router();

// TODO: wire up the routes described in README.md section 3.
// GET /api/bookings - Fetch all bookings
router.get('/', getAllBookings);

// GET /api/bookings/:id - Fetch a single booking by ID
router.get('/:id', getBooking);

// POST /api/bookings - Create a new booking
router.post('/', createBooking);

// PATCH /api/bookings/:id - Update an existing booking by ID
router.patch('/:id', updateBooking);

// DELETE /api/bookings/:id - Delete a booking by ID
router.delete('/:id', deleteBooking);
export default router;
