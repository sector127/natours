/* eslint-disable*/
import { leaflet } from './leaflet';
import { login, logout } from './login';
import { bookTour } from './stripe';
import { updateSettings } from './updateSettings';

const leafletEl = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form.form-user-password');
const photoPreview = document.querySelector('.form__user-photo');
const bookBtn = document.getElementById('book-tour');

if (leafletEl) {
  const locations = JSON.parse(leafletEl.dataset.locations);
  leaflet(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (userDataForm) {
  const photoInput = document.getElementById('photo');

  photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = () => {
        photoPreview.src = reader.result; // Display the uploaded image in the preview element
      };

      reader.readAsDataURL(file);
    } else {
      photoPreview.src = ''; // Clear the preview if no file selected
    }
  });

  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', photoInput.files[0]); // Use the input file directly
    updateSettings(form, 'data');
  });
}

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const currentPassword = document.getElementById('password-current').value;
    const newPassword = document.getElementById('password').value;
    const passwordConfirmation =
      document.getElementById('password-confirm').value;
    await updateSettings(
      { currentPassword, newPassword, passwordConfirmation },
      'password',
    );
    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });

if (bookBtn)
  addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });