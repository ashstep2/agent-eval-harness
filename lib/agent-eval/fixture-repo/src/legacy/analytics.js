function trackEvent(name, properties) {
  if (!name) {
    throw new Error('Event name required');
  }

  return {
    name: name,
    properties: properties || {},
    timestamp: Date.now(),
  };
}

function normalizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    plan: user.plan || 'free',
  };
}

module.exports = {
  trackEvent,
  normalizeUser,
};
