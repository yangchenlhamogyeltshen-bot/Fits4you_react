import { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';

export default function AnimatedSplash() {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 900, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
      <Animated.Image
        source={require('../../assets/logo.png')}
        resizeMode="contain"
        style={{ width: 260, height: 260, opacity: fade, transform: [{ scale }] }}
      />
    </View>
  );
}