import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../widgets/hero_header.dart';
import '../health/health_markers_section.dart';
import 'measurements_section.dart';

class ProgressScreen extends ConsumerWidget {
  const ProgressScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView(
      padding: EdgeInsets.zero,
      children: const [
        HeroHeader(
          eyebrow: 'Tiến độ',
          title: 'Hành trình của bạn',
          subtitle: 'Cân nặng, số đo và chỉ số sức khỏe',
        ),
        Padding(
          padding: EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              MeasurementsSection(),
              SizedBox(height: 24),
              HealthMarkersSection(),
            ],
          ),
        ),
      ],
    );
  }
}
