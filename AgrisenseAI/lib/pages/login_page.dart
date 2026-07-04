import 'package:flutter/material.dart';
import '../widgets.dart';
import '../constants.dart';
import '../services/api_service.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _showPassword = false;
  bool _isLoading = false;

  Future<void> _handleLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Veuillez remplir tous les champs")),
      );
      return;
    }

    setState(() => _isLoading = true);
    final result = await ApiService.login(email, password);
    setState(() => _isLoading = false);

    if (result.containsKey('token')) {
      if (mounted) {
        Navigator.pushReplacementNamed(context, '/home');
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['message'] ?? "Erreur de connexion")),
        );
      }
    }
  }

  void _showForgotPasswordDialog() {
    final emailController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Mot de passe oublié"),
        content: TextField(
          controller: emailController,
          decoration: const InputDecoration(labelText: "Email professionnel"),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text("Annuler")),
          ElevatedButton(
            onPressed: () {
              final email = emailController.text.trim();
              // Validation email
              final isLower = email == email.toLowerCase();
              final hasAt = email.contains('@');
              final hasDot = email.contains('.');
              if (!isLower || !hasAt || !hasDot) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("L'email doit être en minuscule et contenir un @ et un point.")),
                );
                return;
              }
              Navigator.pop(context);
              _sendRecoveryCode(email);
            },
            child: const Text("Envoyer le code"),
          ),
        ],
      ),
    );
  }

  Future<void> _sendRecoveryCode(String email) async {
    setState(() => _isLoading = true);
    final result = await ApiService.forgotPassword(email);
    setState(() => _isLoading = false);

    if (result.containsKey('message')) {
      _showVerifyCodeDialog(email);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['error'] ?? "Erreur lors de l'envoi du code")),
      );
    }
  }

  void _showVerifyCodeDialog(String email) {
    final codeController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Vérification"),
        content: TextField(
          controller: codeController,
          decoration: const InputDecoration(labelText: "Code à 5 chiffres"),
          keyboardType: TextInputType.number,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text("Annuler")),
          ElevatedButton(
            onPressed: () {
              final code = codeController.text.trim();
              Navigator.pop(context);
              _verifyCode(email, code);
            },
            child: const Text("Vérifier"),
          ),
        ],
      ),
    );
  }

  Future<void> _verifyCode(String email, String code) async {
    setState(() => _isLoading = true);
    final result = await ApiService.verifyCode(email, code);
    setState(() => _isLoading = false);

    if (result.containsKey('message') && result['message'] == 'Code valide') {
      _showResetPasswordDialog(email, code);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['message'] ?? "Code invalide")),
      );
    }
  }

  void _showResetPasswordDialog(String email, String code) {
    final passController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Nouveau mot de passe"),
        content: TextField(
          controller: passController,
          decoration: const InputDecoration(labelText: "Nouveau mot de passe"),
          obscureText: true,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text("Annuler")),
          ElevatedButton(
            onPressed: () {
              final newPass = passController.text;
              // Validation password
              final passwordRegex = RegExp(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$');
              if (!passwordRegex.hasMatch(newPass)) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.")),
                );
                return;
              }
              Navigator.pop(context);
              _resetPassword(email, code, newPass);
            },
            child: const Text("Réinitialiser"),
          ),
        ],
      ),
    );
  }

  Future<void> _resetPassword(String email, String code, String newPass) async {
    setState(() => _isLoading = true);
    final result = await ApiService.resetPassword(email, code, newPass);
    setState(() => _isLoading = false);

    if (result.containsKey('message')) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Mot de passe réinitialisé avec succès !")),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['message'] ?? "Erreur lors de la réinitialisation")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      body: Stack(
        children: [
          Positioned(
            top: -100,
            right: -100,
            child: Container(
              width: 500,
              height: 500,
              decoration: BoxDecoration(
                color: AgriSenseColors.brandPrimary.withOpacity(isDark ? 0.1 : 0.05),
                shape: BoxShape.circle,
              ),
            ),
          ),
          
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 400),
                child: GlassCard(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Logo Box
                      Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          gradient: AgriSenseColors.immersiveGradient,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: AgriSenseColors.brandPrimary.withOpacity(0.4),
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                            )
                          ],
                        ),
                        child: const Icon(Icons.eco, color: Colors.white, size: 32),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        "AgriSense AI",
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: isDark ? AgriSenseColors.textMain : const Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        "Votre intelligence agricole, ancrée dans la terre.",
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 14,
                          color: isDark ? AgriSenseColors.textMuted : Colors.black54,
                        ),
                      ),
                      const SizedBox(height: 48),
                      
                      ImmersiveTextField(
                        label: "Email professionnel",
                        placeholder: "agronome@exemple.fr",
                        controller: _emailController,
                        icon: Icon(Icons.mail_outline, color: isDark ? Colors.white54 : Colors.black45, size: 18),
                        isRequired: true,
                      ),
                      const SizedBox(height: 24),
                      ImmersiveTextField(
                        label: "Mot de passe",
                        placeholder: "••••••••",
                        controller: _passwordController,
                        isPassword: !_showPassword,
                        icon: Icon(Icons.lock_outline, color: isDark ? Colors.white54 : Colors.black45, size: 18),
                        rightIcon: Icon(
                          _showPassword ? Icons.visibility_off : Icons.visibility,
                          color: isDark ? Colors.white38 : Colors.black26,
                          size: 18,
                        ),
                        onRightIconClick: () => setState(() => _showPassword = !_showPassword),
                        isRequired: true,
                      ),
                      const SizedBox(height: 12),
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: _showForgotPasswordDialog,
                          child: const Text(
                            "Mot de passe oublié ?",
                            style: TextStyle(color: AgriSenseColors.brandPrimary, fontSize: 13, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      
                      _isLoading 
                        ? const CircularProgressIndicator(color: AgriSenseColors.brandPrimary)
                        : ImmersiveButton(
                            label: "SE CONNECTER",
                            fullWidth: true,
                            onPressed: _handleLogin,
                          ),
                      
                      const SizedBox(height: 32),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            "Pas de compte ? ",
                            style: TextStyle(color: isDark ? AgriSenseColors.textMuted : Colors.black45, fontSize: 13),
                          ),
                          GestureDetector(
                            onTap: () => Navigator.pushNamed(context, '/signup'),
                            child: const Text(
                              "Inscrivez-vous",
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
