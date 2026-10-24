/**
 * HBPlus Auth — App entry point.
 *
 * Instantiates the singleton auth service and renders the top-level
 * navigation router. The service is a singleton so there is exactly one
 * Firebase Auth instance and one `onAuthStateChanged` listener across the
 * whole app; the same instance is injected into every screen and test.
 */

import { AuthService } from './src/services/authService';
import { AppNavigator } from './src/navigation/AppNavigator';

/**
 * The root component.
 *
 * Note: the AuthService instance is created at module load time. In a real
 * app this would be provided via React Context or a dependency-injection
 * container, but a module-level singleton is the simplest maintained
 * approach for a small app and keeps every screen testable via props.
 */
const authService = new AuthService();

export default function App() {
  return <AppNavigator authService={authService} />;
}

