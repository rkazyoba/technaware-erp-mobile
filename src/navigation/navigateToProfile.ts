/** Opens Profile on the Modules stack with ModulesHome underneath (reliable back). */
export function navigateToProfile(navigation: { navigate: (name: string, params?: object) => void }): void {
  navigation.navigate('Modules', { screen: 'ModulesHome' });
  navigation.navigate('Modules', { screen: 'Profile' });
}

/** Leave Profile and return to the modules grid. */
export function leaveProfileScreen(navigation: { navigate: (name: 'ModulesHome') => void }): void {
  navigation.navigate('ModulesHome');
}

/** When the Modules tab is selected, show the grid (not a stale nested screen). */
export function navigateToModulesHome(navigation: { navigate: (name: string, params?: object) => void }): void {
  navigation.navigate('Modules', { screen: 'ModulesHome' });
}
