import 'package:flutter/material.dart';

import '../theme/tokens.dart';

/// Surface card matching the web app's `Card` primitive (rounded, soft shadow).
class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.raised = false,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final bool raised;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadii.cardR,
        border: Border.all(color: AppColors.border),
        boxShadow: raised ? AppShadows.card : null,
      ),
      child: child,
    );
  }
}
