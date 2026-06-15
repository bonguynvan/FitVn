import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/env.dart';
import '../../theme/tokens.dart';
import '../../widgets/hero_header.dart';
import 'coach_controller.dart';

class CoachScreen extends ConsumerStatefulWidget {
  const CoachScreen({super.key});

  @override
  ConsumerState<CoachScreen> createState() => _CoachScreenState();
}

class _CoachScreenState extends ConsumerState<CoachScreen> {
  final _input = TextEditingController();

  @override
  void dispose() {
    _input.dispose();
    super.dispose();
  }

  void _send() {
    final text = _input.text;
    if (text.trim().isEmpty) return;
    _input.clear();
    ref.read(coachControllerProvider.notifier).send(text);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(coachControllerProvider);
    return Column(
      children: [
        const HeroHeader(
          eyebrow: 'HLV AI',
          title: 'Trò chuyện cùng HLV',
          subtitle: 'Hỏi về dinh dưỡng, tập luyện và sức khỏe của bạn',
        ),
        if (Env.coachEndpoint.isEmpty)
          Container(
            width: double.infinity,
            color: AppColors.warning.withOpacity(0.12),
            padding: const EdgeInsets.all(12),
            child: const Text(
              'Chưa cấu hình COACH_ENDPOINT — HLV sẽ trả lời mặc định.',
              style: TextStyle(fontSize: 12, color: AppColors.text),
            ),
          ),
        Expanded(
          child: state.messages.isEmpty
              ? const _EmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: state.messages.length,
                  itemBuilder: (_, i) => _Bubble(turn: state.messages[i]),
                ),
        ),
        if (state.sending)
          const Padding(
            padding: EdgeInsets.only(bottom: 8),
            child: Text('HLV đang trả lời…',
                style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
          ),
        _InputBar(controller: _input, onSend: _send, enabled: !state.sending),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(32),
        child: Text(
          'Hãy hỏi mình bất cứ điều gì về chế độ ăn hay buổi tập của bạn nhé!',
          textAlign: TextAlign.center,
          style: TextStyle(color: AppColors.textMuted, height: 1.5),
        ),
      ),
    );
  }
}

class _Bubble extends StatelessWidget {
  const _Bubble({required this.turn});
  final ChatTurn turn;

  @override
  Widget build(BuildContext context) {
    final isUser = turn.role == 'user';
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.78),
        decoration: BoxDecoration(
          color: isUser ? AppColors.primary : AppColors.surfaceRaised,
          borderRadius: AppRadii.cardR,
        ),
        child: Text(
          turn.text,
          style: TextStyle(
            color: isUser ? AppColors.primaryFg : AppColors.text,
            height: 1.4,
          ),
        ),
      ),
    );
  }
}

class _InputBar extends StatelessWidget {
  const _InputBar({
    required this.controller,
    required this.onSend,
    required this.enabled,
  });

  final TextEditingController controller;
  final VoidCallback onSend;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: controller,
                enabled: enabled,
                minLines: 1,
                maxLines: 4,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => onSend(),
                decoration: const InputDecoration(hintText: 'Nhập câu hỏi…'),
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filled(
              onPressed: enabled ? onSend : null,
              icon: const Icon(Icons.send),
            ),
          ],
        ),
      ),
    );
  }
}
