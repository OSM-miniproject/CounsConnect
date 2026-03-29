import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Keyboard, 
  TouchableWithoutFeedback, 
  ActivityIndicator, 
  Alert,
  SafeAreaView,
  StatusBar,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import 'react-native-get-random-values'; // Required for uuid to work with React Native
import { v4 as uuidv4 } from 'uuid';

// API configuration
const API_BASE_URL = 'http://172.20.10.4:8080/api';

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("patient"); // Default to patient
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Interfaces for request and response data
  interface RegisterUserRequest {
    uid: string;
    username: string;
    email: string;
    password: string;
    role: string;
  }

  interface RegisterUserResponse {
    token?: string;
    [key: string]: any; // For any additional fields in the response
  }

  async function registerUser(
    uid: string,
    username: string, 
    email: string, 
    password: string, 
    role: string
  ): Promise<RegisterUserResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uid,
          username,
          email,
          password,
          role
        } as RegisterUserRequest)
      });
      
      const data: RegisterUserResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  const handleRegister = async () => {
    // Reset previous errors
    setError("");
    
    // Validate inputs
    if (!username || !email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate username length (3-30 characters)
    if (username.length < 3 || username.length > 30) {
      setError("Username must be between 3 and 30 characters");
      return;
    }
    
    // Validate password length (minimum 6 characters)
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Generate a UUID for the user
    const uid = uuidv4();
    console.log("Generated UID:", uid);
    try {
      setIsLoading(true);
      
      // Using the updated registerUser function with auto-generated UUID
      const data = await registerUser(uid, username, email, password, role);
      
      // Option 1: Auto-login the user
      if (data.token) {
        await AsyncStorage.setItem('userToken', data.token);
        router.replace("/");
      } 
      // Option 2: Redirect to login
      else {
        Alert.alert(
          "Registration Successful", 
          "Your account has been created. Please log in.",
          [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
        );
      }
      
    } catch (err) {
      setError("Network error. Please try again later.");
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <ImageBackground
        style={styles.backgroundImage}
        imageStyle={{ opacity: 0.05 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
              <View style={styles.container}>
                <View style={styles.formCard}>
                  <Text style={styles.logo}>CounsConnect</Text>
                  <Text style={styles.welcomeText}>Create Account</Text>
                  <Text style={styles.subtitle}>Please sign up to get started</Text>
                  
                  {error ? (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Username</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your username (3-30 characters)"
                        placeholderTextColor={"#aaa"}
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email Address</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        placeholderTextColor={"#aaa"}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Create a password (min 6 characters)"
                        placeholderTextColor={"#aaa"}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                      />
                    </View>
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Confirm Password</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm your password"
                        placeholderTextColor={"#aaa"}
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                      />
                    </View>
                  </View>

                  
                  <TouchableOpacity 
                    style={[styles.registerButton, isLoading && styles.disabledButton]}
                    onPress={handleRegister}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.registerButtonText}>Register</Text>
                    )}
                  </TouchableOpacity>
                  
                  <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.divider} />
                  </View>
                  
                  <Text style={styles.loginText}>
                    Already have an account?
                  </Text>
                  <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
                    <Text style={styles.loginNow}>Login now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    alignItems: "center",
  },
  logo: {
    fontSize: 24,
    fontWeight: "900",
    color: '#4361ee',
    marginBottom: 15,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    marginBottom: 25,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 10,
    width: '100%',
    marginBottom: 15,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginLeft: 4,
  },
  inputContainer: {
    backgroundColor: '#f5f7fb',
    borderRadius: 12,
    width: '100%',
  },
  input: {
    width: '100%',
    padding: 16,
    fontSize: 16,
    color: "#333",
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#e4ecff',
    borderWidth: 1,
    borderColor: '#4361ee',
  },
  roleText: {
    fontSize: 16,
    color: '#555',
  },
  roleTextActive: {
    color: '#4361ee',
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: "#4361ee",
    width: "100%",
    padding: 16,
    alignItems: "center",
    borderRadius: 12,
    marginTop: 10,
    shadowColor: '#4361ee',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: "#a5b4fc",
  },
  registerButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
    width: '100%',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    color: '#888',
    paddingHorizontal: 10,
  },
  loginText: {
    color: "#555",
    fontSize: 15,
  },
  loginNow: {
    color: "#4361ee",
    fontWeight: "700",
    fontSize: 16,
    marginTop: 5,
  }
});