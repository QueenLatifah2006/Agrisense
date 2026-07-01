import 'package:flutter/material.dart';

class AgriSenseColors {
  static const Color bgDeep = Color(0xFF002114);
  static const Color cardBg = Color(0xFF042813);
  static const Color surfaceItem = Color(0xFF013011);
  static const Color textMain = Color(0xFFF1F5F9);
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color brandPrimary = Color(0xFF95D3BA); // Mint Emerald
  static const Color brandAccent = Color(0xFF4EDEA3);  // Vibrant Emerald
  static const Color brandPurple = Color(0xFF10B981);  // Classic Emerald base
  
  static const Gradient immersiveGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [brandPrimary, brandAccent],
  );

  static const Gradient accentGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [brandPrimary, Color(0xFF10B981)],
  );
}
