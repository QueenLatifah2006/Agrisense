import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../widgets.dart';
import '../constants.dart';
import '../services/api_service.dart';

class SignupPage extends StatefulWidget {
  const SignupPage({super.key});

  @override
  State<SignupPage> createState() => _SignupPageState();
}

class _SignupPageState extends State<SignupPage> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _newDomainController = TextEditingController();
  final List<String> _domains = ['Apiculteur', 'Céréalier', 'Viticuteur', 'Maraîcher', 'Éleveur'];
  String? _selectedDomain;
  bool _showOtherField = false;
  bool _isLoading = false;
  XFile? _pickedFile;

  Future<void> _pickImage() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.gallery);

    if (image != null) {
      setState(() {
        _pickedFile = image;
      });
    }
  }

  void _onDomainChanged(String? newValue) {
    if (newValue == 'Autre') {
      setState(() {
        _showOtherField = true;
      });
    } else {
      setState(() {
        _selectedDomain = newValue;
        _showOtherField = false;
      });
    }
  }

  void _addNewDomain() {
    final newDomain = _newDomainController.text.trim();
    if (newDomain.isNotEmpty && !_domains.contains(newDomain)) {
      setState(() {
        _domains.add(newDomain);
        _selectedDomain = newDomain;
        _showOtherField = false;
        _newDomainController.clear();
      });
    }
  }

  Future<void> _handleSignup() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (_nameController.text.isEmpty || email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Veuillez remplir tous les champs obligatoires")),
      );
      return;
    }

    // Email validation
    final isEmailLower = email == email.toLowerCase();
    final hasAt = email.contains('@');
    final hasDot = email.contains('.');
    if (!isEmailLower || !hasAt || !hasDot) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("L'email doit être en minuscule et contenir un @ et un point.")),
      );
      return;
    }

    // Password validation
    final passwordRegex = RegExp(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$');
    if (!passwordRegex.hasMatch(password)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.")),
      );
      return;
    }

    setState(() => _isLoading = true);
    final result = await ApiService.signup(
      name: _nameController.text,
      email: email,
      password: password,
      domain: _selectedDomain,
      profilePicture: _pickedFile?.path,
    );
    setState(() => _isLoading = false);

    if (result.containsKey('token')) {
      if (mounted) {
        Navigator.pushReplacementNamed(context, '/home');
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['message'] ?? "Erreur d'inscription")),
        );
      }
    }
  }

  ImageProvider _getAvatarImage() {
    if (_pickedFile != null) {
      if (kIsWeb) {
        return NetworkImage(_pickedFile!.path);
      } else {
        return FileImage(File(_pickedFile!.path));
      }
    }
    return const NetworkImage("https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=200&h=200&fit=crop");
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final displayDomains = [..._domains, 'Autre'];

    return Scaffold(
      body: Stack(
        children: [
          Positioned(
            bottom: -100,
            left: -100,
            child: Container(
              width: 500,
              height: 500,
              decoration: BoxDecoration(
                color: Colors.purpleAccent.withOpacity(isDark ? 0.05 : 0.03),
                shape: BoxShape.circle,
              ),
            ),
          ),
          
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 400),
                child: GlassCard(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Avatar Selection
                      GestureDetector(
                        onTap: _pickImage,
                        child: Stack(
                          children: [
                            Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: AgriSenseColors.brandPrimary.withOpacity(0.2), width: 2),
                              ),
                              padding: const EdgeInsets.all(4),
                              child: CircleAvatar(
                                radius: 36,
                                backgroundImage: _getAvatarImage(),
                              ),
                            ),
                            Positioned(
                              bottom: 0,
                              right: 0,
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(
                                  color: AgriSenseColors.brandPrimary,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.add_a_photo, color: Colors.white, size: 12),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        "Rejoindre AgriSense",
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: isDark ? AgriSenseColors.textMain : const Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        "Commencez votre voyage vers une agriculture intelligente.",
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 14,
                          color: isDark ? AgriSenseColors.textMuted : Colors.black54,
                        ),
                      ),
                      const SizedBox(height: 32),
                      
                      ImmersiveTextField(
                        label: "Nom complet",
                        placeholder: "Votre nom complet",
                        controller: _nameController,
                        icon: Icon(Icons.person_outline, color: isDark ? Colors.white54 : Colors.black45, size: 18),
                        isRequired: true,
                      ),
                      const SizedBox(height: 20),
                      ImmersiveTextField(
                        label: "Email professionnel",
                        placeholder: "votre@email.com",
                        controller: _emailController,
                        icon: Icon(Icons.mail_outline, color: isDark ? Colors.white54 : Colors.black45, size: 18),
                        isRequired: true,
                      ),
                      const SizedBox(height: 20),
                      
                      ImmersiveDropdown(
                        label: "Domaine d'activité",
                        value: _showOtherField ? 'Autre' : _selectedDomain,
                        items: displayDomains,
                        onChanged: _onDomainChanged,
                        icon: Icon(Icons.category_outlined, color: isDark ? Colors.white54 : Colors.black45, size: 18),
                      ),

                      if (_showOtherField) ...[
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _newDomainController,
                                style: TextStyle(color: isDark ? Colors.white : Colors.black87, fontSize: 13),
                                decoration: InputDecoration(
                                  hintText: "Précisez votre domaine",
                                  hintStyle: TextStyle(color: isDark ? AgriSenseColors.textMuted.withOpacity(0.5) : Colors.black38),
                                  filled: true,
                                  fillColor: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.05),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    borderSide: BorderSide.none,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            IconButton(
                              onPressed: _addNewDomain,
                              icon: const Icon(Icons.check_circle, color: AgriSenseColors.brandPrimary),
                            ),
                          ],
                        ),
                      ],

                      const SizedBox(height: 20),
                      ImmersiveTextField(
                        label: "Mot de passe",
                        placeholder: "••••••••",
                        controller: _passwordController,
                        isPassword: true,
                        icon: Icon(Icons.lock_outline, color: isDark ? Colors.white54 : Colors.black45, size: 18),
                        isRequired: true,
                      ),
                      const SizedBox(height: 32),
                      
                      _isLoading 
                        ? const CircularProgressIndicator(color: AgriSenseColors.brandPrimary)
                        : ImmersiveButton(
                            label: "CRÉER MON COMPTE",
                            fullWidth: true,
                            onPressed: _handleSignup,
                          ),
                      
                      const SizedBox(height: 32),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            "Déjà un compte ? ",
                            style: TextStyle(color: isDark ? AgriSenseColors.textMuted : Colors.black45, fontSize: 13),
                          ),
                          GestureDetector(
                            onTap: () => Navigator.pushNamed(context, '/login'),
                            child: const Text(
                              "Connectez-vous",
                              style: TextStyle(
                                color: AgriSenseColors.brandPrimary,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
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
