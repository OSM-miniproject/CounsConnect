import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image,
    SafeAreaView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TaskComponent from '../../components/Task';

const BASE_TIME_SLOTS = [
    "9:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "1:00 PM - 2:00 PM",
    "2:00 PM - 3:00 PM",
    "3:00 PM - 4:00 PM",
    "4:00 PM - 5:00 PM",
];

const PAYMENT_LABELS = {
    'card': 'Credit/Debit Card',
    'bank': 'Bank Transfer',
    'insurance': 'Insurance'
};

const COUNSELOR_DATA = [
    {
        id: '1',
        name: 'Dr. Sarah Johnson',
        specialization: 'Anxiety & Depression',
        experience: '8 years',
        rating: 4.8,
        imageUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
        bio: 'Specializes in cognitive behavioral therapy with focus on anxiety and depression management.',
        availability: true,
    },
    {
        id: '2',
        name: 'Dr. Michael Chen',
        specialization: 'Relationship Counseling',
        experience: '10 years',
        rating: 4.9,
        imageUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
        bio: 'Expert in couples therapy and relationship counseling with a compassionate approach.',
        availability: true,
    },
    {
        id: '3',
        name: 'Dr. Jessica Martinez',
        specialization: 'Stress Management',
        experience: '6 years',
        rating: 4.7,
        imageUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
        bio: 'Focused on helping clients develop healthy coping mechanisms for stress and burnout.',
        availability: true,
    },
    {
        id: '4',
        name: 'Dr. James Wilson',
        specialization: 'Trauma & PTSD',
        experience: '12 years',
        rating: 4.9,
        imageUrl: 'https://randomuser.me/api/portraits/men/46.jpg',
        bio: 'Specialized in trauma-focused therapy and PTSD recovery techniques.',
        availability: false,
    }
];

const PAYMENT_METHODS = [
    {
        id: 'card',
        name: 'Credit/Debit Card',
        icon: 'card-outline',
    },
    {
        id: 'bank',
        name: 'Bank Transfer',
        icon: 'wallet-outline',
    },
    {
        id: 'insurance',
        name: 'Insurance',
        icon: 'medkit-outline',
    }
];

interface Counselor {
    id: string;
    name: string;
    specialization: string;
    experience: string;
    rating: number;
    imageUrl: string;
    bio: string;
    availability: boolean;
}

interface PaymentMethod {
    id: string;
    name: string;
    icon: string;
}

const ScheduleScreen = () => {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    
    const [counselors, setCounselors] = useState<Counselor[]>([]);
    const [selectedCounselor, setSelectedCounselor] = useState<string | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
    
    const [reason, setReason] = useState('');
    const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [availableDates, setAvailableDates] = useState<{ value: string; label: string; }[]>([]);
    const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [isSchedulingComplete, setIsSchedulingComplete] = useState(false);

    useEffect(() => {
        const loadData = () => {
            setTimeout(() => {
                setCounselors(COUNSELOR_DATA);
                setLoading(false);
            }, 1000);
        };
        
        loadData();
    }, []);

    useEffect(() => {
        if (currentStep === 2) {
            const dates = [];
            const today = new Date();
            
            for (let i = 0; i < 4; i++) {
                const date = new Date();
                date.setDate(today.getDate() + i);
                const formattedDate = date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                });
                dates.push({
                    value: date.toISOString().split('T')[0],
                    label: i === 0 ? `Today (${formattedDate})` : formattedDate
                });
            }
            
            setAvailableDates(dates);
            if (dates.length > 0) {
                setSelectedDate(dates[0].value);
            }
        }
    }, [currentStep]);

    useEffect(() => {
        if (!selectedDate) return;

        const today = new Date().toISOString().split('T')[0];
        const isToday = selectedDate === today;
        
        if (isToday) {
            const currentHour = new Date().getHours();
            const currentMinutes = new Date().getMinutes();
            
            const filteredSlots = BASE_TIME_SLOTS.filter(slot => {
                const slotHour = parseInt(slot.split(':')[0]);
                let adjustedSlotHour = slotHour;
                
                if (slot.includes('PM') && slotHour !== 12) {
                    adjustedSlotHour += 12;
                }
                if (slot.includes('AM') && slotHour === 12) {
                    adjustedSlotHour = 0;
                }
                
                return adjustedSlotHour > currentHour || 
                       (adjustedSlotHour === currentHour && currentMinutes < 30);
            });
            
            setAvailableTimeSlots(filteredSlots);
        } else {
            setAvailableTimeSlots([...BASE_TIME_SLOTS]);
        }
        
        setSelectedTimeSlot('');
    }, [selectedDate]);

    const handleContinueToScheduling = () => {
        if (!selectedCounselor) {
            Alert.alert('Selection Required', 'Please select a counselor');
            return;
        }

        if (!selectedPayment) {
            Alert.alert('Selection Required', 'Please select a payment method');
            return;
        }

        setCurrentStep(2);
    };

    const handleSubmitScheduling = async () => {
        if (!reason.trim()) {
            setError('Please enter a reason for the meeting');
            return;
        }

        if (!selectedTimeSlot) {
            setError('Please select a time slot');
            return;
        }

        if (!selectedDate) {
            setError('Please select a date');
            return;
        }

        setError('');
        setSubmitting(true);

        try {
            const userToken = await AsyncStorage.getItem('userToken');
            
            if (!userToken) {
                Alert.alert('Error', 'You must be logged in to schedule a meeting');
                router.replace('/(auth)/login');
                return;
            }

            setTimeout(() => {
                const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long', 
                    day: 'numeric'
                });
                
                const counselorInfo = counselors.find(c => c.id === selectedCounselor);
                const paymentMethodInfo = PAYMENT_METHODS.find(p => p.id === selectedPayment);
                
                setIsSchedulingComplete(true);
                setSubmitting(false);
            }, 1000);

        } catch (err) {
            console.error('Scheduling error:', err);
            setError('Failed to schedule meeting. Please try again later.');
            setSubmitting(false);
        }
    };

    const goBackToSelection = () => {
        setCurrentStep(1);
    };

    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(
                    <Ionicons key={`star-${i}`} name="star" size={16} color="#FFD700" />
                );
            } else if (i === fullStars && halfStar) {
                stars.push(
                    <Ionicons key={`star-${i}`} name="star-half" size={16} color="#FFD700" />
                );
            } else {
                stars.push(
                    <Ionicons key={`star-${i}`} name="star-outline" size={16} color="#FFD700" />
                );
            }
        }

        return stars;
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4a6da7" />
                <Text style={styles.loadingText}>Loading counselors...</Text>
            </SafeAreaView>
        );
    }

    if (isSchedulingComplete) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Scheduled Successfully</Text>
                    <View style={styles.placeholder} />
                </View>
                <TaskComponent />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => currentStep === 2 ? goBackToSelection() : router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {currentStep === 1 ? "Select Counselor" : "Schedule Meeting"}
                </Text>
                <View style={styles.placeholder} />
            </View>

            {currentStep === 1 ? (
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Choose a Counselor</Text>
                        <Text style={styles.sectionSubtitle}>Select the counselor you'd like to meet with</Text>
                        
                        {counselors.map((counselor) => (
                            <TouchableOpacity
                                key={counselor.id}
                                style={[
                                    styles.counselorCard,
                                    selectedCounselor === counselor.id && styles.selectedCard,
                                    !counselor.availability && styles.unavailableCard
                                ]}
                                onPress={() => counselor.availability && setSelectedCounselor(counselor.id)}
                                disabled={!counselor.availability}
                            >
                                <Image 
                                    source={{ uri: counselor.imageUrl }} 
                                    style={styles.counselorImage} 
                                />
                                
                                <View style={styles.counselorInfo}>
                                    <View style={styles.counselorHeader}>
                                        <Text style={styles.counselorName}>{counselor.name}</Text>
                                        {!counselor.availability && (
                                            <View style={styles.unavailableBadge}>
                                                <Text style={styles.unavailableText}>Unavailable</Text>
                                            </View>
                                        )}
                                    </View>
                                    
                                    <Text style={styles.counselorSpeciality}>{counselor.specialization}</Text>
                                    
                                    <View style={styles.counselorDetails}>
                                        <View style={styles.detailItem}>
                                            <Ionicons name="time-outline" size={14} color="#666" />
                                            <Text style={styles.detailText}>{counselor.experience}</Text>
                                        </View>
                                        
                                        <View style={styles.ratingContainer}>
                                            <View style={styles.starsContainer}>
                                                {renderStars(counselor.rating)}
                                            </View>
                                            <Text style={styles.ratingText}>{counselor.rating}</Text>
                                        </View>
                                    </View>
                                    
                                    <Text numberOfLines={2} style={styles.counselorBio}>
                                        {counselor.bio}
                                    </Text>
                                </View>
                                
                                {selectedCounselor === counselor.id && (
                                    <View style={styles.checkmarkContainer}>
                                        <Ionicons name="checkmark-circle" size={24} color="#4a6da7" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.divider} />
                    
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Payment Method</Text>
                        <Text style={styles.sectionSubtitle}>How would you like to pay for the session?</Text>
                        
                        <View style={styles.paymentMethodsContainer}>
                            {PAYMENT_METHODS.map((method) => (
                                <TouchableOpacity
                                    key={method.id}
                                    style={[
                                        styles.paymentMethodCard,
                                        selectedPayment === method.id && styles.selectedPaymentCard
                                    ]}
                                    onPress={() => setSelectedPayment(method.id)}
                                >
                                    <View style={styles.paymentIconContainer}>
                                        <Ionicons name={method.icon as any} size={24} color="#4a6da7" />
                                    </View>
                                    <Text style={styles.paymentMethodName}>{method.name}</Text>
                                    
                                    {selectedPayment === method.id && (
                                        <View style={styles.paymentCheckContainer}>
                                            <Ionicons name="checkmark-circle" size={20} color="#4a6da7" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    
                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            (!selectedCounselor || !selectedPayment) && styles.disabledButton
                        ]}
                        onPress={handleContinueToScheduling}
                        disabled={!selectedCounselor || !selectedPayment}
                    >
                        <Text style={styles.continueButtonText}>Continue to Scheduling</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                    </TouchableOpacity>
                </ScrollView>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.formContainer}>
                        <View style={styles.iconContainer}></View>
                            <Ionicons name="calendar" size={40} color="#4a6da7" />
                        </View>
                        
                        <Text style={styles.headerText}>Book Your Appointment</Text>
                        <Text style={styles.subHeaderText}>Fill in the details below to schedule a meeting</Text>

                        {selectedCounselor && (
                            <View style={styles.selectedCounselorContainer}>
                                <Text style={styles.selectedLabel}>Selected Counselor:</Text>
                                <View style={styles.counselorCard2}>
                                    <Text style={styles.counselorName}>
                                        {counselors.find(c => c.id === selectedCounselor)?.name}
                                    </Text>
                                    <Text style={styles.counselorSpeciality}>
                                        {counselors.find(c => c.id === selectedCounselor)?.specialization}
                                    </Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.selectedPaymentContainer}>
                            <Text style={styles.selectedLabel}>Payment Method:</Text>
                            <View style={styles.paymentBadge}>
                                <Ionicons 
                                    name={PAYMENT_METHODS.find(p => p.id === selectedPayment)?.icon as any} 
                                    size={18} 
                                    color="#4a6da7" 
                                />
                                <Text style={styles.paymentText}>
                                    {PAYMENT_METHODS.find(p => p.id === selectedPayment)?.name}
                                </Text>
                            </View>
                        </View>
                        
                        {error ? (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={20} color="#d9534f" />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}
                        
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Why do you wish to meet?</Text>
                            <TextInput
                                style={styles.textInput}
                                value={reason}
                                onChangeText={setReason}
                                placeholder="Enter the reason for your meeting"
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                <Ionicons name="calendar-outline" size={18} color="#4a6da7" style={styles.inputIcon} /> 
                                Select a date
                            </Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={selectedDate}
                                    onValueChange={(itemValue) => setSelectedDate(itemValue)}
                                    style={styles.picker}
                                    mode="dropdown"
                                >
                                    <Picker.Item label="Select a date" value="" />
                                    {availableDates.map((date, index) => (
                                        <Picker.Item key={index} label={date.label} value={date.value} />
                                    ))}
                                </Picker>
                            </View>
                        </View>
                        
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                <Ionicons name="time-outline" size={18} color="#4a6da7" style={styles.inputIcon} /> 
                                Select a time slot
                            </Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={selectedTimeSlot}
                                    onValueChange={(itemValue) => setSelectedTimeSlot(itemValue)}
                                    style={styles.picker}
                                    mode="dropdown"
                                    enabled={availableTimeSlots.length > 0}
                                >
                                    <Picker.Item label="Select a time slot" value="" />
                                    {availableTimeSlots.length > 0 ? (
                                        availableTimeSlots.map((slot, index) => (
                                            <Picker.Item key={index} label={slot} value={slot} />
                                        ))
                                    ) : (
                                        <Picker.Item label="No available slots" value="" />
                                    )}
                                </Picker>
                            </View>
                            {availableTimeSlots.length === 0 && selectedDate && (
                                <View style={styles.infoContainer}>
                                    <Ionicons name="information-circle" size={20} color="#856404" />
                                    <Text style={styles.infoText}>
                                        No time slots available for this date. Please select another date.
                                    </Text>
                                </View>
                            )}
                        </View>
                        
                        <TouchableOpacity
                            style={[styles.submitButton, submitting && styles.disabledButton]}
                            onPress={handleSubmitScheduling}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.buttonIcon} />
                                    <Text style={styles.submitButtonText}>Confirm Booking</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        
                        <View style={styles.noteContainer}>
                            <Ionicons name="information-circle-outline" size={16} color="#666" />
                            <Text style={styles.noteText}>
                                You can schedule a meeting up to 3 days in advance
                            </Text>
                        </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4ff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f4ff',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#4a6da7',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#4a6da7',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    backButton: {
        padding: 8,
    },
    placeholder: {
        width: 40,
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 16,
        paddingBottom: 30,
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    counselorCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        position: 'relative',
    },
    selectedCard: {
        borderColor: '#4a6da7',
        borderWidth: 2,
        backgroundColor: '#f5f8ff',
    },
    unavailableCard: {
        opacity: 0.6,
    },
    counselorImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginRight: 16,
    },
    counselorInfo: {
        flex: 1,
    },
    counselorHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    counselorName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    unavailableBadge: {
        backgroundColor: '#e74c3c',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    unavailableText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    counselorSpeciality: {
        fontSize: 14,
        color: '#4a6da7',
        fontWeight: '500',
        marginBottom: 6,
    },
    counselorDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    starsContainer: {
        flexDirection: 'row',
        marginRight: 6,
    },
    ratingText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    counselorBio: {
        fontSize: 13,
        color: '#777',
        lineHeight: 18,
    },
    checkmarkContainer: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    divider: {
        height: 1,
        backgroundColor: '#ddd',
        marginVertical: 24,
    },
    paymentMethodsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
    },
    paymentMethodCard: {
        width: '31%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        position: 'relative',
    },
    selectedPaymentCard: {
        borderColor: '#4a6da7',
        borderWidth: 2,
        backgroundColor: '#f5f8ff',
    },
    paymentIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f4ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    paymentMethodName: {
        fontSize: 14,
        color: '#333',
        textAlign: 'center',
    },
    paymentCheckContainer: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    continueButton: {
        backgroundColor: '#4a6da7',
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 24,
        shadowColor: '#4a6da7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        backgroundColor: '#a0b4d6',
        shadowOpacity: 0.1,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
    },
    buttonIcon: {
        marginLeft: 4,
    },
    formContainer: {
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
    iconContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
        color: '#333',
    },
    subHeaderText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    selectedCounselorContainer: {
        marginBottom: 20,
    },
    selectedPaymentContainer: {
        marginBottom: 20,
    },
    selectedLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        fontWeight: '500',
    },
    counselorCard2: {
        backgroundColor: '#f5f8ff',
        borderRadius: 10,
        padding: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#4a6da7',
    },
    paymentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f8ff',
        borderRadius: 10,
        padding: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#4a6da7',
    },
    paymentText: {
        fontSize: 14,
        color: '#333',
        marginLeft: 8,
    },
    formGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: '500',
        color: '#333',
        flexDirection: 'row',
        alignItems: 'center',
    },
    textInput: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        color: '#333',
        height: 120,
    },
    pickerContainer: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
        width: '100%',
    },
    submitButton: {
        backgroundColor: '#4a6da7',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fde8e8',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
    },
    errorText: {
        color: '#d9534f',
        marginLeft: 8,
        flex: 1,
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff3cd',
        borderRadius: 8,
        padding: 12,
        marginTop: 8,
    },
    infoText: {
        color: '#856404',
        marginLeft: 8,
        flex: 1,
    },
    inputIcon: {
        marginRight: 6,
    },
    noteContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        padding: 12,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
    },
    noteText: {
        color: '#666',  
        fontSize: 12,
        marginLeft: 6,
    }
});

export default ScheduleScreen;
