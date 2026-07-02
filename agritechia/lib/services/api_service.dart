import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';

class ApiService {
  // URL dynamique : localhost pour le Web, 10.0.2.2 pour l'émulateur Android
  static String get baseUrl {
    if (kIsWeb) {
      final String origin = Uri.base.origin;
      if (origin.contains('localhost') || origin.contains('127.0.0.1')) {
        if (!origin.contains(':3000')) {
          return "http://localhost:3000/api";
        }
      }
      if (origin.startsWith('http')) {
        return "$origin/api";
      }
      return "http://localhost:3000/api";
    } else {
      return "http://agrisense-7oq5.onrender.com/api";
    }
  }
  
  static String? _token;

  static Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (_token != null) 'Authorization': 'Bearer $_token',
  };

  static Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      print("[API_SERVICE] login() called for email: $email");
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: _headers,
        body: jsonEncode({'email': email, 'password': password}),
      );
      print("[API_SERVICE] login() response statusCode: ${response.statusCode}");
      print("[API_SERVICE] login() response body: ${response.body}");
      final result = jsonDecode(response.body);
      if (result.containsKey('token')) {
        _token = result['token'];
        print("[API_SERVICE] Token saved successfully: $_token");
      }
      return result;
    } catch (e) {
      print("[API_SERVICE] login() exception: $e");
      return {'error': 'Connexion échouée'};
    }
  }

  static Future<Map<String, dynamic>> signup({
    required String name, 
    required String email, 
    required String password,
    String? domain,
    String? profilePicture,
    String? organizationId
  }) async {
    try {
      print("[API_SERVICE] signup() called for email: $email");
      final response = await http.post(
        Uri.parse('$baseUrl/auth/signup'),
        headers: _headers,
        body: jsonEncode({
          'name': name,
          'email': email,
          'password': password,
          'role': 'farmer',
          'domain': domain,
          'profile_picture': profilePicture,
          'organization_id': organizationId
        }),
      );
      print("[API_SERVICE] signup() response statusCode: ${response.statusCode}");
      print("[API_SERVICE] signup() response body: ${response.body}");
      final result = jsonDecode(response.body);
      if (result.containsKey('token')) {
        _token = result['token'];
        print("[API_SERVICE] Token saved successfully: $_token");
      }
      return result;
    } catch (e) {
      print("[API_SERVICE] signup() exception: $e");
      return {'error': 'Inscription échouée'};
    }
  }

  static Future<Map<String, dynamic>> getMe() async {
    try {
      print("[API_SERVICE] getMe() called. Token length: ${_token?.length ?? 0}");
      print("[API_SERVICE] url: $baseUrl/auth/me");
      print("[API_SERVICE] headers: $_headers");
      final response = await http.get(Uri.parse('$baseUrl/auth/me'), headers: _headers);
      print("[API_SERVICE] getMe() response statusCode: ${response.statusCode}");
      print("[API_SERVICE] getMe() response body: ${response.body}");
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return {'error': 'Erreur de profil', 'statusCode': response.statusCode, 'body': response.body};
    } catch (e) {
      print("[API_SERVICE] getMe() exception: $e");
      return {'error': 'Connexion API échouée'};
    }
  }

  static Future<Map<String, dynamic>> updateMe(
    String name,
    String email, {
    String? phone,
    String? location,
    String? profilePicture,
    String? domain,
    String? organizationId,
  }) async {
    try {
      print("[API_SERVICE] updateMe() called");
      final response = await http.put(
        Uri.parse('$baseUrl/auth/me'),
        headers: _headers,
        body: jsonEncode({
          'name': name,
          'email': email,
          'phone': phone,
          'location': location,
          'profile_picture': profilePicture,
          'domain': domain,
          'organization_id': organizationId,
        }),
      );
      print("[API_SERVICE] updateMe() response statusCode: ${response.statusCode}");
      print("[API_SERVICE] updateMe() response body: ${response.body}");
      return jsonDecode(response.body);
    } catch (e) {
      print("[API_SERVICE] updateMe() exception: $e");
      return {'error': 'Mise à jour échouée'};
    }
  }

  static Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/forgot-password'),
        headers: _headers,
        body: jsonEncode({'email': email}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'error': 'Erreur API'};
    }
  }

  static Future<Map<String, dynamic>> verifyCode(String email, String code) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/verify-code'),
        headers: _headers,
        body: jsonEncode({'email': email, 'code': code}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'error': 'Erreur API'};
    }
  }

  static Future<Map<String, dynamic>> resetPassword(String email, String code, String newPassword) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/reset-password'),
        headers: _headers,
        body: jsonEncode({
          'email': email,
          'code': code,
          'newPassword': newPassword,
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'error': 'Erreur API'};
    }
  }

  static Future<List<dynamic>> getCrops() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/crops'), headers: _headers);
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  static Future<Map<String, dynamic>> createCrop(Map<String, dynamic> cropData) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/crops'),
        headers: _headers,
        body: jsonEncode(cropData),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'error': 'Erreur lors de la création'};
    }
  }

  static Future<Map<String, dynamic>> updateCrop(dynamic cropId, Map<String, dynamic> cropData) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/crops/$cropId'),
        headers: _headers,
        body: jsonEncode(cropData),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'error': 'Erreur lors de la mise à jour'};
    }
  }

  static Future<List<dynamic>> getCropLogs(String cropId) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/crops/$cropId/logs'), headers: _headers);
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  // Check if token exists
  static bool get isLoggedIn => _token != null;

  // Send message to AI with optional session ID, supporting vocal queries
  static Future<Map<String, dynamic>> sendChatMessage(
    String message, {
    int? chatId,
    String? audio,
    bool? isAudio,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/ai/chat'),
        headers: _headers,
        body: jsonEncode({
          'message': message,
          if (chatId != null) 'chatId': chatId,
          if (audio != null) 'audio': audio,
          if (isAudio != null) 'isAudio': isAudio,
          if (isAudio == true) 'mimeType': 'audio/webm',
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'error': "Impossible de se connecter à l'IA."};
    }
  }

  // Get list of chat history threads
  static Future<List<dynamic>> getUserChats() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/ai/chats'), headers: _headers);
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  // Get messages for a given chat thread
  static Future<List<dynamic>> getChatMessages(int chatId) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/ai/chats/$chatId/messages'), headers: _headers);
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  static void logout() {
    _token = null;
  }
}
