// Authentication guard utility
export const requireAuth = (isAuthenticated, openAuthModal, action, tab = 'login') => {
  if (!isAuthenticated) {
    openAuthModal(tab);
    return false;
  }
  
  if (action && typeof action === 'function') {
    action();
  }
  
  return true;
};

// Higher-order component for protecting actions
export const withAuthGuard = (Component, openAuthModal) => {
  return (props) => {
    const handleProtectedAction = (action, tab = 'login') => {
      return (e) => {
        e.preventDefault();
        if (!props.isAuthenticated) {
          openAuthModal(tab);
          return;
        }
        if (action) action(e);
      };
    };

    return (
      <Component 
        {...props} 
        onProtectedAction={handleProtectedAction}
      />
    );
  };
};