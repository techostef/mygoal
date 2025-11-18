import { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Picker from '../../components/Picker';

interface TaskFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (taskData: any) => void;
  initialTask?: any;
}

const TaskForm = ({ visible, onClose, onSubmit, initialTask = null }: TaskFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [reminderTime, setReminderTime] = useState(new Date());
  const [reminderType, setReminderType] = useState('daily');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, any>>({});

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setCategory(initialTask.category || '');
      setReminderTime(new Date(initialTask.reminderTime));
      setReminderType(initialTask.reminderType);
    } else {
      resetForm();
    }
  }, [initialTask, visible]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setReminderTime(new Date());
    setReminderType('daily');
    setErrors({});
  };

  const validate = () => {
    const newErrors: any = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      reminderTime: reminderTime.toISOString(),
      reminderType,
    };

    if (initialTask) {
      onSubmit({ ...initialTask, ...taskData });
    } else {
      onSubmit(taskData);
    }

    resetForm();
    onClose();
  };

  const formatTime = (date: any) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const reminderOptions = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {initialTask ? 'Edit Task' : 'Add New Task'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Input
              label="Title *"
              value={title}
              onChangeText={setTitle}
              placeholder="Enter task title"
              error={errors.title}
            />

            <Input
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Enter task description"
              multiline
              numberOfLines={3}
            />

            <Input
              label="Category"
              value={category}
              onChangeText={setCategory}
              placeholder="e.g., Work, Personal, Health"
            />

            <View style={styles.timePickerContainer}>
              <Text style={styles.label}>Reminder Time *</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.timeButtonText}>{formatTime(reminderTime)}</Text>
              </TouchableOpacity>
            </View>

            <Picker
              label="Reminder Frequency *"
              selectedValue={reminderType}
              onValueChange={setReminderType}
              items={reminderOptions}
            />

            <View style={styles.buttonContainer}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={onClose}
                style={styles.button}
              />
              <Button
                title={initialTask ? 'Update' : 'Add Task'}
                variant="primary"
                onPress={handleSubmit}
                style={styles.button}
              />
            </View>
          </ScrollView>

          <DatePicker
            modal
            open={showTimePicker}
            date={reminderTime}
            mode="time"
            onConfirm={(date) => {
              setShowTimePicker(false);
              setReminderTime(date);
            }}
            onCancel={() => {
              setShowTimePicker(false);
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#8E8E93',
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  timePickerContainer: {
    marginBottom: 16,
  },
  timeButton: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  timeButtonText: {
    fontSize: 16,
    color: '#000',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  button: {
    flex: 1,
  },
});

export default TaskForm;
