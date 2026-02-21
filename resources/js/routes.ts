// Import the global route function that's available through Ziggy
import { route as ziggyRoute } from 'ziggy-js';

// Export specific route helpers
export const home = () => ziggyRoute('home');
export const dashboard = () => ziggyRoute('dashboard');
export const logout = () => ziggyRoute('logout');
export const edit = () => ziggyRoute('profile.edit');

// Patient routes
export const patients = {
  index: () => ziggyRoute('patients.index'),
  create: () => ziggyRoute('patients.create'),
  show: (id: number | string) => ziggyRoute('patients.show', { patient: id }),
  edit: (id: number | string) => ziggyRoute('patients.edit', { patient: id }),
};

// Billing routes
export const billing = {
  index: () => ziggyRoute('billing.index'),
  create: () => ziggyRoute('billing.create'),
  show: (id: number) => ziggyRoute('billing.show', { bill: id }),
};

// Wallet routes
export const wallet = {
  index: () => ziggyRoute('wallet.index'),
};

// Export the route function as default for general use
export default ziggyRoute;
