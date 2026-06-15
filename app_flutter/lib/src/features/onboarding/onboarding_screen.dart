import 'package:fitvn_domain/fitvn_domain.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../theme/tokens.dart';
import '../../widgets/app_card.dart';
import '../../widgets/choice_tile.dart';
import '../../widgets/number_field.dart';
import '../profile/profile_controller.dart';

/// First-run guided setup — port of the web `OnboardingFlow`: name → goal →
/// body → health, then saves the profile. Body metrics use the free-typing
/// [NumberField]; validation/clamping happens on save (via the controller),
/// never while typing.
class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

const _steps = ['Chào mừng', 'Mục tiêu', 'Cơ thể', 'Sức khỏe'];
final _fmt = NumberFormat.decimalPattern('vi_VN');

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  int _step = 0;
  UserProfile _form = const UserProfile();
  final _nameCtrl = TextEditingController();

  bool get _canContinue => _step != 0 || _nameCtrl.text.trim().isNotEmpty;

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  void _set(UserProfile next) => setState(() => _form = next);

  void _next() {
    if (_step < _steps.length - 1 && _canContinue) setState(() => _step += 1);
  }

  void _toggleCondition(ConditionKey key) {
    final cur = [..._form.conditions];
    cur.contains(key) ? cur.remove(key) : cur.add(key);
    _set(_form.copyWith(conditions: cur, goutMode: () => cur.contains(ConditionKey.gout)));
  }

  Future<void> _finish() async {
    await ref
        .read(profileControllerProvider.notifier)
        .save(_form.copyWith(name: _nameCtrl.text));
    // The root gate watches the profile and swaps to home automatically.
  }

  @override
  Widget build(BuildContext context) {
    final targets = computeTargets(_form);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: kAppMaxWidth),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                children: [
                  const SizedBox(height: 16),
                  _ProgressBar(step: _step),
                  const SizedBox(height: 20),
                  Expanded(
                    child: SingleChildScrollView(
                      child: _stepBody(targets),
                    ),
                  ),
                  _nav(),
                  const SizedBox(height: 12),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _stepBody(DailyTargets targets) {
    switch (_step) {
      case 0:
        return _welcomeStep();
      case 1:
        return _goalStep();
      case 2:
        return _bodyStep(targets);
      default:
        return _healthStep(targets);
    }
  }

  Widget _welcomeStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Chào mừng đến FitVN',
            style: Theme.of(context).textTheme.headlineLarge),
        const SizedBox(height: 8),
        const Text(
          'Theo dõi dinh dưỡng, tập luyện và sức khỏe — cá nhân hoá cho người Việt. '
          'Hãy thiết lập vài thông tin để tính mục tiêu phù hợp với bạn.',
          style: TextStyle(color: AppColors.textMuted, height: 1.5),
        ),
        const SizedBox(height: 20),
        const Text('Tên hiển thị',
            style: TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 6),
        TextField(
          controller: _nameCtrl,
          autofocus: true,
          onChanged: (_) => setState(() {}),
          decoration: const InputDecoration(hintText: 'Tên của bạn'),
        ),
      ],
    );
  }

  Widget _goalStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _FieldLabel('Mục tiêu của bạn'),
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
        const _FieldLabel('Giới tính'),
        Row(
          children: [
            for (final s in sexOptions)
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceTile(
                    active: _form.sex == s.value,
                    title: s.label,
                    onTap: () => _set(_form.copyWith(sex: s.value)),
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }

  Widget _bodyStep(DailyTargets targets) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
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
        const _FieldLabel('Mức vận động'),
        for (final a in activityOptions)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: ChoiceTile(
              active: _form.activityLevel == a.value,
              title: a.label,
              onTap: () => _set(_form.copyWith(activityLevel: a.value)),
            ),
          ),
        const SizedBox(height: 8),
        _TargetSummary(targets: targets),
      ],
    );
  }

  Widget _healthStep(DailyTargets targets) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Tình trạng sức khỏe',
            style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 8),
        const Text(
          'Chọn tình trạng (nếu có) để FitVN điều chỉnh cảnh báo và lời khuyên. '
          'Có thể bỏ qua.',
          style: TextStyle(color: AppColors.textMuted, height: 1.5),
        ),
        const SizedBox(height: 16),
        for (final key in conditionOrder)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: ChoiceTile(
              active: _form.conditions.contains(key),
              title: conditions[key]!.label,
              hint: conditions[key]!.hint,
              onTap: () => _toggleCondition(key),
            ),
          ),
        const SizedBox(height: 8),
        _TargetSummary(targets: targets),
      ],
    );
  }

  Widget _nav() {
    final isLast = _step == _steps.length - 1;
    return Row(
      children: [
        if (_step > 0)
          OutlinedButton(
            onPressed: () => setState(() => _step -= 1),
            child: const Text('Quay lại'),
          ),
        const SizedBox(width: 8),
        Expanded(
          child: FilledButton(
            onPressed: isLast ? _finish : (_canContinue ? _next : null),
            child: Text(isLast ? 'Bắt đầu' : 'Tiếp tục'),
          ),
        ),
      ],
    );
  }
}

class _ProgressBar extends StatelessWidget {
  const _ProgressBar({required this.step});
  final int step;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (var i = 0; i < _steps.length; i++)
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(right: 6),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    height: 6,
                    decoration: BoxDecoration(
                      color: i <= step ? AppColors.primary : AppColors.surfaceRaised,
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(_steps[i],
                      style: TextStyle(
                          fontSize: 11,
                          color: i == step ? AppColors.text : AppColors.textMuted,
                          fontWeight: i == step ? FontWeight.w600 : FontWeight.w400)),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _TargetSummary extends StatelessWidget {
  const _TargetSummary({required this.targets});
  final DailyTargets targets;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      raised: true,
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.12),
              borderRadius: AppRadii.btnR,
            ),
            child: const Icon(Icons.local_fire_department,
                color: AppColors.primary),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Mục tiêu hằng ngày',
                  style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
              Text('${_fmt.format(targets.calories)} kcal',
                  style: const TextStyle(
                      fontSize: 22, fontWeight: FontWeight.w600)),
              Text(
                'Đạm ${targets.proteinG}g · Tinh bột ${targets.carbsG}g · Béo ${targets.fatG}g',
                style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(text, style: const TextStyle(fontWeight: FontWeight.w600)),
    );
  }
}
