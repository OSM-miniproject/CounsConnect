import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define Task type based on the provided schema
interface Task {
  id: string;
  patient_id: string;
  counselor_id: string;
  title: string;
  description: string;
  frequency: string;
  deadline: string;
  status: 'pending' | 'completed' | 'missed';
  feedback: string;
  created_at: string;
  updated_at: string;
}

const API_URL = 'http://172.20.10.4:8080/api'; // Replace with your actual API URL

const TaskComponent: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get token from AsyncStorage
  const getToken = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      console.log('User token:', userToken);
      return userToken;
    } catch (error) {
      console.error('Error getting token from AsyncStorage:', error);
      return null;
    }
  };

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const userToken = await getToken();
      
      if (!userToken) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch tasks. Please try again.');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch upcoming tasks
  const fetchUpcomingTasks = async () => {
    try {
      setLoading(true);
      const userToken = await getToken();
      
      if (!userToken) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${API_URL}/tasks/upcoming`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch upcoming tasks. Please try again.');
      console.error('Error fetching upcoming tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle task status
  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    try {
      const userToken = await getToken();
      
      if (!userToken) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${API_URL}/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to update task status');
      console.error('Error updating task status:', err);
    }
  };

  // Load tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />;
      case 'missed':
        return <Ionicons name="close-circle" size={24} color="#F44336" />;
      default:
        return <Ionicons name="ellipse-outline" size={24} color="#2196F3" />;
    }
  };

  // Format date function
  const formatDate = (dateString: string) => {
    return moment(dateString).format('MMM D, YYYY');
  };

  // Render task item
  const renderTaskItem = ({ item }: { item: Task }) => (
    <View style={styles.taskItem}>
      <TouchableOpacity 
        style={styles.checkbox}
        onPress={() => toggleTaskStatus(item.id, item.status)}
        disabled={item.status === 'missed'}
      >
        {getStatusIcon(item.status)}
      </TouchableOpacity>
      
      <View style={styles.taskContent}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <Text style={styles.taskDescription}>{item.description}</Text>
        
        <View style={styles.taskMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color="#757575" />
            <Text style={styles.metaText}>Deadline: {formatDate(item.deadline)}</Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="repeat" size={16} color="#757575" />
            <Text style={styles.metaText}>Frequency: {item.frequency}</Text>
          </View>
        </View>
        
        {item.feedback ? (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackTitle}>Feedback:</Text>
            <Text style={styles.feedbackText}>{item.feedback}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  // Show loading indicator while fetching data
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Show error message if there's an error
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchTasks}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tasks</Text>
        <TouchableOpacity style={styles.upcomingButton} onPress={fetchUpcomingTasks}>
          <Text style={styles.upcomingButtonText}>Show Upcoming</Text>
        </TouchableOpacity>
      </View>
      
      {tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-done-circle" size={64} color="#BDBDBD" />
          <Text style={styles.emptyText}>No tasks available</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTaskItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  upcomingButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  upcomingButtonText: {
    color: '#FFF',
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: 20,
  },
  taskItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  checkbox: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#757575',
    marginLeft: 4,
  },
  feedbackContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 4,
    padding: 8,
    marginTop: 8,
  },
  feedbackTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 2,
  },
  feedbackText: {
    fontSize: 12,
    color: '#1976D2',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  errorText: {
    color: '#F44336',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  }
});

export default TaskComponent;