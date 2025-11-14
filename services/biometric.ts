import * as LocalAuthentication from 'expo-local-authentication';
import { storageUtils, storageKeys } from '@/lib/storage';

/**
 * Сервис биометрической аутентификации
 */

class BiometricService {
    /**
     * Проверка доступности биометрии на устройстве
     */
    async isAvailable(): Promise<boolean> {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        return compatible && enrolled;
    }

    /**
     * Получить тип биометрии
     */
    async getBiometricType(): Promise<string> {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            return 'Face ID';
        }
        if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            return 'Touch ID';
        }
        if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
            return 'Iris';
        }

        return 'Биометрия';
    }

    /**
     * Аутентификация пользователя
     */
    async authenticate(reason?: string): Promise<boolean> {
        const biometricType = await this.getBiometricType();

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: reason || `Используйте ${biometricType} для разблокировки`,
            cancelLabel: 'Отмена',
            disableDeviceFallback: false,
        });

        return result.success;
    }

    /**
     * Проверка, включена ли биометрическая блокировка
     */
    async isBiometricLockEnabled(): Promise<boolean> {
        const enabled = await storageUtils.get<boolean>(storageKeys.BIOMETRIC_ENABLED);
        return enabled || false;
    }

    /**
     * Включить/выключить биометрическую блокировку
     */
    async setBiometricLockEnabled(enabled: boolean): Promise<void> {
        await storageUtils.set(storageKeys.BIOMETRIC_ENABLED, enabled);
    }
}

export const biometricService = new BiometricService();

