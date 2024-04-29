// dateUtils.js
/**
 * Converts a Unix timestamp to a human-readable date string.
 * Ensures that the timestamp is in milliseconds, as JavaScript expects.
 * If the input is not valid, it returns an empty string or a predefined placeholder.
 * @param {number|null|undefined} unixTimestamp - The Unix timestamp in seconds.
 * @returns {string} - The formatted date string or an empty string if the input is invalid.
 */
export const formatDate = (unixTimestamp) => {
  if (!unixTimestamp) {
    return '';
  }
  const date = new Date(unixTimestamp * 1000);
  return date.toLocaleString();
};
