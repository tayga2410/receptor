import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import { api } from '../services/api';

const StatCard = ({ title, value, icon, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={styles.statIcon}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  </View>
);

const UserCard = ({ user, onGrantAmbassador, onGrantPremium, onRevoke, onDelete }) => {
  const subscriptionColors = {
    FREE: COLORS.textLight,
    PREMIUM: COLORS.accent,
    AMBASSADOR: '#9C27B0',
  };

  const subscriptionLabels = {
    FREE: 'Free',
    PREMIUM: 'Premium',
    AMBASSADOR: 'Ambassador',
  };

  return (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name || user.username}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
        <View style={[styles.subscriptionBadge, { backgroundColor: subscriptionColors[user.subscriptionType] + '20' }]}>
          <Text style={[styles.subscriptionText, { color: subscriptionColors[user.subscriptionType] }]}>
            {subscriptionLabels[user.subscriptionType]}
          </Text>
        </View>
      </View>

      <View style={styles.userStats}>
        <View style={styles.userStat}>
          <MaterialCommunityIcons name="book-open-variant" size={16} color={COLORS.textLight} />
          <Text style={styles.userStatText}>{user.recipesCount || 0} рецептов</Text>
        </View>
        <View style={styles.userStat}>
          <MaterialCommunityIcons name="food-variant" size={16} color={COLORS.textLight} />
          <Text style={styles.userStatText}>{user.ingredientsCount || 0} ингредиентов</Text>
        </View>
        <View style={styles.userStat}>
          <MaterialCommunityIcons name="calendar" size={16} color={COLORS.textLight} />
          <Text style={styles.userStatText}>{user.salesRecordsCount || 0} продаж</Text>
        </View>
      </View>

      {user.subscriptionExpiresAt && (
        <Text style={styles.expiryText}>
          До: {new Date(user.subscriptionExpiresAt).toLocaleDateString('ru-RU')}
        </Text>
      )}

      <View style={styles.userActions}>
        {user.subscriptionType !== 'AMBASSADOR' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.ambassadorButton]}
            onPress={() => onGrantAmbassador(user)}
          >
            <MaterialCommunityIcons name="star" size={16} color="#9C27B0" />
            <Text style={styles.ambassadorButtonText}>Ambassador</Text>
          </TouchableOpacity>
        )}
        {user.subscriptionType !== 'PREMIUM' && user.subscriptionType !== 'AMBASSADOR' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.premiumButton]}
            onPress={() => onGrantPremium(user)}
          >
            <MaterialCommunityIcons name="crown" size={16} color={COLORS.accent} />
            <Text style={styles.premiumButtonText}>Premium</Text>
          </TouchableOpacity>
        )}
        {user.subscriptionType !== 'FREE' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.revokeButton]}
            onPress={() => onRevoke(user)}
          >
            <MaterialCommunityIcons name="cancel" size={16} color={COLORS.error} />
            <Text style={styles.revokeButtonText}>Отозвать</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete(user)}
        >
          <MaterialCommunityIcons name="delete" size={16} color={COLORS.error} />
          <Text style={styles.deleteButtonText}>Удалить</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const AdminDashboardScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const loadData = async () => {
    try {
      const [dashboardRes, usersRes] = await Promise.all([
        api.admin.getDashboard(),
        api.admin.getUsers(),
      ]);

      if (dashboardRes.ok) {
        setDashboard(await dashboardRes.json());
      }
      if (usersRes.ok) {
        setUsers(await usersRes.json());
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.admin.searchUsers(query);
      if (res.ok) {
        setSearchResults(await res.json());
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleGrantAmbassador = async (user) => {
    Alert.alert(
      'Выдать Ambassador',
      `Выдать Ambassador подписку пользователю ${user.name || user.email} на 12 месяцев?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выдать',
          onPress: async () => {
            try {
              const res = await api.admin.grantAmbassador(user.id, 12);
              if (res.ok) {
                Alert.alert('Успешно', 'Ambassador подписка выдана');
                loadData();
              } else {
                const error = await res.json();
                Alert.alert('Ошибка', error.message);
              }
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось выдать подписку');
            }
          },
        },
      ]
    );
  };

  const handleGrantPremium = async (user) => {
    Alert.alert(
      'Выдать Premium',
      `Выдать Premium подписку пользователю ${user.name || user.email} на 1 месяц?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выдать',
          onPress: async () => {
            try {
              const res = await api.admin.grantPremium(user.id, 1);
              if (res.ok) {
                Alert.alert('Успешно', 'Premium подписка выдана');
                loadData();
              } else {
                const error = await res.json();
                Alert.alert('Ошибка', error.message);
              }
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось выдать подписку');
            }
          },
        },
      ]
    );
  };

  const handleRevoke = async (user) => {
    Alert.alert(
      'Отозвать подписку',
      `Отозвать подписку у ${user.name || user.email}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Отозвать',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.admin.revokeSubscription(user.id);
              if (res.ok) {
                Alert.alert('Успешно', 'Подписка отозвана');
                loadData();
              } else {
                const error = await res.json();
                Alert.alert('Ошибка', error.message);
              }
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось отозвать подписку');
            }
          },
        },
      ]
    );
  };

  const handleDelete = async (user) => {
    Alert.alert(
      '⚠️ Удалить пользователя',
      `Вы уверены, что хотите удалить ${user.name || user.email}?\n\nЭто действие необратимо!`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.admin.deleteUser(user.id);
              if (res.ok) {
                Alert.alert('Успешно', 'Пользователь удалён');
                loadData();
              } else {
                const error = await res.json();
                Alert.alert('Ошибка', error.message);
              }
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось удалить пользователя');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  const displayedUsers = searchQuery.length >= 2 ? searchResults : users;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Dashboard Stats */}
      {dashboard && (
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Общая статистика</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Всего пользователей"
              value={dashboard.users.total}
              icon="account-group"
              color={COLORS.primary}
            />
            <StatCard
              title="Новые за месяц"
              value={dashboard.users.newThisMonth}
              icon="account-plus"
              color={COLORS.accent}
            />
            <StatCard
              title="Активные за месяц"
              value={dashboard.users.activeThisMonth}
              icon="account-check"
              color="#4CAF50"
            />
            <StatCard
              title="Premium"
              value={dashboard.users.premium}
              icon="crown"
              color={COLORS.accent}
            />
            <StatCard
              title="Ambassador"
              value={dashboard.users.ambassador}
              icon="star"
              color="#9C27B0"
            />
            <StatCard
              title="Всего рецептов"
              value={dashboard.content.totalRecipes}
              icon="book-open-variant"
              color={COLORS.primary}
            />
          </View>
        </View>
      )}

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск пользователей..."
          placeholderTextColor={COLORS.textLight}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setSearchQuery('');
              setSearchResults([]);
            }}
          >
            <MaterialCommunityIcons name="close" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Users List */}
      <View style={styles.usersContainer}>
        <Text style={styles.sectionTitle}>
          {searchQuery.length >= 2 ? 'Результаты поиска' : 'Пользователи'} ({displayedUsers.length})
        </Text>
        {displayedUsers.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            onGrantAmbassador={handleGrantAmbassador}
            onGrantPremium={handleGrantPremium}
            onRevoke={handleRevoke}
            onDelete={handleDelete}
          />
        ))}
        {displayedUsers.length === 0 && (
          <Text style={styles.emptyText}>Пользователи не найдены</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  statsContainer: {
    padding: THEME.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: THEME.spacing.md,
  },
  statsGrid: {
    gap: THEME.spacing.sm,
  },
  statCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.roundness,
    borderLeftWidth: 4,
    marginBottom: THEME.spacing.sm,
  },
  statIcon: {
    marginRight: THEME.spacing.md,
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statTitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.md,
    paddingRight: 40,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clearButton: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  usersContainer: {
    padding: THEME.spacing.lg,
    paddingTop: 0,
  },
  userCard: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: THEME.spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 2,
  },
  subscriptionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subscriptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  userStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  userStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userStatText: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  expiryText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: THEME.spacing.sm,
  },
  userActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: THEME.spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.roundness,
    gap: 4,
  },
  ambassadorButton: {
    backgroundColor: '#9C27B020',
  },
  ambassadorButtonText: {
    color: '#9C27B0',
    fontWeight: '500',
  },
  premiumButton: {
    backgroundColor: `${COLORS.accent}20`,
  },
  premiumButtonText: {
    color: COLORS.accent,
    fontWeight: '500',
  },
  revokeButton: {
    backgroundColor: `${COLORS.error}20`,
  },
  revokeButtonText: {
    color: COLORS.error,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: `${COLORS.error}15`,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  deleteButtonText: {
    color: COLORS.error,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textLight,
    paddingVertical: THEME.spacing.xl,
  },
});

export default AdminDashboardScreen;
