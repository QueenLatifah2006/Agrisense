import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../constants.dart';
import '../widgets.dart';
import 'profile_edit_page.dart';
import '../services/api_service.dart';

class ProfilePage extends StatefulWidget {
  final bool isVisitor;
  final VoidCallback? onThemeToggle;
  const ProfilePage({super.key, this.isVisitor = false, this.onThemeToggle});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  Map<String, dynamic>? userData;
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    if (!widget.isVisitor) {
      _loadProfile();
    }
  }

  Future<void> _loadProfile() async {
    setState(() => isLoading = true);
    final data = await ApiService.getMe();
    setState(() {
      userData = data;
      isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final String displayName = widget.isVisitor 
        ? "Session Visiteur" 
        : (userData?['name'] ?? "Chargement...");
    
    final String displayRole = widget.isVisitor 
        ? "ACCÈS LIMITÉ" 
        : (userData?['role']?.toString().toUpperCase() ?? "FERMIER");

    return Scaffold(
      appBar: AppBar(
        title: const Text("Mon Profil"),
      ),
      body: isLoading 
          ? const Center(child: CircularProgressIndicator(color: AgriSenseColors.brandPrimary))
          : SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              child: Column(
                children: [
                  // User Info Section
                  const SizedBox(height: 20),
                  Center(
                    child: Stack(
                      children: [
                        Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: AgriSenseColors.brandPrimary.withOpacity(0.3), width: 2),
                          ),
                          padding: const EdgeInsets.all(4),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(60),
                            child: userData?['profile_picture'] != null && userData!['profile_picture'].toString().isNotEmpty
                                ? (kIsWeb || userData!['profile_picture'].toString().startsWith('http') || userData!['profile_picture'].toString().startsWith('blob') || userData!['profile_picture'].toString().contains('assets/') || userData!['profile_picture'].toString().startsWith('content:')
                                    ? Image.network(
                                        userData!['profile_picture'].toString(),
                                        fit: BoxFit.cover,
                                        errorBuilder: (context, error, stackTrace) {
                                          return Icon(Icons.person, size: 60, color: isDark ? Colors.white24 : Colors.black12);
                                        },
                                      )
                                    : Image.file(
                                        File(userData!['profile_picture'].toString()),
                                        fit: BoxFit.cover,
                                        errorBuilder: (context, error, stackTrace) {
                                          return Icon(Icons.person, size: 60, color: isDark ? Colors.white24 : Colors.black12);
                                        },
                                      ))
                                : Icon(Icons.person, size: 60, color: isDark ? Colors.white24 : Colors.black12),
                          ),
                        ),
                        if (!widget.isVisitor)
                          Positioned(
                            bottom: 5,
                            right: 5,
                            child: Container(
                              width: 20,
                              height: 20,
                              decoration: BoxDecoration(
                                color: Colors.green,
                                shape: BoxShape.circle,
                                border: Border.all(color: theme.scaffoldBackgroundColor, width: 2),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    displayName,
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    displayRole,
                    style: TextStyle(
                      color: widget.isVisitor ? AgriSenseColors.textMuted : AgriSenseColors.brandPrimary,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 2,
                    ),
                  ),
                  
                  const SizedBox(height: 48),
                  
                  // Modifier Profil Button (Prominent)
                    if (!widget.isVisitor) ...[
                    ImmersiveButton(
                      label: "MODIFIER MON PROFIL",
                      onPressed: () async {
                        final result = await Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const ProfileEditPage()),
                        );
                        if (result == true) {
                          _loadProfile();
                        }
                      },
                      fullWidth: true,
                    ),
                    const SizedBox(height: 32),
                    if (userData != null) ...[
                      _buildOption(
                        icon: Icons.phone_outlined,
                        title: "Téléphone",
                        subtitle: userData!['phone'] != null && userData!['phone'].toString().isNotEmpty
                            ? userData!['phone'].toString()
                            : "Non enregistré",
                        onTap: () {},
                      ),
                      const SizedBox(height: 16),
                      _buildOption(
                        icon: Icons.location_on_outlined,
                        title: "Localisation",
                        subtitle: userData!['location'] != null && userData!['location'].toString().isNotEmpty
                            ? userData!['location'].toString()
                            : "Non enregistrée",
                        onTap: () {},
                      ),
                      const SizedBox(height: 16),
                      if (userData!['domain'] != null && userData!['domain'].toString().isNotEmpty) ...[
                        _buildOption(
                          icon: Icons.category_outlined,
                          title: "Domaine d'activité",
                          subtitle: userData!['domain'].toString(),
                          onTap: () {},
                        ),
                        const SizedBox(height: 16),
                      ],
                    ],
                  ],

                  // Actions Section
                  _buildOption(
                    icon: Icons.brightness_4_outlined,
                    title: "Apparence",
                    subtitle: isDark ? "Mode Sombre activé" : "Mode Clair activé",
                    onTap: () {
                      if (widget.onThemeToggle != null) {
                        widget.onThemeToggle!();
                      }
                    },
                    trailing: Switch(
                      value: isDark,
                      onChanged: (val) {
                        if (widget.onThemeToggle != null) {
                          widget.onThemeToggle!();
                        }
                      },
                      activeColor: AgriSenseColors.brandAccent,
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  _buildOption(
                    icon: Icons.notifications_none,
                    title: "Notifications",
                    subtitle: "Alertes météo et conseils IA",
                    onTap: () {},
                  ),
                  
                  const SizedBox(height: 40),
                  
                  // Bottom Button
                  if (widget.isVisitor)
                    ImmersiveButton(
                      label: "CRÉER UN COMPTE",
                      fullWidth: true,
                      onPressed: () => Navigator.pushNamed(context, '/signup'),
                    )
                  else
                    ImmersiveButton(
                      label: "DÉCONNEXION",
                      isError: true,
                      fullWidth: true,
                      onPressed: () {
                        ApiService.logout();
                        Navigator.pushNamedAndRemoveUntil(context, '/', (_) => false);
                      },
                    ),
                ],
              ),
            ),
    );
  }

  Widget _buildOption({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    Widget? trailing,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return GlassCard(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.05),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: AgriSenseColors.brandAccent, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A), fontWeight: FontWeight.bold, fontSize: 14),
                ),
                Text(
                  subtitle,
                  style: TextStyle(color: isDark ? AgriSenseColors.textMuted : Colors.black54, fontSize: 11),
                ),
              ],
            ),
          ),
          trailing ?? Icon(Icons.chevron_right, color: isDark ? Colors.white24 : Colors.black26, size: 18),
        ],
      ),
    );
  }
}
