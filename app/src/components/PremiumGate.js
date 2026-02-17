import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import useStore from '../store/useStore';

const PremiumGate = ({ children, navigation }) => {
  const { t } = useTranslation();
  const user = useStore((state) => state.user);
  const [modalVisible, setModalVisible] = React.useState(false);

  const isPremium = user?.subscriptionType === 'PREMIUM' || user?.subscriptionType === 'AMBASSADOR';

  if (isPremium) {
    return children;
  }

  return (
    <View style={styles.container}>
      <View style={styles.lockedContent}>
        <MaterialCommunityIcons name="lock" size={64} color={COLORS.textLight} />
        <Text style={styles.title}>{t('premium_feature')}</Text>
        <Text style={styles.description}>{t('premium_feature_text')}</Text>

        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => navigation?.navigate('ProfileScreen')}
        >
          <MaterialCommunityIcons name="crown" size={20} color={COLORS.white} />
          <Text style={styles.upgradeButtonText}>{t('go_premium')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedContent: {
    alignItems: 'center',
    padding: THEME.spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.sm,
  },
  description: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: THEME.spacing.xl,
    lineHeight: 20,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    gap: 8,
  },
  upgradeButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PremiumGate;
