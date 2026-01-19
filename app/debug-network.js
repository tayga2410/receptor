/**
 * Скрипт для проверки подключения к бэкенду
 * Запустите: node debug-network.js
 */

const API_BASE_URL = 'http://localhost:3001/api';

console.log('🔍 Проверка подключения к бэкенду...');
console.log('📍 URL:', API_BASE_URL);
console.log('');

// Проверка здоровья сервера
async function checkHealth() {
  try {
    console.log('1️⃣ Проверка здоровья сервера...');
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('   Status:', response.status);
    const data = await response.json();
    console.log('   Response:', JSON.stringify(data, null, 2));
    return response.ok;
  } catch (error) {
    console.log('   ❌ Ошибка:', error.message);
    console.log('   💡 Убедитесь, что бэкенд запущен на порту 3001');
    return false;
  }
}

// Проверка регистрации
async function testRegister() {
  try {
    console.log('\n2️⃣ Тест регистрации...');
    const testEmail = `test${Date.now()}@example.com`;
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: testEmail,
        password: 'test123456',
      }),
    });

    console.log('   Status:', response.status);
    const data = await response.json();
    console.log('   Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('   ✅ Регистрация успешна!');
      console.log('   📧 Email:', testEmail);
      console.log('   🔑 Token:', data.token ? data.token.substring(0, 50) + '...' : 'N/A');
      return data;
    } else {
      console.log('   ❌ Регистрация не удалась');
      return null;
    }
  } catch (error) {
    console.log('   ❌ Ошибка:', error.message);
    return null;
  }
}

// Проверка логина
async function testLogin(email, password) {
  try {
    console.log('\n3️⃣ Тест логина...');
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('   Status:', response.status);
    const data = await response.json();
    console.log('   Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('   ✅ Логин успешен!');
      console.log('   🔑 Token:', data.token ? data.token.substring(0, 50) + '...' : 'N/A');
      return data;
    } else {
      console.log('   ❌ Логин не удался');
      return null;
    }
  } catch (error) {
    console.log('   ❌ Ошибка:', error.message);
    return null;
  }
}

// Основная функция
async function main() {
  console.log('='.repeat(60));
  console.log('DEBUG NETWORK CONNECTION');
  console.log('='.repeat(60));

  const healthOk = await checkHealth();

  if (!healthOk) {
    console.log('\n❌ Бэкенд недоступен!');
    console.log('\n💡 Решения:');
    console.log('   1. Запустите бэкенд: cd backend && npm run start:dev');
    console.log('   2. Проверьте, что порт 3001 не занят');
    console.log('   3. Проверьте настройки в backend/.env');
    console.log('   4. Проверьте настройки CORS в backend/src/main.ts');
    return;
  }

  console.log('\n✅ Бэкенд доступен! Проверка API...');

  const registerData = await testRegister();

  if (registerData) {
    await testLogin(registerData.user.email, 'test123456');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Проверка завершена!');
  console.log('='.repeat(60));
}

main().catch(console.error);
