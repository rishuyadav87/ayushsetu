export const generateToken = (userId, role) => {
  import('jsonwebtoken').then(jwt => {
      // not synchronous, but usually helpers are better. We do it inside auth route anyway.
  });
};

export const safeParseJSON = (jsonString, fallback = []) => {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return fallback;
  }
};
