import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';
import { RegisterDto, LoginDto, GoogleAuthDto, TelegramAuthDto } from './dto/auth.dto';

// Интерфейс для payload Google ID Token
interface GooglePayload {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

// Интерфейс для Telegram user data
interface TelegramUserData {
  id: string;
  hash: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date?: string;
}

// Функция для генерации username без зависимостей
function generateUsername(base: string, suffix: string): string {
  const random = Math.random().toString(36).substring(2, 8);
  return `${base}_${suffix}_${random}`.toLowerCase().replace(/[^a-z0-9_]/g, '');
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {
    // Инициализация Google OAuth2 клиента для верификации ID токенов
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async register(registerDto: RegisterDto) {
    // Проверяем, существует ли пользователь
    const existingUser = await this.prisma.user.findUnique({
      where: { username: registerDto.username },
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: registerDto.username,
        email: '',
        password: hashedPassword,
        name: '',
        currency: 'KZT',
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        currency: true,
        subscriptionType: true,
        isAdmin: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    const token = this.generateToken(user.id, user.email);

    return {
      user,
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: loginDto.username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        currency: user.currency,
        subscriptionType: user.subscriptionType,
        isAdmin: user.isAdmin,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  /**
   * Аутентификация через Google
   * Использует ID Token, полученный с клиента через @react-native-google-signin
   */
  async loginWithGoogle(googleAuthDto: GoogleAuthDto) {
    try {
      // Верифицируем ID Token от Google
      const ticket = await this.googleClient.verifyIdToken({
        idToken: googleAuthDto.idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload() as GooglePayload;

      if (!payload) {
        throw new UnauthorizedException('Invalid Google token');
      }

      const { sub: googleId, email, name, picture } = payload;

      // Ищем пользователя по Google ID
      let user = await this.prisma.user.findUnique({
        where: { googleId },
      });

      if (!user && email) {
        // Если не нашли по Google ID, ищем по email
        user = await this.prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // Привязываем Google ID к существующему аккаунту
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: {
              googleId,
              avatarUrl: picture || user.avatarUrl,
            },
          });
        }
      }

      if (!user) {
        // Создаём нового пользователя
        const username = generateUsername(
          name || 'user',
          googleId.substring(0, 8)
        );

        user = await this.prisma.user.create({
          data: {
            username,
            email: email || '',
            password: '', // Для OAuth пользователей пароль не нужен
            name: name || '',
            googleId,
            avatarUrl: picture,
            currency: 'KZT',
          },
        });
      }

      const token = this.generateToken(user.id, user.email);

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          currency: user.currency,
          subscriptionType: user.subscriptionType,
          isAdmin: user.isAdmin,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
        },
        token,
      };
    } catch (error) {
      this.logger.error('Google auth error:', error);
      throw new UnauthorizedException('Failed to authenticate with Google');
    }
  }

  /**
   * Аутентификация через Telegram
   * Проверяет подпись данных от Telegram Login Widget
   */
  async loginWithTelegram(telegramAuthDto: TelegramAuthDto) {
    try {
      const telegramData: TelegramUserData = telegramAuthDto;

      // Проверяем валидность данных от Telegram
      if (!this.validateTelegramAuth(telegramData)) {
        throw new UnauthorizedException('Invalid Telegram authentication data');
      }

      const { id: telegramId, first_name, last_name, username: tgUsername, photo_url } = telegramData;

      // Ищем пользователя по Telegram ID
      let user = await this.prisma.user.findUnique({
        where: { telegramId },
      });

      if (!user) {
        // Создаём нового пользователя
        const name = [first_name, last_name].filter(Boolean).join(' ');
        const generatedUsername = generateUsername(
          tgUsername || first_name || 'user',
          telegramId.toString().slice(-6)
        );

        user = await this.prisma.user.create({
          data: {
            username: generatedUsername,
            email: '',
            password: '', // Для OAuth пользователей пароль не нужен
            name,
            telegramId,
            avatarUrl: photo_url,
            currency: 'KZT',
          },
        });
      }

      const token = this.generateToken(user.id, user.email);

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          currency: user.currency,
          subscriptionType: user.subscriptionType,
          isAdmin: user.isAdmin,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
        },
        token,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Telegram auth error:', error);
      throw new UnauthorizedException('Failed to authenticate with Telegram');
    }
  }

  /**
   * Проверка подписи данных от Telegram Login Widget
   * Документация: https://core.telegram.org/widgets/login#checking-authorization
   */
  private validateTelegramAuth(userData: TelegramUserData): boolean {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      this.logger.error('TELEGRAM_BOT_TOKEN is not configured');
      return false;
    }

    const { hash, ...dataToCheck } = userData;

    // Создаём строку данных для проверки в формате key=value, отсортированную по алфавиту
    const dataCheckArr = Object.keys(dataToCheck)
      .filter(key => dataToCheck[key as keyof typeof dataToCheck] !== undefined)
      .sort()
      .map(key => `${key}=${dataToCheck[key as keyof typeof dataToCheck]}`);

    const dataCheckString = dataCheckArr.join('\n');

    // Вычисляем секретный ключ (SHA256 от токена бота)
    const secretKey = crypto
      .createHash('sha256')
      .update(botToken)
      .digest();

    // Вычисляем HMAC-SHA256 от данных
    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Сравниваем хеши
    return computedHash === hash;
  }

  private generateToken(userId: string, email: string): string {
    return this.jwtService.sign({
      sub: userId,
      email,
    });
  }
}
