import 'package:flutter/material.dart';
import '../constants.dart';
import '../widgets.dart';
import 'crop_detail_page.dart';
import 'add_crop_page.dart';
import '../services/api_service.dart';

class Crop {
  final String id;
  final String name;
  final String variety;
  final String surface;
  final String sowingDate;
  final double progress;
  final String status;
  final String imageUrl;
  final String type;
  final String priceRecordedDate;
  final String market;
  final double quantity;
  final double price;

  Crop({
    required this.id,
    required this.name,
    required this.variety,
    required this.surface,
    required this.sowingDate,
    required this.progress,
    required this.status,
    required this.imageUrl,
    required this.type,
    required this.priceRecordedDate,
    required this.market,
    required this.quantity,
    required this.price,
  });

  factory Crop.fromJson(Map<String, dynamic> json) {
    double prog = 0.0;
    if (json['progress'] != null) {
      prog = double.tryParse(json['progress'].toString()) ?? 0.0;
      if (prog > 1.0) {
        prog = prog / 100.0;
      }
      if (prog > 1.0) prog = 1.0;
      if (prog < 0.0) prog = 0.0;
    }
    String areaStr = 'Non spécifiée';
    if (json['area'] != null) {
      String rawArea = json['area'].toString();
      if (rawArea.toLowerCase().contains('ha')) {
        areaStr = rawArea;
      } else {
        areaStr = '$rawArea ha';
      }
    }
    return Crop(
      id: json['id'].toString(),
      name: json['name'] ?? '',
      variety: json['variety'] ?? 'Non spécifiée',
      surface: areaStr,
      sowingDate: json['planting_date'] ?? 'Non spécifiée',
      progress: prog,
      status: json['status'] ?? 'En croissance',
      imageUrl: (json['image_url'] != null && json['image_url'].toString().isNotEmpty)
          ? json['image_url'].toString()
          : 'https://images.unsplash.com/photo-1551390463-5490714902f4?w=500&h=300&fit=crop',
      type: json['type'] ?? 'Céréales',
      priceRecordedDate: json['price_recorded_date'] ?? 'Non spécifiée',
      market: json['market'] ?? 'Marché Central',
      quantity: double.tryParse((json['quantity'] ?? 0.0).toString()) ?? 0.0,
      price: double.tryParse((json['price'] ?? 0.0).toString()) ?? 0.0,
    );
  }
}

class CropsPage extends StatefulWidget {
  final bool isVisitor;
  final Function(int)? onNavigate;
  const CropsPage({super.key, this.isVisitor = false, this.onNavigate});

  @override
  State<CropsPage> createState() => _CropsPageState();
}

class _CropsPageState extends State<CropsPage> {
  List<Crop> crops = [];
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadCrops();
  }

  Future<void> _loadCrops() async {
    setState(() => isLoading = true);
    final data = await ApiService.getCrops();
    setState(() {
      final seenNames = <String>{};
      final uniqueList = <Crop>[];
      for (var item in data) {
        final crop = Crop.fromJson(item as Map<String, dynamic>);
        final cleanName = crop.name.trim().toLowerCase();
        if (!seenNames.contains(cleanName)) {
          seenNames.add(cleanName);
          uniqueList.add(crop);
        }
      }
      crops = uniqueList;
      isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AgriSenseColors.bgDeep : const Color(0xFFF8FAFC),
      body: Stack(
        children: [
          // Header Background
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 300,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    AgriSenseColors.brandPrimary.withOpacity(isDark ? 0.08 : 0.05),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          
          SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 60, 24, 140),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      "AgriScience AI",
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AgriSenseColors.brandAccent,
                        letterSpacing: 1.5,
                        fontFamily: 'monospace',
                      ),
                    ),
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.05),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white.withOpacity(0.1)),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(22),
                        child: Image.network(
                          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 40),
                
                Text(
                  "Mes cultures",
                  style: TextStyle(
                    fontSize: 36,
                    fontWeight: FontWeight.bold,
                    color: isDark ? AgriSenseColors.textMain : const Color(0xFF0F172A),
                    letterSpacing: -1,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  "Gérez et suivez toutes vos cultures en temps réel.",
                  style: TextStyle(
                    fontSize: 16,
                    color: isDark ? AgriSenseColors.textMuted : Colors.black54,
                  ),
                ),
                const SizedBox(height: 32),
                
                // Add Crop Button
                _buildAddCropButton(context, isDark),
                const SizedBox(height: 32),
                
                // Stats Grid
                _buildStatsGrid(isDark),
                const SizedBox(height: 40),
                
                // Search and Filter
                Row(
                  children: [
                    Expanded(
                      child: _buildSearchBar(isDark),
                    ),
                    const SizedBox(width: 16),
                    _buildFilterButton(isDark),
                  ],
                ),
                const SizedBox(height: 32),
                
                // Crops List or Empty State
                if (isLoading)
                  const Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator(color: AgriSenseColors.brandPrimary)))
                else if (crops.isEmpty)
                  _buildEmptyState(isDark)
                else
                  ...crops.map((crop) => _buildCropCard(context, crop, isDark)).toList(),
                
                const SizedBox(height: 40),
                
                // AI Help Card
                _buildAIHelpCard(isDark),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 60),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withOpacity(0.02) : Colors.black.withOpacity(0.02),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: const Column(
        children: [
          Icon(Icons.grass_outlined, size: 64, color: Colors.white10),
          SizedBox(height: 24),
          Text(
            "Aucune culture enregistrée",
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white38),
          ),
          SizedBox(height: 8),
          Text(
            "Commencez par ajouter votre première parcelle.",
            style: TextStyle(fontSize: 13, color: Colors.white24),
          ),
        ],
      ),
    );
  }

  Widget _buildAddCropButton(BuildContext context, bool isDark) {
    return Container(
      width: double.infinity,
      height: 56,
      decoration: BoxDecoration(
        color: AgriSenseColors.brandPrimary,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AgriSenseColors.brandPrimary.withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 8),
          )
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () async {
            final result = await Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const AddCropPage()),
            );
            if (result == true) {
              _loadCrops();
            }
          },
          borderRadius: BorderRadius.circular(16),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.add, color: AgriSenseColors.bgDeep, size: 24),
              SizedBox(width: 12),
              Text(
                "Ajouter une culture",
                style: TextStyle(
                  color: AgriSenseColors.bgDeep,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showMiniChat(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.75,
        decoration: BoxDecoration(
          color: isDark ? AgriSenseColors.bgDeep : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 12),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AgriSenseColors.brandPrimary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(Icons.psychology, color: AgriSenseColors.brandPrimary),
                  ),
                  const SizedBox(width: 16),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Conseiller AgriSense",
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        Text(
                          "Assistant IA • En ligne",
                          style: TextStyle(color: AgriSenseColors.brandPrimary, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.open_in_full, size: 20, color: Colors.white38),
                    onPressed: () {
                      Navigator.pop(context);
                      widget.onNavigate?.call(1);
                    },
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: Colors.white10),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(24),
                children: [
                  _buildMiniBubble("Bonjour ! Comment puis-je vous aider avec vos cultures aujourd'hui ?", true, isDark),
                  _buildMiniBubble("Je vois que votre Maïs est à 65% de croissance. Avez-vous remarqué des signes de stress hydrique ?", true, isDark),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withOpacity(0.02) : Colors.black.withOpacity(0.02),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: const TextField(
                        decoration: InputDecoration(
                          hintText: "Écrivez ici...",
                          border: InputBorder.none,
                          hintStyle: TextStyle(fontSize: 14),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      gradient: AgriSenseColors.immersiveGradient,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(Icons.send, color: Colors.white, size: 20),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMiniBubble(String text, bool isAi, bool isDark) {
    return Align(
      alignment: isAi ? Alignment.centerLeft : Alignment.centerRight,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isAi 
              ? AgriSenseColors.brandPrimary.withOpacity(0.1) 
              : Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(20).copyWith(
            topLeft: isAi ? Radius.zero : const Radius.circular(20),
            topRight: isAi ? const Radius.circular(20) : Radius.zero,
          ),
        ),
        child: Text(
          text,
          style: const TextStyle(fontSize: 14, height: 1.4),
        ),
      ),
    );
  }

  Widget _buildStatsGrid(bool isDark) {
    final activeCount = crops.where((c) {
      final s = c.status.toLowerCase();
      return s != 'recolte' && s != 'récolté' && s != 'recoltée' && s != 'récoltée' && s != 'harvested';
    }).length;
    
    final comingCount = crops.where((c) => c.progress < 0.25).length;
    final harvestSoonCount = crops.where((c) => c.progress >= 0.75 && c.progress < 1.0).length;
    
    double totalArea = 0.0;
    for (var crop in crops) {
      final s = crop.surface.toLowerCase().replaceAll('ha', '').trim();
      final areaVal = double.tryParse(s) ?? 0.0;
      totalArea += areaVal;
    }
    String areaStr = totalArea % 1 == 0 ? '${totalArea.toInt()} ha' : '${totalArea.toStringAsFixed(1)} ha';

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: 1.15,
      children: [
        _buildStatCard(
          icon: Icons.grass,
          value: "$activeCount",
          label: "Cultures\nactives",
          isDark: isDark,
        ),
        _buildStatCard(
          icon: Icons.calendar_today_outlined,
          value: "$comingCount",
          label: "À venir",
          isDark: isDark,
        ),
        _buildStatCard(
          icon: Icons.agriculture_outlined,
          value: "$harvestSoonCount",
          label: "Récolte\nbientôt",
          isDark: isDark,
        ),
        _buildStatCard(
          icon: Icons.straighten_outlined,
          value: areaStr,
          label: "Superficie\ntotale",
          isDark: isDark,
        ),
      ],
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String value,
    required String label,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? AgriSenseColors.cardBg : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AgriSenseColors.brandPrimary, size: 20),
          const Spacer(),
          Text(
            value,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: isDark ? AgriSenseColors.textMain : const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: isDark ? AgriSenseColors.textMuted : Colors.black54,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar(bool isDark) {
    return Container(
      height: 52,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: isDark ? AgriSenseColors.cardBg : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          const Icon(Icons.search, color: Colors.white54, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: TextField(
              decoration: InputDecoration(
                hintText: "Rechercher une culture...",
                hintStyle: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 14),
                border: InputBorder.none,
              ),
              style: const TextStyle(color: Colors.white, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterButton(bool isDark) {
    return Container(
      height: 52,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: isDark ? AgriSenseColors.cardBg : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          const Icon(Icons.tune, color: AgriSenseColors.brandPrimary, size: 20),
          const SizedBox(width: 8),
          Text(
            "Filtrer",
            style: TextStyle(
              color: isDark ? AgriSenseColors.textMain : Colors.black87,
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCropCard(BuildContext context, Crop crop, bool isDark) {
    return GestureDetector(
      onTap: () async {
        final result = await Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => CropDetailPage(crop: crop)),
        );
        if (result == true) {
          _loadCrops();
        }
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 24),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isDark ? AgriSenseColors.cardBg : Colors.white,
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: Colors.white.withOpacity(0.05)),
        ),
        child: Column(
          children: [
            Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Image.network(
                    crop.imageUrl,
                    width: 70,
                    height: 70,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        width: 70,
                        height: 70,
                        color: isDark ? Colors.white10 : Colors.black.withOpacity(0.05),
                        child: const Icon(Icons.broken_image_outlined, color: Colors.grey, size: 24),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            crop.name,
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: isDark ? AgriSenseColors.textMain : const Color(0xFF0F172A),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AgriSenseColors.brandPrimary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              crop.status,
                              style: const TextStyle(
                                color: AgriSenseColors.brandPrimary,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "Variété: ${crop.variety}",
                        style: TextStyle(
                          fontSize: 13,
                          color: isDark ? AgriSenseColors.textMuted : Colors.black54,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Surface",
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark ? AgriSenseColors.textMuted : Colors.black54,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      crop.surface,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: isDark ? AgriSenseColors.textMain : const Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Semis",
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark ? AgriSenseColors.textMuted : Colors.black54,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      crop.sowingDate,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: isDark ? AgriSenseColors.textMain : const Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "Progression",
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? AgriSenseColors.textMuted : Colors.black54,
                  ),
                ),
                Text(
                  "${(crop.progress * 100).toInt()}%",
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: AgriSenseColors.brandAccent,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: crop.progress,
                backgroundColor: Colors.white.withOpacity(0.05),
                valueColor: const AlwaysStoppedAnimation<Color>(AgriSenseColors.brandAccent),
                minHeight: 6,
              ),
            ),
            const SizedBox(height: 16),
            const Icon(Icons.keyboard_arrow_down, color: Colors.white24, size: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildAIHelpCard(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: const Color(0xFF131A16),
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: AgriSenseColors.brandPrimary.withOpacity(0.1)),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AgriSenseColors.brandPrimary.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.psychology, color: AgriSenseColors.brandPrimary, size: 32),
          ),
          const SizedBox(height: 24),
          Text(
            "Besoin d'aide pour vos cultures ?",
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: isDark ? AgriSenseColors.textMain : Colors.white,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            "Discutez avec notre assistant IA pour des conseils personnalisés basés sur vos données réelles.",
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              color: isDark ? AgriSenseColors.textMuted : Colors.white70,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 32),
          Container(
            width: double.infinity,
            height: 52,
            decoration: BoxDecoration(
              color: AgriSenseColors.brandAccent,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => _showMiniChat(context),
                borderRadius: BorderRadius.circular(16),
                child: const Center(
                  child: Text(
                    "Discuter maintenant",
                    style: TextStyle(
                      color: AgriSenseColors.bgDeep,
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
