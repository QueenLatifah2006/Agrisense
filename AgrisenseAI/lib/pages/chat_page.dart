import 'dart:ui';
import 'dart:async';
import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:record/record.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter/material.dart';
import '../widgets.dart';
import '../constants.dart';
import 'profile_page.dart';
import '../services/api_service.dart';
import '../widgets/voice_message_player.dart';

class ChatPage extends StatefulWidget {
  final Function(int)? onNavigate;
  final bool isVisitor;
  final int? initialChatId;
  
  const ChatPage({super.key, this.onNavigate, this.isVisitor = false, this.initialChatId});

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final TextEditingController _controller = TextEditingController();
  bool _showMenu = false;
  final List<Map<String, dynamic>> _messages = [];
  int? _currentChatId;
  bool _isLoadingMessages = false;
  bool _isSending = false;

  // WhatsApp vocal state controls
  bool _isRecording = false;
  bool _isPreviewing = false;
  int _recordingSeconds = 0;
  Timer? _recordingTimer;
  final _audioRecorder = AudioRecorder();
  String? _recordingPath;
  double _dragPosition = 0;
  bool _dragToCancelTriggered = false;

  @override
  void initState() {
    super.initState();
    _currentChatId = widget.initialChatId;
    if (_currentChatId != null) {
      _loadChatHistory();
    } else {
      // Welcome Message
      _messages.add({
        'id': 'welcome', 
        'role': 'assistant', 
        'content': "Bonjour ! Je suis AgriSense AI. Quel conseil ou question d'agriculture avez-vous pour moi aujourd'hui ?", 
        'timestamp': 'Maintenant'
      });
    }
  }

  @override
  void dispose() {
    _recordingTimer?.cancel();
    _audioRecorder.dispose();
    _controller.dispose();
    super.dispose();
  }

  Future<void> _loadChatHistory() async {
    setState(() => _isLoadingMessages = true);
    try {
      final history = await ApiService.getChatMessages(_currentChatId!);
      setState(() {
        _messages.clear();
        for (var m in history) {
          final sender = m['sender'] ?? 'ai';
          _messages.add({
            'id': (m['id'] ?? DateTime.now().toString()).toString(),
            'role': sender == 'user' ? 'user' : 'assistant',
            'content': m['content'] ?? '',
            'pdf_url': m['pdf_url'],
            'audio_url': m['audio_url'],
            'timestamp': 'Enregistré',
          });
        }
        _isLoadingMessages = false;
      });
    } catch (_) {
      setState(() => _isLoadingMessages = false);
    }
  }

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _isSending) return;

    _controller.clear();

    setState(() {
      _isSending = true;
      _messages.add({
        'id': DateTime.now().toString(),
        'role': 'user',
        'content': text,
        'timestamp': 'À l\'instant',
      });
      // Add loading state bubble
      _messages.add({
        'id': 'loading_placeholder',
        'role': 'assistant',
        'content': "AgriSense IA est en train de réfléchir...",
        'timestamp': 'En cours',
        'isLoading': true,
      });
    });

    try {
      final response = await ApiService.sendChatMessage(text, chatId: _currentChatId);
      
      setState(() {
        _messages.removeWhere((item) => item['id'] == 'loading_placeholder');
        _isSending = false;

        if (response.containsKey('error')) {
          _messages.add({
            'id': DateTime.now().toString(),
            'role': 'assistant',
            'content': "Désolé, je n'ai pas pu me connecter au serveur AI local. Veuillez verifier votre connectivité.",
            'timestamp': 'Maintenant',
          });
        } else {
          final aiResult = response['result'] ?? response['message'] ?? response['text'] ?? "Une erreur interne s'est produite lors de l'appel de l'agent.";
          _messages.add({
            'id': DateTime.now().toString(),
            'role': 'assistant',
            'content': aiResult,
            'pdf_url': response['pdfUrl'],
            'audio_url': response['audioUrl'],
            'timestamp': 'À l\'instant',
          });

          // Cache current chat session ID returned from DB for consecutive requests
          if (response['chatId'] != null) {
            _currentChatId = response['chatId'];
          }
        }
      });
    } catch (_) {
      setState(() {
        _messages.removeWhere((item) => item['id'] == 'loading_placeholder');
        _isSending = false;
        _messages.add({
          'id': DateTime.now().toString(),
          'role': 'assistant',
          'content': "Une erreur réseau est survenue.",
          'timestamp': 'Maintenant',
        });
      });
    }
  }

  String _formatTimer(int secs) {
    final mins = secs ~/ 60;
    final remain = secs % 60;
    return "${mins.toString().padLeft(2, '0')}:${remain.toString().padLeft(2, '0')}";
  }

  Future<void> _startRecording() async {
    final status = await Permission.microphone.request();
    if (status != PermissionStatus.granted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Permission microphone refusée.')));
      return;
    }

    final directory = await getApplicationDocumentsDirectory();
    _recordingPath = '${directory.path}/voice_msg_${DateTime.now().millisecondsSinceEpoch}.m4a';

    if (await _audioRecorder.hasPermission()) {
      await _audioRecorder.start(
        const RecordConfig(),
        path: _recordingPath!,
      );

      setState(() {
        _isRecording = true;
        _isPreviewing = false;
        _recordingSeconds = 0;
        _dragPosition = 0;
        _dragToCancelTriggered = false;
      });
      
      _recordingTimer?.cancel();
      _recordingTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        setState(() => _recordingSeconds++);
      });
    }
  }

  Future<void> _cancelRecording() async {
    _recordingTimer?.cancel();
    if (await _audioRecorder.isRecording()) {
      await _audioRecorder.stop();
    }
    if (_recordingPath != null) {
      final file = File(_recordingPath!);
      if (await file.exists()) {
        await file.delete();
      }
    }
    setState(() {
      _isRecording = false;
      _isPreviewing = false;
      _recordingSeconds = 0;
      _dragPosition = 0;
    });
  }

  Future<void> _stopAndPreview() async {
    _recordingTimer?.cancel();
    if (await _audioRecorder.isRecording()) {
      await _audioRecorder.stop();
    }
    setState(() {
      _isRecording = false;
      _isPreviewing = true;
    });
  }

  Future<void> _sendVoiceMessage() async {
    _recordingTimer?.cancel();
    String? base64Audio;
    
    if (await _audioRecorder.isRecording()) {
      await _audioRecorder.stop();
    }

    if (_recordingPath != null) {
      final file = File(_recordingPath!);
      if (await file.exists()) {
        final bytes = await file.readAsBytes();
        base64Audio = base64Encode(bytes);
        await file.delete();
      }
    }

    if (base64Audio == null) {
       _cancelRecording();
       return;
    }

    setState(() {
      _isRecording = false;
      _isPreviewing = false;
      _isSending = true;
      _dragPosition = 0;
      _messages.add({
        'id': DateTime.now().toString(),
        'role': 'user',
        'content': '🎙️ Message vocal...',
        'timestamp': 'À l\'instant',
        'audio_url': _recordingPath,
      });
      _messages.add({
        'id': 'loading_placeholder',
        'role': 'assistant',
        'content': "AgriSense IA transcrira l'audio et générera vos rapports...",
        'timestamp': 'En cours',
        'isLoading': true,
      });
    });

    try {
      final response = await ApiService.sendChatMessage(
        'Vocal transmet',
        chatId: _currentChatId,
        audio: base64Audio,
        isAudio: true,
      );

      setState(() {
        _messages.removeWhere((item) => item['id'] == 'loading_placeholder');
        _isSending = false;

        if (response.containsKey('error')) {
          _messages.add({
            'id': DateTime.now().toString(),
            'role': 'assistant',
            'content': "Le canal vocal ou d'enregistrement audio est momentanément indisponible.",
            'timestamp': 'Maintenant',
          });
        } else {
          if (response['queryMessage'] != null) {
            for (var m in _messages) {
              if (m['content'] == '🎙️ Message vocal envoyé...' && m['role'] == 'user') {
                m['content'] = '🎙️ "${response['queryMessage']}"';
              }
            }
          }

          final aiResult = response['result'] ?? response['message'] ?? response['text'] ?? "Une erreur s'est produite.";
          _messages.add({
            'id': DateTime.now().toString(),
            'role': 'assistant',
            'content': aiResult,
            'pdf_url': response['pdfUrl'],
            'audio_url': response['audioUrl'],
            'timestamp': 'À l\'instant',
          });

          if (response['chatId'] != null) {
            _currentChatId = response['chatId'];
          }
        }
      });
    } catch (_) {
      setState(() {
        _messages.removeWhere((item) => item['id'] == 'loading_placeholder');
        _isSending = false;
        _messages.add({
          'id': DateTime.now().toString(),
          'role': 'assistant',
          'content': "Impossible de joindre la passerelle vocale.",
          'timestamp': 'Maintenant',
        });
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        titleSpacing: widget.onNavigate != null ? 0 : 24,
        leading: widget.onNavigate != null 
          ? IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () => widget.onNavigate!(0),
            )
          : null,
        title: Row(
          children: [
            if (widget.onNavigate == null) const SizedBox(width: 8),
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AgriSenseColors.brandPrimary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.eco, color: AgriSenseColors.brandPrimary, size: 20),
            ),
            const SizedBox(width: 12),
            Text(
              "AgriSense AI",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: isDark ? Colors.white : const Color(0xFF0F172A)),
            ),
          ],
        ),
        actions: [
          if (!widget.isVisitor) ...[
            IconButton(
              onPressed: () => setState(() => _showMenu = !_showMenu),
              icon: Icon(
                _showMenu ? Icons.close : Icons.add,
                color: isDark ? AgriSenseColors.textMuted : Colors.black45,
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => ProfilePage(isVisitor: widget.isVisitor)));
              },
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.05)),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.network(
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 24),
          ],
        ],
      ),
      body: Stack(
        children: [
          // Background Glow
          Positioned(
            top: 0,
            left: MediaQuery.of(context).size.width / 4,
            child: Container(
              width: MediaQuery.of(context).size.width / 2,
              height: 400,
              decoration: BoxDecoration(
                color: AgriSenseColors.brandPrimary.withOpacity(isDark ? 0.05 : 0.03),
                shape: BoxShape.circle,
              ),
            ),
          ),

          Column(
            children: [
              Expanded(
                child: _isLoadingMessages
                  ? const Center(child: CircularProgressIndicator(color: AgriSenseColors.brandPrimary))
                  : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(24, 120, 24, 150),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final m = _messages[index];
                      final isAssistant = m['role'] == 'assistant';
                      return _buildChatBubble(m, isAssistant);
                    },
                  ),
              ),
            ],
          ),

          // Input Area
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 48),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    theme.scaffoldBackgroundColor.withOpacity(0),
                    theme.scaffoldBackgroundColor,
                  ],
                ),
              ),
              child: Column(
                children: [
                  // Quick Suggestions
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: ["Ravageurs du cacao ?", "Prix du Maïs à Yaoundé", "Variétés de manioc"].map((s) => Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: GestureDetector(
                          onTap: () {
                            _controller.text = s;
                            _send();
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              color: isDark ? Colors.white.withOpacity(0.03) : Colors.black.withOpacity(0.03),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.05)),
                            ),
                            child: Text(s, style: TextStyle(color: isDark ? AgriSenseColors.textMuted : Colors.black54, fontSize: 13)),
                          ),
                        ),
                      )).toList(),
                    ),
                  ),
                            // Chat Input
                  Container(
                      padding: const EdgeInsets.all(8).copyWith(left: 20),
                      decoration: BoxDecoration(
                        color: isDark ? AgriSenseColors.surfaceItem.withOpacity(0.9) : Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.05)),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(isDark ? 0.3 : 0.05), blurRadius: 20, offset: const Offset(0, 4)),
                        ],
                      ),
                      child: Row(
                        children: [
                          if (_isRecording) ...[
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 500),
                              padding: EdgeInsets.all(_recordingSeconds % 2 == 0 ? 0 : 4),
                              child: const Icon(Icons.fiber_manual_record, color: Colors.redAccent, size: 18),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              _formatTimer(_recordingSeconds),
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, fontFamily: 'monospace', color: AgriSenseColors.brandPrimary),
                            ),
                            const Spacer(),
                            GestureDetector(
                              onTap: _cancelRecording,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                decoration: BoxDecoration(
                                  color: Colors.redAccent.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: const Icon(Icons.delete, color: Colors.redAccent, size: 20),
                              ),
                            ),
                            const SizedBox(width: 8),
                            GestureDetector(
                              onTap: _stopAndPreview,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                decoration: BoxDecoration(
                                  color: AgriSenseColors.brandPrimary.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: const Icon(Icons.stop_circle, color: AgriSenseColors.brandPrimary, size: 20),
                              ),
                            ),
                            const SizedBox(width: 8),
                            GestureDetector(
                              onTap: _sendVoiceMessage,
                              child: Container(
                                width: 48,
                                height: 48,
                                decoration: BoxDecoration(
                                  gradient: AgriSenseColors.immersiveGradient,
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: const Icon(Icons.send, color: Colors.white, size: 20),
                              ),
                            ),
                          ] else if (_isPreviewing && _recordingPath != null) ...[
                            Expanded(
                              child: VoiceMessagePlayer(audioUrl: _recordingPath!, isLocal: true),
                            ),
                            const SizedBox(width: 8),
                            GestureDetector(
                              onTap: _cancelRecording,
                              child: Container(
                                width: 48,
                                height: 48,
                                decoration: BoxDecoration(
                                  color: Colors.redAccent.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: const Icon(Icons.delete, color: Colors.redAccent, size: 20),
                              ),
                            ),
                            const SizedBox(width: 8),
                            GestureDetector(
                              onTap: _sendVoiceMessage,
                              child: Container(
                                width: 48,
                                height: 48,
                                decoration: BoxDecoration(
                                  gradient: AgriSenseColors.immersiveGradient,
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: const Icon(Icons.send, color: Colors.white, size: 20),
                              ),
                            ),
                          ] else ...[
                            Expanded(
                              child: TextField(
                                controller: _controller,
                                style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A), fontSize: 15),
                                decoration: InputDecoration(
                                  hintText: "Saisissez ou enregistrez un vocal...",
                                  hintStyle: TextStyle(color: isDark ? const Color(0x33FFFFFF) : Colors.black38, fontSize: 13),
                                  border: InputBorder.none,
                                ),
                                onSubmitted: (_) => _send(),
                              ),
                            ),
                            const SizedBox(width: 8),
                            GestureDetector(
                              onTap: _isSending ? null : _startRecording,
                              child: Container(
                                width: 48,
                                height: 48,
                                decoration: BoxDecoration(
                                  color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.05),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: const Icon(Icons.mic, color: AgriSenseColors.brandPrimary, size: 24),
                              ),
                            ),
                            const SizedBox(width: 8),
                            GestureDetector(
                              onTap: _send,
                              child: Container(
                                width: 48,
                                height: 48,
                                decoration: BoxDecoration(
                                  gradient: AgriSenseColors.immersiveGradient,
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: const Icon(Icons.send, color: Colors.white, size: 20),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // Side Menu Overlay
          if (_showMenu) ...[
            GestureDetector(
              onTap: () => setState(() => _showMenu = false),
              child: ClipRRect(
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                  child: Container(color: Colors.black.withOpacity(isDark ? 0.3 : 0.1)),
                ),
              ),
            ),
            Positioned(
              top: 100,
              right: 24,
              child: Container(
                width: 200,
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: isDark ? AgriSenseColors.bgDeep.withOpacity(0.95) : Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.05)),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(isDark ? 0.5 : 0.1), blurRadius: 40, offset: const Offset(0, 10)),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _buildMenuItem(Icons.home_outlined, 'Accueil', () {
                      widget.onNavigate?.call(0);
                      setState(() => _showMenu = false);
                    }),
                    _buildMenuItem(Icons.message_outlined, 'Nouveau Chat', () {
                      setState(() {
                         _messages.clear();
                         _currentChatId = null;
                         _showMenu = false;
                         _messages.add({
                           'id': 'welcome', 
                           'role': 'assistant', 
                           'content': "Nouvelle discussion démarrée. De quoi aimeriez-vous parler ?", 
                           'timestamp': 'Maintenant'
                         });
                      });
                    }, isHighlighted: true),
                    if (!widget.isVisitor) ...[
                      _buildMenuItem(Icons.person_outline, 'Mon Profil', () {
                        Navigator.push(context, MaterialPageRoute(builder: (_) => ProfilePage(isVisitor: widget.isVisitor)));
                        setState(() => _showMenu = false);
                      }),
                      _buildMenuItem(Icons.history_outlined, 'Historique', () {
                        widget.onNavigate?.call(2);
                        setState(() => _showMenu = false);
                      }),
                      _buildMenuItem(Icons.grass_outlined, 'Mes cultures', () {
                        widget.onNavigate?.call(3);
                        setState(() => _showMenu = false);
                      }),
                    ],
                    _buildMenuItem(Icons.help_outline, 'Support', () {
                      widget.onNavigate?.call(widget.isVisitor ? 2 : 4);
                      setState(() => _showMenu = false);
                    }),
                    if (!widget.isVisitor) ...[
                      const Divider(color: Colors.black12, height: 16),
                      _buildMenuItem(Icons.logout, 'Déconnexion', () {
                        Navigator.pushNamedAndRemoveUntil(context, '/', (_) => false);
                      }, isDestructive: true),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildChatBubble(Map<String, dynamic> message, bool isAssistant) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isLoading = message['isLoading'] == true;

    return Align(
      alignment: isAssistant ? Alignment.centerLeft : Alignment.centerRight,
      child: Container(
        margin: const EdgeInsets.only(bottom: 24),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: isAssistant 
              ? AgriSenseColors.brandPrimary.withOpacity(isDark ? 0.1 : 0.05) 
              : isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.03),
          borderRadius: BorderRadius.circular(24).copyWith(
            topLeft: isAssistant ? Radius.zero : const Radius.circular(24),
            topRight: isAssistant ? const Radius.circular(24) : Radius.zero,
          ),
          border: Border.all(
            color: isAssistant 
                ? AgriSenseColors.brandPrimary.withOpacity(isDark ? 0.2 : 0.1) 
                : isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.05),
          ),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (isLoading)
              Row(
                children: [
                  const SizedBox(
                    width: 12,
                    height: 12,
                    child: CircularProgressIndicator(strokeWidth: 2, color: AgriSenseColors.brandPrimary),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      message['content'],
                      style: TextStyle(
                        color: isDark ? Colors.white70 : const Color(0xFF475569), 
                        fontSize: 14, 
                        fontStyle: FontStyle.italic
                      ),
                    ),
                  ),
                ],
              )
            else ...[
              if (message['audio_url'] != null && message['audio_url'] != 'local')
                VoiceMessagePlayer(audioUrl: message['audio_url'], isLocal: false),
              Text(
                message['content'],
                style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A), fontSize: 13, height: 1.5),
              ),
            ],
            if (message['pdf_url'] != null) ...[
              const SizedBox(height: 12),
              InkWell(
                onTap: () {
                  // Standard simulation of web visual trigger
                  debugPrint("Opening PDF Link: ${message['pdf_url']}");
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.teal.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.teal.withOpacity(0.35)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.picture_as_pdf, color: Colors.teal, size: 16),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Text(
                          "Rapport de décision PDF 📄",
                          style: TextStyle(
                            color: isDark ? Colors.tealAccent : Colors.teal.shade800,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
            if (message['audio_url'] != null) ...[
              const SizedBox(height: 8),
              InkWell(
                onTap: () {
                  debugPrint("Playing TTS audio: ${message['audio_url']}");
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: AgriSenseColors.brandPrimary.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AgriSenseColors.brandPrimary.withOpacity(0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.volume_up, color: AgriSenseColors.brandPrimary, size: 16),
                      const SizedBox(width: 8),
                      Text(
                        "Écouter le conseil vocal de l'IA 🔉",
                        style: TextStyle(
                          color: isDark ? Colors.white70 : Colors.black87,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
            const SizedBox(height: 8),
            Text(
              message['timestamp'],
              style: TextStyle(color: (isDark ? Colors.white : Colors.black).withOpacity(0.3), fontSize: 10, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuItem(IconData icon, String title, VoidCallback onTap, 
      {bool isHighlighted = false, bool isDestructive = false}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    Color itemColor = isHighlighted 
        ? AgriSenseColors.brandPrimary 
        : isDestructive 
            ? Colors.redAccent 
            : AgriSenseColors.textMuted;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Icon(icon, size: 18, color: itemColor),
              const SizedBox(width: 12),
              Text(
                title,
                style: TextStyle(
                  color: isHighlighted || isDestructive ? itemColor : (isDark ? Colors.white70 : Colors.black87),
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
