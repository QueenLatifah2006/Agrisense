import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../widgets.dart';
import '../constants.dart';
import '../services/api_service.dart';

class ProfileEditPage extends StatefulWidget {
  const ProfileEditPage({super.key});

  @override
  State<ProfileEditPage> createState() => _ProfileEditPageState();
}

class _ProfileEditPageState extends State<ProfileEditPage> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _locationController = TextEditingController();
  final _newDomainController = TextEditingController();

  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _locationController.dispose();
    _newDomainController.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    setState(() => _isLoading = true);
    final data = await ApiService.getMe();
    if (mounted) {
      setState(() {
        _nameController.text = data['name'] ?? '';
        _emailController.text = data['email'] ?? '';
        _phoneController.text = data['phone'] ?? ''; 
        _locationController.text = data['location'] ?? '';
        if (data['domain'] != null && data['domain'].toString().isNotEmpty) {
          _selectedDomain = data['domain'].toString();
          if (!_domains.contains(_selectedDomain)) {
            _domains.add(_selectedDomain!);
          }
        }
        if (data['profile_picture'] != null && data['profile_picture'].toString().isNotEmpty) {
          _avatarUrl = data['profile_picture'].toString();
        }
        _isLoading = false;
      });
    }
  }

  Future<void> _handleSave() async {
    // Validate required fields
    if (_nameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Le nom complet est obligatoire.")),
      );
      return;
    }
    if (_emailController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("L'email est obligatoire.")),
      );
      return;
    }

    setState(() => _isLoading = true);
    final result = await ApiService.updateMe(
      _nameController.text,
      _emailController.text,
      phone: _phoneController.text,
      location: _locationController.text,
      profilePicture: _pickedFile != null ? _pickedFile!.path : _avatarUrl,
      domain: _selectedDomain,
    );
    setState(() => _isLoading = false);

    if (result.containsKey('id')) {
      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Profil mis à jour avec succès !"),
            backgroundColor: AgriSenseColors.brandPrimary,
          ),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['message'] ?? "Erreur lors de la mise à jour")),
        );
      }
    }
  }

  String? _avatarPath;
  String? _avatarUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop";
  XFile? _pickedFile;

  final List<String> _domains = ['Apiculteur', 'Céréalier', 'Viticuteur', 'Maraîcher', 'Éleveur'];
  String? _selectedDomain = 'Viticuteur';
  bool _showOtherField = false;

  Future<void> _pickImage() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.gallery);

    if (image != null) {
      setState(() {
        _pickedFile = image;
        _avatarPath = image.path;
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

  ImageProvider _getAvatarImage() {
    if (_pickedFile != null) {
      if (kIsWeb) {
        return NetworkImage(_pickedFile!.path);
      } else {
        return FileImage(File(_pickedFile!.path));
      }
    }
    return NetworkImage(_avatarUrl!);
  }

  @override
  Widget build(BuildContext context) {
    // Add "Autre" to display list but not necessarily to the actual data list
    final displayDomains = [..._domains, 'Autre'];

    return Scaffold(
      body: _isLoading 
          ? const Center(child: CircularProgressIndicator(color: AgriSenseColors.brandPrimary))
          : Stack(
              children: [
          SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 80, 24, 140),
            child: Column(
              children: [
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: AgriSenseColors.brandPrimary),
                      onPressed: () => Navigator.pop(context),
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      "Modifier le profil",
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AgriSenseColors.textMain,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 48),

                // Profile Image with Camera Icon
                GestureDetector(
                  onTap: _pickImage,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      Container(
                        width: 96,
                        height: 96,
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          gradient: AgriSenseColors.immersiveGradient,
                          shape: BoxShape.circle,
                        ),
                        child: Container(
                          decoration: const BoxDecoration(
                            color: AgriSenseColors.bgDeep,
                            shape: BoxShape.circle,
                          ),
                          padding: const EdgeInsets.all(4),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(40),
                            child: _pickedFile != null
                                ? (kIsWeb
                                    ? Image.network(
                                        _pickedFile!.path,
                                        fit: BoxFit.cover,
                                        width: 80,
                                        height: 80,
                                        errorBuilder: (context, error, stackTrace) => const Icon(Icons.person, size: 40, color: Colors.white24),
                                      )
                                    : Image.file(
                                        File(_pickedFile!.path),
                                        fit: BoxFit.cover,
                                        width: 80,
                                        height: 80,
                                        errorBuilder: (context, error, stackTrace) => const Icon(Icons.person, size: 40, color: Colors.white24),
                                      ))
                                : (_avatarUrl != null && _avatarUrl!.isNotEmpty
                                    ? Image.network(
                                        _avatarUrl!,
                                        fit: BoxFit.cover,
                                        width: 80,
                                        height: 80,
                                        errorBuilder: (context, error, stackTrace) => const Icon(Icons.person, size: 40, color: Colors.white24),
                                      )
                                    : const Icon(Icons.person, size: 40, color: Colors.white24)),
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            gradient: AgriSenseColors.immersiveGradient,
                            shape: BoxShape.circle,
                            border: Border.all(color: AgriSenseColors.bgDeep, width: 4),
                          ),
                          child: const Icon(Icons.camera_alt, color: Colors.white, size: 14),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 48),

                // Form Fields
                ImmersiveTextField(
                  label: "Nom complet",
                  placeholder: "Nom complet",
                  icon: const Icon(Icons.person_outline, color: Colors.white54, size: 18),
                  controller: _nameController,
                  isRequired: true,
                ),
                const SizedBox(height: 24),
                ImmersiveTextField(
                  label: "Email",
                  placeholder: "Email",
                  icon: const Icon(Icons.mail_outline, color: Colors.white54, size: 18),
                  controller: _emailController,
                  isRequired: true,
                ),
                const SizedBox(height: 24),
                ImmersiveTextField(
                  label: "Téléphone",
                  placeholder: "Téléphone",
                  icon: const Icon(Icons.phone_outlined, color: Colors.white54, size: 18),
                  controller: _phoneController,
                ),
                const SizedBox(height: 24),
                ImmersiveTextField(
                  label: "Localisation",
                  placeholder: "Localisation",
                  icon: const Icon(Icons.location_on_outlined, color: Colors.white54, size: 18),
                  controller: _locationController,
                ),
                const SizedBox(height: 24),
                
                ImmersiveDropdown(
                  label: "Domaine",
                  value: _showOtherField ? 'Autre' : _selectedDomain,
                  items: displayDomains,
                  onChanged: _onDomainChanged,
                  icon: const Icon(Icons.category_outlined, color: Colors.white54, size: 18),
                ),

                if (_showOtherField) ...[
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _newDomainController,
                          style: const TextStyle(color: Colors.white, fontSize: 14),
                          decoration: InputDecoration(
                            hintText: "Entrez votre domaine",
                            hintStyle: TextStyle(color: AgriSenseColors.textMuted.withOpacity(0.5)),
                            filled: true,
                            fillColor: Colors.white.withOpacity(0.05),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide: BorderSide(color: Colors.white.withOpacity(0.05)),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide: BorderSide(color: Colors.white.withOpacity(0.05)),
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
                
                const SizedBox(height: 48),
                ImmersiveButton(
                  label: "ENREGISTRER LES MODIFICATIONS",
                  fullWidth: true,
                  icon: const Icon(Icons.save_outlined, color: Colors.white, size: 18),
                  onPressed: _handleSave,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
