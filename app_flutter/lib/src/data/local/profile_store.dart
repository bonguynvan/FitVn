import 'dart:convert';

import 'package:fitvn_domain/fitvn_domain.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Local profile persistence — mirrors the web app's localStorage
/// `profile-store`. The on-device copy is the source of truth for the UI
/// (local-first); cloud sync to the `profiles` row happens separately when
/// signed in (see ProfileRepository).
class ProfileStore {
  static const _key = 'fitvn.profile.v1';

  Future<UserProfile?> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null) return null;
    try {
      return UserProfile.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null; // corrupt payload — treat as no profile
    }
  }

  Future<void> save(UserProfile profile) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(profile.toJson()));
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}
