import type { NavigationProp, ParamListBase } from '@react-navigation/native';

/** Payslip tab lives on the root tab navigator, not inside the Modules stack. */
export function navigateToPayslipTab(navigation: NavigationProp<ParamListBase>): void {
  const tabNav = navigation.getParent();
  if (tabNav) {
    tabNav.navigate('Payslip' as never);
    return;
  }
  navigation.navigate('Payslip' as never);
}
