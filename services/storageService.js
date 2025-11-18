import AsyncStorage from '@react-native-async-storage/async-storage';

const TASKS_STORAGE_KEY = '@daily_tasks';

export const storageService = {
  // Get all tasks
  getTasks: async () => {
    try {
      const tasksJson = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
      return tasksJson ? JSON.parse(tasksJson) : [];
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  },

  // Save all tasks
  saveTasks: async (tasks) => {
    try {
      await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch (error) {
      console.error('Error saving tasks:', error);
      return false;
    }
  },

  // Add a new task
  addTask: async (task) => {
    try {
      const tasks = await storageService.getTasks();
      const newTask = {
        ...task,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        completed: false,
      };
      tasks.push(newTask);
      await storageService.saveTasks(tasks);
      return newTask;
    } catch (error) {
      console.error('Error adding task:', error);
      return null;
    }
  },

  // Update a task
  updateTask: async (taskId, updates) => {
    try {
      const tasks = await storageService.getTasks();
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
        await storageService.saveTasks(tasks);
        return tasks[taskIndex];
      }
      return null;
    } catch (error) {
      console.error('Error updating task:', error);
      return null;
    }
  },

  // Delete a task
  deleteTask: async (taskId) => {
    try {
      const tasks = await storageService.getTasks();
      const filteredTasks = tasks.filter(t => t.id !== taskId);
      await storageService.saveTasks(filteredTasks);
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  },

  // Toggle task completion
  toggleTaskCompletion: async (taskId) => {
    try {
      const tasks = await storageService.getTasks();
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        await storageService.saveTasks(tasks);
        return tasks[taskIndex];
      }
      return null;
    } catch (error) {
      console.error('Error toggling task:', error);
      return null;
    }
  },
};
