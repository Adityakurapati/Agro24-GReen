// Card.tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface CardProps {
  style?: ViewStyle;
  children?: React.ReactNode;
}

interface CardHeaderProps {
  style?: ViewStyle;
  children?: React.ReactNode;
}

interface CardTitleProps {
  style?: TextStyle;
  children?: React.ReactNode;
}

interface CardContentProps {
  style?: ViewStyle;
  children?: React.ReactNode;
}

interface CardFooterProps {
  style?: ViewStyle;
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ style, children }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

export const CardHeader: React.FC<CardHeaderProps> = ({ style, children }) => (
  <View style={[styles.cardHeader, style]}>
    {children}
  </View>
);

export const CardTitle: React.FC<CardTitleProps> = ({ style, children }) => (
  <Text style={[styles.cardTitle, style]}>
    {children}
  </Text>
);

export const CardContent: React.FC<CardContentProps> = ({ style, children }) => (
  <View style={[styles.cardContent, style]}>
    {children}
  </View>
);

export const CardFooter: React.FC<CardFooterProps> = ({ style, children }) => (
  <View style={[styles.cardFooter, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    margin: 10,
  },
  cardHeader: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  cardContent: {
    padding: 16,
    paddingTop: 0,
  },
  cardFooter: {
    padding: 16,
    paddingTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default Card;