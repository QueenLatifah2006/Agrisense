import 'package:flutter/material.dart';
import 'constants.dart';
import 'pages/landing_page.dart';
import 'pages/signup_page.dart';
import 'pages/login_page.dart';
import 'pages/main_navigation.dart';

void main() {
  runApp(const AgriSenseApp());
}

class AgriSenseApp extends StatefulWidget {
  const AgriSenseApp({super.key});

  @override
  State<AgriSenseApp> createState() => _AgriSenseAppState();
}

class _AgriSenseAppState extends State<AgriSenseApp> {
  ThemeMode _themeMode = ThemeMode.dark;

  void toggleTheme() {
    setState(() {
      _themeMode = _themeMode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AgriSense AI',
      debugShowCheckedModeBanner: false,
      themeMode: _themeMode,
      theme: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        primaryColor: AgriSenseColors.brandPrimary,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.transparent,
          elevation: 0,
          iconTheme: IconThemeData(color: Color(0xFF0F172A)),
          titleTextStyle: TextStyle(color: Color(0xFF0F172A), fontSize: 18, fontWeight: FontWeight.bold),
        ),
        colorScheme: const ColorScheme.light(
          primary: AgriSenseColors.brandPrimary,
          secondary: AgriSenseColors.brandAccent,
          surface: Colors.white,
          onSurface: Color(0xFF0F172A),
        ),
        fontFamily: 'Inter',
      ),
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: AgriSenseColors.bgDeep,
        primaryColor: AgriSenseColors.brandPrimary,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.transparent,
          elevation: 0,
          iconTheme: IconThemeData(color: Colors.white),
          titleTextStyle: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
        ),
        colorScheme: const ColorScheme.dark(
          primary: AgriSenseColors.brandPrimary,
          secondary: AgriSenseColors.brandAccent,
          surface: AgriSenseColors.cardBg,
          onSurface: AgriSenseColors.textMain,
        ),
        fontFamily: 'Inter',
      ),
      initialRoute: '/',
      routes: {
        '/': (context) => LandingPage(onThemeToggle: toggleTheme),
        '/login': (context) => const LoginPage(),
        '/signup': (context) => const SignupPage(),
        '/home': (context) => MainNavigation(initialIndex: 0, isVisitor: false, onThemeToggle: toggleTheme),
        '/chat': (context) => MainNavigation(initialIndex: 1, isVisitor: true, onThemeToggle: toggleTheme),
        '/history': (context) => MainNavigation(initialIndex: 2, isVisitor: false, onThemeToggle: toggleTheme),
        '/support_visitor': (context) => MainNavigation(initialIndex: 2, isVisitor: true, onThemeToggle: toggleTheme),
        '/support_farmer': (context) => MainNavigation(initialIndex: 4, isVisitor: false, onThemeToggle: toggleTheme),
      },
    );
  }
}
