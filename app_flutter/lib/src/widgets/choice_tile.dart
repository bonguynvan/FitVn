import 'package:flutter/material.dart';

import '../theme/tokens.dart';

/// Selectable option tile — the web app's `Choice`: emerald-tinted when active,
/// hairline border otherwise. Optional [hint] for a secondary line.
class ChoiceTile extends StatelessWidget {
  const ChoiceTile({
    super.key,
    required this.active,
    required this.title,
    required this.onTap,
    this.hint,
  });

  final bool active;
  final String title;
  final String? hint;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: AppRadii.btnR,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: active
                ? AppColors.primary.withValues(alpha: 0.10)
                : AppColors.surface,
            borderRadius: AppRadii.btnR,
            border: Border.all(
                color: active ? AppColors.primary : AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: active ? AppColors.text : AppColors.textMuted,
                ),
              ),
              if (hint != null) ...[
                const SizedBox(height: 2),
                Text(hint!,
                    style: const TextStyle(
                        fontSize: 11, height: 1.2, color: AppColors.textMuted)),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
