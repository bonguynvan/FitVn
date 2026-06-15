import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/tokens.dart';

/// Lightweight line/sparkline chart — no external dependency. Plots a series of
/// values, auto-scaled to its min/max, with an optional soft fill. Used for
/// health-marker trends and any small trend visual.
class LineChart extends StatelessWidget {
  const LineChart({
    super.key,
    required this.values,
    this.height = 64,
    this.color = AppColors.primary,
    this.fill = true,
    this.showDots = false,
  });

  final List<double> values;
  final double height;
  final Color color;
  final bool fill;
  final bool showDots;

  @override
  Widget build(BuildContext context) {
    if (values.length < 2) {
      return SizedBox(
        height: height,
        child: const Center(
          child: Text('Cần ít nhất 2 lần đo để vẽ biểu đồ',
              style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
        ),
      );
    }
    return SizedBox(
      height: height,
      width: double.infinity,
      child: CustomPaint(
        painter: _LinePainter(
          values: values,
          color: color,
          fill: fill,
          showDots: showDots,
        ),
      ),
    );
  }
}

class _LinePainter extends CustomPainter {
  _LinePainter({
    required this.values,
    required this.color,
    required this.fill,
    required this.showDots,
  });

  final List<double> values;
  final Color color;
  final bool fill;
  final bool showDots;

  @override
  void paint(Canvas canvas, Size size) {
    final minV = values.reduce(math.min);
    final maxV = values.reduce(math.max);
    final range = (maxV - minV).abs() < 1e-9 ? 1.0 : (maxV - minV);
    const pad = 4.0;
    final w = size.width;
    final h = size.height - pad * 2;

    Offset at(int i) {
      final x = values.length == 1 ? 0.0 : i / (values.length - 1) * w;
      final norm = (values[i] - minV) / range; // 0..1 (low..high)
      final y = pad + (1 - norm) * h; // invert: higher value = higher on screen
      return Offset(x, y);
    }

    final path = Path()..moveTo(at(0).dx, at(0).dy);
    for (var i = 1; i < values.length; i++) {
      path.lineTo(at(i).dx, at(i).dy);
    }

    if (fill) {
      final area = Path.from(path)
        ..lineTo(w, size.height)
        ..lineTo(0, size.height)
        ..close();
      canvas.drawPath(
        area,
        Paint()..color = color.withOpacity(0.12),
      );
    }

    canvas.drawPath(
      path,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round,
    );

    if (showDots) {
      final dot = Paint()..color = color;
      for (var i = 0; i < values.length; i++) {
        canvas.drawCircle(at(i), 2.5, dot);
      }
    }
  }

  @override
  bool shouldRepaint(_LinePainter old) =>
      old.values != values || old.color != color;
}
