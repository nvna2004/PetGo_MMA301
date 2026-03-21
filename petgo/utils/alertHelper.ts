import { Alert, Platform } from 'react-native';

let MySwal: any = null;

if (Platform.OS === 'web') {
  const Swal = require('sweetalert2');
  const withReactContent = require('sweetalert2-react-content');
  MySwal = withReactContent(Swal);
}

/**
 * 🔔 Universal Alert Service
 */
export const showSuccess = (title: string, message: string) => {
  if (Platform.OS === 'web' && MySwal) {
    MySwal.fire({
      icon: 'success',
      title: title,
      text: message,
      confirmButtonColor: '#3085d6',
    });
  } else {
    Alert.alert(title, message);
  }
};

export const showError = (title: string, message: string) => {
  if (Platform.OS === 'web' && MySwal) {
    MySwal.fire({
      icon: 'error',
      title: title,
      text: message,
      confirmButtonColor: '#d33',
    });
  } else {
    Alert.alert(title, message);
  }
};

export const showWarning = (title: string, message: string) => {
  if (Platform.OS === 'web' && MySwal) {
    MySwal.fire({
      icon: 'warning',
      title: title,
      text: message,
      confirmButtonColor: '#3085d6',
    });
  } else {
    Alert.alert(title, message);
  }
};

export const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  if (Platform.OS === 'web' && MySwal) {
    MySwal.fire({
      toast: true,
      position: 'top-end',
      icon: type,
      title: message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  } else {
    // Basic console log or alert for native toast-like behavior if needed
    console.log(`Toast (${type}): ${message}`);
  }
};

export const showConfirm = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
) => {
  if (Platform.OS === 'web' && MySwal) {
    MySwal.fire({
      title: title,
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#FF6F61',
      cancelButtonColor: '#999',
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy'
    }).then((result: any) => {
      if (result.isConfirmed) {
        onConfirm();
      } else if (onCancel) {
        onCancel();
      }
    });
  } else {
    Alert.alert(
      title,
      message,
      [
        { text: 'Hủy', onPress: onCancel, style: 'cancel' },
        { text: 'Đồng ý', onPress: onConfirm, style: 'destructive' },
      ]
    );
  }
};
