import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Text } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import RulesScreen from '../screens/RulesScreen';
import TradesScreen from '../screens/TradesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import GuideScreen from '../screens/GuideScreen';
import FundingScreen from '../screens/FundingScreen';
import { useTheme } from '../hooks/useTheme';

const Tab = createBottomTabNavigator();

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icon}</Text>;
}

export default function AppNavigator() {
  const t = useTheme();
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: t.header },
          headerTintColor: t.text,
          headerTitleStyle: { fontWeight: '700' },
          tabBarStyle: { backgroundColor: t.tabBar, borderTopColor: t.tabBorder },
          tabBarActiveTintColor: t.accent,
          tabBarInactiveTintColor: t.textMuted,
        }}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} /> }} />
        <Tab.Screen name="Rules" component={RulesScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" focused={focused} />, title: 'DCA Rules' }} />
        <Tab.Screen name="Trades" component={TradesScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} /> }} />
        <Tab.Screen name="Settings" component={SettingsScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🔑" focused={focused} /> }} />
        <Tab.Screen name="Funding" component={FundingScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon icon="💳" focused={focused} /> }} />
        <Tab.Screen name="Guide" component={GuideScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📖" focused={focused} /> }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
