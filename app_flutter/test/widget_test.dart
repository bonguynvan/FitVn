import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:fitvn/src/theme/app_theme.dart';

void main() {
  testWidgets('buildAppTheme produces a usable light theme', (tester) async {
    final theme = buildAppTheme();
    expect(theme.useMaterial3, isTrue);
    expect(theme.brightness, Brightness.light);

    // Smoke-test that the theme renders without throwing.
    await tester.pumpWidget(
      MaterialApp(
        theme: theme,
        home: const Scaffold(body: Center(child: Text('FitVN'))),
      ),
    );
    expect(find.text('FitVN'), findsOneWidget);
  });
}
