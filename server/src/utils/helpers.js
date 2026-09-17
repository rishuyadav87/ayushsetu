export const safeParseJSON = (jsonString, fallback = []) => {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return fallback;
  }
};
