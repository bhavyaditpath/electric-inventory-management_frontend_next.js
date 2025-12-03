export const NAVIGATION = {
  auth: {
    login: '/auth/login',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  admin: {
    dashboard: '/admin/dashboard',
    branches: '/admin/branches',
    users: '/admin/users',
    inventory: '/admin/inventory',
    purchase: '/admin/purchase',
    request: '/admin/request',
    items: '/admin/inventory', // assuming items are in inventory
  },
  branch: {
    dashboard: '/branch/dashboard',
    inventory: '/branch/inventory',
    purchase: '/branch/purchase',
    requestedpurchase: '/branch/requestedpurchase',
    sales: '/branch/sales',
    alerts: '/branch/alerts',
    items: '/branch/inventory', // assuming items are in inventory
  },
};