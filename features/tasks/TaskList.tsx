import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../../components/Button';
import notificationService from '../../services/notificationService';
import { storageService } from '../../services/storageService';
import TaskForm from './TaskForm';
import TaskItem from './TaskItem';

const TaskList = () => {
  const [tasks, setTasks] = useState<any>([]);
  const [filteredTasks, setFilteredTasks] = useState<any>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [filter, setFilter] = useState('all'); // all, active, completed
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTasks();
    notificationService.configure();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, filter]);

  const loadTasks = async () => {
    const loadedTasks = await storageService.getTasks();
    setTasks(loadedTasks);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const filterTasks = () => {
    let filtered: any = [...tasks];
    
    if (filter === 'active') {
      filtered = filtered.filter((task: any) => !task.completed);
    } else if (filter === 'completed') {
      filtered = filtered.filter((task: any) => task.completed);
    }
    
    // Sort by reminder time
    filtered.sort((a: any, b: any) => 
      (new Date(a.reminderTime) as any) - (new Date(b.reminderTime) as any)
    );
    
    setFilteredTasks(filtered);
  };

  const handleAddTask = async (taskData: any) => {
    const newTask = await storageService.addTask(taskData);
    if (newTask) {
      notificationService.scheduleNotification(newTask);
      await loadTasks();
    }
  };

  const handleUpdateTask = async (taskData: any) => {
    const updated = await storageService.updateTask(taskData.id, taskData);
    if (updated) {
      notificationService.cancelNotification(taskData.id);
      if (!taskData.completed) {
        notificationService.scheduleNotification(updated);
      }
      await loadTasks();
    }
    setEditingTask(null);
  };

  const handleToggleTask = async (taskId: any) => {
    const updated = await storageService.toggleTaskCompletion(taskId);
    if (updated) {
      if (updated.completed) {
        notificationService.cancelNotification(taskId);
      } else {
        notificationService.scheduleNotification(updated);
      }
      await loadTasks();
    }
  };

  const handleDeleteTask = (taskId: any) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            notificationService.cancelNotification(taskId);
            await storageService.deleteTask(taskId);
            await loadTasks();
          },
        },
      ]
    );
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter((t: any) => t.completed).length;
    const active = total - completed;
    return { total, active, completed };
  };

  const stats = getTaskStats();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily Tasks</Text>
        <View style={styles.stats}>
          <Text style={styles.statsText}>
            {stats.active} Active • {stats.completed} Done
          </Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({stats.total})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'active' && styles.filterButtonActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
            Active ({stats.active})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'completed' && styles.filterButtonActive]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>
            Done ({stats.completed})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            onToggle={handleToggleTask}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {filter === 'all' 
                ? 'No tasks yet. Add your first task!'
                : filter === 'active'
                ? 'No active tasks'
                : 'No completed tasks'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <View style={styles.addButtonContainer}>
        <Button
          title="+ Add New Task"
          variant="primary"
          size="large"
          onPress={() => setShowForm(true)}
        />
      </View>

      <TaskForm
        visible={showForm}
        onClose={handleCloseForm}
        onSubmit={editingTask ? handleUpdateTask : handleAddTask}
        initialTask={editingTask}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFF',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  stats: {
    marginTop: 4,
  },
  statsText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  addButtonContainer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
});

export default TaskList;
