// backend/src/middleware/requireModuleAccess.js

const PERMISSIONS = {
  trip: {
    write: ['Dispatcher'],
    read: ['Dispatcher', 'SafetyOfficer']
  },
  maintenance: {
    write: ['FleetManager'],
    read: ['FleetManager', 'Dispatcher', 'FinancialAnalyst']
  },
  fuelExpense: {
    write: ['FinancialAnalyst'],
    read: ['FinancialAnalyst']
  },
  analytics: {
    write: ['FleetManager', 'FinancialAnalyst'],
    read: ['FleetManager', 'FinancialAnalyst']
  }
};

const requireModuleAccess = (moduleName, accessType) => {
  return (req, res, next) => {
    const user = req.user; // populated by requireAuth middleware
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const allowedRoles = PERMISSIONS[moduleName]?.[accessType] || [];
    if (allowedRoles.includes(user.role)) {
      return next();
    }

    return res.status(403).json({
      message: `Access Denied: You do not have '${accessType}' access to the '${moduleName}' module.`
    });
  };
};

module.exports = requireModuleAccess;
