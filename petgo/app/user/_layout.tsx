import { Stack } from 'expo-router';

export default function UserLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="shop-registration" />
      <Stack.Screen name="services" />
      <Stack.Screen name="add-service" />
      <Stack.Screen name="shop-bookings" />
    </Stack>
  );
}
