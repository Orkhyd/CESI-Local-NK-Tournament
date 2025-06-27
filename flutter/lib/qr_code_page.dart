import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'qr_overlay.dart';

class QrCodePage extends StatefulWidget {
  final Function(String) onScan;
  final bool hasData;
  final VoidCallback onReset;

  const QrCodePage({
    super.key,
    required this.onScan,
    required this.hasData,
    required this.onReset,
  });

  @override
  State<QrCodePage> createState() => _QrCodePageState();
}

class _QrCodePageState extends State<QrCodePage> with WidgetsBindingObserver {
  late MobileScannerController controller;
  String? _lastValidCode;
  Timer? _errorTimer;
  bool _isCameraInitialized = false;
  bool _showTorch = false;
  bool _showError = false;
  int _scanAttempts = 0;

  @override
  void initState() {
    super.initState();
    controller = MobileScannerController(
      detectionTimeoutMs: 1500,
      formats: [BarcodeFormat.qrCode],
    );
    WidgetsBinding.instance.addObserver(this);
    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    try {
      await controller.start();
      setState(() => _isCameraInitialized = true);
    } catch (e) {
      debugPrint('Camera error: $e');
    }
  }

  @override
  void dispose() {
    _errorTimer?.cancel();
    controller.dispose();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      controller.start();
    }
  }

  void _onQRCodeDetected(BarcodeCapture capture) {
    if (widget.hasData || capture.barcodes.isEmpty) return;

    final code = capture.barcodes.first;
    if (code.rawValue == null || code.rawValue == _lastValidCode) return;

    _scanAttempts++;
    if (_scanAttempts > 3) {
      _throttleScanning();
      return;
    }

    if (_validateQRContent(code.rawValue!)) {
      _handleValidCode(code.rawValue!);
    } else {
      _handleInvalidCode();
    }
  }

  bool _validateQRContent(String rawValue) {
    try {
      final data = jsonDecode(rawValue) as Map<String, dynamic>;

      if (data['date'] == null || data['category'] == null || data['matches'] == null) {
        return false;
      }

      final matches = data['matches'] as Map<String, dynamic>;
      if (matches['total'] is! int || matches['played'] is! int || matches['pending'] is! int) {
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  void _handleValidCode(String code) {
    _lastValidCode = code;
    _scanAttempts = 0;
    widget.onScan(code);
  }

  void _handleInvalidCode() {
    if (_showError) return;

    setState(() => _showError = true);
    _errorTimer = Timer(const Duration(seconds: 2), () {
      if (mounted) setState(() => _showError = false);
    });
  }

  void _throttleScanning() {
    setState(() => _showError = true);
    _errorTimer = Timer(const Duration(seconds: 3), () {
      if (mounted) {
        setState(() {
          _showError = false;
          _scanAttempts = 0;
        });
      }
    });
  }

  void _toggleTorch() {
    setState(() => _showTorch = !_showTorch);
    controller.toggleTorch();
  }

  void _switchCamera() {
    controller.switchCamera();
  }

  void _restartScan() {
    _errorTimer?.cancel();
    widget.onReset();
    setState(() {
      _lastValidCode = null;
      _showError = false;
      _scanAttempts = 0;
    });
    controller.start();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.hasData) {
      return _buildDataExistsUI();
    }

    return _buildScannerUI();
  }

  Widget _buildDataExistsUI() {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.check_circle, size: 80, color: Colors.green),
            const SizedBox(height: 20),
            const Text(
              'Scan réussi !',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'Les données sont disponibles dans l\'onglet Statistiques',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70),
            ),
            const SizedBox(height: 30),
            ElevatedButton.icon(
              onPressed: _restartScan,
              icon: const Icon(Icons.qr_code_scanner),
              label: const Text('Nouveau scan'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                backgroundColor: Colors.blueAccent,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScannerUI() {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          if (_isCameraInitialized)
            MobileScanner(
              controller: controller,
              onDetect: _onQRCodeDetected,
              fit: BoxFit.cover,
            ),
          const QRScannerOverlay(),
          if (_showError)
            Positioned(
              bottom: 150,
              left: 0,
              right: 0,
              child: AnimatedOpacity(
                opacity: _showError ? 1.0 : 0.0,
                duration: const Duration(milliseconds: 300),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  margin: const EdgeInsets.symmetric(horizontal: 40),
                  decoration: BoxDecoration(
                    color: Colors.red[400],
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline, color: Colors.white),
                      SizedBox(width: 10),
                      Text(
                        'QR code non valide',
                        style: TextStyle(color: Colors.white),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(width: 20),
                FloatingActionButton(
                  heroTag: 'switch',
                  onPressed: _switchCamera,
                  backgroundColor: Colors.black54,
                  child: const Icon(
                    Icons.cameraswitch,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          if (!_isCameraInitialized)
            const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 20),
                  Text(
                    'Initialisation de la caméra...',
                    style: TextStyle(color: Colors.white),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}