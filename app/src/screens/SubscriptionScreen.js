import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import { iapService, PRODUCT_SKUS } from '../services/IAPService';
import useStore from '../store/useStore';
import { getCurrencySymbol, CURRENCIES } from '../utils/currency';

// Цены для демо-режима по валютам (месячная / годовая)
const DEMO_PRICES = {
  KZT: { monthly: 2000, yearly: 20000, symbol: '₸' },
  RUB: { monthly: 400, yearly: 4000, symbol: '₽' },
  KGS: { monthly: 110, yearly: 1100, symbol: 'с' },
  UZS: { monthly: 22000, yearly: 220000, symbol: 'сўм' },
  USD: { monthly: 5, yearly: 50, symbol: '$' },
  EUR: { monthly: 5, yearly: 48, symbol: '€' },
};

const SubscriptionScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const user = useStore((state) => state.user);
  const updateUser = useStore((state) => state.updateUser);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const isPremium = user?.subscriptionType === 'PREMIUM' || user?.subscriptionType === 'AMBASSADOR';

  // Получаем цены для валюты пользователя
  const userCurrency = user?.currency || 'KZT';
  const prices = DEMO_PRICES[userCurrency] || DEMO_PRICES.KZT;
  const yearlyDiscount = Math.round((1 - prices.yearly / (prices.monthly * 12)) * 100);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const availableProducts = await iapService.getProducts();
      setProducts(availableProducts);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (productId) => {
    setSelectedProduct(productId);
    setPurchasing(true);

    try {
      const result = await iapService.purchaseSubscription(productId);

      if (result.success) {
        Alert.alert(
          t('success'),
          t('premium_activated'),
          [{ text: t('ok'), onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert(
        t('error'),
        error.message || t('purchase_failed')
      );
    } finally {
      setPurchasing(false);
      setSelectedProduct(null);
    }
  };

  const handleRestorePurchases = async () => {
    setLoading(true);
    try {
      const purchases = await iapService.restorePurchases();
      if (purchases.length > 0) {
        Alert.alert(t('success'), t('purchases_restored'));
      } else {
        Alert.alert(t('info'), t('no_purchases_found'));
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert(t('error'), t('restore_failed'));
    } finally {
      setLoading(false);
    }
  };

  // Если уже Premium/Ambassador
  if (isPremium) {
    return (
      <View style={styles.container}>
        <View style={styles.activeContainer}>
          <MaterialCommunityIcons name="check-circle" size={80} color={COLORS.success} />
          <Text style={styles.activeTitle}>
            {user?.subscriptionType === 'AMBASSADOR' ? 'Ambassador' : 'Premium'}
          </Text>
          <Text style={styles.activeText}>
            {t('premium_active')}
          </Text>
          {user?.subscriptionExpiresAt && (
            <Text style={styles.expiryText}>
              {t('valid_until')}: {new Date(user.subscriptionExpiresAt).toLocaleDateString('ru-RU')}
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="crown" size={60} color={COLORS.accent} />
        <Text style={styles.title}>{t('subscription_title')}</Text>
        <Text style={styles.subtitle}>
          {t('subscription_subtitle')}
        </Text>
      </View>

      {/* Features */}
      <View style={styles.features}>
        <FeatureItem icon="book-open-variant" text={t('unlimited_recipes')} />
        <FeatureItem icon="chart-line" text={t('sales_analytics')} />
        <FeatureItem icon="cash-multiple" text={t('expense_tracking')} />
        <FeatureItem icon="headset" text={t('priority_support')} />
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>{t('loading_plans')}</Text>
        </View>
      )}

      {/* Products */}
      {!loading && products.length > 0 && (
        <View style={styles.products}>
          {products.map((product) => (
            <TouchableOpacity
              key={product.productId}
              style={[
                styles.productCard,
                selectedProduct === product.productId && styles.selectedProduct,
              ]}
              onPress={() => handlePurchase(product.productId)}
              disabled={purchasing}
            >
              <View style={styles.productInfo}>
                <Text style={styles.productTitle}>
                  {product.productId === PRODUCT_SKUS.PREMIUM_YEARLY ? t('plan_yearly') : t('plan_monthly')}
                </Text>
                <Text style={styles.productPrice}>
                  {product.localizedPrice}
                </Text>
                {product.productId === PRODUCT_SKUS.PREMIUM_YEARLY && (
                  <Text style={styles.productSavings}>
                    {t('savings_2_months')}
                  </Text>
                )}
              </View>

              {purchasing && selectedProduct === product.productId ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.white} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Mock products for development */}
      {!loading && products.length === 0 && (
        <View style={styles.mockProducts}>

          <TouchableOpacity
            style={styles.productCard}
            onPress={() => handlePurchase(PRODUCT_SKUS.PREMIUM_MONTHLY)}
            disabled={purchasing}
          >
            <Text style={styles.productTitle}>{t('plan_monthly')} — {prices.monthly.toLocaleString()} {prices.symbol}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.productCard, styles.recommendedCard]}
            onPress={() => handlePurchase(PRODUCT_SKUS.PREMIUM_YEARLY)}
            disabled={purchasing}
          >
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>-{yearlyDiscount}%</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.productTitle}>{t('plan_yearly')} — <Text style={styles.oldPrice}>{(prices.monthly * 12).toLocaleString()} {prices.symbol}</Text> {prices.yearly.toLocaleString()} {prices.symbol}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* Restore */}
      <TouchableOpacity style={styles.restoreButton} onPress={handleRestorePurchases}>
        <Text style={styles.restoreText}>{t('restore_purchases')}</Text>
      </TouchableOpacity>

      {/* Terms */}
      <Text style={styles.terms}>
        {t('subscription_terms')}
      </Text>
    </ScrollView>
  );
};

const FeatureItem = ({ icon, text }) => (
  <View style={styles.featureItem}>
    <MaterialCommunityIcons name={icon} size={20} color={COLORS.accent} />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    padding: THEME.spacing.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: THEME.spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: THEME.spacing.xs,
    textAlign: 'center',
  },
  features: {
    padding: THEME.spacing.md,
    backgroundColor: COLORS.surface,
    margin: THEME.spacing.md,
    borderRadius: THEME.roundness,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: THEME.spacing.xs,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: THEME.spacing.sm,
  },
  loadingContainer: {
    padding: THEME.spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textLight,
    marginTop: THEME.spacing.sm,
  },
  products: {
    padding: THEME.spacing.md,
  },
  productCard: {
    backgroundColor: COLORS.accent,
    borderRadius: THEME.roundness,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedProduct: {
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  oldPrice: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.6,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  recommendedCard: {
    backgroundColor: '#9C27B0',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    left: 12,
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000',
  },
  mockProducts: {
    padding: THEME.spacing.md,
  },
  mockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: THEME.spacing.sm,
    textAlign: 'center',
  },
  restoreButton: {
    padding: THEME.spacing.md,
    alignItems: 'center',
  },
  restoreText: {
    fontSize: 14,
    color: COLORS.accent,
  },
  terms: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    padding: THEME.spacing.md,
    paddingBottom: THEME.spacing.xl,
  },
  activeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.xl,
  },
  activeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: THEME.spacing.md,
  },
  activeText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: THEME.spacing.sm,
  },
  expiryText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: THEME.spacing.md,
  },
});

export default SubscriptionScreen;
