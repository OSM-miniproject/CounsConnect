import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";

export default function MainLayout() {
    return (
        <Tabs
            screenOptions={{
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: "#007AFF",
            tabBarInactiveTintColor: "#8E8E93",
            headerShown: false,
            }}
        >
            <Tabs.Screen
            name="home"
            options={{
                title: "Home",
                tabBarIcon: ({ color, size }) => (
                <Ionicons name="home-outline" size={size} color={color} />
                ),
            }}
            />
            <Tabs.Screen
            name="schedule"
            options={{
                title: "Schedule",
                tabBarIcon: ({ color, size }) => (
                <Ionicons name="calendar-outline" size={size} color={color} />
                ),
            }}
            />
            <Tabs.Screen
            name="chatbot"
            options={{
                title: "Chatbot",
                tabBarIcon: ({ color, size }) => (
                <Ionicons name="chatbubble-outline" size={size} color={color} />
                ),
            }}
            />
            <Tabs.Screen
            name="journal"
            options={{
              title: "Journal",
              tabBarIcon: ({color, size}) => (
                <Ionicons name="book-outline" size={size} color={color} />
              ),
            }}
              />
            <Tabs.Screen
            name="profile"
            options={{
                title: "Profile",
                tabBarIcon: ({ color, size }) => (
                <Ionicons name="person-outline" size={size} color={color} />
                ),
            }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#E0E0E0",
        height: 60,
        paddingBottom: 5,
        paddingTop: 5,
        elevation: 8,
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
    },
});