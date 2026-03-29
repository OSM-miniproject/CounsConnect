import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Keyboard, 
  TouchableWithoutFeedback, 
  Modal, 
  ActivityIndicator, 
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

// API configuration
const API_BASE_URL = 'http://172.20.10.4:8080/api';

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSocial, setSelectedSocial] = useState<string | null>(null);
  const [forgotPasswordModalVisible, setForgotPasswordModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  interface SocialLoginProps {
    platform: string;
  }

  const handleSocialLogin = (platform: SocialLoginProps['platform']): void => {
    setSelectedSocial(platform);
    setModalVisible(true);
  };

  const handleForgotPassword = () => {
    setForgotPasswordModalVisible(true);
    setResetEmail(email); // Pre-fill with current email if available
  };

  const handleResetPassword = () => {
    // Logic for password reset would go here
    setForgotPasswordModalVisible(false);
    // You might want to show a confirmation message or other feedback here
  };

  const handleLogin = async () => {
    // Reset previous errors
    setError("");
    
    // Validate inputs
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || "Login failed. Please check your credentials.");
        return;
      }
      
      // Store the authentication token
      await AsyncStorage.setItem('userToken', data.token);
      
      // Store user information
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      
      // Navigate to home screen
      router.replace("/(main)/home");
      
    } catch (err) {
      setError("Network error. Please try again later.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9faff" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={true}>
          <LinearGradient
            colors={['#f9faff', '#eef2ff']}
            style={styles.container}
          >
            <View style={styles.headerSection}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['#4f78ff', '#3b5fe3']}
                  style={styles.logoGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Image 
                    source={{ uri: "https://via.placeholder.com/100" }} 
                    style={styles.image} 
                  />
                </LinearGradient>
              </View>
              <Text style={styles.welcomeText}>Welcome Back</Text>
              <Text style={styles.subText}>Sign in to continue your journey</Text>
            </View>
            
            {error ? (
              <View style={styles.errorContainer}>
                <FontAwesome name="exclamation-circle" size={18} color="#ff4d4d" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            
            <View style={styles.formContainer}>
              <View style={styles.inputWrapper}>
                <FontAwesome name="envelope-o" size={18} color="#8e9aaf" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor={"#8e9aaf"}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputWrapper}>
                <FontAwesome name="lock" size={20} color="#8e9aaf" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={"#8e9aaf"}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <FontAwesome name={showPassword ? "eye" : "eye-slash"} size={18} color="#8e9aaf" />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordContainer}>
                <Text style={styles.forgotPassword}>Forgot password?</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.loginButton, isLoading && styles.disabledButton]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#4f78ff', '#3b5fe3']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Sign In</Text>
                      <FontAwesome name="arrow-right" size={16} color="white" style={styles.arrowIcon} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
            
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.orContinue}>Or continue with</Text>
              <View style={styles.divider} />
            </View>
            
            <View style={styles.socialContainer}>
              <TouchableOpacity 
                style={[styles.socialButton, styles.googleButton]} 
                onPress={() => handleSocialLogin("Google")}
              >
                <FontAwesome name="google" size={20} color="#E94235" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.socialButton, styles.appleButton]} 
                onPress={() => handleSocialLogin("Apple")}
              >
                <FontAwesome name="apple" size={22} color="#000000" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.socialButton, styles.facebookButton]} 
                onPress={() => handleSocialLogin("Facebook")}
              >
                <FontAwesome name="facebook" size={22} color="#1877F2" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Not a member? </Text>
              <TouchableOpacity onPress={() => router.replace("/(auth)/register")}>
                <Text style={styles.registerNow}>Register now</Text>
              </TouchableOpacity>
            </View>

            {/* Social Login Modal */}
            <Modal
              animationType="fade"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
            >
              <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                  <TouchableWithoutFeedback>
                    <View style={styles.modalContent}>
                      <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{selectedSocial} Login</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                          <FontAwesome name="times" size={22} color="#8e9aaf" />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.modalText}>
                        You're logging in with {selectedSocial}. This functionality is being implemented.
                      </Text>
                      <TouchableOpacity 
                        style={styles.modalButton}
                        onPress={() => setModalVisible(false)}
                      >
                        <Text style={styles.modalButtonText}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>

            {/* Forgot Password Modal */}
            <Modal
              animationType="fade"
              transparent={true}
              visible={forgotPasswordModalVisible}
              onRequestClose={() => setForgotPasswordModalVisible(false)}
            >
              <TouchableWithoutFeedback onPress={() => setForgotPasswordModalVisible(false)}>
                <View style={styles.modalOverlay}>
                  <TouchableWithoutFeedback>
                    <View style={styles.modalContent}>
                      <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Forgot Password</Text>
                        <TouchableOpacity onPress={() => setForgotPasswordModalVisible(false)}>
                          <FontAwesome name="times" size={22} color="#8e9aaf" />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.modalText}>
                        Enter your email address and we'll send you a link to reset your password.
                      </Text>
                      <View style={styles.modalInputWrapper}>
                        <FontAwesome name="envelope-o" size={18} color="#8e9aaf" style={styles.inputIcon} />
                        <TextInput
                          style={styles.modalInput}
                          placeholder="Email Address"
                          placeholderTextColor={"#8e9aaf"}
                          value={resetEmail}
                          onChangeText={setResetEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </View>
                      <View style={styles.modalButtonsContainer}>
                        <TouchableOpacity 
                          style={[styles.modalButton, styles.cancelButton]}
                          onPress={() => setForgotPasswordModalVisible(false)}
                        >
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.modalButton}
                          onPress={handleResetPassword}
                        >
                          <LinearGradient
                            colors={['#4f78ff', '#3b5fe3']}
                            style={styles.buttonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                          >
                            <Text style={styles.modalButtonText}>Reset Password</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          </LinearGradient>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9faff",
  },
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 20,
  },
  logoContainer: {
    marginBottom: 16,
    shadowColor: "#4f78ff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  logoGradient: {
    borderRadius: 25,
    padding: 3,
    overflow: 'hidden',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 22,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  subText: {
    fontSize: 16,
    color: "#8e9aaf",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffe8e8",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#ff4d4d',
    marginLeft: 8,
    flex: 1,
  },
  formContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 14,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 58,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#333",
    fontSize: 16,
    height: "100%",
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPassword: {
    color: "#3b5fe3",
    fontWeight: "600",
    fontSize: 15,
  },
  loginButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: "#4f78ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    width: "100%",
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 17,
  },
  arrowIcon: {
    marginLeft: 8,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#dde1ed",
  },
  orContinue: {
    paddingHorizontal: 16,
    color: "#8e9aaf",
    fontWeight: "500",
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 32,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  googleButton: {
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  appleButton: {
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  facebookButton: {
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerText: {
    color: "#8e9aaf",
    fontSize: 15,
  },
  registerNow: {
    color: "#3b5fe3",
    fontWeight: "600",
    fontSize: 15,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: width * 0.85,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  modalText: {
    marginBottom: 24,
    fontSize: 15,
    lineHeight: 22,
    color: '#666',
  },
  modalInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f6f8ff",
    borderRadius: 14,
    marginBottom: 24,
    paddingHorizontal: 16,
    height: 58,
  },
  modalInput: {
    flex: 1,
    color: "#333",
    fontSize: 16,
    height: "100%",
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#dde1ed",
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    height: 58,
  },
  cancelButtonText: {
    color: '#8e9aaf',
    fontWeight: '600',
    fontSize: 16,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  }
});