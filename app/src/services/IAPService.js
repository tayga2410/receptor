import { Platform, Alert } from 'react-native';
import { api } from './api';
import useStore from '../store/useStore';

// SKU продуктов
const PRODUCT_SKUS = {
  PREMIUM_MONTHLY: 'premium_monthly',
  PREMIUM_YEARLY: 'premium_yearly',
};

// Debug логгер только для DEV
const debugLog = (__DEV__ || process.env.NODE_ENV !== 'production')
  ? (...args) => console.log('[IAP]', ...args)
  : () => {};

// Пытаемся импортировать IAP, если не доступен - работаем в демо-режиме
let InAppPurchase = null;
try {
  InAppPurchase = require('react-native-iap').default;
} catch (e) {
  debugLog('react-native-iap not available, running in demo mode');
}

class IAPService {
  constructor() {
    this.initialized = false;
    this.products = [];
    this.demoMode = !InAppPurchase;
  }

  // Инициализация IAP
  async initialize() {
    if (this.initialized) return true;

    // Демо-режим - пропускаем инициализацию
    if (this.demoMode) {
      debugLog('running in demo mode');
      this.initialized = true;
      return true;
    }

    try {
      // Подключаемся к магазину
      const result = await InAppPurchase.initConnection();
      debugLog('connection initialized:', result);
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize IAP:', error);
      // В случае ошибки включаем демо-режим
      this.demoMode = true;
      this.initialized = true;
      return true;
    }
  }

  // Получить список продуктов
  async getProducts() {
    if (!this.initialized) {
      const success = await this.initialize();
      if (!success) return [];
    }

    // Демо-режим - возвращаем пустой массив (экран покажет mock-продукты)
    if (this.demoMode) {
      debugLog('demo mode - returning empty products');
      return [];
    }

    try {
      const skus = Platform.select({
        android: [PRODUCT_SKUS.PREMIUM_MONTHLY, PRODUCT_SKUS.PREMIUM_YEARLY],
        ios: [PRODUCT_SKUS.PREMIUM_MONTHLY, PRODUCT_SKUS.PREMIUM_YEARLY],
      });

      const products = await InAppPurchase.getProducts({ skus });
      debugLog('available products:', products);
      this.products = products;
      return products;
    } catch (error) {
      console.error('Failed to get products:', error);
      return [];
    }
  }

  // Купить подписку
  async purchaseSubscription(productId) {
    if (!this.initialized) {
      const success = await this.initialize();
      if (!success) {
        throw new Error('Failed to initialize IAP');
      }
    }

    // Демо-режим - показываем сообщение что покупки недоступны
    if (this.demoMode) {
      throw new Error('Покупки недоступны в демо-режиме. Для тестирования используйте реальное устройство с Google Play.');
    }

    try {
      debugLog('starting purchase for:', productId);

      // Запускаем покупку
      const purchase = await InAppPurchase.requestSubscription({
        sku: productId,
      });

      debugLog('purchase result:', purchase);

      // Верифицируем покупку на бэкенде
      const verificationResult = await this.verifyPurchase(purchase);

      if (verificationResult.success) {
        // Обновляем пользователя в store
        const { updateUser } = useStore.getState();
        updateUser({
          subscriptionType: verificationResult.subscriptionType,
          subscriptionExpiresAt: verificationResult.expiresAt,
        });

        return {
          success: true,
          subscriptionType: verificationResult.subscriptionType,
          expiresAt: verificationResult.expiresAt,
        };
      } else {
        throw new Error('Purchase verification failed');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  // Верификация покупки на бэкенде
  async verifyPurchase(purchase) {
    try {
      if (Platform.OS === 'android') {
        const response = await api.billing.verifyGoogle({
          purchaseToken: purchase.purchaseToken,
          productId: purchase.productId,
        });

        if (response.ok) {
          return await response.json();
        }
      } else {
        const response = await api.billing.verifyApple({
          transactionReceipt: purchase.transactionReceipt,
          productId: purchase.productId,
        });

        if (response.ok) {
          return await response.json();
        }
      }

      throw new Error('Verification failed');
    } catch (error) {
      console.error('Failed to verify purchase:', error);
      throw error;
    }
  }

  // Восстановить покупки
  async restorePurchases() {
    if (!this.initialized) {
      await this.initialize();
    }

    // Демо-режим
    if (this.demoMode) {
      debugLog('demo mode - cannot restore purchases');
      return [];
    }

    try {
      const purchases = await InAppPurchase.getAvailablePurchases();
      debugLog('available purchases:', purchases);

      // Верифицируем каждую покупку
      for (const purchase of purchases) {
        try {
          await this.verifyPurchase(purchase);
        } catch (error) {
          console.error('Failed to restore purchase:', error);
        }
      }

      return purchases;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return [];
    }
  }

  // Завершить работу
  async endConnection() {
    if (this.initialized && !this.demoMode && InAppPurchase) {
      try {
        await InAppPurchase.endConnection();
        this.initialized = false;
      } catch (error) {
        console.error('Failed to end IAP connection:', error);
      }
    }
  }
}

export const iapService = new IAPService();
export { PRODUCT_SKUS };
