/// Local date helpers. `yyyy-mm-dd` strings match the web app + the Supabase
/// `*_on` date columns.
String todayIso() => isoDate(DateTime.now());

String isoDate(DateTime d) {
  final m = d.month.toString().padLeft(2, '0');
  final day = d.day.toString().padLeft(2, '0');
  return '${d.year}-$m-$day';
}
