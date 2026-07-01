import 'package:flutter/material.dart';
import '../constants.dart';
import '../widgets.dart';
import '../services/api_service.dart';

class AddCropPage extends StatefulWidget {
  const AddCropPage({super.key});

  @override
  State<AddCropPage> createState() => _AddCropPageState();
}

class _AddCropPageState extends State<AddCropPage> {
  final _nameController = TextEditingController();
  final _zoneController = TextEditingController();
  final _dateController = TextEditingController();
  DateTime? _selectedDate;

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2101),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: AgriSenseColors.brandPrimary,
              onPrimary: AgriSenseColors.bgDeep,
              surface: AgriSenseColors.cardBg,
              onSurface: Colors.white,
            ),
            dialogBackgroundColor: AgriSenseColors.bgDeep,
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
        _dateController.text = "${picked.day}/${picked.month}/${picked.year}";
      });
    }
  }

  bool _isLoading = false;

  Future<void> _handleCreateCrop() async {
    if (_nameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Le nom de la culture est obligatoire")),
      );
      return;
    }
    if (_zoneController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("La zone (Surface ou Emplacement) est obligatoire")),
      );
      return;
    }

    setState(() => _isLoading = true);
    final result = await ApiService.createCrop({
      'name': _nameController.text,
      'area': _zoneController.text, // On passe la zone comme 'area' pour l'instant
      'planting_date': _selectedDate?.toIso8601String(),
      'status': 'active',
      'type': 'Culture',
    });
    setState(() => _isLoading = false);

    if (result.containsKey('id')) {
      if (mounted) {
        Navigator.pop(context, true); // On retourne true pour signaler un changement
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Culture ajoutée avec succès !"),
            backgroundColor: AgriSenseColors.brandPrimary,
          ),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['message'] ?? "Erreur lors de la création")),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: AgriSenseColors.bgDeep,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          "Ajouter une culture",
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "Informations sur la culture",
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              "Remplissez les détails ci-dessous pour commencer le suivi de votre nouvelle culture.",
              style: TextStyle(color: Colors.white54, fontSize: 14),
            ),
            const SizedBox(height: 32),
            
            ImmersiveTextField(
              label: "Nom de la culture",
              placeholder: "Ex: Maïs, Manioc...",
              controller: _nameController,
              icon: const Icon(Icons.grass_outlined, color: Colors.white54, size: 18),
              isRequired: true,
            ),
            const SizedBox(height: 24),
            
            ImmersiveTextField(
              label: "La zone (Surface ou Emplacement)",
              placeholder: "Ex: Secteur A, 2.5 ha...",
              controller: _zoneController,
              icon: const Icon(Icons.map_outlined, color: Colors.white54, size: 18),
              isRequired: true,
            ),
            const SizedBox(height: 24),
            
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => _selectDate(context),
                    child: AbsorbPointer(
                      child: ImmersiveTextField(
                        label: "Début de semis",
                        placeholder: "Date",
                        controller: _dateController,
                        icon: const Icon(Icons.calendar_today_outlined, color: Colors.white54, size: 16),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: GestureDetector(
                    onTap: () => _selectDate(context),
                    child: AbsorbPointer(
                      child: ImmersiveTextField(
                        label: "Fin de semis",
                        placeholder: "Date",
                        icon: const Icon(Icons.calendar_today_outlined, color: Colors.white54, size: 16),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 32),

            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AgriSenseColors.brandPrimary.withOpacity(0.05),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AgriSenseColors.brandPrimary.withOpacity(0.1)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.auto_awesome, color: AgriSenseColors.brandPrimary, size: 16),
                      SizedBox(width: 8),
                      Text(
                        "Récolte (Estimation IA)",
                        style: TextStyle(color: AgriSenseColors.brandPrimary, fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    "Cette période sera affinée automatiquement par l'IA en fonction de l'évolution réelle de votre culture.",
                    style: TextStyle(color: Colors.white38, fontSize: 11, height: 1.4),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => _selectDate(context),
                          child: AbsorbPointer(
                            child: ImmersiveTextField(
                              label: "Début estimé",
                              placeholder: "Date",
                              icon: const Icon(Icons.calendar_month_outlined, color: Colors.white54, size: 16),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => _selectDate(context),
                          child: AbsorbPointer(
                            child: ImmersiveTextField(
                              label: "Fin estimée",
                              placeholder: "Date",
                              icon: const Icon(Icons.calendar_month_outlined, color: Colors.white54, size: 16),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 48),
            
            _isLoading 
              ? const Center(child: CircularProgressIndicator(color: AgriSenseColors.brandPrimary))
              : ImmersiveButton(
                  label: "Créer la culture",
                  onPressed: _handleCreateCrop,
                ),
          ],
        ),
      ),
    );
  }
}
