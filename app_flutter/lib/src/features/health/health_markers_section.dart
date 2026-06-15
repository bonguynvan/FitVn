import 'package:fitvn_domain/fitvn_domain.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/date.dart';
import '../../data/local/database.dart';
import '../../theme/tokens.dart';
import '../../widgets/app_card.dart';
import '../../widgets/line_chart.dart';
import '../profile/profile_controller.dart';
import 'health_controller.dart';

String _fmt(double n) =>
    (n % 1 == 0 ? n.toStringAsFixed(0) : n.toStringAsFixed(1))
        .replaceAll('.', ',');

Color _toneColor(MarkerTone tone) => switch (tone) {
      MarkerTone.success => AppColors.success,
      MarkerTone.warning => AppColors.warning,
      MarkerTone.danger => AppColors.danger,
    };

/// "Chỉ số sức khỏe" — log biomarker readings with reference-range checks and
/// trend sparklines. Drops into the Progress tab.
class HealthMarkersSection extends ConsumerWidget {
  const HealthMarkersSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sex =
        ref.watch(profileControllerProvider).valueOrNull?.sex ?? SexType.male;
    final latest = ref.watch(latestByMarkerProvider);
    final series = ref.watch(seriesByMarkerProvider);
    final shown = markerOrder.where(latest.containsKey).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Chỉ số sức khỏe',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            TextButton.icon(
              onPressed: () => showAddReadingSheet(context),
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Ghi chỉ số'),
            ),
          ],
        ),
        const SizedBox(height: 4),
        if (shown.isEmpty)
          const AppCard(
            child: Text(
              'Ghi acid uric, huyết áp, đường huyết, mỡ máu… để theo dõi và '
              'nhận tư vấn.',
              style: TextStyle(color: AppColors.textMuted, height: 1.5),
            ),
          )
        else
          ...shown.map((key) {
            final def = markers[key]!;
            final r = latest[key]!;
            final ev = def.evaluate(r.value, r.value2, sex);
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _MarkerCard(
                def: def,
                reading: r,
                eval: ev,
                series: series[key] ?? const [],
                onTap: () => showMarkerHistory(context, key),
              ),
            );
          }),
        const Padding(
          padding: EdgeInsets.only(top: 4),
          child: Text(
            'Chỉ mang tính tham khảo, không thay thế chẩn đoán của bác sĩ.',
            style: TextStyle(fontSize: 11, color: AppColors.textMuted),
          ),
        ),
      ],
    );
  }
}

class _MarkerCard extends StatelessWidget {
  const _MarkerCard({
    required this.def,
    required this.reading,
    required this.eval,
    required this.series,
    required this.onTap,
  });

  final MarkerDef def;
  final HealthReading reading;
  final MarkerEval eval;
  final List<double> series;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final valueText = def.hasSecond
        ? '${_fmt(reading.value)}/${reading.value2 != null ? _fmt(reading.value2!) : '—'}'
        : _fmt(reading.value);
    final tone = _toneColor(eval.tone);

    return InkWell(
      onTap: onTap,
      borderRadius: AppRadii.cardR,
      child: AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(def.name,
                          style: const TextStyle(fontWeight: FontWeight.w600)),
                      Text(def.rangeText,
                          style: const TextStyle(
                              fontSize: 11, color: AppColors.textMuted)),
                    ],
                  ),
                ),
                Text('$valueText ',
                    style: const TextStyle(
                        fontSize: 18, fontWeight: FontWeight.w600)),
                Text(def.unit,
                    style: const TextStyle(
                        fontSize: 11, color: AppColors.textMuted)),
                const Icon(Icons.chevron_right, color: AppColors.textMuted),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: tone.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(eval.label,
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: tone)),
                ),
                const Spacer(),
                if (series.length >= 2)
                  SizedBox(
                    width: 96,
                    child: LineChart(values: series, height: 28, color: tone),
                  ),
              ],
            ),
            if (eval.status != MarkerStatus.normal) ...[
              const SizedBox(height: 6),
              Text(eval.advice,
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.textMuted, height: 1.4)),
            ],
          ],
        ),
      ),
    );
  }
}

// --- Add reading sheet ------------------------------------------------------

Future<void> showAddReadingSheet(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (_) => const _AddReadingSheet(),
  );
}

class _AddReadingSheet extends ConsumerStatefulWidget {
  const _AddReadingSheet();

  @override
  ConsumerState<_AddReadingSheet> createState() => _AddReadingSheetState();
}

class _AddReadingSheetState extends ConsumerState<_AddReadingSheet> {
  MarkerKey _marker = markerOrder.first;
  final _value = TextEditingController();
  final _value2 = TextEditingController();

  @override
  void dispose() {
    _value.dispose();
    _value2.dispose();
    super.dispose();
  }

  double? _parse(TextEditingController c) =>
      double.tryParse(c.text.replaceAll(',', '.'));

  Future<void> _save() async {
    final def = markers[_marker]!;
    final v = _parse(_value);
    final v2 = _parse(_value2);
    if (v == null || v <= 0) return;
    if (def.hasSecond && (v2 == null || v2 <= 0)) return;
    await ref.read(healthActionsProvider).add(
          marker: _marker,
          value: v,
          value2: def.hasSecond ? v2 : null,
          measuredOn: todayIso(),
        );
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final def = markers[_marker]!;
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 16, 20, 16 + bottomInset),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Center(
            child: Text('Ghi chỉ số sức khỏe',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final k in markerOrder)
                ChoiceChip(
                  label: Text(markers[k]!.name),
                  selected: _marker == k,
                  onSelected: (_) => setState(() => _marker = k),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Text('Ngưỡng bình thường: ${def.rangeText}',
              style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _value,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: InputDecoration(
                    labelText:
                        def.hasSecond ? 'Tâm thu' : 'Giá trị (${def.unit})',
                  ),
                ),
              ),
              if (def.hasSecond) ...[
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _value2,
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(labelText: 'Tâm trương'),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 16),
          FilledButton(onPressed: _save, child: const Text('Lưu chỉ số')),
        ],
      ),
    );
  }
}

// --- History sheet ----------------------------------------------------------

Future<void> showMarkerHistory(BuildContext context, MarkerKey marker) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (_) => _MarkerHistorySheet(marker: marker),
  );
}

class _MarkerHistorySheet extends ConsumerWidget {
  const _MarkerHistorySheet({required this.marker});
  final MarkerKey marker;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final def = markers[marker]!;
    final all = ref.watch(healthReadingsProvider).valueOrNull ?? const [];
    final rows = all.where((r) => r.marker == marker.wire).toList();
    final series = rows.reversed.map((r) => r.value).toList(); // oldest→newest

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Text('Lịch sử · ${def.name}',
                style:
                    const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          ),
          const SizedBox(height: 16),
          LineChart(values: series, height: 120, showDots: true),
          const SizedBox(height: 16),
          ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 280),
            child: ListView(
              shrinkWrap: true,
              children: [
                for (final r in rows)
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(
                      def.hasSecond
                          ? '${_fmt(r.value)}/${r.value2 != null ? _fmt(r.value2!) : '—'} ${def.unit}'
                          : '${_fmt(r.value)} ${def.unit}',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    subtitle: Text(r.measuredOn,
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.textMuted)),
                    trailing: IconButton(
                      icon: const Icon(Icons.close, size: 18),
                      onPressed: () =>
                          ref.read(healthActionsProvider).remove(r.id),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
