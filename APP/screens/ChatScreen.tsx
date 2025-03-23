import React, { useState, useRef, useEffect } from 'react';
import {
        View,
        Text,
        TextInput,
        FlatList,
        StyleSheet,
        TouchableOpacity,
        KeyboardAvoidingView,
        Platform,
        Animated,
        Easing,
        Keyboard,
        SafeAreaView,
} from 'react-native';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI('AIzaSyCk_nEm0_J4gE20cw4ronBPPF-TtOUqS8g');

// Agriculture-themed colors
const COLORS = {
        primary: '#2E7D32',      // Forest Green
        secondary: '#81C784',    // Light Green
        accent: '#FFC107',       // Warm Yellow
        background: '#F1F8E9',   // Light Sage
        text: '#1B5E20',         // Dark Green
        userBubble: '#2E7D32',   // Forest Green
        botBubble: '#E8F5E9',    // Pale Green
        inputBg: '#FFFFFF',
        disabled: '#A5D6A7',     // Muted Green
};

interface Message {
        id: string;
        text: string;
        sender: 'user' | 'bot';
        timestamp: Date;
        animation?: Animated.Value;
}

interface FormattedText {
        text: string;
        bold?: boolean;
        italic?: boolean;
        bullet?: boolean;
}

const ChatScreen = () => {
        const [messages, setMessages] = useState<Message[]>([]);
        const [inputText, setInputText] = useState('');
        const [isLoading, setIsLoading] = useState(false);
        const [keyboardVisible, setKeyboardVisible] = useState(false);
        const flatListRef = useRef<FlatList>(null);
        const loadingAnimation = useRef(new Animated.Value(0)).current;
        const inputAnimation = useRef(new Animated.Value(0)).current;
        const insets = useSafeAreaInsets();

        // Track keyboard visibility
        useEffect(() => {
                const keyboardDidShowListener = Keyboard.addListener(
                        'keyboardDidShow',
                        () => {
                                setKeyboardVisible(true);
                                flatListRef.current?.scrollToEnd({ animated: true });
                        }
                );
                const keyboardDidHideListener = Keyboard.addListener(
                        'keyboardDidHide',
                        () => {
                                setKeyboardVisible(false);
                        }
                );

                return () => {
                        keyboardDidShowListener.remove();
                        keyboardDidHideListener.remove();
                };
        }, []);

        // Animate loading indicator
        useEffect(() => {
                if (isLoading) {
                        Animated.loop(
                                Animated.sequence([
                                        Animated.timing(loadingAnimation, {
                                                toValue: 1,
                                                duration: 1000,
                                                useNativeDriver: true,
                                                easing: Easing.inOut(Easing.ease),
                                        }),
                                        Animated.timing(loadingAnimation, {
                                                toValue: 0,
                                                duration: 1000,
                                                useNativeDriver: true,
                                                easing: Easing.inOut(Easing.ease),
                                        }),
                                ])
                        ).start();
                } else {
                        loadingAnimation.setValue(0);
                }
        }, [isLoading]);

        // Animate input focus
        const handleInputFocus = () => {
                Animated.spring(inputAnimation, {
                        toValue: 1,
                        useNativeDriver: false,
                        friction: 8,
                }).start();
        };

        const handleInputBlur = () => {
                Animated.spring(inputAnimation, {
                        toValue: 0,
                        useNativeDriver: false,
                        friction: 8,
                }).start();
        };

        const formatText = (text: string): FormattedText[] => {
                const lines = text.split('\n');
                const formattedLines: FormattedText[] = [];

                lines.forEach(line => {
                        if (line.trim().startsWith('*')) {
                                const bulletText = line.trim().replace(/^\*+\s*/, '');
                                formattedLines.push({ text: '• ' + bulletText, bullet: true });
                                return;
                        }

                        const segments = line.split(/(\*{1,3}[^*]+\*{1,3})/g);

                        segments.forEach(segment => {
                                if (segment.trim() === '') return;

                                if (segment.startsWith('***') && segment.endsWith('***')) {
                                        formattedLines.push({
                                                text: segment.replace(/\*{3}/g, ''),
                                                bold: true,
                                                italic: true,
                                        });
                                } else if (segment.startsWith('**') && segment.endsWith('**')) {
                                        formattedLines.push({
                                                text: segment.replace(/\*{2}/g, ''),
                                                bold: true,
                                        });
                                } else if (segment.startsWith('*') && segment.endsWith('*')) {
                                        formattedLines.push({
                                                text: segment.replace(/\*/g, ''),
                                                italic: true,
                                        });
                                } else {
                                        formattedLines.push({ text: segment });
                                }
                        });

                        if (lines.indexOf(line) < lines.length - 1) {
                                formattedLines.push({ text: '\n' });
                        }
                });

                return formattedLines;
        };

        const renderFormattedText = (text: string) => {
                const formattedSegments = formatText(text);

                return formattedSegments.map((segment, index) => (
                        <Text
                                key={index}
                                style={[
                                        styles.messageText,
                                        segment.bullet && styles.bulletPoint,
                                        segment.bold && styles.boldText,
                                        segment.italic && styles.italicText,
                                ]}
                        >
                                {segment.text}
                        </Text>
                ));
        };

        const sendMessage = async () => {
                if (!inputText.trim()) return;

                const newMessage: Message = {
                        id: Date.now().toString(),
                        text: inputText.trim(),
                        sender: 'user',
                        timestamp: new Date(),
                        animation: new Animated.Value(0),
                };

                setMessages(prev => [...prev, newMessage]);
                setInputText('');
                setIsLoading(true);

                // Animate new message
                Animated.spring(newMessage.animation!, {
                        toValue: 1,
                        useNativeDriver: true,
                        friction: 8,
                }).start();

                try {
                        const model = genAI.getGenerativeModel({
                                model: 'gemini-1.5-pro' // Or whatever the current model name is
                        });
                        const result = await model.generateContent(inputText.trim());
                        const response = await result.response;
                        const text = response.text();

                        const botMessage: Message = {
                                id: (Date.now() + 1).toString(),
                                text: text,
                                sender: 'bot',
                                timestamp: new Date(),
                                animation: new Animated.Value(0),
                        };

                        setMessages(prev => [...prev, botMessage]);

                        // Animate bot response
                        Animated.spring(botMessage.animation!, {
                                toValue: 1,
                                useNativeDriver: true,
                                friction: 8,
                        }).start();

                        // Scroll to the bottom to show new message
                        setTimeout(() => {
                                flatListRef.current?.scrollToEnd({ animated: true });
                        }, 100);
                } catch (error) {
                        console.error('Error generating response:', error);
                        const errorMessage: Message = {
                                id: (Date.now() + 1).toString(),
                                text: 'Sorry, I encountered an error. Please try again.',
                                sender: 'bot',
                                timestamp: new Date(),
                                animation: new Animated.Value(1),
                        };
                        setMessages(prev => [...prev, errorMessage]);
                }

                setIsLoading(false);
        };

        const renderMessage = ({ item }: { item: Message }) => {
                const translateY = item.animation!.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                });

                const opacity = item.animation!.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                });

                return (
                        <Animated.View
                                style={[
                                        styles.messageContainer,
                                        item.sender === 'user' ? styles.userMessage : styles.botMessage,
                                        { transform: [{ translateY }], opacity },
                                ]}
                        >
                                <View style={styles.messageContent}>
                                        {renderFormattedText(item.text)}
                                </View>
                                <Text style={[
                                        styles.timestamp,
                                        item.sender === 'user' && styles.userTimestamp
                                ]}>
                                        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                        </Animated.View>
                );
        };

        const inputContainerScale = inputAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.02],
        });

        // Additional padding for the container when keyboard is visible
        const containerStyle = [
                styles.container,
                {
                        // Add bottom padding when keyboard is visible on Android
                        paddingBottom: Platform.OS === 'android' && keyboardVisible ? 50 : 0
                }
        ];

        return (
                <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
                        <KeyboardAvoidingView
                                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                                style={containerStyle}
                                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                        >
                                <View style={styles.header}>
                                        <Text style={styles.headerTitle}>Agri Assistant</Text>
                                        {isLoading && (
                                                <Animated.View style={[styles.loadingIndicator, {
                                                        opacity: loadingAnimation
                                                }]}>
                                                        <Ionicons name="leaf" size={24} color={COLORS.primary} />
                                                </Animated.View>
                                        )}
                                </View>

                                <FlatList
                                        ref={flatListRef}
                                        data={messages}
                                        renderItem={renderMessage}
                                        keyExtractor={item => item.id}
                                        contentContainerStyle={[
                                                styles.messagesList,
                                                { paddingBottom: keyboardVisible ? 60 : 16 }
                                        ]}
                                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                                />

                                <Animated.View style={[
                                        styles.inputContainer,
                                        { transform: [{ scale: inputContainerScale }] },
                                        // Add bottom inset for iOS
                                        Platform.OS === 'ios' && { paddingBottom: insets.bottom || 16 }
                                ]}>
                                        <TextInput
                                                style={styles.input}
                                                value={inputText}
                                                onChangeText={setInputText}
                                                placeholder="Ask about farming..."
                                                placeholderTextColor={COLORS.disabled}
                                                multiline
                                                maxLength={1000}
                                                onFocus={handleInputFocus}
                                                onBlur={handleInputBlur}
                                        />
                                        <TouchableOpacity
                                                style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
                                                onPress={sendMessage}
                                                disabled={isLoading || !inputText.trim()}
                                        >
                                                <Ionicons
                                                        name="send"
                                                        size={24}
                                                        color={isLoading ? COLORS.disabled : '#FFFFFF'}
                                                />
                                        </TouchableOpacity>
                                </Animated.View>
                        </KeyboardAvoidingView>
                </SafeAreaView>
        );
};

const styles = StyleSheet.create({
        container: {
                flex: 1,
                backgroundColor: COLORS.background,
        },
        header: {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                backgroundColor: COLORS.primary,
                borderBottomLeftRadius: 20,
                borderBottomRightRadius: 20,
                elevation: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
        },
        headerTitle: {
                fontSize: 20,
                fontWeight: 'bold',
                color: '#FFFFFF',
        },
        loadingIndicator: {
                padding: 8,
        },
        messagesList: {
                padding: 16,
                paddingBottom: 80, // Extra space to ensure messages aren't hidden behind input
        },
        messageContainer: {
                maxWidth: '80%',
                marginVertical: 6,
                padding: 12,
                borderRadius: 20,
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
        },
        messageContent: {
                flexDirection: 'row',
                flexWrap: 'wrap',
        },
        userMessage: {
                alignSelf: 'flex-end',
                backgroundColor: COLORS.userBubble,
                borderTopRightRadius: 4,
        },
        botMessage: {
                alignSelf: 'flex-start',
                backgroundColor: COLORS.botBubble,
                borderTopLeftRadius: 4,
        },
        messageText: {
                fontSize: 16,
                color: COLORS.text,
                lineHeight: 22,
        },
        boldText: {
                fontWeight: 'bold',
        },
        italicText: {
                fontStyle: 'italic',
        },
        bulletPoint: {
                marginLeft: 10,
        },
        timestamp: {
                fontSize: 12,
                color: COLORS.text,
                marginTop: 4,
                opacity: 0.7,
        },
        userTimestamp: {
                color: '#FFFFFF',
        },
        inputContainer: {
                flexDirection: 'row',
                padding: 16,
                backgroundColor: COLORS.inputBg,
                borderTopWidth: 1,
                borderTopColor: 'rgba(0,0,0,0.1)',
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                elevation: 5, // For Android to appear above the tab bar
                shadowColor: '#000', // For iOS to appear above the tab bar
                shadowOffset: { width: 0, height: -3 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
        },
        input: {
                flex: 1,
                minHeight: 40,
                maxHeight: 100,
                backgroundColor: COLORS.inputBg,
                borderWidth: 1,
                borderColor: COLORS.secondary,
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8,
                marginRight: 12,
                fontSize: 16,
                color: COLORS.text,
        },
        sendButton: {
                width: 48,
                height: 48,
                backgroundColor: COLORS.primary,
                borderRadius: 24,
                justifyContent: 'center',
                alignItems: 'center',
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
        },
        sendButtonDisabled: {
                backgroundColor: COLORS.disabled,
        },
});

export default ChatScreen;