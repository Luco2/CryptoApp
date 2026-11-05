import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  title: string;
  body: string;
}

export default function InfoTooltip({ title, body }: Props) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <View style={[styles.badge, { backgroundColor: theme.bgInput, borderColor: theme.border }]}>
          <Text style={[styles.icon, { color: theme.accent }]}>ⓘ</Text>
        </View>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={[styles.box, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.body, { color: theme.textSub }]}>{body}</Text>
            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: theme.accent }]} onPress={() => setVisible(false)}>
              <Text style={[styles.closeText, { color: theme.accentText }]}>Got it</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  badge: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: '#00000088', alignItems: 'center', justifyContent: 'center', padding: 32 },
  box: { borderRadius: 16, padding: 24, width: '100%', borderWidth: 1 },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 10 },
  body: { fontSize: 14, lineHeight: 22, marginBottom: 20 },
  closeBtn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  closeText: { fontSize: 15, fontWeight: '700' },
});
