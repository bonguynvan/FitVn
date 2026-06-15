import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/date.dart';
import '../../data/local/database.dart';
import '../../theme/tokens.dart';
import '../../widgets/app_card.dart';
import '../../widgets/line_chart.dart';
import '../profile/profile_controller.dart';
import 'measurement_controller.dart';

String _fmt1(double n) =>
    (n % 1 == 0 ? n.toStringAsFixed(0) : n.toStringAsFixed(1))
        .replaceAll('.', ',');

/// Weight (and optional body-fat / waist) history with trend charts.
class MeasurementsSection extends ConsumerWidget {
  const MeasurementsSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final list = ref.watch(measurementsProvider).valueOrNull ?? const [];
    final goal =
        ref.watch(profileControllerProvider).valueOrNull?.targetWeightKg;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Cân nặng & số đo',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            TextButton.icon(
              onPressed: () => showAddMeasurementSheet(context),
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Ghi số đo'),
            ),
          ],
        ),
        const SizedBox(height: 4),
        if (list.isEmpty)
          const AppCard(
            child: Text(
              'Ghi cân nặng để theo dõi xu hướng theo thời gian.',
              style: TextStyle(color: AppColors.textMuted, height: 1.5),
            ),
          )
        else ...[
          _TrendCard(
            title: 'Cân nặng',
            unit: 'kg',
            values: list.map((m) => m.weightKg).toList(),
            goal: goal,
          ),
          _optionalTrend(
              'Mỡ cơ thể',
              '%',
              list
                  .where((m) => m.bodyFatPct != null)
                  .map((m) => m.bodyFatPct!)
                  .toList()),
          _optionalTrend(
              'Vòng eo',
              'cm',
              list
                  .where((m) => m.waistCm != null)
                  .map((m) => m.waistCm!)
                  .toList()),
          const SizedBox(height: 8),
          _History(list: list.reversed.toList()),
        ],
      ],
    );
  }

  Widget _optionalTrend(String title, String unit, List<double> values) {
    if (values.length < 2) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: _TrendCard(title: title, unit: unit, values: values),
    );
  }
}

class _TrendCard extends StatelessWidget {
  const _TrendCard({
    required this.title,
    required this.unit,
    required this.values,
    this.goal,
  });

  final String title;
  final String unit;
  final List<double> values;
  final double? goal;

  @override
  Widget build(BuildContext context) {
    final latest = values.last;
    final first = values.first;
    final delta = latest - first;
    final deltaText =
        '${delta > 0 ? '+' : delta < 0 ? '−' : ''}${_fmt1(delta.abs())}';

    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: AppCard(
        raised: true,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.textMuted)),
                    Text('${_fmt1(latest)} $unit',
                        style: const TextStyle(
                            fontSize: 24, fontWeight: FontWeight.w600)),
                  ],
                ),
                if (values.length >= 2)
                  Text('$deltaText $unit',
                      style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textMuted)),
              ],
            ),
            if (goal != null)
              Text('Mục tiêu: ${_fmt1(goal!)} $unit',
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.textMuted)),
            const SizedBox(height: 12),
            LineChart(
                values: values, height: 80, showDots: values.length <= 12),
          ],
        ),
      ),
    );
  }
}

class _History extends ConsumerWidget {
  const _History({required this.list});
  final List<BodyMeasurement> list; // newest first

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AppCard(
      child: Column(
        children: [
          for (final m in list.take(10))
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  Expanded(
                    child: Text('${_fmt1(m.weightKg)} kg',
                        style: const TextStyle(fontWeight: FontWeight.w600)),
                  ),
                  Text(m.measuredOn,
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.textMuted)),
                  IconButton(
                    icon: const Icon(Icons.close, size: 18),
                    onPressed: () =>
                        ref.read(measurementActionsProvider).remove(m.id),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

// --- Add measurement sheet --------------------------------------------------

Future<void> showAddMeasurementSheet(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (_) => const _AddMeasurementSheet(),
  );
}

class _AddMeasurementSheet extends ConsumerStatefulWidget {
  const _AddMeasurementSheet();

  @override
  ConsumerState<_AddMeasurementSheet> createState() =>
      _AddMeasurementSheetState();
}

class _AddMeasurementSheetState extends ConsumerState<_AddMeasurementSheet> {
  final _weight = TextEditingController();
  final _bodyFat = TextEditingController();
  final _waist = TextEditingController();

  @override
  void dispose() {
    _weight.dispose();
    _bodyFat.dispose();
    _waist.dispose();
    super.dispose();
  }

  double? _parse(TextEditingController c) {
    if (c.text.trim().isEmpty) return null;
    return double.tryParse(c.text.replaceAll(',', '.'));
  }

  Future<void> _save() async {
    final w = _parse(_weight);
    if (w == null || w <= 0) return;
    await ref.read(measurementActionsProvider).add(
          measuredOn: todayIso(),
          weightKg: w,
          bodyFatPct: _parse(_bodyFat),
          waistCm: _parse(_waist),
        );
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 16, 20, 16 + bottomInset),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Center(
            child: Text('Ghi số đo',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _weight,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(labelText: 'Cân nặng (kg)'),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _bodyFat,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(labelText: 'Mỡ cơ thể (%)'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: _waist,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(labelText: 'Vòng eo (cm)'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          FilledButton(onPressed: _save, child: const Text('Lưu số đo')),
        ],
      ),
    );
  }
}
