import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

/// Server push (FCM → APNs on iOS). Scaffold only.
///
/// NOT initialized automatically — Firebase needs project config that can't
/// ship in source:
///   1. `flutterfire configure` → generates `firebase_options.dart`
///   2. Android: `google-services.json` + the Google services Gradle plugin
///   3. iOS: `GoogleService-Info.plist`, an APNs auth key in Firebase, and the
///      Push Notifications + Background Modes capabilities
///
/// Once that's in place, pass the generated options to [init] from `main` and
/// send the returned token to your backend so it can target this device.
/// The web app's equivalent is lib/push/* (web-push subscriptions).
class PushService {
  PushService(this._onMessage);

  /// Called with each foreground message (show a local notification, etc.).
  final void Function(RemoteMessage message) _onMessage;

  /// Initialize Firebase + messaging. Returns the FCM token, or null if the
  /// user denied permission. Throws if Firebase isn't configured — call only
  /// after wiring `firebase_options.dart`.
  Future<String?> init(FirebaseOptions options) async {
    await Firebase.initializeApp(options: options);

    final messaging = FirebaseMessaging.instance;
    final settings = await messaging.requestPermission();
    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      return null;
    }

    FirebaseMessaging.onMessage.listen(_onMessage);
    return messaging.getToken();
  }
}
