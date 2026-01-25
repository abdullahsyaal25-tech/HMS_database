// Import the global route function that's available through Ziggy
import { route as ziggyRoute } from 'ziggy-js';

// Export specific route helpers
export const logout = () => ziggyRoute('logout');
export const edit = () => ziggyRoute('profile.edit');

// Export the route function as default for general use
export default ziggyRoute;