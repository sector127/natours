/* eslint-disable */
/// Function to create and show the alert with a progress bar
export const showAlert = (type, msg, duration = 5000) => {
  hideAlert(); // Hide any existing alert
  const markup = `
    <div class="alert alert--${type}">
      <div class="alert__content">${msg}</div>
      <div class="alert__progress-bar-container">
        <div class="alert__progress-bar"></div>
      </div>
    </div>
  `;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);

  const alertElement = document.querySelector('.alert');
  const progressBar = document.querySelector('.alert__progress-bar');

  // Update progress bar width based on time
  let currentTime = 0;
  const interval = 100;
  const progressInterval = setInterval(() => {
    currentTime += interval;
    const progressWidth = (1 - currentTime / duration) * 100;
    progressBar.style.width = `${Math.max(progressWidth, 0)}%`;
  }, interval);

  // Set timeout to hide the alert and clear the progress interval
  window.setTimeout(() => {
    hideAlert();
    clearInterval(progressInterval);
  }, duration);
};

// Function to hide the alert
export const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};
