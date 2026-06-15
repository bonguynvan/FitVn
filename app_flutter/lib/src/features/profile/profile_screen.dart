import 'package:fitvn_domain/fitvn_domain.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../theme/tokens.dart';
import '../../widgets/choice_tile.dart';
import '../../widgets/number_field.dart';
import '../../widgets/targets_card.dart';
import 'profile_controller.dart';

/// Edit the profile — same fields as onboarding, reusing the free-typing
/// [NumberField]. Body metrics are clamped on save (by the controller), not
/// while typing.
class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  late UserProfile _form;
  late final TextEditingController _nameCtrl;
  bool _saved = false;

  @override
  void initState() {
    super.initState();
    _form = ref.read(profileControllerProvider).valueOrNull ?? const UserProfile();
    _nameCtrl = TextEditingController(text: _form.name);
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  void _set(UserProfile next) => setState(() {
        _form = next;
        _saved = false;
      });

  Future<void> _save() async {
    await ref
        .read(profileControllerProvider.notifier)
        .save(_form.copyWith(name: _nameCtrl.text));
    if (mounted) setState(() => _saved = true);
  }

  @override
  Widget build(BuildContext context) {
    final targets = _form.customTargets ?? computeTargets(_form);
    return Scaffold(
      appBar: AppBar(title: const Text('Hồ sơ & mục tiêu')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          DailyTargetsCard(targets: targets),
          const SizedBox(height: 20),
          const Text('Tên hiển thị',
              style: TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          TextField(
            controller: _nameCtrl,
            onChanged: (_) => setState(() => _saved = false),
            decoration: const InputDecoration(hintText: 'Tên của bạn'),
          ),
          const SizedBox(height: 20),
          const Text('Mục tiêu', style: TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          for (final g in goalOptions)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: ChoiceTile(
                active: _form.goal == g.value,
                title: g.label,
                hint: g.hint,
                onTap: () => _set(_form.copyWith(goal: g.value)),
              ),
            ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: NumberField(
                  label: 'Tuổi',
                  value: _form.age,
                  min: ProfileBounds.age.min,
                  max: ProfileBounds.age.max,
                  onChanged: (v) => _set(_form.copyWith(age: v)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: NumberField(
                  label: 'Cao (cm)',
                  value: _form.heightCm,
                  min: ProfileBounds.heightCm.min,
                  max: ProfileBounds.heightCm.max,
                  onChanged: (v) => _set(_form.copyWith(heightCm: v)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: NumberField(
                  label: 'Nặng (kg)',
                  value: _form.weightKg,
                  allowDecimal: true,
                  min: ProfileBounds.weightKg.min,
                  max: ProfileBounds.weightKg.max,
                  onChanged: (v) => _set(_form.copyWith(weightKg: v)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Text('Mức vận động',
              style: TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          for (final a in activityOptions)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: ChoiceTile(
                active: _form.activityLevel == a.value,
                title: a.label,
                onTap: () => _set(_form.copyWith(activityLevel: a.value)),
              ),
            ),
          const SizedBox(height: 16),
          const Text('Tình trạng sức khỏe',
              style: TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          for (final key in conditionOrder)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: ChoiceTile(
                active: _form.conditions.contains(key),
                title: conditions[key]!.label,
                hint: conditions[key]!.hint,
                onTap: () {
                  final cur = [..._form.conditions];
                  cur.contains(key) ? cur.remove(key) : cur.add(key);
                  _set(_form.copyWith(
                    conditions: cur,
                    goutMode: () => cur.contains(ConditionKey.gout),
                  ));
                },
              ),
            ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _save,
            child: Text(_saved ? 'Đã lưu ✓' : 'Lưu hồ sơ'),
          ),
        ],
      ),
    );
  }
}
