import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, StatusBar, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function HomePage() {
  const router = useRouter();

  return (
    <>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <ImageBackground
          source={{ uri: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&auto=format&fit=crop" }}
          style={styles.backgroundImage}
        >
          <View style={styles.overlay} />
          <View style={styles.container}>
            <View style={styles.contentContainer}>
              <Text style={styles.welcomeText}>Welcome</Text>
              <Text style={styles.subtitle}>Begin your journey with us</Text>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.loginButton}
                  activeOpacity={0.8}
                  onPress={() => router.push("/(auth)/login")}
                >
                  <LinearGradient
                    colors={['#4f78ff', '#3b5fe3']}
                    style={styles.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.buttonText}>Login</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.registerButton}
                  activeOpacity={0.8}
                  onPress={() => router.push("/(auth)/register")}
                >
                  <Text style={styles.registerButtonText}>Register</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ImageBackground>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  container: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 24,
  },
  contentContainer: {
    marginBottom: 60,
  },
  welcomeText: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#e0e0e0",
    marginBottom: 40,
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
  },
  loginButton: {
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#4f78ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  registerButton: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ffffff",
    borderRadius: 12,
  },
  registerButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  }
});