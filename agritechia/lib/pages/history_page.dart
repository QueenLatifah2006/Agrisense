import 'package:flutter/material.dart';
import '../widgets.dart';
import '../constants.dart';

import 'package:flutter/material.dart';
import '../widgets.dart';
import '../constants.dart';
import '../services/api_service.dart';
import 'chat_page.dart';

class HistoryPage extends StatefulWidget {
  const HistoryPage({super.key});

  @override
  State<HistoryPage> createState() => _HistoryPageState();
}

class _HistoryPageState extends State<HistoryPage> {
  List<dynamic> _conversations = [];
  bool _isLoading = true;
  String _searchQuery = "";

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    setState(() => _isLoading = true);
    try {
      final chats = await ApiService.getUserChats();
      setState(() {
        _conversations = chats;
        _isLoading = false;
      });
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final filteredConversations = _conversations.where((c) {
      final title = (c['title'] ?? "").toString().toLowerCase();
      final lastMsg = (c['last_message'] ?? "").toString().toLowerCase();
      final query = _searchQuery.toLowerCase();
      return title.contains(query) || lastMsg.contains(query);
    }).toList();

    return Scaffold(
      body: Stack(
        children: [
          RefreshIndicator(
            onRefresh: _loadHistory,
            color: AgriSenseColors.brandPrimary,
            backgroundColor: isDark ? AgriSenseColors.bgDeep : Colors.white,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(24, 80, 24, 140),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Historique",
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: isDark ? AgriSenseColors.textMain : const Color(0xFF0F172A),
                      letterSpacing: -1,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    "CHAT LOG V2.0",
                    style: TextStyle(
                      color: AgriSenseColors.textMuted,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 2,
                      fontFamily: 'monospace',
                    ),
                  ),
                  const SizedBox(height: 32),
                  
                  // Search Bar
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          height: 52,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          decoration: BoxDecoration(
                            color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.03),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.05)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.search, color: AgriSenseColors.textMuted, size: 20),
                              const SizedBox(width: 12),
                              Expanded(
                                child: TextField(
                                  style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A), fontSize: 14),
                                  onChanged: (val) {
                                    setState(() {
                                      _searchQuery = val;
                                    });
                                  },
                                  decoration: InputDecoration(
                                    hintText: "Rechercher...",
                                    hintStyle: TextStyle(color: AgriSenseColors.textMuted.withOpacity(0.5)),
                                    border: InputBorder.none,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      GestureDetector(
                        onTap: _loadHistory,
                        child: Container(
                          width: 52,
                          height: 52,
                          decoration: BoxDecoration(
                            color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.03),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.05)),
                          ),
                          child: const Icon(Icons.refresh, color: AgriSenseColors.textMuted, size: 20),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  
                  // History List
                  if (_isLoading)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.symmetric(vertical: 60),
                        child: CircularProgressIndicator(color: AgriSenseColors.brandPrimary),
                      ),
                    )
                  else if (filteredConversations.isEmpty)
                    _buildEmptyState(isDark)
                  else
                    ...filteredConversations.map((c) {
                      final titleStr = c['title'] ?? 'Fiche Conseil Agrisense';
                      final lastMsgStr = c['last_message'] ?? 'Aucun message enregistré';
                      final rawDate = c['created_at'];
                      String dateStr = 'Récemment';
                      if (rawDate != null) {
                        try {
                          final parsed = DateTime.parse(rawDate.toString());
                          dateStr = "${parsed.day.toString().padLeft(2, '0')}/${parsed.month.toString().padLeft(2, '0')}/${parsed.year}";
                        } catch (_) {}
                      }

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: GlassCard(
                          padding: const EdgeInsets.all(16),
                          onTap: () {
                            Navigator.push(
                              context, 
                              MaterialPageRoute(
                                builder: (_) => ChatPage(
                                  initialChatId: c['id'],
                                )
                              )
                            ).then((_) => _loadHistory());
                          },
                          child: Row(
                            children: [
                              Container(
                                width: 48,
                                height: 48,
                                decoration: BoxDecoration(
                                  color: AgriSenseColors.brandPrimary.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: AgriSenseColors.brandPrimary.withOpacity(0.1)),
                                ),
                                child: const Icon(Icons.psychology, color: AgriSenseColors.brandPrimary, size: 20),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Text(
                                            titleStr,
                                            style: TextStyle(
                                              color: isDark ? AgriSenseColors.textMain : const Color(0xFF0F172A),
                                              fontWeight: FontWeight.bold,
                                              fontSize: 14,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          dateStr,
                                          style: const TextStyle(
                                            color: AgriSenseColors.textMuted,
                                            fontSize: 9,
                                            fontFamily: 'monospace',
                                            fontWeight: FontWeight.bold,
                                            letterSpacing: 1,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      lastMsgStr,
                                      style: TextStyle(
                                        color: AgriSenseColors.textMuted.withOpacity(0.7),
                                        fontSize: 12,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Icon(Icons.arrow_forward_ios, color: (isDark ? Colors.white : Colors.black).withOpacity(0.2), size: 14),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 80),
      child: Column(
        children: [
          Icon(Icons.history_outlined, size: 64, color: isDark ? Colors.white10 : Colors.black12),
          const SizedBox(height: 24),
          const Text(
            "Aucun historique",
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white38),
          ),
          const SizedBox(height: 8),
          const Text(
            "Vos conversations branchées avec l'IA apparaîtront ici.",
            style: TextStyle(fontSize: 13, color: Colors.white24),
          ),
        ],
      ),
    );
  }
}
