import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../theme/tokens.dart';
import '../../widgets/choice_tile.dart';
import 'food_catalog.dart';
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
  String _query = '';
  String _meal = 'breakfast';
  CatalogFood? _selected;
  final _qtyCtrl = TextEditingController(text: '100');

  @override
  void dispose() {
    _qtyCtrl.dispose();
    super.dispose();
  }

  List<CatalogFood> get _results {
    final q = _query.trim().toLowerCase();
    if (q.isEmpty) return seedFoods;
    return seedFoods
        .where((f) => f.nameVi.toLowerCase().contains(q))
        .toList();
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
            onChanged: (v) => setState(() => _query = v),
            decoration: const InputDecoration(
              hintText: 'Tìm món…',
              prefixIcon: Icon(Icons.search),
            ),
          ),
          const SizedBox(height: 8),
          ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 240),
            child: ListView(
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
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _qtyCtrl,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    labelText: 'Khối lượng (g)',
                  ),
                ),
              ),
            ],
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
