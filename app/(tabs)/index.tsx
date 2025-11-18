
import { ThemedView } from '@/components/themed-view';
import TaskList from '@/features/tasks/TaskList';

export default function HomeScreen() {
  return (
    <ThemedView style={{ flex: 1 }}>
      <TaskList />
    </ThemedView>
  );
}
