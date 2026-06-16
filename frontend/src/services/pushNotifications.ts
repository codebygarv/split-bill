import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Dynamically load expo-notifications to prevent Expo Go SDK 53+ crash on Android
let Notifications: any = null;
try {
  const isExpoGo = Constants.appOwnership === 'expo';
  if (!isExpoGo) {
    Notifications = require('expo-notifications');
  } else {
    console.log('EAS Push Notifications are not supported in Expo Go on SDK 53+. Please use a development build.');
  }
} catch (e) {
  console.log('Failed to load expo-notifications:', e);
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Notifications) {
    return null;
  }

  if (!Device.isDevice) {
    console.log('Must use physical device for Push Notifications');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      console.log('Project ID not found in Constants');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2BA8A2',
      });
    }

    return token;
  } catch (error) {
    console.log('Error registering for push notifications:', error);
    return null;
  }
}
