import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe(
  'pk_test_51OXUjzEAbCy8cjALSbL2tdvKMAHOhCrCokNF5qZHP4zsEShQ2rzepfRP6jzWBwLJtYxI9yrDy5RQyqUWjud7eR0200u29yP9cW',
);

export const bookTour = async (tourId) => {
  try {
    // 1) Get session
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // 2) Create checkout form and charge card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (error) {
    console.log(error);
    showAlert('error', error);
  }
};
