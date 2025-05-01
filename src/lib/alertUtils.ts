import { addAlert, removeAlert, Alert } from '../components/AlertSystem';

/**
 * Utility functions for working with the alert system
 */

/**
 * Show an info alert
 * @param message The message to display
 * @param duration How long to show the alert (in ms)
 * @returns The ID of the created alert
 */
export const showInfoAlert = (message: string, duration = 5000): string => {
  return addAlert({
    message,
    type: 'info',
    duration
  });
};

/**
 * Show a success alert
 * @param message The message to display
 * @param duration How long to show the alert (in ms)
 * @returns The ID of the created alert
 */
export const showSuccessAlert = (message: string, duration = 5000): string => {
  return addAlert({
    message,
    type: 'success',
    duration
  });
};

/**
 * Show a warning alert
 * @param message The message to display
 * @param duration How long to show the alert (in ms)
 * @returns The ID of the created alert
 */
export const showWarningAlert = (message: string, duration = 5000): string => {
  return addAlert({
    message,
    type: 'warning',
    duration
  });
};

/**
 * Show an error alert
 * @param message The message to display
 * @param duration How long to show the alert (in ms)
 * @returns The ID of the created alert
 */
export const showErrorAlert = (message: string, duration = 5000): string => {
  return addAlert({
    message,
    type: 'error',
    duration
  });
};

/**
 * Dismiss an alert by its ID
 * @param id The ID of the alert to dismiss
 */
export const dismissAlert = (id: string): void => {
  removeAlert(id);
};

export { Alert, addAlert, removeAlert };