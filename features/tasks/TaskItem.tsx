import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button from '../../components/Button';
import Card from '../../components/Card';

interface TaskItemProps {
  task: any;
  onToggle: (id: number) => void;
  onEdit: (task: any) => void;
  onDelete: (id: number) => void;
}

const TaskItem = ({ task, onToggle, onEdit, onDelete }: TaskItemProps) => {
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getReminderBadgeColor = (reminderType: string) => {
    switch (reminderType) {
      case 'daily':
        return '#34C759';
      case 'weekly':
        return '#FF9500';
      case 'monthly':
        return '#AF52DE';
      default:
        return '#8E8E93';
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.checkboxContainer}
          onPress={() => onToggle(task.id)}
        >
          <View style={[
            styles.checkbox,
            task.completed && styles.checkboxChecked
          ]}>
            {task.completed && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>
        
        <View style={styles.contentContainer}>
          <Text style={[
            styles.title,
            task.completed && styles.completedText
          ]}>
            {task.title}
          </Text>
          {task.description && (
            <Text style={[
              styles.description,
              task.completed && styles.completedText
            ]}>
              {task.description}
            </Text>
          )}
          
          <View style={styles.metaContainer}>
            {task.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{task.category}</Text>
              </View>
            )}
            <View style={[
              styles.reminderBadge,
              { backgroundColor: getReminderBadgeColor(task.reminderType) }
            ]}>
              <Text style={styles.reminderText}>
                {task.reminderType} • {formatTime(task.reminderTime)}
              </Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.actions}>
        <Button
          title="Edit"
          variant="outline"
          size="small"
          onPress={() => onEdit(task)}
          style={styles.actionButton}
        />
        <Button
          title="Delete"
          variant="danger"
          size="small"
          onPress={() => onDelete(task.id)}
          style={styles.actionButton}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  checkboxContainer: {
    marginRight: 12,
    paddingTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  reminderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  reminderText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    flex: 0,
    minWidth: 80,
  },
});

export default TaskItem;
