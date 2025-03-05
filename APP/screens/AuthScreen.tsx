"use client"

import { useState, useRef, useEffect } from "react"
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  ImageBackground,
  Dimensions,
} from "react-native"
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

const { width } = Dimensions.get("window")

const AuthScreen = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLogin, setIsLogin] = useState(true)

  const auth = getAuth()

  const switchAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start()
  }, [fadeAnim]) // Added fadeAnim as a dependency

  const handleAuth = async () => {
    try {
      if (isLogin) {
        // Login
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        Alert.alert("Success", "Logged in successfully!")
        console.log("Logged in user:", userCredential.user)
      } else {
        // Register
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        Alert.alert("Success", "Registered successfully!")
        console.log("Registered user:", userCredential.user)
      }
    } catch (error) {
      let errorMessage = "An error occurred"

      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "This email is already registered"
          break
        case "auth/invalid-email":
          errorMessage = "Invalid email address"
          break
        case "auth/weak-password":
          errorMessage = "Password should be at least 6 characters"
          break
        case "auth/user-not-found":
          errorMessage = "User not found"
          break
        case "auth/wrong-password":
          errorMessage = "Incorrect password"
          break
      }

      Alert.alert("Error", errorMessage)
      console.error(error)
    }
  }

  const toggleSwitch = () => {
    Animated.spring(switchAnim, {
      toValue: isLogin ? 1 : 0,
      useNativeDriver: false,
    }).start()
    setIsLogin(!isLogin)
  }

  return (
    <ImageBackground
      source={{ uri: "https://example.com/path/to/agricultural-background.jpg" }}
      style={styles.backgroundImage}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <Text style={styles.title}>{isLogin ? "Welcome Back!" : "Join Us!"}</Text>

        <View style={styles.inputContainer}>
          <Icon name="email-outline" size={24} color="#4A3728" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#4A3728"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon name="lock-outline" size={24} color="#4A3728" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#4A3728"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleAuth}>
          <Text style={styles.buttonText}>{isLogin ? "Login" : "Register"}</Text>
        </TouchableOpacity>

        <View style={styles.switchContainer}>
          <Text style={styles.switchText}>Login</Text>
          <TouchableOpacity onPress={toggleSwitch} style={styles.switch}>
            <Animated.View
              style={[
                styles.switchThumb,
                {
                  transform: [
                    {
                      translateX: switchAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 20],
                      }),
                    },
                  ],
                },
              ]}
            />
          </TouchableOpacity>
          <Text style={styles.switchText}>Register</Text>
        </View>
      </Animated.View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },
  container: {
    padding: 20,
    backgroundColor: "rgba(242, 232, 207, 0.9)",
    borderRadius: 20,
    margin: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#2C5F2D",
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#97BC62",
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#4A3728",
  },
  button: {
    backgroundColor: "#2C5F2D",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginTop: 10,
  },
  buttonText: {
    color: "#F2E8CF",
    fontSize: 18,
    fontWeight: "bold",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  switchText: {
    color: "#4A3728",
    fontSize: 16,
    marginHorizontal: 10,
  },
  switch: {
    width: 50,
    height: 30,
    backgroundColor: "#97BC62",
    borderRadius: 15,
    padding: 5,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F2E8CF",
  },
})

export default AuthScreen

