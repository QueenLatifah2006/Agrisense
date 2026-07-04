import 'package:flutter/material.dart';
import '../widgets.dart';
import '../constants.dart';

class LandingPage extends StatelessWidget {
  final VoidCallback? onThemeToggle;
  final Function(int)? onNavigate;
  const LandingPage({super.key, this.onThemeToggle, this.onNavigate});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      body: Stack(
        children: [
          // Background Global Ambient Glows
          Positioned(
            top: -100,
            left: -100,
            child: Container(
              width: 500,
              height: 500,
              decoration: BoxDecoration(
                color: AgriSenseColors.brandPrimary.withOpacity(isDark ? 0.1 : 0.05),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Positioned(
            bottom: -150,
            right: -150,
            child: Container(
              width: 600,
              height: 600,
              decoration: BoxDecoration(
                color: AgriSenseColors.brandAccent.withOpacity(isDark ? 0.05 : 0.03),
                shape: BoxShape.circle,
              ),
            ),
          ),

          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              child: Column(
                children: [
                  // Header with Auth buttons
                  Wrap(
                    alignment: WrapAlignment.spaceBetween,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    spacing: 12,
                    runSpacing: 8,
                    children: [
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              gradient: AgriSenseColors.immersiveGradient,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.eco, color: Colors.white, size: 18),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            "AgriSense AI",
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: isDark ? Colors.white : const Color(0xFF0F172A)),
                          ),
                        ],
                      ),
                      Wrap(
                        crossAxisAlignment: WrapCrossAlignment.center,
                        spacing: 4,
                        runSpacing: 4,
                        children: [
                          IconButton(
                            onPressed: onThemeToggle,
                            icon: Icon(
                              isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
                              color: isDark ? Colors.white70 : Colors.black54,
                            ),
                          ),
                          TextButton(
                            onPressed: () => Navigator.pushNamed(context, '/login'),
                            child: const Text(
                              "Se connecter",
                              style: TextStyle(color: AgriSenseColors.brandPrimary, fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                          ),
                          ElevatedButton(
                            onPressed: () => Navigator.pushNamed(context, '/signup'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AgriSenseColors.brandPrimary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              elevation: 0,
                            ),
                            child: const Text("S'inscrire", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 60),
                  // Header Title
                  ShaderMask(
                    shaderCallback: (bounds) => LinearGradient(
                      colors: isDark 
                          ? [AgriSenseColors.textMain, const Color(0x99FFFFFF)]
                          : [const Color(0xFF0F172A), const Color(0xFF334155)],
                    ).createShader(bounds),
                    child: Text(
                      "Agriculture Intelligente",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 40,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    "OPTIMISATION DES RENDEMENTS PAR L'IA",
                    style: TextStyle(
                      color: AgriSenseColors.brandPrimary,
                      fontFamily: 'monospace',
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 2,
                    ),
                  ),
                  const SizedBox(height: 60),

                  // Cards Section
                  _buildNavCard(
                    context,
                    icon: Icons.message_outlined,
                    iconColor: AgriSenseColors.brandPrimary,
                    title: "Conseiller Agricole IA",
                    subtitle: "Posez vos questions sur vos cultures et recevez des conseils basés sur l'IA et les données météorologiques.",
                    actionLabel: "Commencer le chat",
                    onTap: () {
                      if (onNavigate != null) {
                        onNavigate!(1);
                      } else {
                        Navigator.pushNamed(context, '/chat');
                      }
                    },
                  ),
                  const SizedBox(height: 24),
                  _buildNavCard(
                    context,
                    icon: Icons.help_outline,
                    iconColor: Colors.purpleAccent,
                    title: "Support",
                    subtitle: "Assistance agronomique disponible 24/7.",
                    actionLabel: "Ouvrir",
                    onTap: () {
                      if (onNavigate != null) {
                        onNavigate!(2);
                      } else {
                        Navigator.pushNamed(context, '/support_visitor');
                      }
                    },
                  ),
                  
                  const SizedBox(height: 120), // Footer spacing
                  Text(
                    "© 2024 AgriSense AI. Harvest Intelligence v4.0",
                    style: TextStyle(
                      color: isDark ? const Color(0xFF64748B) : Colors.black45,
                      fontSize: 10,
                      fontFamily: 'monospace',
                      letterSpacing: 1.2,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavCard(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required String actionLabel,
    required VoidCallback onTap,
    bool isFeatured = false,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Transform.scale(
      scale: isFeatured ? 1.05 : 1.0,
      child: GlassCard(
        onTap: onTap,
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: iconColor.withOpacity(0.2)),
              ),
              child: Icon(icon, color: iconColor, size: 24),
            ),
            const SizedBox(height: 24),
            Text(
              title,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: isDark ? AgriSenseColors.textMain : const Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 14,
                color: isDark ? AgriSenseColors.textMuted : Colors.black54,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 24),
            if (isFeatured)
              ImmersiveButton(
                label: actionLabel,
                fullWidth: true,
                onPressed: onTap,
              )
            else
              Row(
                children: [
                  Text(
                    actionLabel,
                    style: TextStyle(
                      color: iconColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(Icons.arrow_forward, color: iconColor, size: 16),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
