import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { format, parse } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

interface UserData {
    id: string;
    username: string;
    email: string;
    created_at: string;
    name?: string;
    phone_number?: string;
    place_of_stay?: string;
    profileCompleted?: boolean;
}

interface ProfileData {
    name: string;
    phone_number: string;
    place_of_stay: string;
}

interface JournalAnalysis {
    "Confidence Score"?: number;
    "Detected Emotion"?: string;
    "Extracted Topic"?: string;
    "Journal Entry"?: string;
    "Personalized Feedback"?: string;
}

interface JournalEntry {
    date: string;
    entry: string;
    analysis?: JournalAnalysis;
    sortDate: Date;
}

const ProfilePage = () => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState<ProfileData>({
        name: '',
        phone_number: '',
        place_of_stay: ''
    });
    const [showProfileForm, setShowProfileForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showJournalModal, setShowJournalModal] = useState(false);
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
    const [loadingJournals, setLoadingJournals] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userToken = await AsyncStorage.getItem('userToken');
                
                if (!userToken) {
                    Alert.alert('Error', 'Authentication token not found');
                    router.replace('/');
                    return;
                }

                const userResponse = await fetch('http://172.20.10.4:8080/api/me', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userToken}`
                    }
                });
                
                if (!userResponse.ok) {
                    throw new Error('Failed to fetch user data');
                }
                
                const fetchedUserData = await userResponse.json();
                
               
                const isProfileComplete = !!fetchedUserData.name;
                
               
                setUserData({
                    ...fetchedUserData,
                    profileCompleted: isProfileComplete
                });
                
               
                if (isProfileComplete) {
                    setProfileData({
                        name: fetchedUserData.name || '',
                        phone_number: fetchedUserData.phone_number || '',
                        place_of_stay: fetchedUserData.place_of_stay || ''
                    });
                }
                
            } catch (error) {
                console.error('Failed to load user data:', error);
                Alert.alert('Error', 'Failed to load profile information');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [router]);

    const handleLogout = async () => {
        try {
            // Delete the user session from API
            const userToken = await AsyncStorage.getItem('userToken');
            if (userToken) {
                await fetch('http://172.20.10.4:8080/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userToken}`
                    }
                });
            }

            // Clear local storage
            await AsyncStorage.removeItem('userData');
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userProfileData');
            router.replace('/');
        } catch (error) {
            console.error('Error logging out:', error);
            Alert.alert('Error', 'Failed to log out');
        }
    };

    const handleProfileChange = (key: keyof ProfileData, value: string) => {
        setProfileData(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const completeProfile = async () => {
        // Basic validation
        if (!profileData.name.trim() || !profileData.phone_number.trim()) {
            Alert.alert('Error', 'Full name and phone number are required');
            return;
        }
        
        try {
            setSubmitting(true);
            
            // Get auth token for API request
            const userToken = await AsyncStorage.getItem('userToken');
            
            if (!userToken) {
                throw new Error('Authentication token not found');
            }
            
            // API call to save profile data
            const response = await fetch('http://172.20.10.4:8080/api/profile/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify({
                    userId: userData?.id,
                    name: profileData.name,
                    phone_number: profileData.phone_number,
                    place_of_stay: profileData.place_of_stay
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update profile on server');
            }
            
            // Update local state to show profile is completed
            setUserData(prev => prev ? {...prev, 
                profileCompleted: true,
                name: profileData.name,
                phone_number: profileData.phone_number,
                place_of_stay: profileData.place_of_stay
            } : null);
            
            // Hide the form
            setShowProfileForm(false);
            
            Alert.alert('Success', 'Your profile has been completed successfully!');
        } catch (error: any) {
            console.error('Error completing profile:', error);
            Alert.alert('Error', error.message || 'Failed to complete profile. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const fetchJournalEntries = async () => {
        setLoadingJournals(true);
        try {
            const keys = await AsyncStorage.getAllKeys();
            const journalKeys = keys.filter(key => key.startsWith('journal_') && !key.includes('analysis'));
            const entriesData = await AsyncStorage.multiGet(journalKeys);
            
            // Create an array to hold all entries with analysis
            const tempEntries: JournalEntry[] = [];
            
            for (const [key, value] of entriesData) {
                if (key && value) {
                    const dateString = key.replace('journal_', '');
                    try {
                        // Attempt to parse the date string
                        const dateObj = parse(dateString, 'MMMM dd, yyyy', new Date());
                        
                        // Check if parsing was successful
                        if (!isNaN(dateObj.getTime())) {
                            // Try to get analysis data for this journal entry
                            const analysisKey = `journal_analysis_${dateString}`;
                            let analysis = undefined;
                            
                            try {
                                const analysisData = await AsyncStorage.getItem(analysisKey);
                                if (analysisData) {
                                    const parsedData = JSON.parse(analysisData);
                                    // Handle both direct object and wrapped in results array
                                    if (parsedData.results && Array.isArray(parsedData.results) && parsedData.results.length > 0) {
                                        analysis = parsedData.results[0];
                                    } else {
                                        analysis = parsedData;
                                    }
                                }
                            } catch (e) {
                                console.warn(`Could not parse analysis for entry: ${dateString}`, e);
                            }
                            
                            tempEntries.push({
                                date: dateString,
                                entry: value,
                                analysis: analysis,
                                sortDate: dateObj
                            });
                        }
                    } catch (e) {
                        console.warn(`Could not parse date from key: ${key}`);
                    }
                }
            }
            
            // Sort entries by date (newest first)
            const sortedEntries = tempEntries.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
            setJournalEntries(sortedEntries);
            
        } catch (error) {
            console.error('Failed to fetch journal entries:', error);
            Alert.alert('Error', 'Could not load journal entries.');
        } finally {
            setLoadingJournals(false);
        }
    };

    const handleViewJournals = () => {
        fetchJournalEntries();
        setShowJournalModal(true);
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMMM dd, yyyy');
        } catch {
            return dateString; // Return original string if formatting fails
        }
    };

    const getEmotionEmoji = (emotion: string | undefined) => {
        if (!emotion) return '';
        
        const lowercaseEmotion = emotion.toLowerCase();
        if (lowercaseEmotion.includes('joy') || lowercaseEmotion.includes('happiness')) return '😊';
        if (lowercaseEmotion.includes('sadness') || lowercaseEmotion.includes('sad')) return '😔';
        if (lowercaseEmotion.includes('anger') || lowercaseEmotion.includes('angry')) return '😠';
        if (lowercaseEmotion.includes('fear') || lowercaseEmotion.includes('anxious')) return '😨';
        if (lowercaseEmotion.includes('surprise')) return '😲';
        if (lowercaseEmotion.includes('disgust')) return '🤢';
        if (lowercaseEmotion.includes('neutral')) return '😐';
        return '';
    };

    const getEmotionColor = (emotion: string | undefined) => {
        if (!emotion) return '#3498db'; // Default blue
        
        const lowercaseEmotion = emotion.toLowerCase();
        if (lowercaseEmotion.includes('joy') || lowercaseEmotion.includes('happiness')) return '#2ecc71'; // Green
        if (lowercaseEmotion.includes('sadness') || lowercaseEmotion.includes('sad')) return '#3498db'; // Blue
        if (lowercaseEmotion.includes('anger') || lowercaseEmotion.includes('angry')) return '#e74c3c'; // Red
        if (lowercaseEmotion.includes('fear') || lowercaseEmotion.includes('anxious')) return '#9b59b6'; // Purple
        if (lowercaseEmotion.includes('surprise')) return '#f39c12'; // Orange
        if (lowercaseEmotion.includes('disgust')) return '#27ae60'; // Green
        if (lowercaseEmotion.includes('neutral')) return '#7f8c8d'; // Gray
        return '#3498db'; // Default blue
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <LinearGradient 
                colors={['#6366f1', '#8b5cf6']} 
                style={styles.header}
            >
                {userData && (
                    <View style={styles.headerContent}>
                        <View style={styles.avatarContainer}>
                            <Text style={styles.avatarText}>
                                {userData.username.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <Text style={styles.headerName}>
                            {userData.name || userData.username}
                        </Text>
                        <Text style={styles.headerRole}>
                            Member since {formatDate(userData.created_at)}
                        </Text>
                    </View>
                )}
            </LinearGradient>

            <View style={styles.profileCard}>
                <Text style={styles.sectionTitle}>Account Information</Text>
                
                {userData ? (
                    <View style={styles.profileInfo}>
                        <View style={styles.infoSection}>
                            <View style={styles.infoRow}>
                                <View style={styles.infoIconContainer}>
                                    <Text style={styles.infoIcon}>👤</Text>
                                </View>
                                <View style={styles.infoTextContainer}>
                                    <Text style={styles.infoLabel}>Username</Text>
                                    <Text style={styles.infoValue}>{userData.username}</Text>
                                </View>
                            </View>
                            
                            <View style={styles.infoRow}>
                                <View style={styles.infoIconContainer}>
                                    <Text style={styles.infoIcon}>📧</Text>
                                </View>
                                <View style={styles.infoTextContainer}>
                                    <Text style={styles.infoLabel}>Email</Text>
                                    <Text style={styles.infoValue}>{userData.email}</Text>
                                </View>
                            </View>
                            
                            {userData.name && (
                                <View style={styles.infoRow}>
                                    <View style={styles.infoIconContainer}>
                                        <Text style={styles.infoIcon}>📝</Text>
                                    </View>
                                    <View style={styles.infoTextContainer}>
                                        <Text style={styles.infoLabel}>Full Name</Text>
                                        <Text style={styles.infoValue}>{userData.name}</Text>
                                    </View>
                                </View>
                            )}
                            
                            {userData.phone_number && (
                                <View style={styles.infoRow}>
                                    <View style={styles.infoIconContainer}>
                                        <Text style={styles.infoIcon}>📱</Text>
                                    </View>
                                    <View style={styles.infoTextContainer}>
                                        <Text style={styles.infoLabel}>Phone</Text>
                                        <Text style={styles.infoValue}>{userData.phone_number}</Text>
                                    </View>
                                </View>
                            )}

                            {userData.place_of_stay && (
                                <View style={styles.infoRow}>
                                    <View style={styles.infoIconContainer}>
                                        <Text style={styles.infoIcon}>🏠</Text>
                                    </View>
                                    <View style={styles.infoTextContainer}>
                                        <Text style={styles.infoLabel}>Address</Text>
                                        <Text style={styles.infoValue}>{userData.place_of_stay}</Text>
                                    </View>
                                </View>
                            )}
                            
                        </View>
                    </View>
                ) : (
                    <View style={styles.noDataContainer}>
                        <Text style={styles.noDataText}>No profile data available</Text>
                    </View>
                )}
            </View>

            <View style={styles.actionCards}>
                {/* Complete Profile Button */}
                {userData && !userData.profileCompleted && !showProfileForm && (
                    <TouchableOpacity 
                        style={styles.actionCard}
                        onPress={() => setShowProfileForm(true)}
                    >
                        <View style={[styles.actionIconContainer, styles.completeProfileIcon]}>
                            <Text style={styles.actionIcon}>✏️</Text>
                        </View>
                        <Text style={styles.actionTitle}>Complete Profile</Text>
                        <Text style={styles.actionDescription}>
                            Fill in your personal information
                        </Text>
                    </TouchableOpacity>
                )}

                {/* View Journal Entries Button */}
                <TouchableOpacity 
                    style={styles.actionCard}
                    onPress={handleViewJournals}
                >
                    <View style={[styles.actionIconContainer, styles.journalIcon]}>
                        <Text style={styles.actionIcon}>📔</Text>
                    </View>
                    <Text style={styles.actionTitle}>Journal Entries</Text>
                    
                </TouchableOpacity>

                {/* Logout Button */}
                <TouchableOpacity 
                    style={[styles.actionCard, styles.logoutCard]}
                    onPress={handleLogout}
                >
                    <View style={[styles.actionIconContainer, styles.logoutIcon]}>
                        <Text style={styles.actionIcon}>🚪</Text>
                    </View>
                    <Text style={styles.actionTitle}>Logout</Text>
                    
                </TouchableOpacity>
            </View>
            
            {/* Complete Profile Modal */}
            <Modal
                visible={showProfileForm}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowProfileForm(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView contentContainerStyle={styles.formScroll}>
                            <Text style={styles.modalTitle}>Complete Your Profile</Text>
                            
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Full Name*</Text>
                                <TextInput
                                    style={styles.formInput}
                                    value={profileData.name}
                                    onChangeText={(text) => handleProfileChange('name', text)}
                                    placeholder="Enter your full name"
                                />
                            </View>
                            
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Phone Number*</Text>
                                <TextInput
                                    style={styles.formInput}
                                    value={profileData.phone_number}
                                    onChangeText={(text) => handleProfileChange('phone_number', text)}
                                    placeholder="Enter your phone number"
                                    keyboardType="phone-pad"
                                />
                            </View>
                            
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Address</Text>
                                <TextInput
                                    style={[styles.formInput, styles.textArea]}
                                    value={profileData.place_of_stay}
                                    onChangeText={(text) => handleProfileChange('place_of_stay', text)}
                                    placeholder="Enter your address"
                                    multiline
                                />
                            </View>
                            
                            <View style={styles.buttonRow}>
                                <TouchableOpacity 
                                    style={[styles.modalButton, styles.cancelButton]} 
                                    onPress={() => setShowProfileForm(false)}
                                    disabled={submitting}
                                >
                                    <Text style={styles.buttonText}>Cancel</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[styles.modalButton, styles.saveButton, submitting && styles.disabledButton]} 
                                    onPress={completeProfile}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={styles.buttonText}>Save Profile</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* View Journal Entries Modal */}
            <Modal
                visible={showJournalModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowJournalModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.journalModalContent}>
                        <Text style={styles.modalTitle}>Journal Entries</Text>
                        {loadingJournals ? (
                            <ActivityIndicator size="large" color="#6366f1" />
                        ) : journalEntries.length > 0 ? (
                            <FlatList
                                data={journalEntries}
                                keyExtractor={(item) => item.date}
                                renderItem={({ item }) => (
                                    <View style={styles.journalEntryContainer}>
                                        {/* Journal Entry Header with Date */}
                                        <LinearGradient
                                            colors={['#6366f1', '#8b5cf6']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.journalHeader}
                                        >
                                            <Text style={styles.journalDate}>{item.date}</Text>
                                        </LinearGradient>
                                        
                                        {/* Journal Entry Content */}
                                        <View style={styles.journalContentContainer}>
                                            <Text style={styles.journalText}>{item.entry}</Text>
                                        </View>
                                        
                                        {/* Analysis Section */}
                                        {item.analysis && (
                                            <View style={styles.analysisContainer}>
                                                <View style={styles.analysisHeaderRow}>
                                                    <Text style={styles.analysisHeader}>Journal Analysis</Text>
                                                    {item.analysis["Confidence Score"] && (
                                                        <View style={styles.confidenceBox}>
                                                            <Text style={styles.confidenceText}>
                                                                {Math.round(item.analysis["Confidence Score"] * 100)}%
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                                
                                                <View style={styles.detailsContainer}>
                                                    {item.analysis["Detected Emotion"] && (
                                                        <View style={styles.analysisItem}>
                                                            <Text style={styles.analysisLabel}>
                                                                Emotion:
                                                            </Text>
                                                            <View style={[
                                                                styles.emotionBadge, 
                                                                { backgroundColor: getEmotionColor(item.analysis["Detected Emotion"]) }
                                                            ]}>
                                                                <Text style={styles.emotionBadgeText}>
                                                                    {item.analysis["Detected Emotion"]}
                                                                </Text>
                                                                <Text style={styles.emotionEmoji}>
                                                                    {getEmotionEmoji(item.analysis["Detected Emotion"])}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    )}
                                                    
                                                    {item.analysis["Extracted Topic"] && (
                                                        <View style={styles.analysisItem}>
                                                            <Text style={styles.analysisLabel}>
                                                                Topic:
                                                            </Text>
                                                            <View style={styles.topicBadge}>
                                                                <Text style={styles.topicText}>
                                                                    {item.analysis["Extracted Topic"]}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    )}
                                                </View>
                                                
                                                {item.analysis["Personalized Feedback"] && (
                                                    <View style={styles.feedbackContainer}>
                                                        <Text style={styles.feedbackHeader}>Feedback:</Text>
                                                        <Text style={styles.feedbackText}>
                                                            {item.analysis["Personalized Feedback"]}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                )}
                                style={styles.journalList}
                            />
                        ) : (
                            <Text style={styles.noJournalText}>No journal entries found.</Text>
                        )}
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.closeButton]} 
                            onPress={() => setShowJournalModal(false)}
                        >
                            <Text style={styles.buttonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    contentContainer: {
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingTop: 40,
        paddingBottom: 30,
        paddingHorizontal: 20,
    },
    headerContent: {
        alignItems: 'center',
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    avatarText: {
        fontSize: 40,
        color: 'white',
        fontWeight: 'bold',
    },
    headerName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    headerRole: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 15,
    },
    profileCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        margin: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    profileInfo: {
        width: '100%',
    },
    infoSection: {
        width: '100%',
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 18,
        alignItems: 'center',
    },
    infoIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    infoIcon: {
        fontSize: 20,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        color: '#1f2937',
        fontWeight: '500',
    },
    infoValueSmall: {
        fontSize: 14,
        color: '#4b5563',
        fontStyle: 'italic',
    },
    actionCards: {
        padding: 16,
        paddingTop: 0,
    },
    actionCard: {
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        alignItems: 'center',
    },
    actionIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    completeProfileIcon: {
        backgroundColor: '#e0f2fe',
    },
    journalIcon: {
        backgroundColor: '#f0fdf4',
    },
    logoutIcon: {
        backgroundColor: '#fef2f2',
    },
    actionIcon: {
        fontSize: 24,
    },
    actionTitle: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 2,
        color: '#1f2937',
    },
    actionDescription: {
        fontSize: 13,
        color: '#6b7280',
        flex: 1,
    },
    logoutCard: {
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    noDataContainer: {
        padding: 20,
        alignItems: 'center',
    },
    noDataText: {
        fontSize: 16,
        color: '#6b7280',
        fontStyle: 'italic',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        width: '100%',
        maxHeight: '80%',
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 5,
    },
    journalModalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        width: '95%',
        maxHeight: '90%',
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
        color: '#1f2937',
    },
    formScroll: {
        paddingBottom: 20,
    },
    formGroup: {
        marginBottom: 18,
    },
    formLabel: {
        fontSize: 14,
        color: '#4b5563',
        marginBottom: 8,
        fontWeight: '500',
    },
    formInput: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9fafb',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
    },
    modalButton: {
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        minWidth: 120,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    cancelButton: {
        backgroundColor: '#e5e7eb',
        marginRight: 10,
    },
    saveButton: {
        backgroundColor: '#6366f1',
    },
    closeButton: {
        backgroundColor: '#6366f1',
        marginTop: 20,
        width: '100%',
    },
    disabledButton: {
        backgroundColor: '#c7d2fe',
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    journalList: {
        width: '100%',
        marginBottom: 10,
    },
    journalEntryContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    journalHeader: {
        padding: 16,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    journalDate: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    journalContentContainer: {
        padding: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        backgroundColor: '#fff',
    },
    journalText: {
        fontSize: 15,
        color: '#334155',
        lineHeight: 24,
    },
    noJournalText: {
        fontSize: 16,
        color: '#6b7280',
        marginTop: 20,
        marginBottom: 20,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    analysisContainer: {
        padding: 18,
        backgroundColor: '#f8fafc',
    },
    analysisHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 12,
    },
    analysisHeader: {
        fontSize: 17,
        fontWeight: '700',
        color: '#334155',
    },
    confidenceBox: {
        backgroundColor: '#6366f1',
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 10,
    },
    confidenceText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 13,
    },
    detailsContainer: {
        marginBottom: 16,
    },
    analysisItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    analysisLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#475569',
        flex: 0.3,
    },
    emotionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        flex: 0.7,
        justifyContent: 'center',
    },
    emotionBadgeText: {
        color: 'white',
        fontWeight: '600',
        marginRight: 6,
        fontSize: 14,
    },
    emotionEmoji: {
        fontSize: 18,
    },
    topicBadge: {
        backgroundColor: '#f1f5f9',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 20,
        flex: 0.7,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    topicText: {
        color: '#6366f1',
        fontWeight: '600',
        fontSize: 14,
    },
    feedbackContainer: {
        backgroundColor: '#f0f9ff',
        borderRadius: 12,
        padding: 16,
        marginTop: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#6366f1',
    },
    feedbackHeader: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e40af',
        marginBottom: 8,
    },
    feedbackText: {
        fontSize: 14,
        color: '#334155',
        lineHeight: 22,
    },
});

export default ProfilePage;