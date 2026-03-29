import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Image, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const Home = () => {
    const router = useRouter();
    const [username, setUsername] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        const fetchUsername = async () => {
            try {
                const userData = await AsyncStorage.getItem('userData');
                if (userData !== null) {
                    const parsedUserData = JSON.parse(userData);
                    setUsername(parsedUserData.username || 'Guest');
                } else {
                    // Try to get just the username if userData is not available
                    const storedUsername = await AsyncStorage.getItem('username');
                    if (storedUsername !== null) {
                        setUsername(storedUsername);
                    } else {
                        setUsername('Guest');
                    }
                }
                
            } catch (error) {
                console.error('Error fetching username:', error);
                setUsername('Guest');
            } finally {
                setLoading(false);
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }).start();
            }
        };

        fetchUsername();
    }, []);

    const navigateToProfile = () => {
        router.push("/(main)/profile");
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#4c669f', '#3b5998', '#192f6a']}
                style={styles.backgroundGradient}
            />
            
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.logoContainer}>
                    <Text style={styles.logoText}>CounsConnect</Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={navigateToProfile} style={styles.profileButton}>
                    <Ionicons name="person-circle" size={28} color="#fff" />
                </TouchableOpacity>
            </View>
            
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                <View style={styles.card}>
                    <View style={styles.header}>
                        {loading ? (
                            <Text style={styles.welcomeText}>Loading...</Text>
                        ) : (
                            <>
                                <Text style={styles.greetingText}>Hello,</Text>
                                <Text style={styles.welcomeText}>{username}!</Text>
                                <Text style={styles.subtitleText}>What would you like to do today?</Text>
                            </>
                        )}
                    </View>
                    
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.featureButton} onPress={() => router.push("/(main)/journal")}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="stats-chart" size={24} color="#fff" />
                            </View>
                            <Text style={styles.buttonText}>Journal</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.featureButton} onPress={() => router.push("/(main)/profile")}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="settings-sharp" size={24} color="#fff" />
                            </View>
                            <Text style={styles.buttonText}>Settings</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.featureButton} onPress={() => router.push("/(main)/home")}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="notifications" size={24} color="#fff" />
                            </View>
                            <Text style={styles.buttonText}>Notifications</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.featureButton} onPress={() => router.push("/(main)/chatbot")}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="help-circle" size={24} color="#fff" />
                            </View>
                            <Text style={styles.buttonText}>Help</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.quickAccess}>
                    <Text style={styles.sectionTitle}>Quick Access</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickAccessScroll}>
                        {['Recent', 'Favorites', 'Trending', 'New'].map((item, index) => (
                            <TouchableOpacity key={index} style={styles.quickAccessItem}>
                                <Text style={styles.quickAccessText}>{item}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </Animated.View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    topBar: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    profileButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    greetingText: {
        fontSize: 18,
        color: '#555',
        marginBottom: 5,
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#192f6a',
        marginBottom: 5,
    },
    subtitleText: {
        fontSize: 16,
        color: '#666',
        marginTop: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 15,
    },
    featureButton: {
        backgroundColor: '#3b5998',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        width: '47%',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    iconContainer: {
        marginBottom: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    quickAccess: {
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    quickAccessScroll: {
        flexDirection: 'row',
    },
    quickAccessItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        marginRight: 10,
    },
    quickAccessText: {
        color: '#fff',
        fontWeight: '500',
    },
});

export default Home;
