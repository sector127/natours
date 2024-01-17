/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!', 1500);
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const signup = async (name, email, password, passwordConfirmation) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'api/v1/users/signup',
      data: {
        name,
        email,
        password,
        passwordConfirmation,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Signed up successfully!');
      window.setTimeout(() => {
        location.assign('/me');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });
    if ((res.data.status = 'success')) location.reload(true);
  } catch (err) {
    console.log(err.response);
    showAlert('error', 'Error logging out! Try again.');
  }
};

export const forgotPassword = async (email) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/forgotPassword',
      data: {
        email,
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Please check your email!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (error) {
    showAlert('error', `Error reseting password \n${error.message}`, 2500);
  }
};

export const resetPassword = async (password, passwordConfirmation, token) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `/api/v1/users/resetPassword/${token}`,
      data: {
        password,
        passwordConfirmation,
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'You reset your password!');
      window.setTimeout(() => {
        location.assign('/me');
      }, 2500);
    }
  } catch (error) {
    showAlert('error', `Error reseting password \n${error.message}`, 2500);
  }
};
