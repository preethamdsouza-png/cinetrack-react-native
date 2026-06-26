import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SQLiteProvider } from 'expo-sqlite';
import { SvgLoader } from './src/components/SvgLoader';
import { migrateBookmarksDb } from './src/db/bookmarkDB';
import { MiniCPMProvider } from './src/llm/MiniCPMProvider';
import DetailScreen from './src/screens/DetailScreen';
import HomeScreen from './src/screens/HomeScreen';
import ScanPosterToEventInCalender from './src/screens/ScanPosterToEventInCalender';
import SearchScreen from './src/screens/SearchScreen';
import SplashScreen from './src/screens/SplashScreen';
import WatchlistScreen from './src/screens/WatchListScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1E1E2A',
          borderTopWidth: 1,
          borderTopColor: '#0296E5',
          paddingBottom: 20,
          paddingTop: 10,
          height: 90,
        },
        tabBarLabelStyle: {
          fontSize: 12,     
          fontWeight: '600',
          marginBottom: 2, 
        },
        tabBarActiveTintColor: '#0296E5',
        tabBarInactiveTintColor: '#67686D',

        // Wire up your SvgLoader for the tab bar icons
        tabBarIcon: ({ color }) => {
          if (route.name === 'Home') {
            return <SvgLoader name="home" width={20} height={24} color={color} />;
          }

          if (route.name === 'Search') {
            return <SvgLoader name="search" width={20} height={24} color={color} />;
          }

          if (route.name === 'WatchList') {
            return <SvgLoader name="watchlist" width={17} height={22} color={color} />;
          }

          if (route.name === 'Scan') {
            return <SvgLoader name="scan" width={20} height={24} color={color} />;
          }

          return null;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="WatchList" component={WatchlistScreen} options={{ title: 'Watch list' }} />
      <Tab.Screen name="Scan" component={ScanPosterToEventInCalender} options={{ title: 'Scan' }} />
    </Tab.Navigator>
  );
};


export default function App() {
  return (
    <MiniCPMProvider>
        <SQLiteProvider databaseName="cinetrack.db" onInit={migrateBookmarksDb}>
           <NavigationContainer>
        {/* Set initialRouteName to 'Splash' */}
        <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
          {/* Add the Splash screen here */}
          <Stack.Screen name="Details" component={DetailScreen} />
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="HomeTabs" component={HomeTabs} />

        </Stack.Navigator>
      </NavigationContainer>
      </SQLiteProvider>
    </MiniCPMProvider>
  );
}