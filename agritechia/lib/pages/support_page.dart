import 'package:flutter/material.dart';
import '../widgets.dart';
import '../constants.dart';
import 'profile_page.dart';

class SupportPage extends StatelessWidget {
  final bool isVisitor;
  final Function(int)? onNavigate;
  const SupportPage({super.key, this.isVisitor = false, this.onNavigate});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      appBar: AppBar(
        centerTitle: false,
        title: const Text(
          "Support & Ressources",
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AgriSenseColors.brandPrimary),
        ),
        leading: onNavigate != null 
          ? IconButton(
              icon: const Icon(Icons.arrow_back, color: AgriSenseColors.brandPrimary),
              onPressed: () => onNavigate!(0),
            )
          : null,
        actions: [
          if (!isVisitor)
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: GestureDetector(
                onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => ProfilePage(isVisitor: isVisitor)));
                },
                child: Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AgriSenseColors.brandPrimary.withOpacity(0.3)),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: const Icon(Icons.person_outline, size: 18),
                  ),
                ),
              ),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 140),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Section 1: Guide d'utilisation
            _buildSectionHeader(context, "Guide d'utilisation", "Voir tout"),
            const SizedBox(height: 16),
            
            // Large Feature Card
            GestureDetector(
              onTap: () {},
              child: Container(
                height: 200,
                width: double.infinity,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24),
                  image: const DecorationImage(
                    image: NetworkImage("https://lh3.googleusercontent.com/aida-public/AB6AXuABhOYp5u9dPyzudITX3xrY4NCEtw4iuLlJCeSEvcxYk_QfU2Eia65D2QqDnyqJzQxJHlYvAiqi3B0cxU6oVJ6sRMl3_da2znYitiGIqWc_QNrT71hFpZ9oPxQQd3hLJcfLshptnQJasY-x3cOL2GW-1f7lsgHjSJOoUrPFMAvEhBIRgG8jkcxXMtl-mGc2NjkyDSSkvtq_vpXHNTmYm9RWNkH8Alw3g02xa92W4-_iZafibz7wJcwtOmbCdr8HBugRax9X3C-uM-bt"),
                    fit: BoxFit.cover,
                  ),
                ),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    gradient: LinearGradient(
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                      colors: [
                        (isDark ? AgriSenseColors.bgDeep : Colors.black).withOpacity(0.8),
                        Colors.transparent,
                      ],
                    ),
                  ),
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "Optimisez votre culture",
                        style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Text(
                            "Lire le guide",
                            style: TextStyle(color: AgriSenseColors.brandAccent, fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(width: 8),
                          Icon(Icons.arrow_forward, color: AgriSenseColors.brandAccent, size: 14),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            
            // Two Smaller Cards
            Row(
              children: [
                Expanded(
                  child: _buildSmallResourceCard(
                    context,
                    icon: Icons.mic,
                    title: "Audio",
                    subtitle: "Commandes vocales",
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildSmallResourceCard(
                    context,
                    icon: Icons.analytics,
                    title: "Analyse",
                    subtitle: "Rapports de sol",
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 40),
            
            // Section 2: Impact Social
            _buildSectionHeader(context, "Impact Social", null),
            const SizedBox(height: 16),
            GlassCard(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  _buildImpactItem(
                    context,
                    icon: Icons.psychology,
                    title: "Farmer Empowerment",
                    description: "Soutenir les petits producteurs par le biais de l'intelligence partagée et du savoir local.",
                  ),
                  const SizedBox(height: 24),
                  _buildImpactItem(
                    context,
                    icon: Icons.eco,
                    title: "Durabilité",
                    description: "Réduction de l'empreinte carbone grâce à une gestion précise de l'eau et des nutriments.",
                  ),
                  const SizedBox(height: 24),
                  Divider(color: isDark ? Colors.white10 : Colors.black12),
                  const SizedBox(height: 24),
                  Stack(
                    children: [
                      Positioned(
                        left: 0,
                        top: 0,
                        child: Text(
                          "\"",
                          style: TextStyle(
                            color: AgriSenseColors.brandPrimary.withOpacity(0.2),
                            fontSize: 48,
                            fontFamily: 'serif',
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(left: 16, top: 20),
                        child: Text(
                          "Notre mission est de réconcilier la technologie de pointe avec la sagesse ancestrale de la terre pour un futur fertile.",
                          style: TextStyle(
                            color: AgriSenseColors.brandPrimary.withOpacity(0.8),
                            fontStyle: FontStyle.italic,
                            fontSize: 16,
                            height: 1.6,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 40),
            
            // Section 3: Contact
            _buildSectionHeader(context, "Contact", null),
            const SizedBox(height: 16),
            _buildContactButton(context, Icons.support_agent, "Support Technique"),
            const SizedBox(height: 12),
            _buildContactButton(context, Icons.agriculture, "Conseil Agronomique"),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title, String? actionText) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: isDark ? Colors.white : const Color(0xFF0F172A)),
        ),
        if (actionText != null)
          Text(
            actionText,
            style: const TextStyle(color: AgriSenseColors.brandAccent, fontSize: 12, fontWeight: FontWeight.bold),
          ),
      ],
    );
  }

  Widget _buildSmallResourceCard(BuildContext context, {required IconData icon, required String title, required String subtitle}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GlassCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AgriSenseColors.brandPrimary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: AgriSenseColors.brandAccent, size: 20),
          ),
          const SizedBox(height: 12),
          Text(title, style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A), fontWeight: FontWeight.bold)),
          Text(subtitle, style: const TextStyle(color: AgriSenseColors.textMuted, fontSize: 10)),
        ],
      ),
    );
  }

  Widget _buildImpactItem(BuildContext context, {required IconData icon, required String title, required String description}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AgriSenseColors.brandPrimary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: AgriSenseColors.brandAccent, size: 20),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A), fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 4),
              Text(
                description,
                style: const TextStyle(color: AgriSenseColors.textMuted, fontSize: 12, height: 1.5),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildContactButton(BuildContext context, IconData icon, String label) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GlassCard(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Row(
        children: [
          Icon(icon, color: AgriSenseColors.brandAccent, size: 20),
          const SizedBox(width: 16),
          Expanded(
            child: Text(label, style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A), fontSize: 14)),
          ),
          Icon(Icons.chevron_right, color: (isDark ? Colors.white : Colors.black).withOpacity(0.2), size: 18),
        ],
      ),
    );
  }
}
