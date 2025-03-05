'use client';

import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  Platform, 
  Alert,
  Animated,
  StyleSheet,
  Dimensions,
  ScrollView
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from 'expo-file-system';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#2F5233',
  secondary: '#4B7B3B',
  accent: '#8BC34A',
  background: '#F4F9F1',
  text: '#1C2F1C',
  warning: '#FFA000',
  white: '#FFFFFF'
};

const CropHealthDetection = ({ route }) => {
  const { url } = route.params || {};

  const [imageUri, setImageUri] = useState(null);
  const [analysis, setAnalysis] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.95);
  const spinValue = new Animated.Value(0);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  useEffect(() => {
    requestPermissions();
  }, []);

  useEffect(() => {
    if (analysis) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [analysis]);

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [isLoading]);

  const requestPermissions = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!cameraPermission.granted || !libraryPermission.granted) {
        Alert.alert(
          "Permissions Required",
          "Camera and media library access are needed for this feature to work."
        );
      }
    } catch (error) {
      console.error("Error requesting permissions:", error);
    }
  };

  const pickImage = async (useCamera) => {
    try {
      const result = useCamera 
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
          });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        await analyzeCropHealth(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error capturing/picking image:", error);
      Alert.alert("Error", "Failed to capture/select an image.");
    }
  };

  const analyzeCropHealth = async (uri) => {
    setIsLoading(true);
    setAnalysis("");
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.95);
    
    try {
      const uploadResult = await FileSystem.uploadAsync(
        `${url}/detect_disease`,
        uri,
        {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'image',
          mimeType: 'image/jpeg',
        }
      );

      if (uploadResult.status !== 200) {
        throw new Error(`Upload failed with status ${uploadResult.status}`);
      }

      const responseData = JSON.parse(uploadResult.body);
      
      const formattedAnalysis = `Disease detected: ${responseData.disease}
      
Confidence: ${(responseData.confidence * 100).toFixed(2)}%

Processing Time: ${responseData.processing_time}

Recommended Actions:
1. Document the symptoms and affected areas
2. Remove infected plant parts if possible
3. Improve air circulation between plants
4. Consider appropriate treatment options
5. Monitor surrounding plants for spread

Prevention Tips:
• Maintain proper plant spacing
• Use appropriate irrigation methods
• Practice crop rotation
• Regular monitoring
• Maintain field hygiene`;

      setAnalysis(formattedAnalysis);
    } catch (error) {
      console.error("Error analyzing image:", error);
      Alert.alert(
        "Error", 
        error instanceof Error ? error.message : "Failed to analyze image"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Crop Health Analysis</Text>
      </View>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.uploadButton, styles.cameraButton]} 
            onPress={() => pickImage(true)}
            disabled={isLoading}
          >
            <MaterialCommunityIcons 
              name="camera" 
              size={24} 
              color={COLORS.white} 
            />
            <Text style={styles.uploadButtonText}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.uploadButton, styles.galleryButton]} 
            onPress={() => pickImage(false)}
            disabled={isLoading}
          >
            <MaterialCommunityIcons 
              name="image" 
              size={24} 
              color={COLORS.white} 
            />
            <Text style={styles.uploadButtonText}>Gallery</Text>
          </TouchableOpacity>
        </View>
        
        {imageUri && (
          <Animated.View 
            style={[
              styles.imageContainer,
              {
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim
              }
            ]}
          >
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
            />
          </Animated.View>
        )}
        
        {analysis ? (
          <Animated.View 
            style={[
              styles.analysisContainer,
              {
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim
              }
            ]}
          >
            <Text style={styles.analysisHeader}>Analysis Result:</Text>
            <Text style={styles.analysisText}>{analysis}</Text>
          </Animated.View>
        ) : null}

        {/* Adding some bottom padding for better scrolling */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <MaterialCommunityIcons 
              name="leaf" 
              size={40} 
              color={COLORS.primary} 
            />
          </Animated.View>
          <Text style={styles.loadingText}>Analyzing crop health...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 30,
  },
  header: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  headerText: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  uploadButton: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.48,
  },
  cameraButton: {
    backgroundColor: COLORS.primary,
  },
  galleryButton: {
    backgroundColor: COLORS.secondary,
  },
  uploadButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  image: {
    width: Dimensions.get('window').width - 40,
    height: 300,
    borderRadius: 15,
  },
  analysisContainer: {
    padding: 20,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  analysisHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 15,
  },
  analysisText: {
    fontSize: 14,
    lineHeight: 24,
    color: COLORS.text,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 249, 241, 0.9)',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 20,
  }
});

export default CropHealthDetection;