import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SvgLoader } from '../components/SvgLoader';

const SplashScreen = ({ navigation }) => {
    useEffect(() => {
        // Wait for 3 seconds, then navigate to the HomeTabs 
        const timer = setTimeout(() => {
            navigation.replace('HomeTabs');
        }, 3000);

        // Cleanup the timer if the component unmounts
        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <View style={styles.container}>
        <SvgLoader name="splashImage" width={190} height={190} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1E1E2A', // App background color
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default SplashScreen;