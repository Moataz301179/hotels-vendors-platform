import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { FieldTask, MobilePlan } from '../api/hovin';

type Props = {
  plan: MobilePlan;
  tasks: FieldTask[];
  email: string;
  loading: boolean;
  message: string | null;
  onRefresh: () => void;
  onSignOut: () => void;
  onOpenPhone: (moduleId: string) => void;
  onOpenDesk: () => void;
  onRespond: (task: FieldTask, status: 'ACCEPTED' | 'REJECTED') => void;
};

/**
 * The signed-in home is the field layer for this account.
 * Phone modules open field work. Desk modules leave the phone.
 */
export function FieldHome({ plan, tasks, email, loading, message, onRefresh, onSignOut, onOpenPhone, onOpenDesk, onRespond }: Props) {
  const phoneModules = plan.modules.filter((module) => module.surface === 'phone');
  const deskModules = plan.modules.filter((module) => module.surface === 'web');

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.topline}>
        <View>
          <Text style={styles.brand}>HOVIN</Text>
          <Text style={styles.context}>{plan.title}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onSignOut}><Text style={styles.signOut}>Sign out</Text></Pressable>
      </View>
      <Text style={styles.identity}>{email}</Text>
      <Text style={styles.summary}>{plan.summary}</Text>

      {phoneModules.length > 0 ? <Text style={styles.section}>On this phone</Text> : null}
      {phoneModules.map((module) => {
        const moduleTasks = tasks.filter((task) => task.module === module.id);
        return (
          <View key={module.id} style={styles.card}>
            <Text style={styles.cardTitle}>{module.title}</Text>
            <Text style={styles.cardBody}>{module.purpose}</Text>
            {moduleTasks.map((task) => (
              <View key={task.id} style={styles.task}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskDetail}>{task.detail}</Text>
                <Text style={styles.taskStatus}>{task.status.replaceAll('_', ' ')}</Text>
                {task.action === 'receive' ? <Pressable accessibilityRole="button" style={styles.action} onPress={() => onOpenPhone('arrivals')}><Text style={styles.actionText}>Record receipt</Text></Pressable> : null}
                {task.action === 'respond' ? (
                  <View style={styles.row}>
                    <Pressable accessibilityRole="button" style={styles.action} onPress={() => onRespond(task, 'ACCEPTED')}><Text style={styles.actionText}>Accept</Text></Pressable>
                    <Pressable accessibilityRole="button" style={styles.secondary} onPress={() => onRespond(task, 'REJECTED')}><Text style={styles.secondaryText}>Decline</Text></Pressable>
                  </View>
                ) : null}
              </View>
            ))}
            {moduleTasks.length === 0 ? <Text style={styles.empty}>Nothing assigned in this module.</Text> : null}
            {module.id === 'count' ? <Pressable accessibilityRole="button" style={styles.action} onPress={() => onOpenPhone('count')}><Text style={styles.actionText}>Open camera count</Text></Pressable> : null}
          </View>
        );
      })}

      <Text style={styles.section}>Stays on the desk</Text>
      {deskModules.map((module) => (
        <View key={module.id} style={styles.card}>
          <Text style={styles.cardTitle}>{module.title}</Text>
          <Text style={styles.cardBody}>{module.purpose}</Text>
        </View>
      ))}
      <Pressable accessibilityRole="button" style={styles.secondary} onPress={onOpenDesk}><Text style={styles.secondaryText}>Open the desk</Text></Pressable>

      <View style={styles.boundary}>
        <Text style={styles.section}>Kept off this phone</Text>
        {plan.withheld.map((item) => <Text key={item} style={styles.boundaryItem}>{item}</Text>)}
      </View>

      <Pressable accessibilityRole="button" onPress={onRefresh} style={styles.secondary}><Text style={styles.secondaryText}>{loading ? 'Refreshing' : 'Refresh field work'}</Text></Pressable>
      {message ? <Text accessibilityRole="alert" style={styles.alert}>{message}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12, backgroundColor: '#101215' },
  topline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: '#F2F4F5', fontSize: 20, fontWeight: '800', letterSpacing: 2.4 },
  context: { color: '#808B95', fontSize: 12, fontWeight: '700', marginTop: 3 },
  signOut: { color: '#B4BDC5', fontSize: 13, fontWeight: '700' },
  identity: { color: '#F2F4F5', fontSize: 14, fontWeight: '700' },
  summary: { color: '#B4BDC5', fontSize: 16, lineHeight: 23 },
  section: { color: '#F2F4F5', fontSize: 18, fontWeight: '700', marginTop: 6 },
  card: { gap: 8, padding: 16, backgroundColor: '#171B20', borderColor: '#303940', borderWidth: 1, borderRadius: 16 },
  cardTitle: { color: '#F2F4F5', fontSize: 16, fontWeight: '800' },
  cardBody: { color: '#B4BDC5', fontSize: 14, lineHeight: 20 },
  task: { gap: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#303940' },
  taskTitle: { color: '#F2F4F5', fontSize: 15, fontWeight: '800' },
  taskDetail: { color: '#B4BDC5', fontSize: 13, lineHeight: 18 },
  taskStatus: { color: '#9BC9E9', fontSize: 12, fontWeight: '700' },
  empty: { color: '#808B95', fontSize: 13 },
  row: { flexDirection: 'row', gap: 8 },
  action: { alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: '#9BC9E9', borderRadius: 8 },
  actionText: { color: '#10202C', fontSize: 14, fontWeight: '800' },
  secondary: { alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', paddingHorizontal: 12, borderColor: '#44515A', borderWidth: 1, borderRadius: 8 },
  secondaryText: { color: '#B4BDC5', fontSize: 14, fontWeight: '700' },
  boundary: { gap: 6, padding: 16, backgroundColor: '#12161A', borderRadius: 16, borderWidth: 1, borderColor: '#303940' },
  boundaryItem: { color: '#B4BDC5', fontSize: 13, lineHeight: 18 },
  alert: { color: '#F4B6B0', backgroundColor: '#402326', padding: 12, borderRadius: 10 },
});
