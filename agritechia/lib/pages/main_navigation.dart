import 'package:flutter/material.dart';
import '../constants.dart';
import '../services/api_service.dart';
import 'home_page.dart';
import 'chat_page.dart';
import 'crops_page.dart';
import 'history_page.dart';
import 'support_page.dart';
import 'landing_page.dart';

class MainNavigation extends StatefulWidget {
  final int initialIndex;
  final bool isVisitor;
  final VoidCallback? onThemeToggle;
  const MainNavigation({super.key, this.initialIndex = 0, this.isVisitor = false, this.onThemeToggle});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  late int _selectedIndex;
  late List<Widget> _pages;

  @override
  void initState() {
    super.initState();
    _selectedIndex = widget.initialIndex;
    
    // Safety check: if user is NOT logged in and is trying to access member area
    if (!widget.isVisitor && !ApiService.isLoggedIn) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Navigator.of(context).pushReplacementNamed('/');
      });
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (widget.isVisitor) {
      _pages = [
        LandingPage(
          onThemeToggle: widget.onThemeToggle,
          onNavigate: (index) => setState(() => _selectedIndex = index),
        ),
        ChatPage(
          isVisitor: widget.isVisitor,
          onNavigate: (index) => setState(() => _selectedIndex = index),
        ),
        SupportPage(
          isVisitor: widget.isVisitor,
          onNavigate: (index) => setState(() => _selectedIndex = index),
        ),
      ];
    } else {
      _pages = [
        HomePage(
          isVisitor: widget.isVisitor,
          onNavigate: (index) => setState(() => _selectedIndex = index),
          onThemeToggle: widget.onThemeToggle,
        ),
        ChatPage(
          isVisitor: widget.isVisitor,
          onNavigate: (index) => setState(() => _selectedIndex = index),
        ),
        const HistoryPage(),
        CropsPage(
          isVisitor: widget.isVisitor,
          onNavigate: (index) => setState(() => _selectedIndex = index),
        ),
        SupportPage(
          isVisitor: widget.isVisitor,
          onNavigate: (index) => setState(() => _selectedIndex = index),
        ),
      ];
    }
  }

  @override
  Widget build(BuildContext context) {
    // Masquer la navigation sur la page de Chat (index 1)
    bool hideNav = _selectedIndex == 1;

    return Scaffold(
      extendBody: true,
      body: _pages[_selectedIndex],
      bottomNavigationBar: hideNav 
          ? null 
          : BottomNavigationBar(
              currentIndex: _selectedIndex,
              onTap: (index) => setState(() => _selectedIndex = index),
              type: BottomNavigationBarType.fixed,
              backgroundColor: const Color(0xFF0F1713),
              selectedItemColor: AgriSenseColors.brandPrimary,
              unselectedItemColor: Colors.white38,
              selectedLabelStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5),
              unselectedLabelStyle: const TextStyle(fontSize: 10, letterSpacing: 0.5),
              items: widget.isVisitor 
                ? [
                    _buildNavItem(Icons.grid_view_outlined, Icons.grid_view, 'Accueil'),
                    _buildNavItem(Icons.psychology_outlined, Icons.psychology, 'Chat'),
                    _buildNavItem(Icons.help_outline, Icons.help, 'Support'),
                  ]
                : [
                    _buildNavItem(Icons.grid_view_outlined, Icons.grid_view, 'Accueil'),
                    _buildNavItem(Icons.psychology_outlined, Icons.psychology, 'Chat'),
                    _buildNavItem(Icons.history, Icons.history, 'Historique'),
                    _buildNavItem(Icons.grass_outlined, Icons.grass, 'Mes cultures'),
                    _buildNavItem(Icons.help_outline, Icons.help, 'Support'),
                  ],
            ),
    );
  }

  BottomNavigationBarItem _buildNavItem(IconData icon, IconData activeIcon, String label) {
    return BottomNavigationBarItem(
      icon: Icon(icon),
      activeIcon: Icon(activeIcon),
      label: label,
    );
  }
}
