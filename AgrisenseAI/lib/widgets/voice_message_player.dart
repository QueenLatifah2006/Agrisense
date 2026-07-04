import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';
import '../constants.dart';

class VoiceMessagePlayer extends StatefulWidget {
  final String audioUrl;
  final bool isLocal;
  
  const VoiceMessagePlayer({
    Key? key, 
    required this.audioUrl, 
    this.isLocal = false,
  }) : super(key: key);

  @override
  State<VoiceMessagePlayer> createState() => _VoiceMessagePlayerState();
}

class _VoiceMessagePlayerState extends State<VoiceMessagePlayer> {
  late AudioPlayer _player;
  bool _isPlaying = false;
  Duration _duration = Duration.zero;
  Duration _position = Duration.zero;

  @override
  void initState() {
    super.initState();
    _player = AudioPlayer();
    
    _player.onPlayerStateChanged.listen((state) {
      if (mounted) setState(() => _isPlaying = state == PlayerState.playing);
    });
    
    _player.onDurationChanged.listen((d) {
      if (mounted) setState(() => _duration = d);
    });
    
    _player.onPositionChanged.listen((p) {
      if (mounted) setState(() => _position = p);
    });
  }

  @override
  void dispose() {
    _player.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 8, top: 4),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? Colors.black26 : Colors.black12,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          GestureDetector(
            onTap: () async {
              if (_isPlaying) {
                await _player.pause();
              } else {
                if (widget.audioUrl.startsWith('data:')) {
                  final base64Str = widget.audioUrl.split(',').last;
                  final bytes = base64Decode(base64Str);
                  await _player.play(BytesSource(bytes));
                } else if (widget.isLocal) {
                  await _player.play(DeviceFileSource(widget.audioUrl));
                } else {
                  await _player.play(UrlSource(widget.audioUrl));
                }
              }
            },
            child: Icon(
              _isPlaying ? Icons.pause_circle_filled : Icons.play_circle_fill, 
              color: AgriSenseColors.brandPrimary, 
              size: 32,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: SliderTheme(
              data: SliderTheme.of(context).copyWith(
                thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                trackHeight: 3,
              ),
              child: Slider(
                activeColor: AgriSenseColors.brandPrimary,
                inactiveColor: AgriSenseColors.brandPrimary.withOpacity(0.3),
                min: 0,
                max: _duration.inMilliseconds > 0 ? _duration.inMilliseconds.toDouble() : 1,
                value: _position.inMilliseconds.toDouble().clamp(0, _duration.inMilliseconds > 0 ? _duration.inMilliseconds.toDouble() : 1),
                onChanged: (val) async {
                  await _player.seek(Duration(milliseconds: val.toInt()));
                },
              ),
            ),
          ),
          Text(
            "${_position.inMinutes}:${(_position.inSeconds % 60).toString().padLeft(2, '0')}",
            style: TextStyle(fontSize: 12, color: isDark ? Colors.white70 : Colors.black54),
          ),
        ],
      ),
    );
  }
}
