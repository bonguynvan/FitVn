import 'package:flutter/material.dart';

import '../../theme/tokens.dart';
import '../../widgets/app_card.dart';
import '../../widgets/hero_header.dart';

class WorkoutsScreen extends StatelessWidget {
  const WorkoutsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: EdgeInsets.zero,
      children: const [
        HeroHeader(
          eyebrow: 'Lịch tập',
          title: 'Buổi tập của bạn',
          subtitle: 'Ghi lại bài tập, set và tiến bộ theo thời gian',
        ),
        Padding(
          padding: EdgeInsets.all(20),
          child: AppCard(
            child: Text(
              'Tạo buổi tập, ghi set/rep/tạ và xem tiến bộ sẽ có ở giai đoạn tới. '
              'Buổi tập ghi khi offline sẽ tự đồng bộ lên Supabase khi có mạng '
              '(tầng đồng bộ đã hoàn tất).',
              style: TextStyle(color: AppColors.textMuted, height: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}
