import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/env.dart';

/// Result of an auth action — mirrors the web app's `AuthResult`
/// (`app/login/actions.ts`): either an error or a non-error notice.
class AuthResult {
  const AuthResult({this.error, this.notice});
  final String? error;
  final String? notice;

  bool get ok => error == null;

  static const ok_ = AuthResult();
}

/// Email/password + Google auth against Supabase. Vietnamese messages match the
/// web app. When Supabase isn't configured the app runs local-only and these
/// return a guiding error (the native app has no cookie-stub equivalent).
class AuthRepository {
  AuthRepository(this._client);

  final SupabaseClient _client;

  static final _emailRe = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

  Session? get currentSession => _client.auth.currentSession;
  User? get currentUser => _client.auth.currentUser;
  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;

  Future<AuthResult> signIn(String email, String password) async {
    email = email.trim();
    if (email.isEmpty || password.isEmpty) {
      return const AuthResult(error: 'Vui lòng nhập email và mật khẩu.');
    }
    if (!_emailRe.hasMatch(email)) {
      return const AuthResult(error: 'Email không hợp lệ.');
    }
    if (!Env.isSupabaseConfigured) {
      return const AuthResult(error: 'Chưa cấu hình Supabase.');
    }
    try {
      await _client.auth.signInWithPassword(email: email, password: password);
      return AuthResult.ok_;
    } on AuthException {
      return const AuthResult(error: 'Email hoặc mật khẩu không đúng.');
    }
  }

  Future<AuthResult> signUp(String email, String password) async {
    email = email.trim();
    if (!_emailRe.hasMatch(email)) {
      return const AuthResult(error: 'Email không hợp lệ.');
    }
    if (password.length < 6) {
      return const AuthResult(error: 'Mật khẩu cần ít nhất 6 ký tự.');
    }
    if (!Env.isSupabaseConfigured) {
      return const AuthResult(error: 'Chưa cấu hình Supabase.');
    }
    try {
      final res = await _client.auth.signUp(email: email, password: password);
      if (res.session == null) {
        return const AuthResult(
          notice: 'Đã gửi email xác nhận. Kiểm tra hộp thư rồi đăng nhập.',
        );
      }
      return AuthResult.ok_;
    } on AuthException catch (e) {
      final already = RegExp('already registered', caseSensitive: false)
          .hasMatch(e.message);
      return AuthResult(
        error: already
            ? 'Email này đã được đăng ký. Hãy đăng nhập.'
            : 'Không tạo được tài khoản. Vui lòng thử lại.',
      );
    }
  }

  Future<AuthResult> signInWithGoogle() async {
    if (!Env.isSupabaseConfigured) {
      return const AuthResult(error: 'Đăng nhập Google cần cấu hình Supabase.');
    }
    try {
      await _client.auth.signInWithOAuth(OAuthProvider.google);
      return AuthResult.ok_;
    } on AuthException {
      return const AuthResult(error: 'Không thể đăng nhập với Google.');
    }
  }

  Future<void> signOut() => _client.auth.signOut();
}
