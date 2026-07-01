import 'dart:ui';
import 'dart:convert';
import 'dart:typed_data';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'constants.dart';

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
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          boxShadow: isDark ? [] : [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 24,
              spreadRadius: 0,
              offset: const Offset(0, 8),
            ),
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 10,
              spreadRadius: 0,
              offset: const Offset(0, 2),
            )
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
            child: Container(
              padding: padding ?? const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withOpacity(0.05) : Colors.white.withOpacity(0.85),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: isDark 
                    ? Colors.white.withOpacity(0.05) 
                    : Colors.white.withOpacity(0.4),
                  width: 1.5,
                ),
              ),
              child: child,
            ),
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
  final TextEditingController? controller;
  final int? maxLines;
  final bool isRequired;

  const ImmersiveTextField({
    super.key,
    required this.label,
    required this.placeholder,
    required this.icon,
    this.isPassword = false,
    this.rightIcon,
    this.onRightIconClick,
    this.controller,
    this.maxLines = 1,
    this.isRequired = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text.rich(
          TextSpan(
            children: [
              TextSpan(text: label),
              if (isRequired)
                const TextSpan(
                  text: ' *',
                  style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold),
                ),
            ],
            style: TextStyle(
              color: isDark ? AgriSenseColors.textMain : Colors.black87,
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          obscureText: isPassword,
          maxLines: maxLines,
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
            fillColor: isDark ? Colors.white.withOpacity(0.05) : Colors.white,
            contentPadding: const EdgeInsets.symmetric(vertical: 18),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.08)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.08)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: AgriSenseColors.brandPrimary, width: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}

class ImmersiveDropdown extends StatelessWidget {
  final String label;
  final String? value;
  final List<String> items;
  final ValueChanged<String?> onChanged;
  final Widget icon;
  final bool isRequired;

  const ImmersiveDropdown({
    super.key,
    required this.label,
    required this.items,
    required this.onChanged,
    required this.icon,
    this.value,
    this.isRequired = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text.rich(
          TextSpan(
            children: [
              TextSpan(text: label),
              if (isRequired)
                const TextSpan(
                  text: ' *',
                  style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold),
                ),
            ],
            style: TextStyle(
              color: isDark ? AgriSenseColors.textMain : Colors.black87,
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withOpacity(0.05) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.08),
            ),
          ),
          child: DropdownButtonFormField<String>(
            value: value,
            items: items.map((item) {
              return DropdownMenuItem(
                value: item,
                child: Text(
                  item,
                  style: TextStyle(
                    color: isDark ? Colors.white : Colors.black87,
                    fontSize: 14,
                  ),
                ),
              );
            }).toList(),
            onChanged: onChanged,
            icon: const Icon(Icons.keyboard_arrow_down, color: AgriSenseColors.brandPrimary),
            decoration: InputDecoration(
              prefixIcon: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: icon,
              ),
              prefixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(vertical: 18),
            ),
            dropdownColor: isDark ? AgriSenseColors.bgDeep : Colors.white,
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ],
    );
  }
}

class SafeAvatar extends StatelessWidget {
  final String? picture;
  final double size;
  final IconData fallbackIcon;

  const SafeAvatar({
    super.key,
    this.picture,
    this.size = 40,
    this.fallbackIcon = Icons.person,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final fallbackColor = isDark ? Colors.white24 : Colors.black12;

    if (picture == null || picture!.isEmpty) {
      return Icon(fallbackIcon, size: size * 0.6, color: fallbackColor);
    }

    final String picStr = picture!;

    try {
      // 1. Check if it's base64 data URL
      if (picStr.startsWith('data:image/') && picStr.contains(';base64,')) {
        final base64Part = picStr.split(';base64,').last;
        final decodedBytes = base64Decode(base64Part);
        return Image.memory(
          decodedBytes,
          fit: BoxFit.cover,
          width: size,
          height: size,
          errorBuilder: (context, error, stackTrace) {
            return Icon(fallbackIcon, size: size * 0.6, color: fallbackColor);
          },
        );
      }

      // 2. Check if it's a HTTP / Network URL
      if (picStr.startsWith('http://') || picStr.startsWith('https://') || picStr.startsWith('blob:') || picStr.startsWith('content:')) {
        return Image.network(
          picStr,
          fit: BoxFit.cover,
          width: size,
          height: size,
          errorBuilder: (context, error, stackTrace) {
            return Icon(fallbackIcon, size: size * 0.6, color: fallbackColor);
          },
        );
      }

      // 3. Check if it's a local file path
      if (!kIsWeb) {
        return Image.file(
          File(picStr),
          fit: BoxFit.cover,
          width: size,
          height: size,
          errorBuilder: (context, error, stackTrace) {
            return Icon(fallbackIcon, size: size * 0.6, color: fallbackColor);
          },
        );
      }
    } catch (e) {
      print("[SafeAvatar] Error loading image: $e");
    }

    return Icon(fallbackIcon, size: size * 0.6, color: fallbackColor);
  }
}
