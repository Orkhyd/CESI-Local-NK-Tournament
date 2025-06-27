import 'package:flutter/material.dart';
import 'qr_code_page.dart';
import 'stats_page.dart';

void main() => runApp(const MyApp());

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Statistiques NIPPON KEMPO',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _selectedIndex = 0;
  String? _scannedData;

  void _onItemTapped(int index) {
    setState(() => _selectedIndex = index);
  }

  void _handleScan(String data) {
    setState(() {
      _scannedData = data;
      _selectedIndex = 1; // Switch to stats page
    });
  }

  void _resetScan() {
    setState(() => _scannedData = null);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Statistiques NIPPON KEMPO')),
      body: IndexedStack(
        index: _selectedIndex,
        children: [
          QrCodePage(
            onScan: _handleScan,
            hasData: _scannedData != null,
            onReset: _resetScan,
          ),
          StatsPage(data: _scannedData),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.qr_code),
            label: 'Scanner',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.leaderboard),
            label: 'Stats',
          ),
        ],
      ),
    );
  }
}