import { Redirect, Tabs } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

const TabsLayout = () => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href={"/(auth)"} />;

  return (
    <Tabs>
      <Tabs.Screen
        name="index"
      />
      <Tabs.Screen
        name="profile"
      />
    </Tabs>
  );
};

export default TabsLayout;