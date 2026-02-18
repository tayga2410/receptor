import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';

const PRIVACY_POLICY = {
  KZ: {
    lastUpdated: 'Соңғы жаңартылған:',
    sections: [
      {
        title: '1. Кіріспе',
        content: [
          'Осы Құпиялылық саясаты «Рецептор» («біз», «біздің қолданба») пайдаланушылардың ақпаратын қалай жинаитынын, пайдаланатынын және қорғайтынын сипаттайды.',
          'Біздің мобильді қолданбаны пайдалана отырып, сіз осы саясаттың шарттарымен келісесіз.',
        ],
      },
      {
        title: '2. Біз жинайтын ақпарат',
        content: [
          'Тіркелу кезінде біз сіздің пайдаланушы атыңызды, email және құпия сөзді (шифрланған түрде) жинаймыз.',
          'Біз сіз жасаған рецепттерді, ингредиенттерді және сатылым деректерін қорғалған серверлерімізде сақтаймыз.',
          'Біз қызмет сапасын жақсарту үшін құрылғы түрі, операциялық жүйе және қолданба нұсқасы туралы ақпаратты жинауымыз мүмкін.',
        ],
      },
      {
        title: '3. Ақпаратты қалай пайдаланамыз',
        content: [
          'Біз жиналған ақпаратты келесі мақсаттарда пайдаланамыз:',
          '• Қолданба мүмкіндіктерін ұсыну (рецепт калькуляторы, сатылым есебі)',
          '• Premium және Ambassador жазбаларын өңдеу',
          '• Қолданба жұмысын жақсарту',
          '• Пайдаланушылармен байланыс (сұраныс бойынша)',
        ],
      },
      {
        title: '4. Деректер қауіпсіздігі',
        content: [
          'Біз сіздің деректеріңізді қорғау үшін заманауи қауіпсіздік шараларын қолданамыз:',
          '• Құпия сөздерді bcrypt көмегімен шифрлау',
          '• Қорғалған қосылыс (HTTPS/TLS)',
          '• Аутентификация үшін JWT-токендер',
          '• Тұрақты резервтік көшіру',
        ],
      },
      {
        title: '5. Жазбалар және төлемдер',
        content: [
          'Premium жазбалары Google Play Store немесе Apple App Store арқылы өңделеді. Біз тек жазба статусы туралы ақпаратты аламыз, бірақ төлем деректерін емес.',
          'Төлем ақпараты Google/Apple арқылы олардың құпиялылық саясаттарына сәйкес сақталады және өңделеді.',
        ],
      },
      {
        title: '6. Деректерді үшінші тұлғаларға беру',
        content: [
          'Біз сіздің жеке деректеріңізді үшінші тұлғаларға сатпаймыз.',
          'Біз келесі жағдайларда деректерді бере аламыз:',
          '• Сіздің келісіміңізбен',
          '• Заңнаманы сақтау үшін',
          '• Біздің заңды құқықтарымызды қорғау үшін',
        ],
      },
      {
        title: '7. Сіздің құқықтарыңыз',
        content: [
          'Сіздің құқығыңыз бар:',
          '• Сіздің деректеріңіздің көшірмесін сұрау',
          '• Сіздің деректеріңізді жоюды сұрау',
          '• Деректерді өңдеуге келісімді қайтарып алу',
          '• Кез келген уақытта Google Play / App Store арқылы жазпадан бас тарту',
        ],
      },
      {
        title: '8. Деректерді сақтау',
        content: [
          'Сіздің деректеріңіз қолданбаны пайдалану мерзімі ішінде серверлерде сақталады. Тіркелгі жойылғаннан кейін деректер 30 күн ішінде жойылады.',
        ],
      },
      {
        title: '9. Балалар',
        content: [
          '«Рецептор» қолданбасы бизнеске (кафе, мейрамханалар) арналған және балаларға бағытталмаған. Біз 16 жасқа дейінгі тұлғалардың деректерін жинауды мақсат етпеймыз.',
        ],
      },
      {
        title: '10. Саясат өзгерістері',
        content: [
          'Біз осы саясатты мерзімді түрде жаңартуымыз мүмкін. Оны кезде-кезде тексеріп отыруды ұсынамыз. Өзгерістер қолданбаны әрі қарай пайдаланғаннан кейін сіз жаңартылған саясатты қабылдайсыз.',
        ],
      },
      {
        title: '11. Байланыс ақпараты',
        content: [
          'Құпиялылық мәселелері бойынша хабарласыңыз:',
        ],
      },
    ],
    footer: '© {{year}} Рецептор. Барлық құқықтар қорғалған.',
  },
  RU: {
    lastUpdated: 'Последнее обновление:',
    sections: [
      {
        title: '1. Введение',
        content: [
          'Настоящая Политика конфиденциальности описывает, как «Рецептор» («мы», «наше приложение») собирает, использует и защищает информацию пользователей.',
          'Используя наше мобильное приложение, вы соглашаетесь с условиями данной политики.',
        ],
      },
      {
        title: '2. Информация, которую мы собираем',
        content: [
          'При регистрации мы собираем ваше имя пользователя, email и пароль (в зашифрованном виде).',
          'Мы храним созданные вами рецепты, ингредиенты и данные о продажах на наших защищённых серверах.',
          'Мы можем собирать информацию о типе устройства, операционной системе и версии приложения для улучшения качества сервиса.',
        ],
      },
      {
        title: '3. Как мы используем информацию',
        content: [
          'Мы используем собранную информацию для:',
          '• Предоставления функционала приложения (калькулятор рецептов, учёт продаж)',
          '• Обработки подписок Premium и Ambassador',
          '• Улучшения работы приложения',
          '• Связи с пользователями (по запросу)',
        ],
      },
      {
        title: '4. Безопасность данных',
        content: [
          'Мы применяем современные меры безопасности для защиты ваших данных:',
          '• Шифрование паролей с использованием bcrypt',
          '• Защищённое соединение (HTTPS/TLS)',
          '• JWT-токены для аутентификации',
          '• Регулярное резервное копирование',
        ],
      },
      {
        title: '5. Подписки и платежи',
        content: [
          'Подписки Premium обрабатываются через Google Play Store или Apple App Store. Мы получаем только информацию о статусе подписки, но не платёжные данные.',
          'Платёжная информация хранится и обрабатывается Google/Apple в соответствии с их политиками конфиденциальности.',
        ],
      },
      {
        title: '6. Передача данных третьим лицам',
        content: [
          'Мы не продаём ваши персональные данные третьим лицам.',
          'Мы можем передавать данные в следующих случаях:',
          '• С вашего согласия',
          '• Для соблюдения законодательства',
          '• Защиты наших законных прав',
        ],
      },
      {
        title: '7. Ваши права',
        content: [
          'Вы имеете право:',
          '• Запросить копию ваших данных',
          '• Запросить удаление ваших данных',
          '• Отозвать согласие на обработку данных',
          '• Отписаться от подписки в любое время через Google Play / App Store',
        ],
      },
      {
        title: '8. Хранение данных',
        content: [
          'Ваши данные хранятся на серверах в рамках срока использования приложения. После удаления аккаунта данные удаляются в течение 30 дней.',
        ],
      },
      {
        title: '9. Дети',
        content: [
          'Приложение «Рецептор» предназначено для бизнеса (кафе, рестораны) и не ориентировано на детей. Мы намеренно не собираем данные лиц младше 16 лет.',
        ],
      },
      {
        title: '10. Изменения политики',
        content: [
          'Мы можем периодически обновлять эту политику. Рекомендуем проверять её периодически. Продолжая использовать приложение после изменений, вы принимаете обновлённую политику.',
        ],
      },
      {
        title: '11. Контактная информация',
        content: [
          'По вопросам конфиденциальности обращайтесь:',
        ],
      },
    ],
    footer: '© {{year}} Рецептор. Все права защищены.',
  },
  EN: {
    lastUpdated: 'Last updated:',
    sections: [
      {
        title: '1. Introduction',
        content: [
          'This Privacy Policy describes how "Receptor" ("we", "our app") collects, uses, and protects user information.',
          'By using our mobile application, you agree to the terms of this policy.',
        ],
      },
      {
        title: '2. Information We Collect',
        content: [
          'During registration, we collect your username, email, and password (encrypted).',
          'We store the recipes, ingredients, and sales data you create on our secure servers.',
          'We may collect device type, operating system, and app version information to improve service quality.',
        ],
      },
      {
        title: '3. How We Use Information',
        content: [
          'We use the collected information for:',
          '• Providing app functionality (recipe calculator, sales tracking)',
          '• Processing Premium and Ambassador subscriptions',
          '• Improving app performance',
          '• Communicating with users (upon request)',
        ],
      },
      {
        title: '4. Data Security',
        content: [
          'We apply modern security measures to protect your data:',
          '• Password encryption using bcrypt',
          '• Secure connection (HTTPS/TLS)',
          '• JWT tokens for authentication',
          '• Regular backups',
        ],
      },
      {
        title: '5. Subscriptions and Payments',
        content: [
          'Premium subscriptions are processed through Google Play Store or Apple App Store. We only receive subscription status information, not payment details.',
          'Payment information is stored and processed by Google/Apple according to their privacy policies.',
        ],
      },
      {
        title: '6. Data Sharing with Third Parties',
        content: [
          'We do not sell your personal data to third parties.',
          'We may share data in the following cases:',
          '• With your consent',
          '• To comply with legal requirements',
          '• To protect our legal rights',
        ],
      },
      {
        title: '7. Your Rights',
        content: [
          'You have the right to:',
          '• Request a copy of your data',
          '• Request deletion of your data',
          '• Withdraw consent for data processing',
          '• Cancel subscription anytime through Google Play / App Store',
        ],
      },
      {
        title: '8. Data Retention',
        content: [
          'Your data is stored on servers during the period of app usage. After account deletion, data is removed within 30 days.',
        ],
      },
      {
        title: '9. Children',
        content: [
          'The "Receptor" app is designed for business (cafes, restaurants) and is not intended for children. We do not knowingly collect data from individuals under 16 years of age.',
        ],
      },
      {
        title: '10. Policy Changes',
        content: [
          'We may periodically update this policy. We recommend checking it periodically. By continuing to use the app after changes, you accept the updated policy.',
        ],
      },
      {
        title: '11. Contact Information',
        content: [
          'For privacy inquiries, please contact:',
        ],
      },
    ],
    footer: '© {{year}} Receptor. All rights reserved.',
  },
};

const PrivacyPolicyScreen = () => {
  const { language, changeLanguage } = useTranslation();
  const policy = PRIVACY_POLICY[language] || PRIVACY_POLICY.RU;

  const languages = [
    { code: 'KZ', label: 'KZ' },
    { code: 'RU', label: 'RU' },
    { code: 'EN', label: 'EN' },
  ];

  const openLink = (url) => {
    Linking.openURL(url).catch(() => {});
  };

  const getLocaleDate = () => {
    const locales = { KZ: 'kk-KZ', RU: 'ru-RU', EN: 'en-US' };
    return new Date().toLocaleDateString(locales[language] || 'ru-RU');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.lastUpdated}>{policy.lastUpdated} {getLocaleDate()}</Text>

      {/* Language Switcher */}
      <View style={styles.languageSwitcher}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.languageButton,
              language === lang.code && styles.languageButtonActive,
            ]}
            onPress={() => changeLanguage(lang.code)}
          >
            <Text style={styles.languageButtonText}>{lang.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {policy.sections.map((section, index) => (
        <View key={index} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.content.map((paragraph, pIndex) => (
            <Text key={pIndex} style={styles.paragraph}>{paragraph}</Text>
          ))}
        </View>
      ))}

      <View style={styles.section}>
        <Text style={styles.paragraph}>
          Email:{' '}
          <Text style={styles.link} onPress={() => openLink('mailto:support@receptor.kz')}>
            support@receptor.kz
          </Text>
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {policy.footer.replace('{{year}}', new Date().getFullYear())}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: THEME.spacing.lg,
  },
  lastUpdated: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: THEME.spacing.md,
    fontStyle: 'italic',
  },
  languageSwitcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: THEME.spacing.lg,
  },
  languageButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.roundness,
    marginHorizontal: THEME.spacing.xs,
  },
  languageButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  section: {
    marginBottom: THEME.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: THEME.spacing.md,
  },
  paragraph: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: THEME.spacing.sm,
  },
  link: {
    color: COLORS.accent,
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: THEME.spacing.xl,
    paddingTop: THEME.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
});

export default PrivacyPolicyScreen;
