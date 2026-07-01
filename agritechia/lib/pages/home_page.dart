import 'package:flutter/material.dart';
import '../constants.dart';
import '../widgets.dart';
import 'profile_page.dart';
import 'main_navigation.dart';
import '../services/api_service.dart';

class HomePage extends StatefulWidget {
  final Function(int)? onNavigate;
  final bool isVisitor;
  final VoidCallback? onThemeToggle;
  const HomePage({super.key, this.isVisitor = false, this.onNavigate, this.onThemeToggle});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  Map<String, dynamic>? userData;

  @override
  void initState() {
    super.initState();
    if (!widget.isVisitor) {
      _loadProfile();
    }
  }

  Future<void> _loadProfile() async {
    final data = await ApiService.getMe();
    if (mounted) {
      setState(() {
        userData = data;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final String greeting = widget.isVisitor 
        ? "Bienvenue sur AgriSense" 
        : (userData?['name'] != null ? "Bienvenue, ${userData!['name']}" : "Bienvenue");

    return Scaffold(
      body: Stack(
        children: [
          // Background ambient glows
          Positioned(
            top: -50,
            left: -50,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                color: AgriSenseColors.brandPrimary.withOpacity(isDark ? 0.05 : 0.03),
                shape: BoxShape.circle,
              ),
            ),
          ),
          
          SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 60, 24, 140),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "AgriSense AI",
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: isDark ? AgriSenseColors.brandPrimary : AgriSenseColors.brandPrimary,
                        letterSpacing: 2,
                        fontFamily: 'monospace',
                      ),
                    ),
                    if (!widget.isVisitor)
                      GestureDetector(
                        onTap: () => Navigator.push(
                          context, 
                          MaterialPageRoute(builder: (_) => ProfilePage(isVisitor: widget.isVisitor, onThemeToggle: widget.onThemeToggle))
                        ),
                        child: Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.05),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.05)),
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: const Icon(Icons.person_outline),
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 32),
                Text(
                  greeting,
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: isDark ? AgriSenseColors.textMain : const Color(0xFF0F172A),
                    letterSpacing: -1,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  "Optimisez vos rendements avec l'IA de pointe.",
                  style: TextStyle(
                    fontSize: 16,
                    color: isDark ? AgriSenseColors.textMuted : Colors.black54,
                  ),
                ),
                const SizedBox(height: 48),
                
                // Main Featured Card
                _buildFeaturedCard(
                  context,
                  icon: Icons.message_outlined,
                  title: "Conseiller Agricole IA",
                  subtitle: "Interrogez notre IA sur la santé de vos sols, les prévisions météo ou le diagnostic de maladies.",
                  chips: ['Analyse de sol', 'Conseil irrigation', 'Alerte parasites'],
                  onTap: () {
                    if (widget.onNavigate != null) {
                      widget.onNavigate!(1);
                    } else {
                      Navigator.pushNamed(context, '/chat');
                    }
                  },
                ),
                const SizedBox(height: 24),
                
                // Status Placeholder
                if (!widget.isVisitor) ...[
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: isDark ? AgriSenseColors.brandPrimary.withOpacity(0.05) : AgriSenseColors.brandPrimary.withOpacity(0.03),
                            borderRadius: BorderRadius.circular(32),
                            border: Border.all(color: AgriSenseColors.brandPrimary.withOpacity(0.1)),
                          ),
                          child: Column(
                            children: [
                              const Text(
                                "ÉTAT GLOBAL",
                                style: TextStyle(
                                  color: AgriSenseColors.brandPrimary,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 2,
                                  fontFamily: 'monospace',
                                ),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                "OK",
                                style: TextStyle(
                                  fontSize: 48,
                                  fontWeight: FontWeight.bold,
                                  color: isDark ? AgriSenseColors.textMain : const Color(0xFF0F172A),
                                ),
                              ),
                              Text(
                                "Tout semble en ordre",
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? AgriSenseColors.textMuted : Colors.black54,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                ],
                
                // Support Option
                _buildProfileOption(
                  context,
                  icon: Icons.help_outline,
                  title: "Aide et Support",
                  subtitle: "Consultez nos guides ou contactez un expert agronome.",
                  rightLabel: "OUVRIR",
                  onTap: () {
                    if (widget.onNavigate != null) {
                      widget.onNavigate!(widget.isVisitor ? 2 : 4); // Switch to Support tab
                    } else {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => MainNavigation(initialIndex: widget.isVisitor ? 2 : 4, isVisitor: widget.isVisitor, onThemeToggle: widget.onThemeToggle)));
                    }
                  },
                ),
                if (!widget.isVisitor) ...[
                  const SizedBox(height: 12),
                  // Settings Option
                  _buildProfileOption(
                    context,
                    icon: Icons.settings_outlined,
                    title: "Gérer mes parcelles",
                    subtitle: "Suivez l'évolution de vos cultures et zones.",
                    rightLabel: "VOIR TOUT",
                    accentColor: AgriSenseColors.brandAccent,
                    onTap: () {
                      if (widget.onNavigate != null) {
                        widget.onNavigate!(2); // Switch to Crops tab
                      }
                    },
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeaturedCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required List<String> chips,
    required VoidCallback onTap,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return GlassCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AgriSenseColors.brandPrimary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AgriSenseColors.brandPrimary.withOpacity(0.2)),
                ),
                child: const Icon(Icons.message_outlined, color: AgriSenseColors.brandPrimary, size: 24),
              ),
              const Icon(Icons.arrow_forward, color: AgriSenseColors.brandPrimary, size: 20),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            title,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: isDark ? AgriSenseColors.textMain : const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            subtitle,
            style: TextStyle(
              fontSize: 14,
              color: isDark ? AgriSenseColors.textMuted : Colors.black54,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 24),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: chips.map((label) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.05),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.05)),
              ),
              child: Text(
                label,
                style: TextStyle(color: isDark ? Colors.white70 : Colors.black87, fontSize: 10, fontWeight: FontWeight.w600),
              ),
            )).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileOption(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required String rightLabel,
    required VoidCallback onTap,
    Color accentColor = AgriSenseColors.brandPrimary,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return GlassCard(
      onTap: onTap,
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.05),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: isDark ? Colors.white70 : Colors.black54, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(fontWeight: FontWeight.bold, color: isDark ? Colors.white : const Color(0xFF0F172A), fontSize: 14),
                ),
                Text(
                  subtitle,
                  style: TextStyle(color: isDark ? AgriSenseColors.textMuted : Colors.black54, fontSize: 11),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                rightLabel,
                style: TextStyle(
                  color: accentColor,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(width: 4),
              Icon(Icons.chevron_right, color: accentColor, size: 14),
            ],
          ),
        ],
      ),
    );
  }
}
