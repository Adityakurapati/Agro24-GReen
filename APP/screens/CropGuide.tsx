import React, { useState, useEffect } from 'react';
import {
        StyleSheet,
        View,
        Text,
        TouchableOpacity,
        ScrollView,
        SafeAreaView,
        ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CropGuide = () => {
        const [activeCategory, setActiveCategory] = useState('Cereals');
        const [expandedItem, setExpandedItem] = useState(null);
        const [categories, setCategories] = useState([]);
        const [crops, setCrops] = useState({});
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);

        // Fetch data from data.json file
        useEffect(() => {
                const fetchData = async () => {
                        try {
                                // You can use require for local files or fetch for remote files
                                // For remote files:
                                // const response = await fetch('path/to/data.json');
                                // const data = await response.json();

                                // For local files:
                                const data = require('./data.json');

                                // Extract categories and organize crops
                                const categoryList = [...new Set(data.crops.map(crop => crop.category))];

                                // Organize crops by category
                                const cropsByCategory = {};
                                categoryList.forEach(category => {
                                        cropsByCategory[category] = data.crops.filter(crop => crop.category === category);
                                });

                                setCategories(categoryList);
                                setCrops(cropsByCategory);

                                // Set default active category if available
                                if (categoryList.length > 0 && !categoryList.includes(activeCategory)) {
                                        setActiveCategory(categoryList[0]);
                                }

                                setLoading(false);
                        } catch (err) {
                                console.error('Error loading data:', err);
                                setError('Failed to load crop data');
                                setLoading(false);
                        }
                };

                fetchData();
        }, []);

        const toggleExpand = (id) => {
                if (expandedItem === id) {
                        setExpandedItem(null);
                } else {
                        setExpandedItem(id);
                }
        };

        const getDifficultyColor = (difficulty) => {
                switch (difficulty) {
                        case 'Easy':
                                return '#2ecc71';
                        case 'Moderate':
                                return '#f39c12';
                        case 'Hard':
                                return '#e74c3c';
                        default:
                                return '#3498db';
                }
        };

        if (loading) {
                return (
                        <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#116530" />
                                <Text style={styles.loadingText}>Loading crop data...</Text>
                        </View>
                );
        }

        if (error) {
                return (
                        <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
                                <Text style={styles.errorText}>{error}</Text>
                                <TouchableOpacity style={styles.retryButton}>
                                        <Text style={styles.retryButtonText}>Retry</Text>
                                </TouchableOpacity>
                        </View>
                );
        }

        return (
                <SafeAreaView style={styles.container}>
                        {/* Header */}
                        <View style={styles.header}>
                                <Text style={styles.headerTitle}>Crop Guide</Text>
                                <View style={styles.headerIcons}>
                                        <TouchableOpacity style={styles.iconButton}>
                                                <Ionicons name="search" size={24} color="white" />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.iconButton}>
                                                <Ionicons name="heart-outline" size={24} color="white" />
                                        </TouchableOpacity>
                                </View>
                        </View>

                        {/* Category Tabs */}
                        <View style={styles.categoryContainer}>
                                {categories.map((category) => (
                                        <TouchableOpacity
                                                key={category}
                                                style={[
                                                        styles.categoryButton,
                                                        activeCategory === category && styles.activeCategoryButton,
                                                ]}
                                                onPress={() => setActiveCategory(category)}
                                        >
                                                <Text
                                                        style={[
                                                                styles.categoryText,
                                                                activeCategory === category && styles.activeCategoryText,
                                                        ]}
                                                >
                                                        {category}
                                                </Text>
                                        </TouchableOpacity>
                                ))}
                        </View>

                        {/* Crop List */}
                        <ScrollView style={styles.cropListContainer}>
                                {crops[activeCategory] && crops[activeCategory].length > 0 ? (
                                        crops[activeCategory].map((crop) => (
                                                <TouchableOpacity
                                                        key={crop.id}
                                                        style={styles.cropItem}
                                                        onPress={() => toggleExpand(crop.id)}
                                                >
                                                        <View style={styles.cropHeaderRow}>
                                                                <View style={styles.cropIconContainer}>
                                                                        <Text style={styles.cropIcon}>{crop.icon || '🌱'}</Text>
                                                                </View>
                                                                <View style={styles.cropTitleContainer}>
                                                                        <Text style={styles.cropName}>{crop.name}</Text>
                                                                        <View style={styles.difficultyRow}>
                                                                                <Text style={styles.difficultyLabel}>Difficulty: </Text>
                                                                                <View
                                                                                        style={[
                                                                                                styles.difficultyBadge,
                                                                                                { backgroundColor: getDifficultyColor(crop.difficulty) },
                                                                                        ]}
                                                                                >
                                                                                        <Text style={styles.difficultyText}>{crop.difficulty}</Text>
                                                                                </View>
                                                                        </View>
                                                                </View>
                                                                <TouchableOpacity style={styles.favoriteButton}>
                                                                        <Ionicons name="heart-outline" size={24} color="#aaa" />
                                                                </TouchableOpacity>
                                                        </View>

                                                        <Text
                                                                style={styles.cropDescription}
                                                                numberOfLines={expandedItem === crop.id ? null : 2}
                                                        >
                                                                {crop.description}
                                                        </Text>

                                                        {/* Crop Details */}
                                                        <View style={styles.cropDetails}>
                                                                <View style={styles.detailItem}>
                                                                        <Ionicons name="time-outline" size={18} color="#666" />
                                                                        <Text style={styles.detailText}>{crop.growingTime}</Text>
                                                                </View>

                                                                <View style={styles.detailItem}>
                                                                        <Ionicons name="water-outline" size={18} color="#666" />
                                                                        <Text style={styles.detailText}>{crop.waterNeeds}</Text>
                                                                </View>

                                                                <View style={styles.detailItem}>
                                                                        <Ionicons name="leaf-outline" size={18} color="#666" />
                                                                        <Text style={styles.detailText}>{crop.soilType}</Text>
                                                                </View>
                                                        </View>

                                                        {expandedItem === crop.id && (
                                                                <View style={styles.expandedContent}>
                                                                        <Text style={styles.expandedTitle}>Growing Instructions</Text>
                                                                        <Text style={styles.expandedText}>
                                                                                {crop.growingInstructions || 'No growing instructions available.'}
                                                                        </Text>

                                                                        <Text style={styles.expandedTitle}>Best Practices</Text>
                                                                        <Text style={styles.expandedText}>
                                                                                {crop.bestPractices || 'No best practices available.'}
                                                                        </Text>
                                                                </View>
                                                        )}
                                                </TouchableOpacity>
                                        ))
                                ) : (
                                        <View style={styles.emptyCategoryContainer}>
                                                <Ionicons name="leaf-outline" size={48} color="#ccc" />
                                                <Text style={styles.emptyCategoryText}>No crops found in this category</Text>
                                        </View>
                                )}
                        </ScrollView>

                        {/* Add Button */}
                        <TouchableOpacity style={styles.addButton}>
                                <Ionicons name="add" size={32} color="white" />
                        </TouchableOpacity>
                </SafeAreaView>
        );
};

const styles = StyleSheet.create({
        container: {
                flex: 1,
                backgroundColor: '#f8f9fa',
        },
        loadingContainer: {
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#f8f9fa',
        },
        loadingText: {
                marginTop: 16,
                color: '#666',
                fontSize: 16,
        },
        errorContainer: {
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#f8f9fa',
                padding: 24,
        },
        errorText: {
                marginTop: 16,
                marginBottom: 24,
                color: '#666',
                fontSize: 16,
                textAlign: 'center',
        },
        retryButton: {
                backgroundColor: '#116530',
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 8,
        },
        retryButtonText: {
                color: 'white',
                fontWeight: 'bold',
        },
        header: {
                backgroundColor: '#116530',
                padding: 16,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
        },
        headerTitle: {
                color: 'white',
                fontSize: 22,
                fontWeight: 'bold',
        },
        headerIcons: {
                flexDirection: 'row',
        },
        iconButton: {
                marginLeft: 16,
        },
        categoryContainer: {
                flexDirection: 'row',
                padding: 8,
                backgroundColor: '#f0f0f0',
        },
        categoryButton: {
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 20,
                marginRight: 8,
                backgroundColor: '#f0f0f0',
        },
        activeCategoryButton: {
                backgroundColor: '#116530',
        },
        categoryText: {
                color: '#666',
                fontWeight: '500',
        },
        activeCategoryText: {
                color: 'white',
                fontWeight: 'bold',
        },
        cropListContainer: {
                flex: 1,
                padding: 8,
        },
        cropItem: {
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
        },
        cropHeaderRow: {
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8,
        },
        cropIconContainer: {
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#116530',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
        },
        cropIcon: {
                fontSize: 24,
                color: 'white',
        },
        cropTitleContainer: {
                flex: 1,
        },
        cropName: {
                fontSize: 18,
                fontWeight: 'bold',
                color: '#116530',
                marginBottom: 4,
        },
        difficultyRow: {
                flexDirection: 'row',
                alignItems: 'center',
        },
        difficultyLabel: {
                color: '#666',
                fontSize: 14,
        },
        difficultyBadge: {
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 12,
        },
        difficultyText: {
                color: 'white',
                fontWeight: '500',
                fontSize: 14,
        },
        favoriteButton: {
                padding: 4,
        },
        cropDescription: {
                color: '#666',
                marginBottom: 12,
                lineHeight: 20,
        },
        cropDetails: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                borderTopWidth: 1,
                borderTopColor: '#f0f0f0',
                paddingTop: 12,
        },
        detailItem: {
                flexDirection: 'row',
                alignItems: 'center',
        },
        detailText: {
                marginLeft: 4,
                color: '#666',
        },
        expandedContent: {
                marginTop: 16,
                borderTopWidth: 1,
                borderTopColor: '#f0f0f0',
                paddingTop: 16,
        },
        expandedTitle: {
                fontSize: 16,
                fontWeight: 'bold',
                color: '#116530',
                marginBottom: 8,
        },
        expandedText: {
                color: '#666',
                lineHeight: 20,
                marginBottom: 16,
        },
        emptyCategoryContainer: {
                alignItems: 'center',
                justifyContent: 'center',
                padding: 48,
        },
        emptyCategoryText: {
                marginTop: 16,
                color: '#666',
                fontSize: 16,
                textAlign: 'center',
        },
        addButton: {
                position: 'absolute',
                right: 16,
                bottom: 16,
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: '#116530',
                justifyContent: 'center',
                alignItems: 'center',
                elevation: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
        },
});

export default CropGuide;