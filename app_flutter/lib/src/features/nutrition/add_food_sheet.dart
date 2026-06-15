import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/providers.dart';
import '../../theme/tokens.dart';
import '../../widgets/choice_tile.dart';
import 'food.dart';
import 'nutrition_controller.dart';

const _meals = [
  ('breakfast', 'Bữa sáng'),
  ('lunch', 'Bữa trưa'),
  ('dinner', 'Bữa tối'),
  ('snack', 'Ăn vặt'),
];

Future<void> showAddFoodSheet(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (_) => const _AddFoodSheet(),
  );
}

class _AddFoodSheet extends ConsumerStatefulWidget {
  const _AddFoodSheet();

  @override
  ConsumerState<_AddFoodSheet> createState() => _AddFoodSheetState();
}

class _AddFoodSheetState extends ConsumerState<_AddFoodSheet> {
  String _meal = 'breakfast';
  Food? _selected;
  List<Food> _results = [];
  bool _loading = true;
  Timer? _debounce;
  final _qtyCtrl = TextEditingController(text: '100');

  @override
  void initState() {
    super.initState();
    _runSearch('');
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _qtyCtrl.dispose();
    super.dispose();
  }

  void _onQueryChanged(String q) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 250), () => _runSearch(q));
  }

  Future<void> _runSearch(String q) async {
    setState(() => _loading = true);
    final foods = await ref.read(foodRepositoryProvider).search(q);
    if (!mounted) return;
    setState(() {
      _results = foods;
      _loading = false;
    });
  }

  Future<void> _save() async {
    final food = _selected;
    final qty = double.tryParse(_qtyCtrl.text.replaceAll(',', '.'));
    if (food == null || qty == null || qty <= 0) return;
    await ref.read(nutritionActionsProvider).log(
          foodId: food.id,
          mealType: _meal,
          quantityGrams: qty,
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
            child: Text('Ghi món ăn',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: [
              for (final m in _meals)
                ChoiceChip(
                  label: Text(m.$2),
                  selected: _meal == m.$1,
                  onSelected: (_) => setState(() => _meal = m.$1),
                ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            onChanged: _onQueryChanged,
            decoration: const InputDecoration(
              hintText: 'Tìm món…',
              prefixIcon: Icon(Icons.search),
            ),
          ),
          const SizedBox(height: 8),
          ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 260),
            child: _loading
                ? const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: CircularProgressIndicator(),
                    ),
                  )
                : _results.isEmpty
                    ? const Center(
                        child: Padding(
                          padding: EdgeInsets.all(24),
                          child: Text('Không tìm thấy món nào.',
                              style: TextStyle(color: AppColors.textMuted)),
                        ),
                      )
                    : ListView(
                        shrinkWrap: true,
                        children: [
                          for (final f in _results)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 6),
                              child: ChoiceTile(
                                active: _selected?.id == f.id,
                                title: f.nameVi,
                                hint:
                                    '${f.caloriesPer100g.round()} kcal/100g${f.servingDesc != null ? ' · ${f.servingDesc}' : ''}',
                                onTap: () => setState(() => _selected = f),
                              ),
                            ),
                        ],
                      ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _qtyCtrl,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(labelText: 'Khối lượng (g)'),
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: _selected == null ? null : _save,
            child: const Text('Thêm vào nhật ký'),
          ),
        ],
      ),
    );
  }
}
