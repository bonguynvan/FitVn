import 'package:fitvn_domain/fitvn_domain.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/providers.dart';
import '../profile/profile_controller.dart';
import 'coach_client.dart';

class ChatTurn {
  const ChatTurn(this.role, this.text);
  final String role; // 'user' | 'assistant'
  final String text;
}

class CoachState {
  const CoachState({this.messages = const [], this.sending = false});
  final List<ChatTurn> messages;
  final bool sending;

  CoachState copyWith({List<ChatTurn>? messages, bool? sending}) => CoachState(
        messages: messages ?? this.messages,
        sending: sending ?? this.sending,
      );
}

final coachControllerProvider =
    NotifierProvider<CoachController, CoachState>(CoachController.new);

class CoachController extends Notifier<CoachState> {
  @override
  CoachState build() => const CoachState();

  Future<void> send(String text) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty || state.sending) return;

    final history = [...state.messages, ChatTurn('user', trimmed)];
    state = state.copyWith(messages: history, sending: true);

    final client = ref.read(coachClientProvider);
    final profile = ref.read(profileControllerProvider).valueOrNull;
    try {
      final reply = await client.ask(
        messages:
            history.map((t) => CoachMessage(role: t.role, text: t.text)).toList(),
        context: _context(profile),
      );
      state = state.copyWith(
        messages: [...history, ChatTurn('assistant', reply)],
        sending: false,
      );
    } catch (e) {
      state = state.copyWith(
        messages: [
          ...history,
          ChatTurn('assistant', 'Xin lỗi, hiện chưa kết nối được HLV AI.'),
        ],
        sending: false,
      );
    }
  }

  /// Local-first context, mirroring the web app's CoachContext (compact form).
  Map<String, dynamic> _context(UserProfile? p) {
    if (p == null) return {};
    final t = p.customTargets ?? computeTargets(p);
    return {
      'profile': {
        'fullName': p.name,
        'goal': p.goal.wire,
        'heightCm': p.heightCm,
        'weightKg': p.weightKg,
        'targets': t.toJson(),
      },
      'conditions': p.conditions.map((c) => c.wire).toList(),
    };
  }
}
