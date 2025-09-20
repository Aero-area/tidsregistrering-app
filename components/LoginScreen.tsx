import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock } from 'lucide-react-native';
import GradientBackground from '@/components/GradientBackground';
import { globalStyles } from '@/constants/styles';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignUp?: (email: string, password: string) => Promise<void>;
}

export default function LoginScreen({ onLogin, onSignUp }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Fejl', 'Indtast venligst din e-mail');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Fejl', 'Indtast venligst din adgangskode');
      return;
    }

    setIsLoading(true);
    setMessage('');
    try {
      if (isSignUp && onSignUp) {
        await onSignUp(email.trim(), password.trim());
        setMessage('Konto oprettet! Du er nu logget ind.');
      } else {
        await onLogin(email.trim(), password.trim());
        setMessage('Du er nu logget ind!');
      }
    } catch (error: any) {
      Alert.alert('Fejl', error.message || 'Der opstod en fejl. Prøv igen.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={globalStyles.container}>
        <View style={styles.content}>
          <View style={styles.logoSection}>
            <Text style={styles.appTitle}>Timestamp</Text>
            <Text style={styles.appSubtitle}>Registrer din arbejdstid nemt og præcist</Text>
          </View>

          <View style={globalStyles.glassCard}>
            <Text style={[globalStyles.title, styles.loginTitle]}>
              {isSignUp ? 'Opret konto' : 'Log ind'}
            </Text>
            
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Mail size={20} color="rgba(255, 255, 255, 0.6)" />
                <TextInput
                  style={styles.input}
                  placeholder="E-mail"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              
              <View style={styles.inputWrapper}>
                <Lock size={20} color="rgba(255, 255, 255, 0.6)" />
                <TextInput
                  style={styles.input}
                  placeholder="Adgangskode"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              
              {message ? (
                <Text style={styles.message}>{message}</Text>
              ) : null}
            </View>

            <TouchableOpacity 
              style={[globalStyles.primaryButton, isLoading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={globalStyles.primaryButtonText}>
                {isLoading ? (isSignUp ? 'Opretter...' : 'Logger ind...') : (isSignUp ? 'Opret konto' : 'Log ind')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.switchButton}
              onPress={() => setIsSignUp(!isSignUp)}
              disabled={isLoading}
            >
              <Text style={styles.switchButtonText}>
                {isSignUp ? 'Har du allerede en konto? Log ind' : 'Har du ikke en konto? Opret en'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 1,
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
  loginTitle: {
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    gap: 20,
    marginBottom: 30,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    paddingVertical: 16,
    paddingLeft: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  message: {
    color: '#4ade80',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  switchButton: {
    marginTop: 20,
    paddingVertical: 12,
  },
  switchButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});