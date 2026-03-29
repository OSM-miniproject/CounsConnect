import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Alert,
    Dimensions,
    ActivityIndicator,
    StatusBar,
    Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const JournalScreen = () => {
    const [entry, setEntry] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const todayDate = format(new Date(), 'MMMM dd, yyyy');
    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        const loadEntry = async () => {
            try {
                const savedEntry = await AsyncStorage.getItem(`journal_${todayDate}`);
                if (savedEntry !== null) {
                    setEntry(savedEntry);
                }
            } catch (error) {
                console.error('Failed to load journal entry:', error);
            }
        };
        loadEntry();
        
        // Fade in animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true
        }).start();
    }, [todayDate]);

    const handleSaveEntry = async () => {
        if (!entry.trim()) {
            Alert.alert('Empty Entry', 'Please write something before saving.');
            return;
        }

        setIsSaving(true);
        try {
            // Save locally
            await AsyncStorage.setItem(`journal_${todayDate}`, entry);

            // Send to API
            const response = await fetch('https://f39a-35-188-213-28.ngrok-free.app/analyze_journals', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ journals: [entry] }),
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error('API returned:', errText);
                throw new Error(`API error: ${response.status}`);
            }

            const result = await response.json();
            console.log('API Response:', result);

            // Save API response locally
            await AsyncStorage.setItem(`journal_analysis_${todayDate}`, JSON.stringify(result));

            Alert.alert('Saved', 'Your journal entry has been saved and analyzed.');
        } catch (error) {
            console.error('Error saving journal entry:', error);
            Alert.alert('Error', 'Could not save or analyze your entry. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Ionicons name="book-outline" size={28} color="#4a6da7" />
                        <Text style={styles.headerText}>Daily Journal</Text>
                    </View>
                    <View style={styles.dateContainer}>
                        <Ionicons name="calendar-outline" size={18} color="#666" style={styles.dateIcon} />
                        <Text style={styles.dateText}>{todayDate}</Text>
                    </View>
                </View>
                
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoidingContainer}
                >
                    <ScrollView contentContainerStyle={styles.scrollContainer}>
                        <Animated.View style={[styles.journalCard, { opacity: fadeAnim }]}>
                            <View style={styles.promptContainer}>
                                <Text style={styles.promptText}>
                                    How was your day? Write down your thoughts...
                                </Text>
                            </View>
                            
                            <TextInput
                                style={styles.textArea}
                                value={entry}
                                onChangeText={setEntry}
                                placeholder=""
                                placeholderTextColor="#bebebe"
                                multiline
                                numberOfLines={15}
                                textAlignVertical="top"
                            />
                            
                            <TouchableOpacity
                                style={[styles.saveButton, isSaving && styles.disabledButton]}
                                onPress={handleSaveEntry}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <View style={styles.buttonContent}>
                                        <Ionicons name="save-outline" size={20} color="#fff" style={styles.saveIcon} />
                                        <Text style={styles.saveButtonText}>
                                            Save Entry
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
                
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Journal entries are analyzed to track your mood over time
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    header: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e8e8e8',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 3,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 12,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateIcon: {
        marginRight: 8,
    },
    dateText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    keyboardAvoidingContainer: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
    },
    journalCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 20,
    },
    promptContainer: {
        marginBottom: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    promptText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#4a6da7',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    textArea: {
        flex: 1,
        minHeight: 300,
        backgroundColor: '#fbfbfb',
        borderRadius: 12,
        padding: 18,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        color: '#333',
        marginBottom: 20,
        lineHeight: 24,
    },
    saveButton: {
        backgroundColor: '#4a6da7',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#4a6da7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveIcon: {
        marginRight: 10,
    },
    disabledButton: {
        backgroundColor: '#a0b4d6',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        padding: 16,
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    footerText: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
    }
});

export default JournalScreen;