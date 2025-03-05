import React, { useState, useEffect } from 'react';
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

import CropRecommendation from "./screens/CropRecommendation";
import CropHealthDetection from "./screens/CropHealthDetection";
import CropInformation from "./screens/CropInformation";
import AuthScreen from './screens/AuthScreen'; // Import the auth screen we created earlier
import ChatScreen from './screens/ChatScreen';
// Initialize Firebase - Replace with your config
const firebaseConfig = {
  apiKey: "AIzaSyD04GBzKKyxBrSGL7LeLq99Y37YsEB6aOg",
  authDomain: "thirdeye-c5b2e.firebaseapp.com",
  databaseURL: "https://thirdeye-c5b2e-default-rtdb.firebaseio.com",
  projectId: "thirdeye-c5b2e",
  storageBucket: "thirdeye-c5b2e.firebasestorage.app",
  messagingSenderId: "97667042020",
  appId: "1:97667042020:web:4178bc2c8e9d6818fb7af1",
  measurementId: "G-FE8WSFS1B7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Inside your TabNavigator function, modify the screenOptions to include the chat icon
function TabNavigator() {
  const url = "http://192.168.57.182:5000";
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "Crop Health") {
            iconName = focused ? "medkit" : "medkit-outline";
          } else if (route.name === "Crop Recommendation") {
            iconName = focused ? "leaf" : "leaf-outline";
          } else if (route.name === "Crop Information") {
            iconName = focused ? "information-circle" : "information-circle-outline";
          } else if (route.name === "Chat") {
            iconName = focused ? "chatbubbles" : "chatbubbles-outline";
          } else {
            return null;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Crop Health" component={CropHealthDetection} initialParams={{ url }} />
      <Tab.Screen name="Crop Recommendation" component={CropRecommendation} initialParams={{ url }} />
      <Tab.Screen name="Crop Information" component={CropInformation} initialParams={{ url }} />
      <Tab.Screen name="Chat" component={ChatScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe; // Cleanup subscription
  }, []);

  if (loading) {
    // You might want to add a loading screen/spinner here
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // User is signed in
          <Stack.Screen name="MainApp" component={TabNavigator} />
        ) : (
          // No user is signed in
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}