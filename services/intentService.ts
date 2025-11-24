
import { ActionPayload } from '../types';

export const intentService = {
  execute: (payload: ActionPayload) => {
    const isAndroid = /android/i.test(navigator.userAgent);
    console.log("Executing Intent:", payload);

    switch (payload.action) {
      case 'OPEN_APP':
        handleAppLaunch(payload.data.appName, isAndroid);
        break;
      
      case 'CALL':
        // Direct dial intent
        window.location.href = `tel:${payload.data.number}`;
        break;
        
      case 'WHATSAPP':
        // Use intent:// protocol for Android to open specific contact or text
        const phone = payload.data.number ? payload.data.number.replace(/\D/g, '') : '';
        const text = encodeURIComponent(payload.data.message || '');
        
        if (isAndroid) {
            // Android Intent for WhatsApp
            const waUrl = phone 
                ? `intent://send?phone=${phone}&text=${text}#Intent;package=com.whatsapp;scheme=whatsapp;end`
                : `intent://send?text=${text}#Intent;package=com.whatsapp;scheme=whatsapp;end`;
            window.location.href = waUrl;
        } else {
            // Fallback for Web
            const webUrl = phone 
                ? `https://wa.me/${phone}?text=${text}`
                : `https://wa.me/?text=${text}`;
            window.open(webUrl, '_blank');
        }
        break;

      case 'ALARM':
        // Attempt to set alarm via Intent
        if (isAndroid) {
            const { hour, minute, message } = payload.data;
            // Android Alarm Intent
            const alarmIntent = `intent:#Intent;action=android.intent.action.SET_ALARM;i.android.intent.extra.HOUR=${hour};i.android.intent.extra.MINUTES=${minute};s.android.intent.extra.MESSAGE=${encodeURIComponent(message || 'Nexa Alarm')};B.android.intent.extra.SKIP_UI=true;end`;
            window.location.href = alarmIntent;
        } else {
            alert(`[SIMULATION] Alarm set for ${payload.data.hour}:${payload.data.minute}`);
        }
        break;
    }
  }
};

const handleAppLaunch = (appName: string, isAndroid: boolean) => {
    const app = appName.toLowerCase();
    
    if (app.includes('whatsapp')) {
        isAndroid 
          ? window.location.href = 'intent://#Intent;package=com.whatsapp;scheme=whatsapp;end'
          : window.open('https://web.whatsapp.com', '_blank');
    } 
    else if (app.includes('youtube')) {
        isAndroid
          ? window.location.href = 'intent://www.youtube.com/#Intent;package=com.google.android.youtube;scheme=https;end'
          : window.open('https://youtube.com', '_blank');
    }
    else if (app.includes('instagram')) {
        isAndroid
          ? window.location.href = 'intent://instagram.com/#Intent;package=com.instagram.android;scheme=https;end'
          : window.open('https://instagram.com', '_blank');
    }
    else if (app.includes('camera')) {
        // Trigger file input for camera behavior in PWA
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.click();
    }
    else if (app.includes('chrome') || app.includes('browser')) {
        window.open('https://google.com', '_blank');
    }
    else if (app.includes('settings')) {
        if(isAndroid) window.location.href = 'intent:#Intent;action=android.settings.SETTINGS;end';
    }
    else if (app.includes('phone') || app.includes('dialer')) {
        window.location.href = 'tel:';
    }
    else {
        // Generic Search fallback
        window.open(`https://www.google.com/search?q=${appName}`, '_blank');
    }
};
