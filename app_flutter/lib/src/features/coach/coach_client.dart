import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../core/env.dart';

/// One chat turn sent to the coach.
class CoachMessage {
  const CoachMessage({required this.role, required this.text});
  final String role; // 'user' | 'assistant'
  final String text;

  Map<String, dynamic> toJson() => {'role': role, 'text': text};
}

/// Client for the FitVN coach endpoint (Supabase Edge Function — see
/// `supabase/functions/coach`). Local-first like the web app: the caller passes
/// the personalized `context` map built from the local store, so the endpoint
/// needs no server-side data fetch.
///
/// PHASE 2 SCOPE: request/response only. Token streaming is a Phase 3 UX
/// enhancement once the chat screen exists.
class CoachClient {
  CoachClient({http.Client? httpClient}) : _http = httpClient ?? http.Client();

  final http.Client _http;

  Future<String> ask({
    required List<CoachMessage> messages,
    Map<String, dynamic> context = const {},
    String preset = 'default',
  }) async {
    if (Env.coachEndpoint.isEmpty) {
      throw StateError('COACH_ENDPOINT is not configured.');
    }
    final res = await _http.post(
      Uri.parse(Env.coachEndpoint),
      headers: const {'content-type': 'application/json'},
      body: jsonEncode({
        'messages': messages.map((m) => m.toJson()).toList(),
        'context': context,
        'preset': preset,
      }),
    );
    if (res.statusCode != 200) {
      throw http.ClientException(
        'Coach request failed (${res.statusCode}): ${res.body}',
      );
    }
    final decoded = jsonDecode(utf8.decode(res.bodyBytes)) as Map;
    return (decoded['reply'] as String?) ?? '';
  }
}
