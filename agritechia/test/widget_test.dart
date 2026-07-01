import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:agritech_ai/constants.dart';

class ImmersiveButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;
  final bool fullWidth;
  final bool isSecondary;
  final bool isError;
  final Widget? icon;

  const ImmersiveButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.fullWidth = false,
    this.isSecondary = false,
    this.isError = false,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return SizedBox(
      width: fullWidth ? double.infinity : null,
      child: Container(
        decoration: BoxDecoration(
          gradient: (isSecondary || isError) ? null : AgriSenseColors.immersiveGradient,
          color: isError 
              ? Colors.red.withOpacity(0.1) 
              : isSecondary 
                  ? (isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.05))
                  : null,
          borderRadius: BorderRadius.circular(16),
          border: isSecondary ? Border.all(color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.05)) : null,
          boxShadow: [
            if (!isSecondary && !isError)
              BoxShadow(
                color: AgriSenseColors.brandPrimary.withOpacity(isDark ? 0.3 : 0.15),
                blurRadius: 20,
                offset: const Offset(0, 10),
              )
          ],
        ),
        child: ElevatedButton(
          onPressed: onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.transparent,
            shadowColor: Colors.transparent,
            padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 24),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                icon!,
                const SizedBox(width: 8),
              ],
              Text(
                label,
                style: TextStyle(
                  color: isError 
                      ? Colors.red 
                      : isSecondary 
                          ? (isDark ? AgriSenseColors.brandPrimary : AgriSenseColors.brandPrimary) 
                          : Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;
  final bool hoverEffect;

  const GlassCard({
    super.key, 
    required this.child, 
    this.padding, 
    this.onTap,
    this.hoverEffect = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
          child: Container(
            padding: padding ?? const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withOpacity(0.05) : Colors.white.withOpacity(0.7),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: isDark ? Colors.white.withOpacity(0.05) : Colors.white.withOpacity(0.2)),
              boxShadow: isDark ? [] : [
                BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 20,
                  spreadRadius: 0,
                  offset: const Offset(0, 4),
                )
              ],
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}

class ImmersiveTextField extends StatelessWidget {
  final String label;
  final String placeholder;
  final Widget icon;
  final bool isPassword;
  final Widget? rightIcon;
  final VoidCallback? onRightIconClick;

  const ImmersiveTextField({
    super.key,
    required this.label,
    required this.placeholder,
    required this.icon,
    this.isPassword = false,
    this.rightIcon,
    this.onRightIconClick,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: isDark ? AgriSenseColors.textMain : Colors.black87,
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          obscureText: isPassword,
          style: TextStyle(color: isDark ? Colors.white : Colors.black87, fontSize: 14),
          decoration: InputDecoration(
            hintText: placeholder,
            hintStyle: TextStyle(color: isDark ? AgriSenseColors.textMuted.withOpacity(0.5) : Colors.black38),
            prefixIcon: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: icon,
            ),
            prefixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
            suffixIcon: rightIcon != null 
              ? InkWell(
                  onTap: onRightIconClick,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: rightIcon,
                  ),
                )
              : null,
            filled: true,
            fillColor: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.03),
            contentPadding: const EdgeInsets.symmetric(vertical: 18),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.05)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.05)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: AgriSenseColors.brandPrimary.withOpacity(0.5)),
            ),
          ),
        ),
      ],
    );
  }
}
