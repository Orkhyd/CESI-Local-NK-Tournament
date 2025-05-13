import 'package:flutter/material.dart';
import 'dart:convert';

class StatsPage extends StatelessWidget {
  final String? data;
  Map<String, dynamic>? stats;

  StatsPage({super.key, required this.data}) {
    if (data != null) {
      try {
        stats = json.decode(data!);
      } catch (e) {
        debugPrint('Erreur de décodage JSON: $e');
        stats = null;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (data == null || stats == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 50, color: Colors.red),
            const SizedBox(height: 20),
            const Text('Aucune donnée valide disponible'),
            if (data != null) ...[
              const SizedBox(height: 20),
              const Text('Donnée brute reçue:',
                  style: TextStyle(fontWeight: FontWeight.bold)),
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Text(data!),
              ),
            ],
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),

          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Détails de la catégorie',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 10),
                  _buildCategoryItem('Nom', stats!['categoryDetails']['name']?.toString() ?? 'N/A'),
                  _buildCategoryItem('Genre', stats!['categoryDetails']['genre']?.toString() ?? 'N/A'),
                  _buildCategoryItem('Type', stats!['categoryDetails']['type']?.toString() ?? 'N/A'),
                  _buildCategoryItem(
                      'Catégorie d\'âge',
                      (stats!['categoryDetails']['ageCategories'] is List)
                          ? stats!['categoryDetails']['ageCategories'].join(', ')
                          : 'N/A'
                  ),
                  _buildCategoryItem('Grade min', stats!['categoryDetails']['minGrade']?.toString() ?? 'N/A'),
                  _buildCategoryItem('Grade max', stats!['categoryDetails']['maxGrade']?.toString() ?? 'N/A'),
                  _buildCategoryItem(
                      'Poids',
                      (stats!['categoryDetails']['weightRange'] is List && stats!['categoryDetails']['weightRange'].length >= 2)
                          ? '${stats!['categoryDetails']['weightRange'][0]} - ${stats!['categoryDetails']['weightRange'][1]} kg'
                          : 'N/A'
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Date des statistiques
          Text(
            'Statistiques du ${stats!['date'] ?? 'date inconnue'}',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 20),

          // Matchs
          if (stats!['matches'] != null)
            _buildMatchStats(stats!['matches'] as Map<String, dynamic>),
          const SizedBox(height: 20),

          // Temps
          if (stats!['timeStats'] != null)
            _buildTimeStats(stats!['timeStats'] as Map<String, dynamic>),
          const SizedBox(height: 20),

          // Podiums
          _buildPodium(
              'Top Ippons',
              (stats!['ipponsPodium'] is List) ? stats!['ipponsPodium'] : []
          ),
          const SizedBox(height: 20),
          _buildPodium(
              'Top Keikokus',
              (stats!['keikokusPodium'] is List) ? stats!['keikokusPodium'] : []
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Text(
              '$label :',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(value),
          ),
        ],
      ),
    );
  }

  Widget _buildMatchStats(Map<String, dynamic> matches) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Matchs',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStatItem('Total', matches['total']?.toString() ?? '0'),
                _buildStatItem('Joués', matches['played']?.toString() ?? '0'),
                _buildStatItem('En attente', matches['pending']?.toString() ?? '0'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        Text(label),
      ],
    );
  }

  Widget _buildTimeStats(Map<String, dynamic> timeStats) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Temps des matchs',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            _buildTimeItem('Moyen', timeStats['average']?.toString() ?? 'N/A'),
            _buildTimeItem(
                'Plus rapide',
                (timeStats['fastest'] is Map)
                    ? '${timeStats['fastest']['time']} (${timeStats['fastest']['players']})'
                    : 'N/A'
            ),
            _buildTimeItem(
                'Plus long',
                (timeStats['longest'] is Map)
                    ? '${timeStats['longest']['time']} (${timeStats['longest']['players']})'
                    : 'N/A'
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Expanded(child: Text(label)),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPodium(String title, List<dynamic> podium) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            if (podium.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Text(
                  'Aucun participant.',
                  style: TextStyle(color: Colors.grey),
                ),
              )
            else
              ...podium.map((player) => _buildPlayerItem(player)).toList(),
          ],
        ),
      ),
    );
  }

  Widget _buildPlayerItem(Map<String, dynamic> player) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: _getRankColor(player['rank'] as int? ?? 0),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                (player['rank']?.toString() ?? '?'),
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(child: Text(player['name']?.toString() ?? 'Inconnu')),
          Text(
              '${player['score']?.toString() ?? '0'} pts',
              style: const TextStyle(fontWeight: FontWeight.bold)
          ),
        ],
      ),
    );
  }

  Color _getRankColor(int rank) {
    switch (rank) {
      case 1: return Colors.amber;
      case 2: return Colors.grey;
      case 3: return Colors.brown;
      default: return Colors.blue;
    }
  }
}