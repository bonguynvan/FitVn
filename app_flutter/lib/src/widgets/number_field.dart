import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/tokens.dart';

/// Numeric input that lets the user type freely — the Dart port of the web
/// app's `NumberField` (and the behavior fix that motivated this migration).
///
///   - No clamping/validation mid-keystroke; partial entries ("1" on the way to
///     "15") are left untouched, and the raw number is propagated upward so live
///     previews stay in sync.
///   - On blur, if [min]/[max] are given the value snaps into range.
///   - The caller still validates authoritatively on confirm
///     (`clampProfileMetrics`).
class NumberField extends StatefulWidget {
  const NumberField({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.min,
    this.max,
    this.allowDecimal = false,
  });

  final String label;
  final double value;
  final ValueChanged<double> onChanged;
  final double? min;
  final double? max;
  final bool allowDecimal;

  @override
  State<NumberField> createState() => _NumberFieldState();
}

class _NumberFieldState extends State<NumberField> {
  late final TextEditingController _controller =
      TextEditingController(text: _fmt(widget.value));
  late final FocusNode _focus = FocusNode();

  @override
  void initState() {
    super.initState();
    _focus.addListener(_onFocusChange);
  }

  @override
  void didUpdateWidget(NumberField old) {
    super.didUpdateWidget(old);
    // Reflect external value changes (e.g. clamping on save) while not editing.
    if (!_focus.hasFocus && widget.value != old.value) {
      _controller.text = _fmt(widget.value);
    }
  }

  @override
  void dispose() {
    _focus.removeListener(_onFocusChange);
    _focus.dispose();
    _controller.dispose();
    super.dispose();
  }

  void _onFocusChange() {
    if (_focus.hasFocus) return;
    // Snap into range now that the user has left the field.
    final n = double.tryParse(_controller.text.replaceAll(',', '.'));
    if (n == null) {
      _controller.text = _fmt(widget.value); // revert blank/garbage
      return;
    }
    final lo = widget.min ?? n;
    final hi = widget.max ?? n;
    final snapped = n.clamp(lo, hi).toDouble();
    _controller.text = _fmt(snapped);
    if (snapped != widget.value) widget.onChanged(snapped);
  }

  String _fmt(double v) {
    if (!v.isFinite) return '';
    return widget.allowDecimal ? '$v' : '${v.round()}';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(widget.label,
            style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: AppColors.textMuted)),
        const SizedBox(height: 6),
        TextField(
          controller: _controller,
          focusNode: _focus,
          textAlign: TextAlign.center,
          keyboardType: TextInputType.numberWithOptions(
              decimal: widget.allowDecimal),
          inputFormatters: [
            FilteringTextInputFormatter.allow(
                widget.allowDecimal ? RegExp(r'[0-9.,]') : RegExp(r'[0-9]')),
          ],
          style: const TextStyle(
              fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.text),
          onChanged: (raw) {
            // Propagate unclamped; validation happens on blur / confirm.
            final n = double.tryParse(raw.replaceAll(',', '.'));
            if (raw.isNotEmpty && n != null) widget.onChanged(n);
          },
        ),
      ],
    );
  }
}
