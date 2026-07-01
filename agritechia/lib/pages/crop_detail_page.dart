import 'package:flutter/material.dart';
import '../constants.dart';
import '../widgets.dart';
import 'crops_page.dart';
import '../services/api_service.dart';

class CropDetailPage extends StatefulWidget {
  final Crop crop;
  const CropDetailPage({super.key, required this.crop});

  @override
  State<CropDetailPage> createState() => _CropDetailPageState();
}

class _CropDetailPageState extends State<CropDetailPage> {
  int _activeTab = 0; // 0: Aperçu, 1: Suivi quotidien, 2: Calendrier

  late double _cropProgress;
  late String _cropStatus;
  late List<Map<String, dynamic>> _dailyLogs;
  bool _initialized = false;

  String _selectedState = 'Bon';
  final List<String> _selectedActionsList = [];
  final TextEditingController _notesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _cropProgress = widget.crop.progress;
    _cropStatus = widget.crop.status;
    _initLogs();
  }

  void _initLogs() {
    if (_initialized) return;
    _initialized = true;
    
    final name = widget.crop.name;
    _dailyLogs = [
      {
        'date': 'Aujourd\'hui',
        'state': _cropStatus,
        'actions': ['Observation', 'Inspection des plants'],
        'notes': 'Les parcelles de $name (superficie de ${widget.crop.surface}) se développent normalement. Le taux de croissance estimé à ${(_cropProgress * 100).toInt()}% est cohérent.',
      },
      {
        'date': 'Il y a 3 jours',
        'state': 'Excellent',
        'actions': ['Irrigation', 'Sarclage'],
        'notes': 'Apport modéré d\'eau sur la variété ${widget.crop.variety}. Nettoyage des adventices.',
      },
      {
        'date': 'Il y a 1 semaine',
        'state': 'Bon',
        'actions': ['Fertilisation'],
        'notes': 'Saisie d\'un nouveau lot de culture en plein champ. Les analyses préliminaires indiquent que le sol soutient adéquatement la culture.',
      },
    ];
  }

  String getEstimatedHarvestDate() {
    try {
      DateTime date = DateTime.tryParse(widget.crop.sowingDate) ?? DateTime.now();
      DateTime harvestStart = date.add(const Duration(days: 90));
      DateTime harvestEnd = date.add(const Duration(days: 105));
      final months = ["Janv.", "Févr.", "Mars", "Avril", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];
      return "${harvestStart.day} - ${harvestEnd.day} ${months[harvestEnd.month - 1]} ${harvestEnd.year}";
    } catch (_) {
      return "10 - 20 Oct. 2026";
    }
  }

  String getDaysRemaining() {
    try {
      DateTime date = DateTime.tryParse(widget.crop.sowingDate) ?? DateTime.now();
      DateTime harvestStart = date.add(const Duration(days: 90));
      int diff = harvestStart.difference(DateTime.now()).inDays;
      if (diff <= 0) {
        return "Récolte en cours ou imminente";
      }
      return "Dans $diff jours • Ajusté suite à l'évolution constatée";
    } catch (_) {
      return "Dans 45 jours • Ajusté suite à l'évolution constatée";
    }
  }

  String getEstimatedYield() {
    double base = 3.2;
    String nameCropLower = widget.crop.name.toLowerCase();
    if (nameCropLower.contains('maïs') || nameCropLower.contains('corn')) {
      base = 4.5;
    } else if (nameCropLower.contains('tomate')) {
      base = 15.0;
    } else if (nameCropLower.contains('manioc') || nameCropLower.contains('cassava')) {
      base = 12.0;
    } else if (nameCropLower.contains('riz') || nameCropLower.contains('rice')) {
      base = 5.2;
    } else if (nameCropLower.contains('café') || nameCropLower.contains('coffee')) {
      base = 1.2;
    } else if (nameCropLower.contains('cacao') || nameCropLower.contains('cocoa')) {
      base = 0.8;
    }
    
    double yieldMin = base * (0.85 + (_cropProgress * 0.15));
    double yieldMax = base * (1.10 + (_cropProgress * 0.10));
    return "${yieldMin.toStringAsFixed(1)} - ${yieldMax.toStringAsFixed(1)} t/ha";
  }

  String cropLocation() {
    final v = widget.crop.variety;
    if (v.toLowerCase().contains('central') || v.toLowerCase().contains('standard')) {
      return "Ngaoundéré, Cameroun";
    }
    return "$v, Cameroun";
  }

  void _addDailyLog() {
    _selectedState = 'Bon';
    _selectedActionsList.clear();
    _notesController.clear();
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          return _buildAddLogBottomSheet(setModalState);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AgriSenseColors.bgDeep : const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context, true),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  widget.crop.name,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: AgriSenseColors.brandPrimary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    _cropStatus,
                    style: const TextStyle(color: AgriSenseColors.brandPrimary, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            Text(
              "Variété: ${widget.crop.variety} • Semis: ${widget.crop.sowingDate}",
              style: const TextStyle(color: Colors.white54, fontSize: 11),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined, color: Colors.white),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.more_vert, color: Colors.white),
            onPressed: () {},
          ),
        ],
      ),
      body: Column(
        children: [
          const SizedBox(height: 16),
          // Tabs
          _buildTabs(isDark),
          const SizedBox(height: 16),
          Expanded(
            child: IndexedStack(
              index: _activeTab,
              children: [
                _buildOverviewTab(isDark),
                _buildDailyMonitoringTab(isDark),
                _buildDiagnosticsTab(isDark),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: _activeTab == 1 
          ? FloatingActionButton(
              onPressed: _addDailyLog,
              backgroundColor: AgriSenseColors.brandPrimary,
              child: const Icon(Icons.add, color: AgriSenseColors.bgDeep),
            )
          : null,
    );
  }

  Widget _buildOverviewTab(bool isDark) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 40),
      child: Column(
        children: [
          // Progression Section
          _buildProgressionCard(isDark),
          const SizedBox(height: 24),
          
          // Summary Section
          _buildSummaryCard(isDark),
          const SizedBox(height: 24),
          
          // AI Recommendations
          _buildAIRecommendations(isDark),
          const SizedBox(height: 24),
          
          // Next Step
          _buildNextStepCard(isDark),
          const SizedBox(height: 24),
          
          // Harvest Estimate
          _buildHarvestEstimateCard(isDark),
          const SizedBox(height: 24),
          
          // Expected Yield
          _buildYieldCard(isDark),
          const SizedBox(height: 24),
          
          // Weather
          _buildWeatherCard(isDark),
        ],
      ),
    );
  }

  Widget _buildDailyMonitoringTab(bool isDark) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 100),
      itemCount: _dailyLogs.length,
      itemBuilder: (context, index) {
        final log = _dailyLogs[index];
        return _buildLogCard(log, isDark);
      },
    );
  }

  Widget _buildLogCard(Map<String, dynamic> log, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AgriSenseColors.cardBg,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(log['date'], style: const TextStyle(color: AgriSenseColors.brandAccent, fontWeight: FontWeight.bold, fontSize: 14)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(log['state'], style: const TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            children: (log['actions'] as List<String>).map((action) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(action, style: const TextStyle(color: Colors.white70, fontSize: 11)),
            )).toList(),
          ),
          const SizedBox(height: 16),
          Text(
            log['notes'],
            style: const TextStyle(color: Colors.white54, fontSize: 13, height: 1.4),
          ),
        ],
      ),
    );
  }

  Widget _buildAddLogBottomSheet(StateSetter setModalState) {
    return Container(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      decoration: const BoxDecoration(
        color: AgriSenseColors.bgDeep,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text("Suivi d'aujourd'hui", style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 24),
            const Text("Comment se porte la culture ?", style: TextStyle(color: Colors.white54, fontSize: 12, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildEmojiItem("Excellent", "😄", _selectedState == 'Excellent', () => setModalState(() => _selectedState = 'Excellent')),
                _buildEmojiItem("Bon", "😊", _selectedState == 'Bon', () => setModalState(() => _selectedState = 'Bon')),
                _buildEmojiItem("Moyen", "😐", _selectedState == 'Moyen', () => setModalState(() => _selectedState = 'Moyen')),
                _buildEmojiItem("Mauvais", "😟", _selectedState == 'Mauvais', () => setModalState(() => _selectedState = 'Mauvais')),
                _buildEmojiItem("Critique", "😵", _selectedState == 'Critique', () => setModalState(() => _selectedState = 'Critique')),
              ],
            ),
            const SizedBox(height: 32),
            const Text("Actions effectuées", style: TextStyle(color: Colors.white54, fontSize: 12, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildActionChip("Arrosage", _selectedActionsList.contains("Arrosage"), () {
                  setModalState(() {
                    if (_selectedActionsList.contains("Arrosage")) {
                      _selectedActionsList.remove("Arrosage");
                    } else {
                      _selectedActionsList.add("Arrosage");
                    }
                  });
                }),
                _buildActionChip("Mise d'engrais", _selectedActionsList.contains("Mise d'engrais"), () {
                  setModalState(() {
                    if (_selectedActionsList.contains("Mise d'engrais")) {
                      _selectedActionsList.remove("Mise d'engrais");
                    } else {
                      _selectedActionsList.add("Mise d'engrais");
                    }
                  });
                }),
                _buildActionChip("Sarclage", _selectedActionsList.contains("Sarclage"), () {
                  setModalState(() {
                    if (_selectedActionsList.contains("Sarclage")) {
                      _selectedActionsList.remove("Sarclage");
                    } else {
                      _selectedActionsList.add("Sarclage");
                    }
                  });
                }),
                _buildActionChip("Traitement", _selectedActionsList.contains("Traitement"), () {
                  setModalState(() {
                    if (_selectedActionsList.contains("Traitement")) {
                      _selectedActionsList.remove("Traitement");
                    } else {
                      _selectedActionsList.add("Traitement");
                    }
                  });
                }),
                _buildActionChip("Tuteurage", _selectedActionsList.contains("Tuteurage"), () {
                  setModalState(() {
                    if (_selectedActionsList.contains("Tuteurage")) {
                      _selectedActionsList.remove("Tuteurage");
                    } else {
                      _selectedActionsList.add("Tuteurage");
                    }
                  });
                }),
              ],
            ),
            const SizedBox(height: 32),
            ImmersiveTextField(
              label: "Notes / Évolution",
              placeholder: "Décrivez ce que vous observez (vigueur, parasites, humidité...)...",
              icon: const Icon(Icons.edit_note, color: Colors.white54),
              maxLines: 3,
              controller: _notesController,
            ),
            const SizedBox(height: 40),
            ImmersiveButton(
              label: "Enregistrer mon suivi",
              onPressed: () async {
                final double currentProgress = _cropProgress;
                double newProgress = currentProgress + 0.05;
                if (newProgress > 1.0) newProgress = 1.0;
                
                final String stateLabel = _selectedState;
                
                setState(() {
                  _cropProgress = newProgress;
                  _cropStatus = stateLabel;
                  _dailyLogs.insert(0, {
                    'date': 'Aujourd\'hui',
                    'state': stateLabel,
                    'actions': _selectedActionsList.isEmpty ? ['Observation'] : List<String>.from(_selectedActionsList),
                    'notes': _notesController.text.isNotEmpty ? _notesController.text : 'Suivi de culture enregistré.',
                  });
                });
                
                try {
                  final response = await ApiService.updateCrop(widget.crop.id, <String, dynamic>{
                    'name': widget.crop.name,
                    'type': widget.crop.type,
                    'planting_date': widget.crop.sowingDate,
                    'area': widget.crop.surface.replaceAll(' ha', ''),
                    'status': stateLabel,
                    'progress': (newProgress * 100).toInt(),
                    'variety': widget.crop.variety,
                    'price_recorded_date': widget.crop.priceRecordedDate,
                    'market': widget.crop.market,
                    'quantity': widget.crop.quantity,
                    'price': widget.crop.price,
                  });
                  if (response.containsKey('error') && mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(response['error'] ?? 'Impossible de mettre à jour la culture en ligne.')),
                    );
                  } else if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text("Suivi enregistré et synchronisé en ligne !"),
                        backgroundColor: AgriSenseColors.brandPrimary,
                      ),
                    );
                  }
                } catch (e) {
                  print('Error updating crop: $e');
                }
                
                if (mounted) {
                  Navigator.pop(context);
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionChip(String label, bool active, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: active ? AgriSenseColors.brandPrimary.withOpacity(0.1) : Colors.white.withOpacity(0.03),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: active ? AgriSenseColors.brandPrimary : Colors.white.withOpacity(0.1)),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: active ? AgriSenseColors.brandPrimary : Colors.white38,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildTabs(bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Row(
        children: [
          _buildTabItem("Aperçu", 0, isDark),
          const SizedBox(width: 12),
          _buildTabItem("Suivi quotidien", 1, isDark),
          const SizedBox(width: 12),
          _buildTabItem("Diagnostics", 2, isDark),
        ],
      ),
    );
  }

  Widget _buildTabItem(String label, int index, bool isDark) {
    bool active = _activeTab == index;
    return GestureDetector(
      onTap: () => setState(() => _activeTab = index),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: active ? AgriSenseColors.brandPrimary : Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: active ? AgriSenseColors.bgDeep : Colors.white70,
            fontWeight: FontWeight.bold,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  Widget _buildProgressionCard(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AgriSenseColors.cardBg,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                "Progression\nde la culture",
                style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold, height: 1.2),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.03),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.white.withOpacity(0.05)),
                ),
                child: const Row(
                  children: [
                    Text("Par jours", style: TextStyle(color: Colors.white54, fontSize: 12)),
                    SizedBox(width: 4),
                    Icon(Icons.keyboard_arrow_down, color: Colors.white54, size: 16),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 40),
          // Chart Placeholder
          Stack(
            alignment: Alignment.center,
            children: [
              CustomPaint(
                size: const Size(double.infinity, 100),
                painter: CurvePainter(),
              ),
              Positioned(
                bottom: 60,
                left: 120,
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AgriSenseColors.brandAccent,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text("${(_cropProgress * 100).toInt()}% Aujourd'hui", style: const TextStyle(color: AgriSenseColors.bgDeep, fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                    const Icon(Icons.arrow_drop_down, color: AgriSenseColors.brandAccent, size: 16),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildTimePoint("Semis", widget.crop.sowingDate, isDark, completed: true),
              _buildTimePoint("Levée", _cropProgress >= 0.15 ? "Validé" : "À venir", isDark, completed: _cropProgress >= 0.15),
              _buildTimePoint("Croissance", _cropProgress >= 0.5 ? "Validé" : "En cours", isDark, active: _cropProgress < 0.8 && _cropProgress >= 0.15),
              _buildTimePoint("Floraison", _cropProgress >= 0.8 ? "Validé" : "À venir", isDark, active: _cropProgress >= 0.8 && _cropProgress < 0.95),
              _buildTimePoint("Récolte", _cropProgress >= 0.95 ? "Prêt" : "À venir", isDark, active: _cropProgress >= 0.95),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTimePoint(String label, String date, bool isDark, {bool completed = false, bool active = false}) {
    return Column(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: (completed || active) ? AgriSenseColors.brandAccent : Colors.white10,
            shape: BoxShape.circle,
            boxShadow: active ? [const BoxShadow(color: AgriSenseColors.brandAccent, blurRadius: 8)] : null,
          ),
        ),
        const SizedBox(height: 8),
        Text(label, style: TextStyle(color: active ? Colors.white : Colors.white38, fontSize: 9, fontWeight: FontWeight.bold)),
        Text(date, style: const TextStyle(color: Colors.white24, fontSize: 8)),
      ],
    );
  }

  Widget _buildSummaryCard(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AgriSenseColors.cardBg,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Résumé de la culture", style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 24),
          _buildSummaryItem(Icons.grid_3x3, "Surface", widget.crop.surface, isDark),
          _buildSummaryItem(Icons.category_outlined, "Catégorie", widget.crop.type, isDark),
          _buildSummaryItem(Icons.grass_outlined, "Variété", widget.crop.variety, isDark),
          _buildSummaryItem(Icons.store_mall_directory_outlined, "Marché ciblé", widget.crop.market, isDark),
          _buildSummaryItem(Icons.monetization_on_outlined, "Prix enregistré", "${widget.crop.price.toInt()} FCFA", isDark),
          _buildSummaryItem(Icons.history, "Date de relevé", widget.crop.priceRecordedDate, isDark),
          _buildSummaryItem(Icons.check_circle_outline, "État actuel", _cropStatus, isDark, isBadge: true),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(IconData icon, String label, String value, bool isDark, {bool isBadge = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Icon(icon, color: Colors.white38, size: 18),
          const SizedBox(width: 12),
          Text(label, style: const TextStyle(color: Colors.white54, fontSize: 13)),
          const Spacer(),
          if (isBadge)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.green.withOpacity(0.2)),
              ),
              child: Text(value, style: const TextStyle(color: Colors.green, fontSize: 11, fontWeight: FontWeight.bold)),
            )
          else
            Text(value, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildEmojiItem(String label, String emoji, bool active, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: active ? AgriSenseColors.brandAccent.withOpacity(0.1) : Colors.transparent,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: active ? AgriSenseColors.brandAccent : Colors.white10),
            ),
            child: Center(child: Text(emoji, style: const TextStyle(fontSize: 20))),
          ),
          const SizedBox(height: 6),
          Text(label, style: TextStyle(color: active ? AgriSenseColors.brandAccent : Colors.white38, fontSize: 8, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildAIRecommendations(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF131A16),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: AgriSenseColors.brandPrimary.withOpacity(0.15)),
      ),
      child: Column(
        children: [
          const Row(
            children: [
              Icon(Icons.psychology, color: AgriSenseColors.brandAccent, size: 20),
              SizedBox(width: 12),
              Text("Recommandations IA", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.02),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AgriSenseColors.brandPrimary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.agriculture, color: AgriSenseColors.brandPrimary, size: 18),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("Apport de nutriments recommandé pour ${widget.crop.name}.", style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Text("Basé sur votre dernier relevé sur la variété ${widget.crop.variety} et les prévisions de pluie, c'est le moment idéal pour booster la croissance.", style: const TextStyle(color: Colors.white54, fontSize: 12)),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                const Text("Voir\ndétails", style: TextStyle(color: AgriSenseColors.brandPrimary, fontSize: 11, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNextStepCard(bool isDark) {
    // Dynamically advice
    String actionLabel = "Apport d'engrais";
    String rate = "100 kg/ha";
    String description = "Azote / Urée recommandé";
    if (widget.crop.name.toLowerCase().contains("tomate")) {
      actionLabel = "Tuteurage & Taille";
      rate = "Manuel";
      description = "Soutenir la variété " + widget.crop.variety;
    } else if (widget.crop.name.toLowerCase().contains("manioc")) {
      actionLabel = "Sarclage & Buttage";
      rate = "Sillon léger";
      description = "Protéger les tubercules de l'érosion";
    }

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AgriSenseColors.cardBg,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        children: [
          const Text("PROCHAINE ÉTAPE", style: TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AgriSenseColors.brandPrimary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Icon(Icons.grass, color: AgriSenseColors.brandPrimary, size: 32),
          ),
          const SizedBox(height: 16),
          Text(actionLabel, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
          const Text("Dans 3 jours", style: TextStyle(color: AgriSenseColors.brandAccent, fontSize: 13, fontWeight: FontWeight.bold)),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(description, style: const TextStyle(color: Colors.white54, fontSize: 12)),
              Text(rate, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: 0.6,
              backgroundColor: Colors.white.withOpacity(0.05),
              valueColor: const AlwaysStoppedAnimation<Color>(AgriSenseColors.brandPrimary),
              minHeight: 4,
            ),
          ),
          const SizedBox(height: 24),
          Container(
            width: double.infinity,
            height: 52,
            decoration: BoxDecoration(
              color: AgriSenseColors.brandPrimary,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Center(
              child: Text("Voir conseils", style: TextStyle(color: AgriSenseColors.bgDeep, fontWeight: FontWeight.bold, fontSize: 15)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHarvestEstimateCard(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AgriSenseColors.cardBg,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.calendar_today, color: Colors.white38, size: 16),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  "DATE ESTIMÉE DE RÉCOLTE", 
                  style: TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.0),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AgriSenseColors.brandPrimary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.auto_awesome, color: AgriSenseColors.brandPrimary, size: 10),
                    SizedBox(width: 4),
                    Text("AJUSTÉ PAR L'IA", style: TextStyle(color: AgriSenseColors.brandPrimary, fontSize: 8, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text(getEstimatedHarvestDate(), style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(
            getDaysRemaining(),
            style: const TextStyle(color: Colors.white38, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildYieldCard(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AgriSenseColors.cardBg,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.trending_up, color: Colors.white38, size: 16),
              SizedBox(width: 12),
              Text("RENDEMENT ESTIMÉ", style: TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
            ],
          ),
          const SizedBox(height: 20),
          Text(getEstimatedYield(), style: const TextStyle(color: AgriSenseColors.brandAccent, fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          const Text("Estimation actuelle basée sur la santé", style: TextStyle(color: Colors.white38, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildWeatherCard(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AgriSenseColors.cardBg,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Text("Conditions météo", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
              Spacer(),
              Icon(Icons.location_on, color: Colors.white38, size: 16),
            ],
          ),
          Text(cropLocation(), style: const TextStyle(color: Colors.white38, fontSize: 11)),
          const SizedBox(height: 32),
          const Row(
            children: [
              Icon(Icons.cloudy_snowing, color: AgriSenseColors.brandPrimary, size: 48),
              SizedBox(width: 24),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("26°C", style: TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold)),
                  Text("Ciel nuageux", style: TextStyle(color: Colors.white38, fontSize: 13)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 32),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildWeatherStat("HUMIDITÉ", "72%"),
              _buildWeatherStat("PLUIE", "10%"),
              _buildWeatherStat("VENT", "12 km/h"),
            ],
          ),
          const SizedBox(height: 32),
          const Center(
            child: Text(
              "Voir prévisions complètes",
              style: TextStyle(color: AgriSenseColors.brandPrimary, fontWeight: FontWeight.bold, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWeatherStat(String label, String value) {
    return Column(
      children: [
        Text(label, style: const TextStyle(color: Colors.white24, fontSize: 9, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildDiagnosticsTab(bool isDark) {
    final progressVal = _cropProgress;
    String healthStatus = "Excellente";
    Color healthColor = Colors.green;
    String diagMessage = "Aucune anomalie détectée sur vos plans de ${widget.crop.name}.";
    
    if (progressVal < 0.3) {
      healthStatus = "Phase Critique";
      healthColor = Colors.amber;
      diagMessage = "Plants fragiles à ce stade. Surveillez étroitement l'humidité du sol pour éviter le dessèchement de la semence de variété ${widget.crop.variety}.";
    } else if (progressVal < 0.6) {
      healthStatus = "Bonne croissance";
      healthColor = Colors.green;
      diagMessage = "Développement foliaire robuste. Taux d'activité photosynthétique dans la norme.";
    } else if (progressVal < 0.85) {
      healthStatus = "Floraison / Maturation";
      healthColor = Colors.green;
      diagMessage = "Croissance optimale en cours. Recommandation : maintenir l'irrigation régulière.";
    } else {
      healthStatus = "Prêt pour récolte";
      healthColor = Colors.orange;
      diagMessage = "Rendement estimé atteint. Préparer l'équipement de récolte et les espaces de stockage.";
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 40),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Diagnostic header
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AgriSenseColors.cardBg,
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: Colors.white.withOpacity(0.05)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      "Analyse de Santé IA",
                      style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: healthColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        healthStatus,
                        style: TextStyle(color: healthColor, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Text(
                  diagMessage,
                  style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.4),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Soil diagnostic stats
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AgriSenseColors.cardBg,
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: Colors.white.withOpacity(0.05)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildDiagMiniValue("Humidité", "68%", Icons.water_drop, Colors.blue),
                _buildDiagMiniValue("pH Sol", "6.2", Icons.science_outlined, Colors.purple),
                _buildDiagMiniValue("Temp. Sol", "24°C", Icons.thermostat, Colors.orange),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // NPK levels
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AgriSenseColors.cardBg,
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: Colors.white.withOpacity(0.05)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "Nutriments du Sol (NPK)",
                  style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 20),
                _buildNPKIndicator("Azote (N)", 0.78, "Optimal (78%)"),
                const SizedBox(height: 16),
                _buildNPKIndicator("Phosphore (P)", 0.62, "Moyen (62%)"),
                const SizedBox(height: 16),
                _buildNPKIndicator("Potassium (K)", 0.85, "Excellent (85%)"),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNPKIndicator(String label, double value, String status) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12)),
            Text(status, style: const TextStyle(color: AgriSenseColors.brandAccent, fontSize: 12, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: value,
            backgroundColor: Colors.white.withOpacity(0.05),
            valueColor: const AlwaysStoppedAnimation<Color>(AgriSenseColors.brandAccent),
            minHeight: 6,
          ),
        ),
      ],
    );
  }

  Widget _buildDiagMiniValue(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(height: 8),
        Text(label, style: const TextStyle(color: Colors.white38, fontSize: 10)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
      ],
    );
  }
}


class CurvePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AgriSenseColors.brandAccent
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;

    final path = Path();
    path.moveTo(0, size.height * 0.8);
    path.quadraticBezierTo(
      size.width * 0.4,
      size.height * 0.6,
      size.width * 0.6,
      size.height * 0.2,
    );
    path.quadraticBezierTo(
      size.width * 0.85,
      -size.height * 0.1,
      size.width,
      size.height * 0.1,
    );

    canvas.drawPath(path, paint);

    // Fade area below curve
    final fillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [AgriSenseColors.brandAccent.withOpacity(0.2), Colors.transparent],
      ).createShader(Rect.fromLTRB(0, 0, size.width, size.height));

    final fillPath = Path.from(path);
    fillPath.lineTo(size.width, size.height);
    fillPath.lineTo(0, size.height);
    fillPath.close();

    canvas.drawPath(fillPath, fillPaint);
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}
