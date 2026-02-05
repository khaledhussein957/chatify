import { Stack } from "expo-router";

const ScreensLayout = () => {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        animation: "slide_from_right",
        
        contentStyle: { backgroundColor: "#0D0D0F" } 
      }}
    >
      <Stack.Screen 
        name="delete_account" 
        options={{ 
          presentation: "transparentModal",
          animation: "fade",
          contentStyle: { backgroundColor: "transparent" }
        }} 
      />
      <Stack.Screen 
        name="select_participates"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: "#0D0D0F" },
          headerTintColor: "#fff",
        }}
      />
    </Stack>
  );
};

export default ScreensLayout;