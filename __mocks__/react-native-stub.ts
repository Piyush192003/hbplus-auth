import React from 'react';

// Self-contained React Native mock — does NOT import from the real
// react-native package (which contains unparseable Flow syntax).
export const View = React.forwardRef((props: any) => null);
export const Text = React.forwardRef((props: any) => null);
export const StyleSheet = { create: (styles: any) => styles };
export const ScrollView = React.forwardRef((props: any) => null);
export const ActivityIndicator = React.forwardRef((props: any) => null);
export const SafeAreaView = React.forwardRef((props: any) => null);
export const TouchableOpacity = React.forwardRef((props: any) => null);
export const Alert = { alert: () => {} };
export const Image = React.forwardRef((props: any) => null);
export const TextInput = React.forwardRef((props: any) => null);
export const Dimensions = { get: () => ({ width: 1000, height: 1000 }) };

export const metrics = {
  screenWidth: 1000,
  screenHeight: 1000,
  baseMargin: 10,
  doubleMargin: 20,
  tripleMargin: 30,
  smallMargin: 5,
  paddingSmall: 8,
  paddingMedium: 16,
  paddingLarge: 24,
  borderRadius: 5,
  radiusLarge: 10,
  headerHeight: 60,
  paddingTop: 20,
};

export default {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
};

