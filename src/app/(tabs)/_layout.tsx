import { Tabs } from 'expo-router';
import { Text, ColorValue } from 'react-native';

function TabIcon({ emoji, color }: { emoji: string; color: ColorValue }) {
  return <Text style={{ fontSize: 20, color }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerTitleStyle: { fontWeight: '600' } }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon emoji="⚙️" color={color} />,
        }}
      />
      <Tabs.Screen
        name="vercel"
        options={{
          title: 'Vercel',
          tabBarIcon: ({ color }) => <TabIcon emoji="▲" color={color} />,
        }}
      />
      <Tabs.Screen
        name="supabase"
        options={{
          title: 'Supabase',
          tabBarIcon: ({ color }) => <TabIcon emoji="⚡" color={color} />,
        }}
      />
    </Tabs>
  );
}
